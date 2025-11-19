# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HyperCard Renaissance is a Next.js 16 application that reimagines HyperCard for the modern web as an interactive story editor and player. Users create branching narrative experiences (story stacks) with AI-generated imagery and choice-based navigation.

**Key Technologies:**
- Next.js 16 (App Router)
- TypeScript (strict mode)
- Supabase (PostgreSQL with RLS)
- Anthropic Claude API (AI script generation)
- OpenAI API (image generation)
- Tailwind CSS with CSS custom properties for theming
- React Flow (story graph visualization)
- Zustand (state management)

## Development Commands

```bash
# Development server (runs on http://localhost:3000)
npm run dev

# Production build
npm run build

# Production server
npm start

# Linting
npm run lint

# Type checking
npx tsc --noEmit
```

## Architecture

### Data Model

The application has evolved from a complex HyperCard clone to a streamlined interactive story platform. The core entities are:

**StoryStack** → A publishable story project
- Contains multiple StoryCards
- Has a `firstCardId` entry point
- Can be published with a unique slug
- Supports theme system (light, halloween, etc.)

**StoryCard** → A scene/moment in the story
- Belongs to a StoryStack
- Contains: title, content (narrative text), imageUrl, imagePrompt
- Has multiple Choices for navigation

**Choice** → A navigation decision button
- Belongs to a StoryCard
- Has: label (button text), targetCardId (where it leads)
- Ordered by `orderIndex`

**Important**: There are deprecated types (Stack, Card, Element) marked in `src/lib/types/index.ts` for backward compatibility. Always use StoryStack, StoryCard, and Choice for new code.

### Service Layer Architecture

All data access goes through service classes in `src/lib/services/`:

**StoryService** (`src/lib/services/story.ts`) - Primary service for CRUD operations
- All methods use camelCase (e.g., `getStoryStacks`, `createStoryCard`)
- Database fields use snake_case, service layer maps to camelCase
- Always includes RLS (Row Level Security) checks
- Key methods:
  - Story stacks: `getStoryStacks()`, `createStoryStack()`, `publishStoryStack()`
  - Cards: `getStoryCards()`, `createStoryCard()`, `updateStoryCard()`
  - Choices: `getChoices()`, `createChoice()`, `deleteChoice()`
  - Validation: `validateStoryGraph()` - detects orphaned cards, dead ends, invalid targets

**Image Services**:
- `src/lib/services/image.ts` - Client-side image generation interface
- `src/lib/services/image-server.ts` - Server-side OpenAI DALL-E integration

**AI Services**:
- `src/lib/services/anthropic.ts` - Claude AI integration for script generation
  - Uses `claude-sonnet-4-20250514` model
  - Supports streaming with `streamAICompletion()`
- `src/lib/services/openai.ts` - GPT integration (recommendations, embeddings)

### Context Architecture

**EditorContext** (`src/contexts/EditorContext.tsx`)
- Centralized state management for the story editor
- Manages: storyStack, storyCards, currentCard, choices
- Provides actions: addCard, updateCard, deleteCard, addChoice, etc.
- Use `useEditor()` hook to access in editor components

**ThemeContext** (`src/contexts/ThemeContext.tsx`)
- Manages theme switching (light, halloween, etc.)
- Persists to localStorage
- Provides: `theme`, `setTheme()`, `toggleTheme()`

**AuthContext** (`src/lib/auth/AuthContext.tsx`)
- Supabase authentication state
- Session management
- Use `useAuth()` hook for user data

### Component Organization

```
src/components/
├── dashboard/story/        # Dashboard story list components
│   ├── StoryStackList.tsx  # Grid view of user's stories
│   ├── CreateStoryDialog.tsx
│   └── DeleteConfirmDialog.tsx
├── editor/                 # Story editor components
│   ├── story/
│   │   ├── StoryEditorLayout.tsx   # Main editor shell
│   │   ├── CardList.tsx            # Left sidebar card navigator
│   │   ├── CardEditor.tsx          # Main card editing area
│   │   ├── ChoiceEditor.tsx        # Choice creation/editing
│   │   ├── ImageGenerator.tsx      # AI image generation UI
│   │   ├── StoryGraph.tsx          # React Flow graph visualization
│   │   └── PublishDialog.tsx
│   └── AIScriptEditor.tsx  # (Legacy - for old Stack system)
├── player/
│   └── StoryPlayer.tsx     # Public story playback interface
├── theme/
│   └── ThemeToggle.tsx     # Theme switcher component
└── ui/                     # shadcn/ui components
    ├── button.tsx
    ├── dialog.tsx
    └── ...
```

### Routing Structure

```
/                           # Landing page (app/page.tsx)
/login                      # Auth page
/dashboard                  # User's story list (protected)
/editor/[stackId]          # Story editor (protected)
/play/[slug]               # Public player for published stories
```

Protected routes use middleware (`src/middleware.ts`) to check Supabase session.

## Database Schema

**Key Tables:**
- `story_stacks` - Story projects
- `story_cards` - Story scenes/moments
- `choices` - Navigation options
- `profiles` - User profiles (auto-created on signup)

**Migrations** are in `supabase/migrations/`:
1. `00001_initial_schema.sql` - Profiles, auth triggers
2. `00002_stacks_and_cards.sql` - Core story tables
3. `00003_publishing.sql` - Slug, view counts
4. `00004_marketplace_packages.sql` - (Optional) Marketplace
5. `00005_stack_embeddings.sql` - (Optional) AI recommendations
6. `00006_nested_stacks.sql` - (Optional) Composable stacks
7. `00007_deployments.sql` - (Optional) Vercel/Netlify deploys

All tables use Row Level Security (RLS). Users can only access their own data unless stories are published.

## Theme System

**Location**: `src/app/globals.css` + `src/lib/theme/theme-config.ts`

The app uses CSS custom properties for theming. All components should use theme variables:

```tsx
// ❌ Don't use hardcoded colors
<div className="bg-white text-black border-gray-300">

// ✅ Use theme variables
<div className="bg-card text-foreground border-border">
```

**Available themes**: light (default), halloween

**Core Variables**:
- `bg-background` / `text-foreground` - Main background/text
- `bg-card` / `text-card-foreground` - Card backgrounds
- `bg-primary` / `text-primary-foreground` - Primary buttons
- `bg-muted` / `text-muted-foreground` - Disabled states
- `border-border` - Borders

**Utility Classes**:
- `bg-gradient-theme` - Theme-aware gradient
- `shadow-theme`, `shadow-theme-sm`, `shadow-theme-lg` - Themed shadows

See README.md "Theme System" section for full details on adding new themes.

## AI Integration

### Anthropic Claude (Script Generation)
- **File**: `src/lib/services/anthropic.ts`
- **Model**: `claude-sonnet-4-20250514`
- **Env Var**: `ANTHROPIC_API_KEY`
- **Usage**: AI-powered script generation via `/api/ai/complete`
- Falls back gracefully when not configured

### OpenAI (Image Generation)
- **File**: `src/lib/services/image-server.ts`
- **Model**: DALL-E 3
- **Env Var**: `OPENAI_API_KEY`
- **Usage**: Generate card images via `/api/ai/generate-image`

**Important**: Always check if API keys are configured before calling AI features. Services throw descriptive errors when unavailable.

## Environment Variables

Required in `.env.local`:
```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# AI Features (Optional)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Deployment (Optional)
VERCEL_API_TOKEN=...
NETLIFY_API_TOKEN=...
```

See SETUP.md for detailed setup instructions.

## Key Patterns & Conventions

### Error Handling
Custom error classes in `src/lib/types/index.ts`:
- `StoryNotFoundError`
- `CardNotFoundError`
- `ChoiceNotFoundError`
- `DatabaseError`
- `ImageGenerationError`
- `UnauthorizedError`

Services throw these errors, UI components catch and display user-friendly messages.

### Database Field Naming
- **Database**: snake_case (`story_stack_id`, `order_index`)
- **TypeScript**: camelCase (`storyStackId`, `orderIndex`)
- Service layer handles mapping via private `map*()` methods

### API Routes
All in `src/app/api/`:
- `/api/stories` - Story stack CRUD
- `/api/stories/[id]/cards` - Card CRUD
- `/api/stories/[id]/cards/[cardId]/choices` - Choice CRUD
- `/api/ai/complete` - Claude AI completions
- `/api/ai/generate-image` - DALL-E image generation

Use Next.js 16 App Router conventions (route handlers, not pages API).

### State Management
- **Global**: Zustand stores (not heavily used currently)
- **Editor**: EditorContext for story editing state
- **Theme**: ThemeContext for theme state
- **Auth**: AuthContext for Supabase session
- **Forms**: React `useState` for local component state

### Supabase Client Creation
- **Client-side**: `createClient()` from `src/lib/supabase/client.ts`
- **Server-side**: Import from `src/lib/supabase/server.ts` (uses cookies)
- Never use server client on client components

## Testing

Currently uses manual testing. Test file at `src/lib/services/__tests__/image.test.ts` shows testing pattern if adding tests.

## Common Development Tasks

### Adding a New Story Card
1. Use `StoryService.createStoryCard(input)` with `storyStackId`
2. Card auto-assigned next `orderIndex`
3. Update EditorContext with `addCard(card)`

### Adding a Choice
1. Use `StoryService.createChoice(input)` with `storyCardId` and `targetCardId`
2. Update EditorContext with `addChoice(choice)`
3. Choice buttons render in StoryPlayer from ordered list

### Publishing a Story
1. Call `StoryService.publishStoryStack(id)`
2. Service validates story has cards, generates unique slug
3. Sets `isPublished=true`, `publishedAt=timestamp`
4. Story accessible at `/play/[slug]`

### Validating Story Structure
```typescript
const validation = await storyService.validateStoryGraph(stackId)
// Returns: { isValid, errors, warnings }
// Detects: orphaned cards, dead ends, invalid targets
```

## Path Aliases

TypeScript configured with path alias:
```typescript
import { StoryService } from '@/lib/services/story'
```
`@/` maps to `src/` directory (see `tsconfig.json`).

## Accessibility

- Theme toggle has ARIA labels and keyboard support
- Respects `prefers-reduced-motion`
- All color combinations meet WCAG 2.1 AA standards
- Detailed specs in `.kiro/specs/theme-switching/`
