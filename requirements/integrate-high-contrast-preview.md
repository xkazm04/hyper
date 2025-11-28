# Integrate HighContrastPreview into Accessibility Settings

## Component Overview
**File:** `src/app/features/accessibility/components/HighContrastPreview.tsx`
**Exports:** `HighContrastPreview`
**Purpose:** Provides side-by-side comparison of normal vs high contrast colors with sample card preview. Allows users to preview color changes before applying high contrast mode globally.

## Why Integrate
This component enhances the high contrast configuration experience:

1. **Preview Before Commit**: Users can see exactly how colors will change before enabling high contrast.
2. **Visual Comparison**: Shows sample card, text, and UI elements in preview container.
3. **Color Swatches**: Displays text and UI color comparisons for transparency.
4. **Confirm/Cancel Flow**: Modal-friendly design with explicit apply/cancel actions.

## Integration Plan

### 1. Pre-Integration Updates
- [ ] No modifications needed - component is ready for integration
- [ ] Verify `useHighContrast` hook is properly exported
- [ ] Ensure `ColorTokenResolver` functions correctly

### 2. Integration Points

**Primary Usage: Settings/Preferences Page (Needs Creation)**
- File: Create `src/app/settings/page.tsx` or `src/app/settings/accessibility/page.tsx`
- Purpose: Dedicated settings page for accessibility preferences
- Changes needed:
  - Create new settings route
  - Import `HighContrastPreview` component
  - Add section for accessibility settings
  - Include preview in modal or inline panel

**Secondary Usage: Accessibility Panel in Editor**
- File: Add to StoryCardEditor or create dedicated AccessibilityPanel
- Location: Could be a tab in the editor or dropdown menu option
- Changes needed:
  - Import `HighContrastPreview`
  - Add as expandable section or dialog trigger
  - Connect with existing high contrast context

**Tertiary Usage: User Profile/Account Settings**
- Location: If user profile page exists, add accessibility section
- Purpose: Persistent user preference configuration
- Changes: Similar to settings page integration

### 3. Testing Requirements
- [ ] Verify preview toggle shows/hides preview container
- [ ] Test color swatches display correctly
- [ ] Verify sample card applies preview styles
- [ ] Test Confirm applies high contrast globally
- [ ] Test Cancel restores original state
- [ ] Verify works in modal context (showInModal prop)
- [ ] Test with both themes (light, halloween)

### 4. Cleanup Tasks
- [ ] Consider consolidating with CardContrastPreview if overlap exists
- [ ] Add preference sync across devices (if user accounts support it)

## Success Criteria
- HighContrastPreview accessible from settings or accessibility panel
- Preview accurately shows high contrast appearance
- Confirm/Cancel actions work correctly
- Integration doesn't affect existing high contrast functionality

## Estimated Impact
- **Code Quality:** Medium - Requires creating settings infrastructure
- **User Experience:** Medium - Improves accessibility configuration UX
- **Maintainability:** Low - Self-contained preview component
- **Performance:** Neutral - Preview only active when toggled
