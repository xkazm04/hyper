# HyperCard Renaissance

> **Monthly Hackathon Project** — Reviving Apple's HyperCard (1987) as a modern AI-powered interactive story platform.

## What Is This?

HyperCard Renaissance transforms the groundbreaking concept of Apple's HyperCard — the original "software construction kit" that let anyone create interactive applications — into a modern web-based storytelling platform enhanced with artificial intelligence.

**The Vision:** Enable anyone to create professional-quality interactive stories, branching narratives, and visual novels without coding — just like HyperCard democratized software creation in the late 1980s.

## Key Features

### Story Editor

#### Visual Story Graph
- **Interactive Node Editor** — Design branching narratives with a React Flow-based canvas
- **Hierarchical Layout** — Automatic node positioning with branch depth indicators
- **Orphan Detection** — Identify and reattach disconnected story cards
- **Graph Diagnostics** — Real-time validation overlay showing structure issues
- **Export/Import** — Save and load story structures as JSON

#### Card-Based Storytelling
- **Story Cards** — Each scene is a card with title, narrative text, images, and audio
- **Choice Navigation** — Create meaningful decisions linking cards together
- **Card Preview** — Live preview showing exactly how cards appear to readers
- **Auto-Save** — Changes saved automatically as you edit
- **Undo/Redo** — Full history tracking with visual history panel

#### Character System
- **Reusable Characters** — Define characters once, reference across your story
- **Character Cards** — Multiple visual representations (poses, expressions, outfits)
- **AI-Generated Portraits** — Create character visuals with AI image generation
- **Character Consistency** — Bria AI maintains visual consistency across scenes

### AI-Powered Content Creation

#### Story Writing Assistant (Claude)
- **Next Steps Mode** — AI suggests what should happen next
- **Content Generation** — AI writes scene descriptions and dialogue
- **Story Architect** — Bulk story structure generation with configurable depth
- **Choice Suggestions** — AI-recommended player decisions for scenes

#### Image Generation 
- **Scene Imagery** — Generate unique artwork for story cards
- **Visual Prompt Builder** — Interactive UI for composing image prompts
- **Style/Setting/Mood Selection** — Curated options or custom inputs
- **Sketch-to-Image** — Generate images from rough sketches
- **Art Style Management** — Set story-wide visual style for consistency
- **Character Insertion** — Insert trained character models into scenes

#### Audio Narration (ElevenLabs)
- **Text-to-Speech** — Generate spoken audio from narrative text
- **Voice Configuration** — Customizable voice settings
- **Autoplay Support** — Audio plays automatically when viewing cards
- **Player Controls** — Play, pause, mute controls during playback

### Story Player

#### Immersive Reading Experience
- **Card Display** — Elegant presentation with images, text, and choices
- **Typewriter Effect** — Animated text reveal for dramatic pacing
- **Parallax Images** — Subtle motion effects on card images
- **Theme Support** — Light and Halloween visual themes

#### Navigation
- **Choice Selection** — Click or keyboard to select story paths
- **Back Navigation** — Return to previous cards in your playthrough
- **Browser History** — Shareable URLs for specific story positions
- **Keyboard Shortcuts** — Full keyboard navigation (arrows, Enter, Space)
- **Progress Tracking** — Visual indicator of story depth

#### Performance
- **Lazy Loading** — Cards loaded on-demand, not all at once
- **Smart Caching** — Visited cards cached for instant back-navigation
- **Prefetching** — Choice targets pre-loaded for smooth transitions

### Publishing & Sharing

- **One-Click Publishing** — Share stories instantly with a unique URL
- **Public Player** — Beautiful reading experience at `/play/[slug]`
- **Unpublish Option** — Retract stories back to private/draft status
- **Story Validation** — Detect issues before publishing (dead ends, orphans)

### Command Palette & Productivity

- **Quick Actions** — `Cmd+K` / `Ctrl+K` opens command palette
- **Keyboard Navigation** — Full keyboard support throughout editor
- **Story DSL Editor** — Custom scripting for complex story logic
- **Resizable Panels** — Adjustable layout for different workflows

### Theming & Accessibility

- **Multiple Themes** — Light and Halloween visual styles
- **Mood-Based Colors** — Dynamic color schemes based on story mood
- **WCAG 2.1 AA Compliant** — Accessible to all users
- **High Contrast Mode** — Support for high contrast displays
- **Reduced Motion** — Respects `prefers-reduced-motion`
- **Responsive Design** — Works on desktop, tablet, and mobile

### Marketplace (Optional)

- **Asset Creation** — Upload character models, art styles, templates
- **Collections** — Organize assets into themed collections
- **Purchase & Download** — Buy and use community-created assets
- **Earnings & Payouts** — Track revenue from asset sales
- **API Access** — Generate API keys for third-party integrations

## AI Integration

HyperCard Renaissance leverages cutting-edge AI to supercharge storytelling:

### Anthropic Claude
- **Model:** Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- **Purpose:** AI-powered narrative and dialogue generation
- **Features:** Streaming responses, context-aware suggestions, story architecture

### OpenAI DALL-E
- **Model:** DALL-E 3 (1024x1024)
- **Purpose:** Generate unique scene artwork
- **Features:** Rate-limited (10/hour), prompt enrichment, style consistency

### ElevenLabs
- **Purpose:** Text-to-speech narration
- **Features:** Multiple voices, adjustable parameters, auto-playback

### Bria AI (Optional)
- **Purpose:** Character model training and scene insertion
- **Features:** Train custom character models, maintain visual consistency
- **Key Capability:** Insert the same character into multiple scenes

### Leonardo AI (Optional)
- **Purpose:** Alternative image generation provider
- **Features:** Different artistic styles and capabilities

## Why HyperCard?

HyperCard (1987-2004) was revolutionary — it let non-programmers create interactive applications years before the web existed. Many credit it as an inspiration for the World Wide Web itself.

**What made HyperCard special:**
- Stack-and-card metaphor (like a deck of index cards)
- Anyone could create, not just programmers
- Hyperlinking before the web
- Multimedia before multimedia was common

**What HyperCard Renaissance adds:**
- Cloud-based (access anywhere)
- AI-assisted content creation
- Modern responsive design
- Instant publishing and sharing
- Character consistency with AI
- Audio narration support

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

See [SETUP.md](./SETUP.md) for detailed configuration including environment variables.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** Supabase (PostgreSQL with RLS)
- **AI Services:** Anthropic Claude, OpenAI, ElevenLabs, Bria AI
- **Styling:** Tailwind CSS 4 with CSS custom properties
- **State:** React Context + Zustand + RxJS (GraphStreamHub)
- **Visualization:** React Flow (story graph)
- **Testing:** Vitest

## Development Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # Run ESLint
npx tsc --noEmit # Type checking
npx vitest       # Run tests
```

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes (stories, AI, marketplace)
│   ├── editor/        # Story editor page
│   ├── features/      # Feature modules
│   │   ├── editor/    # Editor components
│   │   │   └── story/ # Story editing features
│   │   ├── landing/   # Landing page
│   │   └── accessibility/
│   └── play/          # Public story player
├── components/
│   ├── player/        # Story player components
│   ├── ui/            # Shared UI components (shadcn/ui)
│   └── theme/         # Theme components
├── contexts/          # React contexts
├── lib/
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API and business logic
│   └── supabase/      # Database client
└── styles/            # Theme styles
```

---

*Built for the monthly hackathon challenge: "Revamp Old Technology"*
