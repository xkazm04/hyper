# Fix Build Errors - Requirements

## Overview
Systematically resolve 69 TypeScript compilation errors preventing successful production build in the vibeman project. Previous work has already fixed 25+ errors, and this spec addresses all remaining issues.

## User Stories

### US-1: Missing Module Resolution
**As a** developer  
**I want** all missing module imports to be resolved  
**So that** TypeScript can compile all dependent files

**Acceptance Criteria:**
- StatusChip component exists at `@/app/components/ui/StatusChip`
- All imports of StatusChip resolve successfully
- No "Cannot find module" errors remain

### US-2: ScanResult Type Consistency
**As a** developer  
**I want** all ScanResult generic types to match their expected data types  
**So that** adapter methods return correctly typed results

**Acceptance Criteria:**
- All FastAPI adapters return `ScanResult<FastAPIXxxData>` not `ScanResult<undefined>`
- All NextJS adapters return `ScanResult<NextJSXxxData>` not `ScanResult<undefined>`
- All ReactNative adapters return `ScanResult<ReactNativeXxxData>` not `ScanResult<undefined>`
- 12 ScanResult type mismatch errors resolved

### US-3: DecisionData Type Conversions
**As a** developer  
**I want** DecisionData to be properly converted to framework-specific data types  
**So that** adapter methods maintain type safety

**Acceptance Criteria:**
- All 9 DecisionData type mismatches resolved
- Type conversions use appropriate casting patterns (through `unknown` if needed)
- No unsafe `as any` casts unless absolutely necessary

### US-4: ScanResult.data Property Access
**As a** developer  
**I want** to safely access the data property on ScanResult objects  
**So that** TypeScript recognizes the property exists

**Acceptance Criteria:**
- All 9 "Property 'data' does not exist on type 'never'" errors resolved
- Type guards or assertions properly narrow types before property access
- Code maintains runtime safety

### US-5: OnboardingStep Generic Type Alignment
**As a** developer  
**I want** OnboardingStep generic parameters to match their data types  
**So that** step data is correctly typed throughout the onboarding flow

**Acceptance Criteria:**
- All 9 OnboardingStep type errors resolved
- Generic type parameters align with framework-specific data types
- Type safety maintained across adapter boundaries

### US-6: LLMResponse Property Standardization
**As a** developer  
**I want** consistent access to LLM response content  
**So that** all code uses the correct property name

**Acceptance Criteria:**
- All 11 "Property 'text' does not exist" errors resolved
- Code uses correct property (likely `response` instead of `text`)
- LLMResponse interface usage is consistent across codebase

### US-7: Miscellaneous Type Fixes
**As a** developer  
**I want** all remaining type incompatibilities resolved  
**So that** the build completes successfully

**Acceptance Criteria:**
- RefactorWizardState 'packages' property issues resolved (4 errors)
- Task 'response' property issue resolved (1 error)
- Set<string> to string[] conversion fixed (1 error)
- ProviderConfig 'model' property issues resolved (3 errors)
- Context undefined checks added (3 errors)
- AnnetteTheme type alignment fixed (2 errors)
- All 18 miscellaneous errors resolved

## Technical Context

### Error Categories (Priority Order)
1. **Priority 1 - Missing Modules (4 errors)**: Block compilation of dependent files
2. **Priority 2 - Systematic Type Issues (48 errors)**: Patterns affecting multiple adapters
3. **Priority 3 - Individual Type Issues (17 errors)**: Isolated fixes

### Key Type Patterns to Use
- Double cast through `unknown` for complex type conversions: `value as unknown as TargetType`
- Nullish coalescing for null/undefined: `value ?? undefined`
- Type guards before property access
- Proper generic type parameters in function signatures

### Files Affected
- **Adapters**: 9 files (FastAPI, NextJS, ReactNative - Build, Contexts, Structure)
- **UI Components**: 3 files (AnnettePanel, IdeaDetailModal, ReviewStep, FilterPanel)
- **Managers/Services**: 5 files (conversationManager, aiAnalyzer, packageGenerator, techDebtScanner)
- **Scan Strategies**: 3 files (FastAPIScanStrategy, NextJSScanStrategy, ReactNativeScanStrategy)
- **Stores**: 2 files (refactorStore, themeStore)
- **Other**: 5 files (TaskItem, RelatedProjectSelector, AsyncVoiceSolution, ConvModelSelector, context scans)

## Success Criteria
- [ ] `npm run build` completes without TypeScript errors

-

- [ ] All 69 errors resolved

- [ ] No type safety compromises (minimal use of `as any`)
- [ ] Production build artifacts generated successfully
- [ ] No new errors introduced

## Out of Scope
- Runtime behavior changes (unless required for type fixes)
- Refactoring beyond what's needed for type safety
- Performance optimizations
- Adding new features

## Dependencies
- Access to vibeman project at `C:\Users\kazda\kiro\vibeman`
- Node.js and npm installed
- TypeScript compiler available via `npm run build`

## Notes
- Some errors may cascade - fixing one may resolve others
- The actual error count may decrease as blocking errors are fixed
- LLMResponse likely has `response` property instead of `text` based on error patterns
- StatusChip component needs to be created or import path corrected
