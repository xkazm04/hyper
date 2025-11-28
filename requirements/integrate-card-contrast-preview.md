# Integrate CardContrastPreview into Story Editor

## Component Overview
**File:** `src/app/features/accessibility/components/CardContrastPreview.tsx`
**Exports:** `CardContrastPreview`, `CardContrastIndicator`
**Purpose:** Provides live preview of story card appearance with high contrast mode, displays WCAG compliance metrics, and shows contrast ratios for all card color combinations.

## Why Integrate
This component addresses accessibility validation needs:

1. **Preview Before Apply**: Authors can see exactly how their cards will appear to users with high contrast needs before enabling the mode.
2. **WCAG Compliance Visibility**: Shows contrast ratio information and AA/AAA compliance status for text, buttons, and backgrounds.
3. **Existing Infrastructure**: Uses the same `ColorTokenResolver` and `HighContrastContext` that's already integrated in the app.
4. **Compact Indicator Available**: `CardContrastIndicator` provides a small badge showing compliance status for toolbar use.

## Integration Plan

### 1. Pre-Integration Updates
- [ ] Verify sub-components exist (`ContrastMetrics`, `ContrastPreview`, `ContrastControls`)
- [ ] Ensure `ColorTokenResolver` and context are properly imported
- [ ] Check that card data structure matches component expectations

### 2. Integration Points

**Primary Usage: Card Editor Accessibility Panel**
- File: `src/app/features/editor/story/sub_StoryCardEditor/StoryCardEditor.tsx`
- Location: Add as new section/tab in card editor, or as expandable panel
- Changes needed:
  - Import `CardContrastPreview` from accessibility feature
  - Add accessibility tab or expandable section
  - Pass current card title, content, and choices as props
  - Connect onApply callback to enable high contrast mode

**Secondary Usage: Toolbar Contrast Indicator**
- File: `src/app/features/editor/story/StoryEditorToolbar.tsx`
- Location: Next to other toolbar buttons
- Changes needed:
  - Import `CardContrastIndicator` from accessibility feature
  - Add indicator showing green checkmark (meets AA) or yellow warning (doesn't meet)
  - Clicking indicator could open full CardContrastPreview panel

**Tertiary Usage: Settings/Preferences Page (if created)**
- Location: Dedicated accessibility settings section
- Purpose: Allow users to preview and configure high contrast preferences globally

### 3. Testing Requirements
- [ ] Verify preview displays current card content accurately
- [ ] Test contrast ratio calculations display correctly
- [ ] Test preview toggle on/off functionality
- [ ] Verify Apply and Cancel callbacks work
- [ ] Test with both light and halloween (dark) themes
- [ ] Verify accessibility of the preview component itself

### 4. Cleanup Tasks
- [ ] Document contrast ratio thresholds in component
- [ ] Consider caching contrast analysis for performance

## Success Criteria
- CardContrastPreview accessible from card editor
- CardContrastIndicator visible in toolbar
- Users can preview high contrast before applying
- WCAG compliance status clearly communicated
- No regressions in card editing functionality

## Estimated Impact
- **Code Quality:** Medium - Adds accessibility validation feature
- **User Experience:** High - Helps authors create accessible content
- **Maintainability:** Medium - Depends on color token system
- **Performance:** Neutral - Calculations only when preview is active
