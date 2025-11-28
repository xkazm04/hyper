# Requirements Document

## Introduction

This specification defines the refactoring of large files (>200 lines) in the Hyper project into modular, maintainable components following the established `sub_*` folder pattern. Each refactored component will receive a unique Halloween-themed visual enhancement to differentiate the theme beyond simple color switching.

## Glossary

- **Large File**: A TypeScript/TSX/CSS file exceeding 200 lines of code
- **Sub-Module**: A feature folder following the `sub_*` naming convention containing components/, lib/, and hooks/ subdirectories
- **Halloween Theme**: The dark purple-accented theme activated via the `.halloween` CSS class
- **Visual Enhancement**: A unique CSS animation, effect, or decorative element specific to a component
- **Refactor Target**: A file identified for decomposition into smaller, focused modules

## Requirements

### Requirement 1: File Scanning and Identification

**User Story:** As a developer, I want to identify all files exceeding 200 lines, so that I can prioritize refactoring efforts systematically.

#### Acceptance Criteria

1. WHEN the system scans the src directory THEN the system SHALL identify all .ts, .tsx, and .css files exceeding 200 lines
2. WHEN files are identified THEN the system SHALL categorize them by type (component, service, hook, type definition, style)
3. WHEN categorization is complete THEN the system SHALL prioritize files by line count descending

### Requirement 2: Component Decomposition

**User Story:** As a developer, I want large components split into focused sub-modules, so that the codebase remains maintainable and testable.

#### Acceptance Criteria

1. WHEN a component file exceeds 200 lines THEN the system SHALL decompose it following the sub_* folder pattern
2. WHEN decomposing a component THEN the system SHALL create separate files for: main component, sub-components, hooks, utilities, and types
3. WHEN creating sub-modules THEN the system SHALL maintain a maximum of 200 lines per file
4. WHEN refactoring is complete THEN the system SHALL preserve all existing functionality without breaking changes
5. WHEN a module is created THEN the system SHALL export public APIs through an index.ts barrel file

### Requirement 3: Service Layer Refactoring

**User Story:** As a developer, I want large service files split into domain-specific modules, so that business logic is organized and discoverable.

#### Acceptance Criteria

1. WHEN a service file exceeds 200 lines THEN the system SHALL split it by domain responsibility
2. WHEN splitting services THEN the system SHALL group related functions into cohesive modules
3. WHEN refactoring services THEN the system SHALL maintain backward-compatible exports from the original file path

### Requirement 4: Halloween Visual Enhancements

**User Story:** As a user, I want each major UI component to have a unique Halloween-themed visual effect, so that the theme feels immersive and distinctive.

#### Acceptance Criteria

1. WHEN the Halloween theme is active THEN each refactored component SHALL display a unique visual enhancement
2. WHEN implementing visual effects THEN the system SHALL use CSS animations, pseudo-elements, or SVG decorations
3. WHEN adding effects THEN the system SHALL respect the prefers-reduced-motion media query
4. WHEN effects are applied THEN the system SHALL maintain component usability and readability
5. WHEN implementing effects THEN the system SHALL use the existing Halloween color palette (purple hues: 270°)

### Requirement 5: CSS Architecture Refactoring

**User Story:** As a developer, I want the globals.css file modularized, so that styles are co-located with their components.

#### Acceptance Criteria

1. WHEN globals.css exceeds 200 lines THEN the system SHALL extract component-specific styles to CSS modules
2. WHEN extracting styles THEN the system SHALL keep only global theme variables and base styles in globals.css
3. WHEN creating CSS modules THEN the system SHALL co-locate them with their respective components
4. WHEN refactoring CSS THEN the system SHALL maintain all existing visual behaviors

### Requirement 6: Type Definition Organization

**User Story:** As a developer, I want type definitions organized by domain, so that types are discoverable and maintainable.

#### Acceptance Criteria

1. WHEN a types file exceeds 200 lines THEN the system SHALL split it by domain (e.g., nodes, cards, characters)
2. WHEN splitting types THEN the system SHALL create domain-specific type files
3. WHEN refactoring types THEN the system SHALL re-export all types from the original index.ts for backward compatibility

### Requirement 7: Hook Extraction

**User Story:** As a developer, I want complex hooks decomposed into smaller, composable hooks, so that logic is reusable and testable.

#### Acceptance Criteria

1. WHEN a hook file exceeds 200 lines THEN the system SHALL extract sub-hooks for distinct responsibilities
2. WHEN extracting hooks THEN the system SHALL maintain the original hook as a composition of smaller hooks
3. WHEN creating sub-hooks THEN the system SHALL place them in a hooks/ subdirectory of the relevant feature

### Requirement 8: Halloween Effect Catalog

**User Story:** As a developer, I want a documented catalog of Halloween effects, so that new components can adopt consistent theming.

#### Acceptance Criteria

1. WHEN implementing Halloween effects THEN the system SHALL document each effect type in a catalog
2. WHEN documenting effects THEN the system SHALL include: effect name, CSS class, applicable components, and preview
3. WHEN the catalog is complete THEN the system SHALL provide utility classes for common effect patterns
