# Implementation Plan

- [x] 1. Database schema migration and cleanup




  - Create new simplified tables (story_stacks, story_cards, choices)
  - Set up Row Level Security policies for all tables
  - Create database indexes for performance optimization
  - Drop old unused tables (packages, deployments, stack_versions, stack_references, assets)
  - _Requirements: 9.1, 9.2, 9.4_

- [x] 2. Update TypeScript types and remove unused code




  - Replace types in src/lib/types/index.ts with simplified StoryStack, StoryCard, and Choice types
  - Remove unused types (Package, Deployment, StackVersion, StackReference, Element, Asset, etc.)
  - Create error types (StoryNotFoundError, CardNotFoundError, ImageGenerationError, etc.)
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Implement StoryService for data operations




  - Create StoryService class with CRUD operations for story stacks
  - Implement story card CRUD operations
  - Implement choice CRUD operations
  - Add slug generation utility function
  - Add story graph validation function (detect orphaned cards and dead ends)
  - _Requirements: 1.1, 1.2, 1.3, 3.2, 5.1, 5.2_

- [x] 4. Implement ImageService for AI image generation




  - Create ImageService class with generateImage method using OpenAI/Anthropic API
  - Implement image upload to Supabase Storage
  - Add image deletion functionality
  - Implement error handling and retry logic for image generation
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 10.1, 10.2, 10.3, 10.4_

- [x] 5. Create API routes for story operations





  - Create /api/stories route for listing user's stories
  - Create /api/stories/[id] route for get/update/delete operations
  - Create /api/stories/[id]/cards route for card operations
  - Create /api/stories/[id]/cards/[cardId]/choices route for choice operations
  - Create /api/stories/[id]/publish route for publishing stories
  - Add proper error handling and authentication checks
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 5.1, 5.2, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 6. Create API route for AI image generation





  - Create /api/ai/generate-image route
  - Integrate with OpenAI DALL-E or Anthropic image generation API
  - Implement rate limiting to prevent abuse
  - Add authentication check
  - Return generated image URL from Supabase Storage
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 7. Build simplified Dashboard page




  - Create StoryStackList component to display user's stories
  - Create StoryStackCard component with thumbnail, metadata, and actions
  - Implement CreateStoryDialog for creating new stories
  - Add delete confirmation dialog
  - Add search/filter functionality
  - Remove marketplace, templates, and performance monitoring components
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Build Story Editor layout and navigation





  - Create EditorLayout with three-column design (CardList, CardEditor, StoryGraph)
  - Implement EditorToolbar with back, add card, preview, and publish actions
  - Create CardList sidebar showing all cards in the story
  - Add card selection and navigation
  - Implement EditorContext for managing editor state
  - _Requirements: 1.1, 1.2, 6.1, 6.2_

- [x] 9. Implement Card Editor panel



  - Create CardEditor component with title and content fields
  - Add rich text editing for story content
  - Implement image section with generate and upload options
  - Create ImageGenerator dialog for AI image generation with prompt input
  - Add image preview and replace/remove functionality
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.4, 10.1, 10.2, 10.3, 10.4_

- [x] 10. Implement Choice management in editor




  - Create ChoiceEditor component for adding/editing choices
  - Implement choice list display with reordering
  - Add choice label input field
  - Create target card selector dropdown
  - Add delete choice functionality
  - Validate that target cards exist
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
-

- [x] 11. Build Story Graph visualization




  - Create StoryGraph component showing visual flow of story cards
  - Display cards as nodes with connections showing choice links
  - Highlight orphaned cards (no incoming links) in yellow
  - Highlight dead-end cards (no outgoing choices) in red
  - Make nodes clickable to navigate to that card in editor
  - Add zoom and pan controls for large stories
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
-

- [x] 12. Implement story publishing workflow




  - Add publish button to editor toolbar
  - Validate story has at least one card before publishing
  - Generate unique slug from story name
  - Update story stack with published status and slug
  - Show shareable URL after publishing
  - Add unpublish functionality
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_


- [x] 13. Build Story Player page




  - Create /play/[slug] route for published stories
  - Implement StoryPlayer component with clean, immersive layout
  - Display current card's image, title, and content
  - Render choice buttons for navigation
  - Implement choice click handler to navigate to target card
  - Add back button with browser history integration
  - Show "The End" message for cards with no choices
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
- [ ] 14. Implement auto-save functionality






- [ ] 14. Implement auto-save functionality

  - Add debounced auto-save for card title and content changes
  - Show save status indicator (saving/saved)
  - Queue changes locally if database connection is lost
  - Sync queued changes when connection is restored
  - Ensure all changes are saved before closing editor
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
-

- [x] 15. Delete unused files and components




  - Remove src/components/marketplace/ directory
  - Remove src/components/canvas/ directory
  - Remove src/components/editor/NodeEditor.tsx and NodePalette.tsx
  - Remove src/components/editor/NestedStackElement.tsx
  - Remove src/components/editor/DeploymentHistoryPanel.tsx
  - Remove src/components/editor/VersionHistoryPanel.tsx
  - Remove src/components/editor/NaturalLanguageStackEditor.tsx
  - Remove src/components/editor/StoryOutlineGenerator.tsx
  - Remove src/components/dashboard/AITemplateGenerator.tsx
  - Remove src/components/dashboard/RenderPerformanceMonitor.tsx
  - Remove src/components/dashboard/TemplateStacksSection.tsx
  - Remove src/components/runtime/NestedStackRenderer.tsx
  - Remove src/app/marketplace/ directory
  - Remove src/app/performance/ directory
  - Remove src/app/explore/ directory
  - Remove src/app/api/deploy/ directory
  - Remove src/app/api/embeddings/ directory
  - Remove src/app/api/generate-stack-template/ directory
  - Remove src/app/api/parse-stack-command/ directory
  - Remove docs/ directory
  - Remove scripts/ directory
  - _Requirements: All (cleanup to focus on adventure story use case)_
- [x] 16. Update package.json dependencies




- [ ] 16. Update package.json dependencies

  - Remove unused dependencies: reactflow, pixi.js, better-sqlite3, diff-match-patch, use-context-selector
  - Keep essential dependencies: Next.js, React, Supabase, Anthropic/OpenAI, Tailwind, shadcn/ui
  - Update .env.example to remove deployment-related variables
  - _Requirements: All (cleanup and optimization)_
-

- [ ] 17. Add mobile responsiveness




  - Make Dashboard responsive with grid layout
  - Make Story Editor responsive (stack panels vertically on mobile)
  - Make Story Player fully responsive with mobile-first design
  - Test on various screen sizes
  - Ensure touch interactions work properly
  - _Requirements: 4.1, 4.2, 4.3, 5.1_
- [ ] 18. Implement error handling and loading states


- [ ] 18. Implement error handling and loading states

  - Add error boundaries for React components
  - Show loading spinners during data fetching
  - Display user-friendly error messages with toast notifications
  - Handle image generation failures with retry option
  - _Requirements: 2.3, 9.2_
cefully
  - _Requirements: 2.3, 9.2_

- [ ] 19. Add accessibility features

  - Ensure keyboard navigation works for all interactive elements
  - Add proper ARIA labels to all components
  - Verify color contrast meets WCAG AA standards
  - Require alt text for all images
sable elements
  - Require alt text for all images
  - Test with screen reader
  - _Requirements: 2.4, 10.2_

- [ ] 20. Write documentation

  - Update README.md with new project description
  - Document the story creation workflow
  - Add API documentation for routes
  - Create user guide for story creators
  - Document database schema
  - _Requirements: All_
