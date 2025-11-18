# HyperCard Renaissance - Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works fine)

## Setup Steps

### 1. Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### 2. Set Up Supabase (REQUIRED)

**⚠️ CRITICAL: The app will not work without proper Supabase configuration!**

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned (2-3 minutes)
3. Go to **Project Settings → API**
4. Copy your **Project URL** (looks like: `https://xxxxx.supabase.co`)
5. Copy your **anon/public key** (long string starting with `eyJ...`)

### 3. Configure Supabase Authentication

**Important**: Configure email settings in Supabase:

1. Go to Authentication > Settings in your Supabase dashboard
2. **Disable email confirmation** for development:
   - Scroll to "Email Auth"
   - Turn OFF "Enable email confirmations"
   - This allows instant signup without email verification

3. **(Optional) Enable Google OAuth**:
   - Go to Authentication > Providers
   - Enable Google provider
   - Add your Google OAuth credentials
   - Set redirect URL to: `http://localhost:3000/dashboard`

### 4. Configure Environment Variables (REQUIRED)

**Edit the `.env.local` file** in the project root and replace the placeholder values:

```bash
# Replace these with your ACTUAL Supabase credentials!
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:**
- Remove `https://placeholder.supabase.co` and use your real URL
- Remove the placeholder key and use your real anon key
- Save the file
- **Restart the development server** after changing environment variables

### 5. Configure AI Features (Optional)

#### AI-Powered Script Generation (Anthropic Claude)

If you want to use AI-powered script generation:

1. Get an Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
2. Add to your `.env.local`:
```
ANTHROPIC_API_KEY=your_api_key_here
```

AI script generation features will be disabled if no API key is provided.

#### AI-Powered Stack Recommendations (OpenAI)

For personalized stack recommendations based on your work:

1. Get an OpenAI API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Add to your `.env.local`:
```
OPENAI_API_KEY=your_api_key_here
```

3. Run the embeddings migration (see Migration 5 below)
4. Generate embeddings for your stacks via the API endpoint or automatically when creating stacks

**Features enabled with OpenAI:**
- AI-powered stack recommendations based on similarity
- Content-based filtering using embeddings
- Personalized suggestions based on your stack history
- One-click clone of recommended stacks

#### One-Click Deployment (Vercel/Netlify)

To enable instant deployment of stacks to Vercel or Netlify:

1. **For Vercel:**
   - Get an API token from [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - Add to your `.env.local`:
   ```
   VERCEL_API_TOKEN=your_vercel_token_here
   ```

2. **For Netlify:**
   - Get an API token from [app.netlify.com/user/applications](https://app.netlify.com/user/applications#personal-access-tokens)
   - Add to your `.env.local`:
   ```
   NETLIFY_API_TOKEN=your_netlify_token_here
   ```

**Features enabled with deployment tokens:**
- One-click publishing of stacks as static websites
- Automatic subdomain generation
- Custom domain configuration
- Environment variable management
- Deployment history tracking
- Real-time deployment status updates

**Note:** Both tokens are optional. If not configured, the deployment feature will display an error message when attempting to deploy.

### 6. Run Database Migrations

Run all three migrations in order:

#### Migration 1: Profiles Table

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/migrations/00001_initial_schema.sql`
4. Paste and run the SQL in the editor

This will create:
- The `profiles` table
- Row Level Security policies
- Triggers for automatic profile creation
- Functions for timestamp updates

#### Migration 2: Stacks, Cards, Elements, and Assets Tables

1. In the SQL Editor, copy the contents of `supabase/migrations/00002_stacks_and_cards.sql`
2. Paste and run the SQL in the editor

This will create:
- The `stacks` table for managing HyperCard stacks
- The `cards` table for individual cards within stacks
- The `elements` table for UI elements on cards
- The `assets` table for media files
- Row Level Security policies for all tables
- Indexes for performance
- Triggers for automatic reordering

#### Migration 3: Publishing Features

1. In the SQL Editor, copy the contents of `supabase/migrations/00003_publishing.sql`
2. Paste and run the SQL in the editor

This will add:
- Publishing fields (slug, view_count, featured, tags)
- Indexes for public stacks
- Slug generation function
- Support for stack discovery and sharing

#### Migration 4: Marketplace Features

1. In the SQL Editor, copy the contents of `supabase/migrations/00004_marketplace_packages.sql`
2. Paste and run the SQL in the editor

This will add:
- Marketplace package system
- Package versioning
- Installation tracking
- Package reviews and ratings

#### Migration 5: AI Embeddings for Recommendations (Optional)

**Note:** Only run this migration if you plan to use AI-powered recommendations with OpenAI.

1. In the SQL Editor, copy the contents of `supabase/migrations/00005_stack_embeddings.sql`
2. Paste and run the SQL in the editor

This will add:
- Stack and card embeddings tables with vector support
- User interaction tracking for collaborative filtering
- RLS policies for embeddings data

#### Migration 6: Nested Stacks (Optional)

**Note:** Only run this migration if you plan to use nested/composable stacks.

1. In the SQL Editor, copy the contents of `supabase/migrations/00006_nested_stacks.sql`
2. Paste and run the SQL in the editor

This will add:
- Stack references table for nested stack composition
- Circular dependency prevention
- RLS policies for stack references

#### Migration 7: One-Click Deployments (Optional)

**Note:** Only run this migration if you plan to use the deployment feature with Vercel/Netlify.

1. In the SQL Editor, copy the contents of `supabase/migrations/00007_deployments.sql`
2. Paste and run the SQL in the editor

This will add:
- Deployments table for tracking stack deployments
- Support for Vercel and Netlify providers
- Deployment status tracking (pending, building, ready, failed)
- RLS policies for user-owned deployments
- Indexes for efficient querying
- Functions for managing user interactions

**Requirements:**
- PostgreSQL with pgvector extension enabled (available in Supabase)
- OpenAI API key configured in environment variables

### 7. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing the Setup

1. Navigate to the home page - you should see the HyperCard Renaissance landing page
2. Click "Get Started" to go to the login page
3. Create a new account with email and password
4. You should be redirected to the dashboard
5. Try signing out and signing back in

## What's Been Implemented

### ✅ Phase 1: Foundation & Authentication

- [x] Next.js project with TypeScript and Tailwind CSS
- [x] Supabase integration with modern @supabase/ssr package
- [x] Database schema with profiles table
- [x] Authentication context and hooks
- [x] Login/signup page with form validation
- [x] Protected dashboard route
- [x] Auth middleware for route protection
- [x] shadcn/ui components (Button, Input, Card, Dialog, Dropdown)
- [x] HyperCard-inspired theme with CSS variables
- [x] Responsive layouts

### ✅ Phase 2: Data Models & Basic CRUD

- [x] Database schema for stacks, cards, elements, and assets
- [x] Row Level Security policies for all tables
- [x] TypeScript types for all data models
- [x] Service classes for CRUD operations
- [x] Custom React hooks (useStacks, useCards)
- [x] Dashboard with stack management
- [x] Create, view, and delete stacks
- [x] Basic editor page with card listing
- [x] Create cards within stacks

### ✅ Phase 3: Visual Card Editor

- [x] Full editor layout with toolbar, canvas, navigator, and property panel
- [x] Editor context for state management
- [x] Card navigation sidebar
- [x] Visual canvas (800x600) with card background
- [x] Drawing mode for creating elements
- [x] Element types: Button, Text, Input, Image, Shape
- [x] Element rendering on canvas
- [x] Element selection with visual indicators
- [x] Property panel for editing element properties
- [x] Position and size controls
- [x] Type-specific property editors
- [x] Preview mode toggle
- [x] Element deletion

### ✅ Phase 4: Scripting Engine & Interactivity

- [x] Script execution engine with sandboxed context
- [x] Script editor with syntax highlighting
- [x] Template library for common scripts
- [x] Navigation functions (goToNextCard, goToPrevCard, goToCard)
- [x] Element manipulation (updateElement, hideElement, showElement)
- [x] Variable storage system (setVariable, getVariable)
- [x] UI functions (showMessage, playSound)
- [x] Runtime canvas for script execution
- [x] onClick event handlers for elements
- [x] onLoad event handlers for cards
- [x] Preview mode with full script execution
- [x] Error handling and debugging

### ✅ Phase 5: AI Integration (Claude)

- [x] Anthropic Claude API integration
- [x] AI completion API route
- [x] Natural language script generation
- [x] Script explanation feature
- [x] Script improvement suggestions
- [x] AI-powered script editor component
- [x] Dual editor mode (AI vs Manual)
- [x] Demo mode support for AI features
- [x] Error handling for API failures

### ✅ Phase 6: Publishing & Sharing

- [x] Publishing service with slug generation
- [x] Publish/unpublish functionality
- [x] Public stack player page
- [x] Stack gallery/explore page
- [x] Search functionality
- [x] View count tracking
- [x] Featured stacks support
- [x] Tag system for categorization
- [x] Responsive player interface
- [x] Navigation controls in player

### Features

- **Authentication**: Email/password signup and login
- **Session Management**: Automatic session refresh and persistence
- **Protected Routes**: Dashboard and editor routes require authentication
- **User Profiles**: Automatically created on signup
- **Stack Management**: Create, view, and delete HyperCard stacks
- **Card Management**: Create and view cards within stacks
- **Visual Editor**: Full-featured card editor with drag-to-draw elements
- **Element Types**: Buttons, text, inputs, images, and shapes
- **Property Editing**: Real-time property editing with visual feedback
- **Scripting**: Add interactive behaviors with JavaScript
- **Script Templates**: Pre-built templates for common interactions
- **Preview Mode**: Test your cards with full script execution
- **Navigation**: Script-based card navigation
- **Variables**: Store and retrieve data across scripts
- **Data Security**: Row Level Security ensures users can only access their own data
- **Modern UI**: Clean, accessible components with shadcn/ui

## Project Structure

```
hyper/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── dashboard/         # Protected dashboard
│   │   ├── login/             # Authentication page
│   │   ├── layout.tsx         # Root layout with AuthProvider
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   ├── auth/              # Authentication context
│   │   ├── supabase/          # Supabase clients and types
│   │   ├── types/             # TypeScript types
│   │   └── utils.ts           # Utility functions
│   └── middleware.ts          # Auth middleware
├── supabase/
│   └── migrations/            # Database migrations
└── .env.local                 # Environment variables (create this)
```

## Next Steps

After completing the foundation setup, you can proceed to:

1. **Phase 2**: Implement Stack and Card data models
2. **Phase 3**: Build the card editor interface
3. **Phase 4**: Add scripting engine
4. **Phase 5**: Integrate AI features
5. **Phase 6**: Publishing and sharing

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env.local` file has the correct Supabase URL and anon key
- Make sure there are no extra spaces or quotes around the values
- Restart the dev server after changing environment variables

### Authentication not working
- Verify the database migration ran successfully
- Check that the `profiles` table exists in Supabase
- Ensure Row Level Security policies are enabled

### Build errors
- Run `npm install` to ensure all dependencies are installed
- Check that you're using Node.js 18 or higher
- Clear the `.next` folder and rebuild: `rm -rf .next && npm run dev`

## Support

For issues or questions, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
