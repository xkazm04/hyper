# HyperCard Renaissance - Project Overview

## Vision
A modern web-based resurrection of Apple's HyperCard, enabling users to create interactive "stacks" of cards with visual editing and AI-assisted scripting. Built with Next.js and Supabase, featuring a modernized UI that pays homage to the original while leveraging contemporary design principles.

## Core Philosophy
- **Accessibility First**: Anyone can create interactive experiences without prior coding knowledge
- **Progressive Disclosure**: Simple for beginners, powerful for advanced users
- **Visual + Code**: Seamless transition between visual editing and code
- **Instant Gratification**: See changes immediately, publish instantly
- **Learning Through Doing**: Natural progression from using AI assistance to understanding code

## Technology Stack

### Frontend
- **Next.js 16+** (App Router)
- **React 19+**
- **TypeScript**
- **Tailwind CSS** for styling
- **shadcn/ui** for component library
- **Framer Motion** for animations
- **React DnD** or **dnd-kit** for drag-and-drop

### Backend & Database
- **Supabase**
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Storage for assets (images, audio, etc.)
  - Row Level Security (RLS)

### AI Integration (Future Phase)
- **Anthropic Claude API** for Kiro integration
- Natural language to script generation
- Smart suggestions and agent hooks

## Key Features

### Phase 1: Core Foundation
- User authentication
- Stack and card data models
- Basic card editor
- Navigation between cards
- Stack management (create, edit, delete)

### Phase 2: Visual Editor
- Drag-and-drop element placement
- Element types: text, button, image, input field, shape
- Property panels for styling
- Card-to-card linking
- Preview mode

### Phase 3: Scripting & Interactivity
- Event system (onClick, onLoad, onChange)
- Script editor with syntax highlighting
- Variable and state management
- Built-in functions library
- Script execution engine

### Phase 4: AI Integration (Kiro)
- Natural language script generation
- Smart suggestions
- Pattern recognition
- Code explanation
- Accessibility recommendations

### Phase 5: Publishing & Sharing
- Export to standalone web app
- Embed codes
- Public stack gallery
- Collaborative editing
- Version control

## Design Principles

### Visual Style
- **Modern HyperCard Aesthetic**: Black and white base with selective color
- **Clean Typography**: System fonts with excellent readability
- **Chunky Borders**: 2-3px borders reminiscent of classic Mac UI
- **Subtle Shadows**: Depth without skeuomorphism
- **Monospace Code**: Clear distinction between visual and code modes

### UX Patterns
- **Cmd/Ctrl + K** command palette for power users
- **Undo/Redo** for all operations
- **Auto-save** to Supabase
- **Keyboard shortcuts** for common actions
- **Context menus** for element manipulation

## Data Models

### Stack
- id, name, description, owner_id
- created_at, updated_at
- settings (theme, default card, etc.)
- is_public, published_at

### Card
- id, stack_id, name, order_index
- background_color, background_image
- script (onLoad event)
- created_at, updated_at

### Element
- id, card_id, type, order_index
- position (x, y, width, height)
- properties (JSON: style, content, etc.)
- script (onClick, onChange events)
- created_at, updated_at

### Asset
- id, stack_id, type, url
- filename, size, mime_type
- uploaded_at

## Success Metrics
- Users can create a working interactive stack in under 5 minutes
- Non-programmers can understand and modify generated scripts
- Load time under 2 seconds for typical stacks
- Zero data loss (auto-save + version history)

## Development Phases Overview

**Phase 1**: Foundation & Authentication (Week 1)
**Phase 2**: Data Models & Basic UI (Week 1-2)
**Phase 3**: Card Editor & Elements (Week 2-3)
**Phase 4**: Scripting Engine (Week 3-4)
**Phase 5**: AI Integration (Week 4-5)
**Phase 6**: Polish & Publishing (Week 5-6)

## Repository Structure
```
hypercard-renaissance/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   │   ├── editor/         # Card editor components
│   │   ├── runtime/        # Card runtime/player
│   │   ├── ui/             # shadcn components
│   │   └── layout/         # Layout components
│   ├── lib/                # Utilities
│   │   ├── supabase/       # Supabase client
│   │   ├── scripting/      # Script engine
│   │   └── types/          # TypeScript types
│   ├── hooks/              # Custom React hooks
│   └── styles/             # Global styles
├── supabase/
│   ├── migrations/         # Database migrations
│   └── functions/          # Edge functions
├── public/                 # Static assets
└── docs/                   # Documentation
```

## Next Steps
Refer to individual phase documents for detailed implementation instructions:
- `01-PHASE-1-FOUNDATION.md`
- `02-PHASE-2-DATA-MODELS.md`
- `03-PHASE-3-EDITOR.md`
- `04-PHASE-4-SCRIPTING.md`
- `05-PHASE-5-AI-INTEGRATION.md`
- `06-PHASE-6-PUBLISHING.md`