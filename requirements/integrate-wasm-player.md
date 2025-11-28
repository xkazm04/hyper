# Integrate WasmPlayer as Offline Story Player

## Component Overview
**File:** `src/app/features/wasm-runtime/components/WasmPlayer.tsx`
**Exports:** `WasmPlayer`
**Purpose:** Fully-featured story player that runs from compiled WASM bundles without server connectivity. Includes keyboard navigation, auto-save progress, online/offline status indicator, and theme support.

## Why Integrate
This component enables true offline story experiences:

1. **Complete Player Implementation**: Full-featured player with navigation, back button, restart, keyboard shortcuts, and theme toggle.
2. **Offline-First Design**: Explicitly designed for offline use with online/offline status indicator.
3. **Progress Persistence**: Auto-save functionality stores player progress locally.
4. **Keyboard Accessibility**: Comprehensive keyboard shortcuts (Arrow keys, Space, Enter, Home, Escape).
5. **Responsive Design**: Mobile-friendly with touch-friendly buttons and responsive layouts.

## Integration Plan

### 1. Pre-Integration Updates
- [ ] Verify WasmRuntime and related types are properly exported
- [ ] Ensure CompiledStoryBundle type matches compiled output from WasmExportDialog
- [ ] Check that createRuntime function works correctly
- [ ] Verify Image component compatibility with blob URLs

### 2. Integration Points

**Primary Usage: Standalone Offline Player Page**
- Create new route: `src/app/play-offline/page.tsx` or `src/app/offline/[bundleId]/page.tsx`
- Purpose: Load and play pre-downloaded story bundles from IndexedDB or file input
- Changes needed:
  - Create new page component
  - Add file input or IndexedDB bundle selector
  - Render WasmPlayer with loaded bundle
  - Handle bundle loading errors gracefully

**Secondary Usage: Downloaded Bundle Opener**
- Location: Could be integrated with a "Recently Downloaded" section in dashboard
- Purpose: Quick access to previously downloaded offline stories
- Changes needed:
  - Track downloaded bundles in localStorage/IndexedDB
  - Show list of available offline stories
  - Open WasmPlayer with selected bundle

**Tertiary Usage: PWA Offline Fallback**
- Location: Service worker offline handler
- Purpose: When online story player fails due to connectivity, offer cached bundles
- Note: Requires PWA configuration updates

### 3. Testing Requirements
- [ ] Test bundle loading from different sources (file, IndexedDB)
- [ ] Verify keyboard navigation works (Up/Down/Left/Right/Space/Enter/Home)
- [ ] Test progress auto-save and restore
- [ ] Verify offline indicator updates correctly
- [ ] Test with large stories (many cards)
- [ ] Verify theme toggle works
- [ ] Test on mobile devices (touch navigation)
- [ ] Test accessibility with screen readers

### 4. Cleanup Tasks
- [ ] Add WasmPlayer to wasm-runtime feature exports
- [ ] Document bundle format for third-party tooling
- [ ] Consider adding bundle validation before playback

## Success Criteria
- Users can open and play downloaded story bundles
- Progress saves and restores correctly
- Keyboard navigation works fully
- Player works completely offline
- Theme and accessibility features function correctly

## Estimated Impact
- **Code Quality:** Medium - Adds new player route and infrastructure
- **User Experience:** High - Enables true offline story consumption
- **Maintainability:** Medium - Self-contained but requires bundle format stability
- **Performance:** Positive - Runs locally without network latency
