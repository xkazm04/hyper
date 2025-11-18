# Design Document: Adventure Story System

## Overview

The Adventure Story System is a focused redesign of the HyperCard Renaissance project, streamlined to support a single use case: creating interactive, choose-your-own-adventure style stories with AI-generated imagery. This design eliminates complexity from the current multi-purpose stack system and provides a purpose-built experience for narrative creators.

### Design Goals

1. **Simplicity**: Remove all non-essential features (marketplace, nested stacks, node editors, deployment, performance monitoring)
2. **Narrative Focus**: Optimize the interface and data model for storytelling workflows
3. **Visual Storytelling**: Integrate AI image generation as a first-class feature
4. **Playability**: Create an immersive player experience separate from the editing interface

### Key Differences from Current System

| Current System | Adventure Story System |
|----------------|------------------------|
| Generic "stacks" and "cards" | Story-specific "Story Stacks" and "Story Cards" |
| Multiple element types (buttons, inputs, shapes, images, nested stacks) | Only text, images, and choice buttons |
| Complex scripting with code/node editors | No scripting - simple choice-based navigation |
| Marketplace for sharing components | Simple story publishing with shareable URLs |
| Deployment to Vercel/Netlify | Built-in player at `/play/[slug]` |
| Performance monitoring | Removed |
| Template system | Removed (may add story templates later) |

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Dashboard  │  │ Story Editor │  │ Story Player │  │
│  │    /dashboard│  │/editor/[id]  │  │ /play/[slug] │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐  │
│  │           React Context (EditorContext)           │  │
│  └──────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Story Service│  │ Image Service│  │  Auth Service│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  API Layer (Next.js API Routes)          │
├─────────────────────────────────────────────────────────┤
│  /api/ai/generate-image  │  /api/stories/*              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    External Services                     │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐                    │
│  │   Supabase   │  │  OpenAI/     │                    │
│  │  (Database,  │  │  Anthropic   │                    │
│  │   Auth,      │  │  (Image Gen) │                    │
│  │   Storage)   │  │              │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

**Retained from Current System:**
- Next.js 16+ (App Router)
- React 19+
- TypeScript
- Supabase (Database, Auth, Storage)
- Tailwind CSS
- shadcn/ui components
- Anthropic Claude API (for image generation)

**Removed Dependencies:**
- `reactflow` (node editor - not needed)
- `pixi.js` (canvas rendering - not needed)
- `better-sqlite3` (local DB - not needed)
- `diff-match-patch` (version diffing - not needed)
- `use-context-selector` (over-optimization - not needed)

## Components and Interfaces

### Data Models

#### Simplified Type System

```typescript
// Story Stack - simplified from Stack
export interface StoryStack {
  id: string
  ownerId: string
  name: string
  description: string | null
  isPublished: boolean
  publishedAt: string | null
  slug: string | null
  firstCardId: string | null  // Entry point for the story
  createdAt: string
  updatedAt: string
}

// Story Card - simplified from Card
export interface StoryCard {
  id: string
  storyStackId: string
  title: string  // Scene title
  content: string  // Story text content
  imageUrl: string | null  // AI-generated or uploaded image
  imagePrompt: string | null  // Prompt used to generate the image
  orderIndex: number  // For editor organization
  createdAt: string
  updatedAt: string
}

// Choice - replaces Element (button type only)
export interface Choice {
  id: string
  storyCardId: string
  label: string  // Button text (e.g., "Go north", "Fight the dragon")
  targetCardId: string  // Which card to navigate to
  orderIndex: number  // Display order
  createdAt: string
  updatedAt: string
}

// User - unchanged
export interface User {
  id: string
  email: string
  username?: string
  createdAt: string
}
```

### Database Schema

```sql
-- Story Stacks table (replaces stacks)
CREATE TABLE story_stacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  slug TEXT UNIQUE,
  first_card_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Story Cards table (replaces cards)
CREATE TABLE story_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_stack_id UUID REFERENCES story_stacks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  image_prompt TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Choices table (replaces elements - button type only)
CREATE TABLE choices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_card_id UUID REFERENCES story_cards(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  target_card_id UUID REFERENCES story_cards(id) ON DELETE SET NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_story_cards_stack ON story_cards(story_stack_id);
CREATE INDEX idx_choices_card ON choices(story_card_id);
CREATE INDEX idx_story_stacks_owner ON story_stacks(owner_id);
CREATE INDEX idx_story_stacks_slug ON story_stacks(slug);
CREATE INDEX idx_story_stacks_published ON story_stacks(is_published, published_at);

-- Row Level Security
ALTER TABLE story_stacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE choices ENABLE ROW LEVEL SECURITY;

-- Policies for story_stacks
CREATE POLICY "Users can view their own stacks"
  ON story_stacks FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can view published stacks"
  ON story_stacks FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "Users can create their own stacks"
  ON story_stacks FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own stacks"
  ON story_stacks FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own stacks"
  ON story_stacks FOR DELETE
  USING (auth.uid() = owner_id);

-- Policies for story_cards
CREATE POLICY "Users can view cards from their stacks"
  ON story_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM story_stacks
      WHERE story_stacks.id = story_cards.story_stack_id
      AND (story_stacks.owner_id = auth.uid() OR story_stacks.is_published = TRUE)
    )
  );

CREATE POLICY "Users can manage cards in their stacks"
  ON story_cards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM story_stacks
      WHERE story_stacks.id = story_cards.story_stack_id
      AND story_stacks.owner_id = auth.uid()
    )
  );

-- Policies for choices
CREATE POLICY "Users can view choices from accessible cards"
  ON choices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM story_cards
      JOIN story_stacks ON story_stacks.id = story_cards.story_stack_id
      WHERE story_cards.id = choices.story_card_id
      AND (story_stacks.owner_id = auth.uid() OR story_stacks.is_published = TRUE)
    )
  );

CREATE POLICY "Users can manage choices in their stacks"
  ON choices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM story_cards
      JOIN story_stacks ON story_stacks.id = story_cards.story_stack_id
      WHERE story_cards.id = choices.story_card_id
      AND story_stacks.owner_id = auth.uid()
    )
  );
```

### Component Structure

#### Dashboard (`/dashboard`)

**Purpose**: List all user's story stacks with create/delete actions

**Components**:
- `DashboardLayout` - Main layout with header and navigation
- `StoryStackList` - Grid of story stack cards
- `StoryStackCard` - Individual stack preview with metadata
- `CreateStoryDialog` - Modal for creating new stories

**Key Features**:
- Display story stacks with thumbnails (first card image)
- Show metadata: card count, last edited, published status
- Quick actions: Edit, Delete, Publish/Unpublish
- Search and filter stories

#### Story Editor (`/editor/[id]`)

**Purpose**: Visual editor for creating and editing story cards and choices

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│                      Toolbar                             │
│  [Back] Story Name    [Add Card] [Preview] [Publish]    │
├──────────────┬──────────────────────────┬───────────────┤
│              │                          │               │
│   Card List  │     Card Editor          │  Story Graph  │
│   (Sidebar)  │     (Center)             │  (Sidebar)    │
│              │                          │               │
│  • Card 1    │  ┌────────────────────┐  │   ┌─────┐    │
│  • Card 2    │  │ Title: [______]    │  │   │ C1  │    │
│  • Card 3    │  │                    │  │   └──┬──┘    │
│              │  │ Content:           │  │      │       │
│              │  │ [____________]     │  │   ┌──▼──┐    │
│              │  │ [____________]     │  │   │ C2  │    │
│              │  │                    │  │   └──┬──┘    │
│              │  │ Image:             │  │      │       │
│              │  │ [Generate] [Upload]│  │   ┌──▼──┐    │
│              │  │ [___________]      │  │   │ C3  │    │
│              │  │                    │  │   └─────┘    │
│              │  │ Choices:           │  │               │
│              │  │ • [Choice 1] → C2  │  │               │
│              │  │ • [Choice 2] → C3  │  │               │
│              │  │ [+ Add Choice]     │  │               │
│              │  └────────────────────┘  │               │
└──────────────┴──────────────────────────┴───────────────┘
```

**Components**:
- `EditorLayout` - Three-column layout
- `EditorToolbar` - Top toolbar with actions
- `CardList` - Left sidebar with card navigation
- `CardEditor` - Center panel for editing current card
- `StoryGraph` - Right sidebar showing visual story flow
- `ImageGenerator` - Dialog for AI image generation
- `ChoiceEditor` - Component for managing choices

**Key Features**:
- Add/delete/reorder cards
- Edit card title and content (rich text)
- Generate images with AI (text prompt → image)
- Upload custom images
- Add/edit/delete choices
- Link choices to target cards
- Visual graph showing story flow
- Identify dead ends (cards with no choices)
- Identify orphaned cards (no incoming links)

#### Story Player (`/play/[slug]`)

**Purpose**: Immersive reading experience for published stories

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│                    ┌──────────────┐                     │
│                    │              │                     │
│                    │    Image     │                     │
│                    │              │                     │
│                    └──────────────┘                     │
│                                                          │
│                   Scene Title                            │
│                                                          │
│  Story content goes here. This is the narrative text    │
│  that describes what's happening in this scene. It can   │
│  be multiple paragraphs long and will be displayed in    │
│  a readable, centered format.                            │
│                                                          │
│                                                          │
│              ┌──────────────────────┐                   │
│              │   Go to the forest   │                   │
│              └──────────────────────┘                   │
│                                                          │
│              ┌──────────────────────┐                   │
│              │   Enter the castle   │                   │
│              └──────────────────────┘                   │
│                                                          │
│              ┌──────────────────────┐                   │
│              │   Return to village  │                   │
│              └──────────────────────┘                   │
│                                                          │
│                                                          │
│                    [← Back]                              │
└─────────────────────────────────────────────────────────┘
```

**Components**:
- `StoryPlayer` - Main player component
- `StoryCard` - Displays current card content
- `ChoiceButton` - Interactive choice buttons
- `NavigationHistory` - Back button with history

**Key Features**:
- Clean, distraction-free reading experience
- Large, readable text
- Prominent image display
- Clear choice buttons
- Back navigation (browser history)
- Smooth transitions between cards
- Mobile-responsive design

### Service Layer

#### StoryService

```typescript
class StoryService {
  // Story Stack operations
  async getStoryStacks(userId: string): Promise<StoryStack[]>
  async getStoryStack(id: string): Promise<StoryStack | null>
  async getPublishedStoryStack(slug: string): Promise<StoryStack | null>
  async createStoryStack(input: CreateStoryStackInput): Promise<StoryStack>
  async updateStoryStack(id: string, input: UpdateStoryStackInput): Promise<StoryStack>
  async deleteStoryStack(id: string): Promise<void>
  async publishStoryStack(id: string): Promise<StoryStack>
  async unpublishStoryStack(id: string): Promise<StoryStack>
  
  // Story Card operations
  async getStoryCards(storyStackId: string): Promise<StoryCard[]>
  async getStoryCard(id: string): Promise<StoryCard | null>
  async createStoryCard(input: CreateStoryCardInput): Promise<StoryCard>
  async updateStoryCard(id: string, input: UpdateStoryCardInput): Promise<StoryCard>
  async deleteStoryCard(id: string): Promise<void>
  
  // Choice operations
  async getChoices(storyCardId: string): Promise<Choice[]>
  async createChoice(input: CreateChoiceInput): Promise<Choice>
  async updateChoice(id: string, input: UpdateChoiceInput): Promise<Choice>
  async deleteChoice(id: string): Promise<void>
  
  // Utility operations
  async generateSlug(name: string): Promise<string>
  async validateStoryGraph(storyStackId: string): Promise<ValidationResult>
}
```

#### ImageService

```typescript
class ImageService {
  // AI Image Generation
  async generateImage(prompt: string): Promise<string>  // Returns image URL
  
  // Image Upload
  async uploadImage(file: File, storyStackId: string): Promise<string>  // Returns URL
  
  // Image Management
  async deleteImage(url: string): Promise<void>
}
```

## Error Handling

### Error Types

```typescript
export class StoryNotFoundError extends Error {
  constructor(id: string) {
    super(`Story stack not found: ${id}`)
    this.name = 'StoryNotFoundError'
  }
}

export class CardNotFoundError extends Error {
  constructor(id: string) {
    super(`Story card not found: ${id}`)
    this.name = 'CardNotFoundError'
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized access') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ImageGenerationError extends Error {
  constructor(message: string) {
    super(`Image generation failed: ${message}`)
    this.name = 'ImageGenerationError'
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(`Validation failed: ${message}`)
    this.name = 'ValidationError'
  }
}
```

### Error Handling Strategy

1. **API Routes**: Return appropriate HTTP status codes with error messages
2. **Service Layer**: Throw typed errors that can be caught and handled
3. **UI Layer**: Display user-friendly error messages with toast notifications
4. **Image Generation**: Retry logic with exponential backoff (max 3 attempts)
5. **Database Errors**: Log to console, show generic message to user

## Testing Strategy

### Unit Tests

**Priority Components**:
- `StoryService` - All CRUD operations
- `ImageService` - Image generation and upload
- Slug generation utility
- Story graph validation

**Testing Framework**: Jest + React Testing Library

### Integration Tests

**Key Flows**:
1. Create story → Add cards → Add choices → Publish
2. Generate image → Save to card
3. Play published story → Navigate choices
4. Delete story → Verify cascade deletion

### Manual Testing Checklist

- [ ] Create a new story stack
- [ ] Add multiple story cards
- [ ] Generate AI images for cards
- [ ] Upload custom images
- [ ] Create choices linking cards
- [ ] Verify story graph visualization
- [ ] Publish story and access via slug
- [ ] Play story and navigate all paths
- [ ] Test back navigation
- [ ] Delete story and verify cleanup
- [ ] Test mobile responsiveness
- [ ] Test with slow network (image loading)

## Migration Strategy

### Phase 1: Database Migration

1. Create new tables (`story_stacks`, `story_cards`, `choices`)
2. Migrate existing `stacks` data to `story_stacks` (if any worth keeping)
3. Drop old tables (`stacks`, `cards`, `elements`, `assets`, `packages`, etc.)

### Phase 2: Code Cleanup

**Files to Delete**:
```
src/components/marketplace/
src/components/editor/NodeEditor.tsx
src/components/editor/NodePalette.tsx
src/components/editor/NestedStackElement.tsx
src/components/editor/DeploymentHistoryPanel.tsx
src/components/editor/VersionHistoryPanel.tsx
src/components/editor/NaturalLanguageStackEditor.tsx
src/components/editor/StoryOutlineGenerator.tsx
src/components/canvas/
src/components/dashboard/AITemplateGenerator.tsx
src/components/dashboard/RenderPerformanceMonitor.tsx
src/components/dashboard/TemplateStacksSection.tsx
src/components/runtime/NestedStackRenderer.tsx
src/app/marketplace/
src/app/performance/
src/app/explore/
src/app/api/deploy/
src/app/api/embeddings/
src/app/api/generate-stack-template/
src/app/api/parse-stack-command/
docs/
scripts/
```

**Files to Modify**:
- `src/lib/types/index.ts` - Replace with simplified types
- `src/components/editor/*` - Simplify for story editing
- `src/components/dashboard/*` - Simplify for story management
- `src/app/dashboard/page.tsx` - Story stack list
- `src/app/editor/[stackId]/page.tsx` - Story editor
- Create `src/app/play/[slug]/page.tsx` - Story player

### Phase 3: Feature Implementation

1. Implement simplified data models and services
2. Build story editor UI
3. Integrate AI image generation
4. Build story player
5. Add publishing workflow
6. Test end-to-end

## Performance Considerations

### Optimization Strategies

1. **Image Loading**: Use Next.js Image component with lazy loading
2. **Database Queries**: Use indexes on foreign keys and slug lookups
3. **Caching**: Cache published stories at CDN edge (Vercel Edge)
4. **Bundle Size**: Remove unused dependencies (reactflow, pixi.js, etc.)
5. **API Rate Limiting**: Implement rate limiting for image generation

### Expected Performance Metrics

- Dashboard load: < 1s
- Editor load: < 2s
- Story player load: < 1s
- Image generation: 10-30s (external API)
- Card navigation: < 200ms

## Security Considerations

1. **Authentication**: Supabase Auth with email/password
2. **Authorization**: Row Level Security (RLS) policies
3. **Image Upload**: Validate file types and sizes
4. **API Keys**: Store in environment variables, never expose to client
5. **XSS Prevention**: Sanitize user-generated content (story text)
6. **CSRF Protection**: Next.js built-in protection
7. **Rate Limiting**: Limit image generation requests per user

## Accessibility

1. **Keyboard Navigation**: All interactive elements accessible via keyboard
2. **Screen Readers**: Proper ARIA labels and semantic HTML
3. **Color Contrast**: WCAG AA compliance for text
4. **Focus Indicators**: Visible focus states
5. **Alt Text**: Required for all images
6. **Responsive Design**: Mobile-first approach

## Future Enhancements (Out of Scope for Initial Release)

1. **Story Templates**: Pre-built story structures (e.g., "Mystery", "Fantasy Quest")
2. **Collaborative Editing**: Multiple authors working on same story
3. **Analytics**: Track which story paths are most popular
4. **Comments**: Allow readers to leave feedback
5. **Story Collections**: Group related stories
6. **Export**: Download story as PDF or ePub
7. **Audio Narration**: Text-to-speech for accessibility
8. **Achievements**: Unlock badges for completing stories
9. **Branching Analytics**: Visualize player choices
10. **Version History**: Restore previous versions of stories
