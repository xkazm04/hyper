# Integrate HighContrastToggle into Story Editor Toolbar

## Component Overview
**File:** `src/app/features/accessibility/components/HighContrastToggle.tsx`
**Exports:** `HighContrastToggle`, `HighContrastButton`
**Purpose:** Provides accessible high contrast mode switching with three modes: Off, System (follow OS preference), and On. Includes compact button variant for toolbar placement.

## Why Integrate
The high contrast accessibility feature infrastructure is already in place but the editor lacks user controls:

1. **Accessibility Gap**: The `HighContrastWrapper` is already in the app layout (`src/app/layout.tsx:31`), but users cannot toggle it from the editor interface.
2. **Player Has It, Editor Doesn't**: The `AccessibilityToolbar` is used in `PlayerControls.tsx` but not in the editor, creating inconsistent UX.
3. **WCAG Compliance**: Adding this toggle supports WCAG 2.1 AA compliance for users who need higher contrast.
4. **Component Ready**: `HighContrastButton` is specifically designed for compact toolbar placement.

## Integration Plan

### 1. Pre-Integration Updates
- [ ] No modifications needed - component is ready for integration
- [ ] Verify `HighContrastButton` export is available from accessibility index

### 2. Integration Points

**Primary Usage: StoryEditorToolbar**
- File: `src/app/features/editor/story/StoryEditorToolbar.tsx`
- Location: Right section, next to `ThemeToggle` (line 62)
- Changes needed:
  - Import `HighContrastButton` from `@/app/features/accessibility`
  - Add `<HighContrastButton className="..." />` before or after `ThemeToggle`
  - Match existing button styling patterns

**Example Integration:**
```tsx
import { HighContrastButton } from '@/app/features/accessibility'

// In the right section (line 56-86):
<HighContrastButton />
<ThemeToggle />
```

**Secondary Usage: CardContrastIndicator in Preview**
- File: `src/app/features/editor/story/CardPreview.tsx`
- Location: Card preview header/toolbar area
- Changes needed:
  - Import `CardContrastIndicator` from `@/app/features/accessibility`
  - Add indicator showing current contrast compliance status

### 3. Testing Requirements
- [ ] Verify high contrast toggle appears in editor toolbar
- [ ] Test mode cycling (Off -> System -> On -> Off)
- [ ] Verify high contrast styles apply to editor UI
- [ ] Test keyboard accessibility of toggle button
- [ ] Verify ARIA attributes are correct
- [ ] Test on Windows High Contrast Mode (forced-colors media query)

### 4. Cleanup Tasks
- [ ] Ensure consistent styling with existing toolbar buttons
- [ ] Consider adding tooltip explaining the three modes

## Success Criteria
- HighContrastButton integrated in StoryEditorToolbar
- Users can toggle high contrast mode from the editor
- Toggle state persists across sessions (already handled by context)
- No regressions in existing toolbar functionality

## Estimated Impact
- **Code Quality:** Low - Simple import and render
- **User Experience:** High - Improves accessibility for visually impaired users
- **Maintainability:** Low - Uses existing infrastructure
- **Performance:** Neutral - Minimal overhead
