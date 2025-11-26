# Fix Build Errors - Implementation Plan

## Phase 1: Missing Modules (Priority 1)
**Goal**: Resolve 4 "Cannot find module" errors to unblock dependent file compilation

### Task 1.1: Investigate StatusChip Component
- Check if StatusChip exists elsewhere in the codebase
- Search for similar components that might be renamed
- Determine if component needs to be created or import path corrected

**Files to check:**
- `src/app/components/ui/` directory structure
- Existing chip/badge/status components

### Task 1.2: Resolve StatusChip Imports
**Option A**: If component exists elsewhere
- Update import paths in affected files
- Verify component exports match usage

**Option B**: If component doesn't exist
- Create minimal StatusChip component at `src/app/components/ui/StatusChip.tsx`
- Implement basic props interface based on usage in consuming files
- Export component properly

**Affected files:**
- `src/app/features/Annette/components/AnnettePanel.tsx` (2 imports)
- `src/app/features/Ideas/components/IdeaDetailModal.tsx` (2 imports)

**Verification:**
```bash
npm run build
```
Expected: 4 fewer errors (65 remaining)

---

## Phase 2: LLMResponse Property Fixes (Priority 2)
**Goal**: Resolve 11 "Property 'text' does not exist" errors by using correct property name

### Task 2.1: Verify LLMResponse Interface
- Locate LLMResponse type definition
- Confirm correct property name (likely `response` not `text`)
- Document the interface structure

### Task 2.2: Update LLMResponse Property Access
Replace `response.text` with `response.response` (or correct property) in:

**Conversation/AI files (5 errors):**
- `src/app/features/Annette/lib/conversationManager.ts` (lines 125, 125, 155, 179)
- `src/app/features/RefactorWizard/lib/aiAnalyzer.ts` (line 53)
- `src/app/features/RefactorWizard/lib/packageGenerator.ts` (line 45)

**Context scan files (3 errors):**
- `src/app/features/Onboarding/sub_Blueprint/lib/context-scans/blueprintContextReviewScan.ts` (line 68)
- `src/app/features/Onboarding/sub_Blueprint/lib/context-scans/contextDecisionScan.ts` (line 59)
- `src/app/features/Onboarding/sub_Blueprint/lib/context-scans/featureExplanationScan.ts` (line 68)

**Scanner files (3 errors):**
- `src/app/features/TechDebtRadar/lib/techDebtScanner.ts` (line 127)
- `src/lib/scan/strategies/FastAPIScanStrategy.ts` (line 101)
- `src/lib/scan/strategies/NextJSScanStrategy.ts` (line 125)
- `src/lib/scan/strategies/ReactNativeScanStrategy.ts` (line 119)

**Verification:**
```bash
npm run build
```
Expected: 11 fewer errors (54 remaining)

---

## Phase 3: ScanResult Type Fixes (Priority 2)
**Goal**: Resolve 30 errors related to ScanResult generic type mismatches

### Task 3.1: Fix ScanResult<undefined> Returns (12 errors)
Update return types in adapter methods to use correct generic parameter:

**Pattern to fix:**
```typescript
// Before
return { success: false, data: undefined } as ScanResult<undefined>;

// After
return { success: false, data: undefined } as ScanResult<FastAPIBuildData>;
```

**FastAPI adapters (4 errors):**
- `FastAPIBuildAdapter.ts` (line 48)
- `FastAPIContextsAdapter.ts` (lines 71, 95)
- `FastAPIStructureAdapter.ts` (line 69)

**NextJS adapters (4 errors):**
- `NextJSBuildAdapter.ts` (line 46)
- `NextJSContextsAdapter.ts` (lines 105, 129)
- `NextJSStructureAdapter.ts` (line 87)

**ReactNative adapters (4 errors):**
- `ReactNativeBuildAdapter.ts` (line 50)
- `ReactNativeContextsAdapter.ts` (lines 84, 108)
- `ReactNativeStructureAdapter.ts` (line 77)

### Task 3.2: Fix DecisionData Type Conversions (9 errors)
Add proper type casting when converting DecisionData to framework-specific types:

**Pattern to fix:**
```typescript
// Before
const data: FastAPIBuildData | undefined = decisionData;

// After
const data: FastAPIBuildData | undefined = decisionData as unknown as FastAPIBuildData;
```

**FastAPI adapters (3 errors):**
- `FastAPIBuildAdapter.ts` (line 75)
- `FastAPIContextsAdapter.ts` (line 127)
- `FastAPIStructureAdapter.ts` (line 101)

**NextJS adapters (3 errors):**
- `NextJSBuildAdapter.ts` (line 73)
- `NextJSContextsAdapter.ts` (line 163)
- `NextJSStructureAdapter.ts` (line 119)

**ReactNative adapters (3 errors):**
- `ReactNativeBuildAdapter.ts` (line 77)
- `ReactNativeContextsAdapter.ts` (line 142)
- `ReactNativeStructureAdapter.ts` (line 109)

### Task 3.3: Fix ScanResult.data Property Access (9 errors)
Add type guards or assertions before accessing `.data` property:

**Pattern to fix:**
```typescript
// Before
const value = scanResult.data;

// After
const value = (scanResult as ScanResult<FastAPIBuildData>).data;
```

**Same files as Task 3.2, next line after each error**

**Verification:**
```bash
npm run build
```
Expected: 30 fewer errors (24 remaining)

---

## Phase 4: OnboardingStep Type Fixes (Priority 2)
**Goal**: Resolve 9 OnboardingStep generic type mismatches

### Task 4.1: Fix OnboardingStep Generic Parameters
Update OnboardingStep type parameters to match framework-specific data types:

**Pattern to fix:**
```typescript
// Before
return step as OnboardingStep<DecisionData>;

// After
return step as unknown as OnboardingStep<FastAPIBuildData>;
```

**FastAPI adapters (2 errors):**
- `FastAPIBuildAdapter.ts` (line 77)
- `FastAPIContextsAdapter.ts` (line 129)
- `FastAPIStructureAdapter.ts` (line 103)

**NextJS adapters (2 errors):**
- `NextJSBuildAdapter.ts` (line 75)
- `NextJSContextsAdapter.ts` (line 165)
- `NextJSStructureAdapter.ts` (line 121)

**ReactNative adapters (2 errors):**
- `ReactNativeBuildAdapter.ts` (line 79)
- `ReactNativeContextsAdapter.ts` (line 144)
- `ReactNativeStructureAdapter.ts` (line 111)

**Verification:**
```bash
npm run build
```
Expected: 9 fewer errors (15 remaining)

---

## Phase 5: Miscellaneous Type Fixes (Priority 3)
**Goal**: Resolve remaining 15 individual type errors

### Task 5.1: Fix RefactorWizardState 'packages' Property (4 errors)
- Locate RefactorWizardState interface definition
- Add missing 'packages' property or update usage sites
- Files affected:
  - `src/app/features/RefactorWizard/components/ReviewStep.tsx` (line 15)
  - `src/app/features/reflector/sub_Reflection/components/FilterPanel.tsx` (line 11)
  - `src/stores/refactorStore.ts` (line 20)

### Task 5.2: Fix Task 'response' Property (1 error)
- Locate Task interface definition
- Add missing 'response' property or update usage
- File: `src/app/features/TaskRunner/TaskItem.tsx` (line 27)

### Task 5.3: Fix Set<string> to string[] Conversion (1 error)
- Convert Set to Array using `Array.from()` or spread operator
- File: `src/app/projects/sub_ProjectForm/components/RelatedProjectSelector.tsx` (line 15)

**Pattern:**
```typescript
// Before
const arr: string[] = mySet;

// After
const arr: string[] = Array.from(mySet);
```

### Task 5.4: Fix ProviderConfig 'model' Property (3 errors)
- Locate ProviderConfig interface
- Add missing 'model' property or update property access
- Files:
  - `src/app/voicebot/components/AsyncVoiceSolution.tsx` (line 173)
  - `src/app/voicebot/components/conversation/ConvModelSelector.tsx` (lines 30, 55)

### Task 5.5: Add Context Undefined Checks (3 errors)
- Add optional chaining or null checks before accessing 'context' property
- Files:
  - `src/lib/scan/strategies/FastAPIScanStrategy.ts` (line 102)
  - `src/lib/scan/strategies/NextJSScanStrategy.ts` (line 126)
  - `src/lib/scan/strategies/ReactNativeScanStrategy.ts` (line 120)

**Pattern:**
```typescript
// Before
const value = result.context.something;

// After
const value = result.context?.something;
```

### Task 5.6: Fix AnnetteTheme Type (2 errors)
- Locate AnnetteTheme type definition
- Update to accept "light" | "dark" or cast values appropriately
- File: `src/stores/themeStore.ts` (lines 7, 8)

**Verification:**
```bash
npm run build
```
Expected: 15 fewer errors (0 remaining)

---

## Phase 6: Final Verification
**Goal**: Confirm all errors resolved and build succeeds

### Task 6.1: Full Build Test
```bash
cd C:\Users\kazda\kiro\vibeman
npm run build
```

**Expected output:**
- No TypeScript compilation errors
- Build completes successfully
- Production artifacts generated

### Task 6.2: Verify Type Safety
- Review all type casts added during fixes
- Ensure no unsafe `as any` casts remain
- Confirm type guards are appropriate

### Task 6.3: Documentation
- Update any relevant documentation about type changes
- Document any interface modifications made
- Note any breaking changes (if applicable)

---

## Rollback Plan
If issues arise during implementation:
1. Each phase can be reverted independently via git
2. Keep commits atomic (one phase per commit)
3. Test after each phase to isolate problems

## Estimated Effort
- Phase 1: 30 minutes (investigation + fix)
- Phase 2: 20 minutes (straightforward property rename)
- Phase 3: 45 minutes (systematic but repetitive)
- Phase 4: 20 minutes (similar pattern to Phase 3)
- Phase 5: 40 minutes (varied fixes requiring investigation)
- Phase 6: 15 minutes (verification)

**Total: ~2.5 hours**

## Notes
- Work in vibeman project: `C:\Users\kazda\kiro\vibeman`
- Run builds frequently to catch cascading fixes
- Some errors may auto-resolve as blocking errors are fixed
- Prioritize type safety over quick fixes
