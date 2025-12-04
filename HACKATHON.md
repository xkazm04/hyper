# HyperCard Renaissance — Hackathon Submission

## Inspiration

Apple's HyperCard (1987) was revolutionary — it let anyone create interactive applications before the web existed. Teachers made educational games, writers crafted interactive fiction, and hobbyists built utilities — all without traditional programming. When Apple discontinued it in 2004, that democratizing spirit was lost.

We asked: *What if HyperCard existed today, enhanced with modern AI?* The result is HyperCard Renaissance — bringing the stack-and-card paradigm into 2024 with cloud storage, AI-generated content, and instant web publishing.

## What it does

HyperCard Renaissance is a web-based platform for creating interactive stories and branching narratives:

- **Visual Story Editor** — Design narrative flows with a node-based graph editor
- **Card-Based Scenes** — Each story moment is a "card" with text, images, and choices
- **AI Story Writing** — Claude generates narrative content, dialogue, and descriptions
- **AI Scene Imagery** — DALL-E creates unique artwork for each card
- **Character Consistency** — Bria AI trains character models and inserts them into scenes
- **One-Click Publishing** — Share stories instantly via unique URLs

## How we built it

- **Next.js 16** with App Router for the frontend and API routes
- **Supabase** (PostgreSQL) for database with Row Level Security
- **React Flow** for the visual story graph editor
- **Anthropic Claude API** for AI-assisted narrative generation
- **OpenAI DALL-E 3** for scene image generation
- **Bria AI API** for character model training and scene insertion
- **Tailwind CSS 4** with a custom theme system (light, halloween modes)
- **Zustand + RxJS** for reactive state management

## Challenges we ran into

- **Character consistency** — Maintaining the same character appearance across multiple AI-generated images was difficult until we integrated Bria AI's character training pipeline
- **Graph synchronization** — Keeping the visual story graph in sync with database state required building a custom RxJS-based event hub (GraphStreamHub)
- **Undo/redo** — Implementing reliable undo/redo across a complex editor with multiple entity types (cards, choices, characters) needed careful state snapshot management
- **Theme transitions** — Creating smooth, accessible theme switching while respecting user motion preferences took iteration

## Accomplishments that we're proud of

- **True democratization** — Non-technical users can create professional interactive stories with AI assistance
- **Character consistency solved** — Bria AI integration means characters look the same across an entire story
- **Instant publishing** — One click to go from draft to shareable URL
- **Accessibility-first** — WCAG 2.1 AA compliant from day one
- **The graph editor** — Visualizing story branches as a flowchart makes complex narratives manageable

## What we learned

- **AI as collaborator** — The best results come from AI generating drafts that humans refine, not full automation
- **Bria's power** — Character model training unlocks consistency that generic image generation can't achieve
- **Old ideas, new tech** — HyperCard's core concepts (stacks, cards, links) translate perfectly to modern web architecture
- **RxJS patterns** — Reactive streams elegantly solve complex UI synchronization problems

## What's next for Hyper

- **Multiplayer editing** — Real-time collaboration on stories
- **Voice narration** — AI-generated audio for accessibility and immersion
- **Story templates** — Pre-built structures for common narrative patterns (mystery, romance, adventure)
- **Asset marketplace** — Share and discover character models, backgrounds, and story components
- **Mobile app** — Native reading experience for published stories
- **Analytics** — Track reader choices to understand which paths resonate
