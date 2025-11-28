# Integrate WasmExportDialog into Story Publishing Workflow

## Component Overview
**File:** `src/app/features/wasm-runtime/components/WasmExportDialog.tsx`
**Exports:** `WasmExportDialog`
**Purpose:** Provides a complete offline export workflow for stories, compiling them into standalone HTML, JSON, or WASM bundles that work without server connectivity.

## Why Integrate
The WASM export feature fills a critical gap in the story distribution workflow:

1. **Offline Distribution**: Users currently can only share stories via online URLs. This component enables sharing stories as downloadable files that work offline.
2. **Complete Feature Ready**: The component is fully implemented with format selection, compilation progress, error handling, and download functionality.
3. **API Already Functional**: Backend endpoints at `/api/wasm/download` and `/api/wasm/compile` are already implemented and working.
4. **Enhanced Publishing Options**: Complements the existing PublishDialog by offering an alternative distribution method.

## Integration Plan

### 1. Pre-Integration Updates
- [ ] No modifications needed to WasmExportDialog - component is ready for integration
- [ ] Verify all sub-components are properly exported (`ExportFormatSelector`, `CompilationProgress`, `CompilationStats`)
- [ ] Ensure Character type is properly imported in consuming components

### 2. Integration Points

**Primary Usage: PublishDialog Enhancement**
- File: `src/app/features/editor/story/sub_StoryCardEditor/components/PublishDialog.tsx`
- Location: Add "Export Offline Bundle" button in the dialog footer alongside existing publish options
- Changes needed:
  - Import `WasmExportDialog` from wasm-runtime feature
  - Add state for controlling WasmExportDialog visibility
  - Add "Export Offline" button that opens the WasmExportDialog
  - Pass required props (stack, cards, choices, characters) from editor context

**Alternative Usage: StoryEditorToolbar**
- File: `src/app/features/editor/story/StoryEditorToolbar.tsx`
- Location: Add export button next to the publish button
- Changes needed:
  - Import `WasmExportDialog` and `Download` icon
  - Add state for dialog visibility
  - Render export button and dialog
  - Access editor context for story data

### 3. Testing Requirements
- [ ] Verify dialog opens correctly from PublishDialog/Toolbar
- [ ] Test format selection (HTML, JSON, WASM)
- [ ] Test compilation with sample story
- [ ] Verify download produces working offline bundle
- [ ] Test error states (empty story, compilation failure)
- [ ] Test keyboard navigation within dialog

### 4. Cleanup Tasks
- [ ] Add component to feature exports in `src/app/features/wasm-runtime/index.ts`
- [ ] Consider adding export count or last export date to story metadata

## Success Criteria
- WasmExportDialog integrated and accessible from publish workflow
- No regressions in existing publish functionality
- Users can successfully export stories to offline bundles
- All interactive elements have data-testid attributes

## Estimated Impact
- **Code Quality:** Medium - Adds new export capability to existing workflow
- **User Experience:** High - Enables entirely new distribution method
- **Maintainability:** Medium - Self-contained feature with clear boundaries
- **Performance:** Neutral - Compilation happens on user action, not by default
