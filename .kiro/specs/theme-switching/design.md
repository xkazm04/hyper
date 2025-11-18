# Theme Switching System Design

## Overview

This design document outlines the architecture and implementation approach for a comprehensive theme switching system in the HyperCard Renaissance application. The system will enable users to switch between a default light theme (preserving current colors) and a Halloween-themed dark mode featuring dark backgrounds with light purple tones.

The design leverages Tailwind CSS v4's CSS custom properties approach, React Context for state management, and localStorage for persistence. The implementation will systematically migrate hardcoded color classes to theme-aware variables while maintaining the application's distinctive retro aesthetic with bold borders and shadow effects.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Components  │  │    Pages     │  │   Layouts    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┴──────────────────┘               │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                    Theme Provider Layer                       │
│                           │                                  │
│  ┌────────────────────────▼───────────────────────────┐     │
│  │         ThemeProvider (React Context)              │     │
│  │  - Current theme state                             │     │
│  │  - Theme switching logic                           │     │
│  │  - localStorage persistence                        │     │
│  │  - Theme application to DOM                        │     │
│  └────────────────────────┬───────────────────────────┘     │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                   Theme Definition Layer                      │
│                           │                                  │
│  ┌────────────────────────▼───────────────────────────┐     │
│  │         CSS Custom Properties (globals.css)        │     │
│  │  - :root (light theme - default)                   │     │
│  │  - .halloween (Halloween dark theme)               │     │
│  │  - Transition definitions                          │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      Theme Configuration (theme-config.ts)           │   │
│  │  - Available themes metadata                         │   │
│  │  - Theme names, labels, icons                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User clicks Theme Toggle
        │
        ▼
ThemeProvider.setTheme()
        │
        ├──► Update React state
        │
        ├──► Save to localStorage
        │
        └──► Apply theme class to <html> element
                │
                ▼
        CSS custom properties update
                │
                ▼
        All components re-render with new colors
```

## Components and Interfaces

### 1. Theme Configuration

**File:** `src/lib/theme/theme-config.ts`

```typescript
export type ThemeName = 'light' | 'halloween'

export interface ThemeConfig {
  name: ThemeName
  label: string
  icon: string
  description: string
}

export const themes: ThemeConfig[] = [
  {
    name: 'light',
    label: 'Light',
    icon: '☀️',
    description: 'Clean and bright default theme'
  },
  {
    name: 'halloween',
    label: 'Halloween',
    icon: '🎃',
    description: 'Spooky dark theme with purple accents'
  }
]

export const defaultTheme: ThemeName = 'light'
```

### 2. Theme Context and Provider

**File:** `src/contexts/ThemeContext.tsx`

```typescript
interface ThemeContextType {
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
  toggleTheme: () => void
  availableThemes: ThemeConfig[]
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // State management
  // localStorage persistence
  // DOM class application
  // Context value provision
}

export function useTheme(): ThemeContextType {
  // Hook for consuming theme context
}
```

**Key Responsibilities:**
- Manage current theme state
- Persist theme selection to localStorage
- Apply theme class to `<html>` element
- Provide theme switching functions to components
- Handle initial theme loading (from localStorage or system preference)
- Disable transitions on initial load to prevent FOUC

### 3. Theme Toggle Component

**File:** `src/components/theme/ThemeToggle.tsx`

```typescript
export function ThemeToggle() {
  const { theme, toggleTheme, availableThemes } = useTheme()
  
  // Render button with current theme icon
  // Handle click to cycle through themes
  // Show tooltip with theme name
  // Ensure accessibility (aria-label, keyboard support)
}
```

**Design Specifications:**
- Position: Fixed in top-right corner or in main navigation
- Visual style: Matches retro aesthetic with border and shadow
- Size: 44x44px minimum for touch targets
- States: Default, hover, active, focus
- Animation: Smooth icon transition when theme changes

### 4. CSS Custom Properties Structure

**File:** `src/app/globals.css`

The CSS will be organized into three main sections:

#### Base Styles (Existing)
```css
@import "tailwindcss";

* {
  border-color: hsl(var(--border));
}

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

#### Light Theme (Default - :root)
```css
:root {
  /* Backgrounds */
  --background: 0 0% 100%;           /* white */
  --foreground: 0 0% 3.9%;           /* near-black */
  --card: 0 0% 100%;                 /* white */
  --card-foreground: 0 0% 3.9%;     /* near-black */
  
  /* Interactive Elements */
  --primary: 0 0% 9%;                /* dark gray/black */
  --primary-foreground: 0 0% 98%;   /* white */
  --secondary: 0 0% 96.1%;          /* light gray */
  --secondary-foreground: 0 0% 9%;  /* dark gray */
  
  /* Accents */
  --accent: 0 0% 96.1%;             /* light gray */
  --accent-foreground: 0 0% 9%;     /* dark gray */
  --muted: 0 0% 96.1%;              /* light gray */
  --muted-foreground: 0 0% 45.1%;   /* medium gray */
  
  /* Semantic Colors */
  --destructive: 0 84.2% 60.2%;     /* red */
  --destructive-foreground: 0 0% 98%; /* white */
  
  /* Borders & Inputs */
  --border: 0 0% 89.8%;             /* light gray */
  --input: 0 0% 89.8%;              /* light gray */
  --ring: 0 0% 3.9%;                /* dark gray */
  
  /* Additional theme-specific colors */
  --slate-50: 210 40% 98%;
  --slate-100: 210 40% 96.1%;
  --slate-200: 214 32% 91%;
  --slate-300: 213 27% 84%;
  --slate-600: 215 16% 47%;
  --slate-700: 215 19% 35%;
  --slate-800: 217 19% 27%;
  --slate-900: 222 47% 11%;
  
  --gray-50: 0 0% 98%;
  --gray-100: 0 0% 96.1%;
  --gray-200: 0 0% 89.8%;
  --gray-300: 0 0% 83.1%;
  --gray-400: 0 0% 63.9%;
  --gray-500: 0 0% 45.1%;
  --gray-600: 0 0% 32.2%;
  --gray-700: 0 0% 25.1%;
  --gray-800: 0 0% 14.9%;
  
  --blue-500: 217 91% 60%;
  --blue-600: 221 83% 53%;
  --green-50: 138 76% 97%;
  --green-100: 141 84% 93%;
  --green-500: 142 71% 45%;
  --green-600: 142 76% 36%;
  --green-800: 143 64% 24%;
  --red-50: 0 86% 97%;
  --red-400: 0 91% 71%;
  --red-500: 0 84% 60%;
  --red-600: 0 72% 51%;
  --yellow-100: 48 96% 89%;
  --yellow-500: 45 93% 47%;
}
```

#### Halloween Theme
```css
.halloween {
  /* Backgrounds - Dark with purple undertones */
  --background: 270 30% 8%;          /* very dark purple-black */
  --foreground: 270 60% 85%;         /* light purple */
  --card: 270 25% 12%;               /* dark purple card */
  --card-foreground: 270 60% 85%;   /* light purple */
  
  /* Interactive Elements - Purple accents */
  --primary: 270 60% 70%;            /* medium-light purple */
  --primary-foreground: 270 30% 8%; /* dark purple */
  --secondary: 270 20% 20%;          /* dark purple-gray */
  --secondary-foreground: 270 60% 85%; /* light purple */
  
  /* Accents - Halloween colors */
  --accent: 280 70% 50%;             /* vibrant purple */
  --accent-foreground: 270 60% 95%; /* very light purple */
  --muted: 270 20% 20%;              /* dark purple-gray */
  --muted-foreground: 270 30% 60%;  /* medium purple */
  
  /* Semantic Colors - Adjusted for dark theme */
  --destructive: 0 70% 50%;          /* darker red */
  --destructive-foreground: 270 60% 95%; /* light purple */
  
  /* Borders & Inputs - Purple tinted */
  --border: 270 20% 25%;             /* dark purple border */
  --input: 270 20% 20%;              /* dark purple input */
  --ring: 270 60% 70%;               /* light purple ring */
  
  /* Additional theme-specific colors - Halloween palette */
  --slate-50: 270 30% 15%;
  --slate-100: 270 25% 18%;
  --slate-200: 270 20% 25%;
  --slate-300: 270 15% 35%;
  --slate-600: 270 30% 55%;
  --slate-700: 270 40% 65%;
  --slate-800: 270 50% 75%;
  --slate-900: 270 60% 85%;
  
  --gray-50: 270 20% 15%;
  --gray-100: 270 15% 18%;
  --gray-200: 270 10% 25%;
  --gray-300: 270 8% 35%;
  --gray-400: 270 10% 50%;
  --gray-500: 270 15% 60%;
  --gray-600: 270 20% 70%;
  --gray-700: 270 30% 75%;
  --gray-800: 270 40% 80%;
  
  --blue-500: 250 80% 60%;           /* purple-blue */
  --blue-600: 250 85% 55%;
  --green-50: 270 20% 18%;
  --green-100: 270 20% 20%;
  --green-500: 150 50% 45%;          /* muted green */
  --green-600: 150 55% 40%;
  --green-800: 150 60% 30%;
  --red-50: 270 20% 18%;
  --red-400: 0 70% 60%;
  --red-500: 0 70% 50%;
  --red-600: 0 75% 45%;
  --yellow-100: 270 20% 20%;
  --yellow-500: 45 80% 55%;          /* orange-yellow */
}
```

#### Transition Styles
```css
/* Smooth theme transitions */
html.theme-transitioning,
html.theme-transitioning *,
html.theme-transitioning *::before,
html.theme-transitioning *::after {
  transition: background-color 200ms ease-in-out,
              color 200ms ease-in-out,
              border-color 200ms ease-in-out !important;
  transition-delay: 0ms !important;
}

/* Disable transitions on initial load */
html.no-transitions,
html.no-transitions *,
html.no-transitions *::before,
html.no-transitions *::after {
  transition: none !important;
}
```

## Data Models

### Theme Preference Storage

**localStorage key:** `theme-preference`

**Value format:**
```typescript
type StoredTheme = 'light' | 'halloween'
```

**Storage operations:**
```typescript
// Save theme
localStorage.setItem('theme-preference', theme)

// Load theme
const savedTheme = localStorage.getItem('theme-preference') as ThemeName | null

// Clear theme (reset to default)
localStorage.removeItem('theme-preference')
```

## Migration Strategy

### Phase 1: Infrastructure Setup
1. Create theme configuration file
2. Implement ThemeProvider and context
3. Add ThemeProvider to root layout
4. Create ThemeToggle component
5. Update CSS with Halloween theme variables

### Phase 2: Component Migration

Components will be migrated in priority order based on visibility and usage:

#### High Priority (User-facing, always visible)
- `StoryPlayer.tsx` - Main story viewing experience
- `StoryEditorToolbar.tsx` - Editor navigation
- `DashboardPage.tsx` - Main dashboard
- `Button.tsx` - Core UI component

#### Medium Priority (Frequently used)
- `CardEditor.tsx` - Card editing interface
- `CardList.tsx` - Card navigation
- `StoryGraph.tsx` - Visual story structure
- Dialog components
- Form components

#### Low Priority (Less frequently visible)
- Modal dialogs
- Dropdown menus
- Utility components

### Migration Pattern

For each component, follow this pattern:

**Before:**
```tsx
<div className="bg-white border-2 border-black text-gray-900">
  <h1 className="text-slate-900">Title</h1>
  <p className="text-gray-600">Description</p>
</div>
```

**After:**
```tsx
<div className="bg-background border-2 border-border text-foreground">
  <h1 className="text-foreground">Title</h1>
  <p className="text-muted-foreground">Description</p>
</div>
```

### Color Mapping Reference

| Hardcoded Class | Theme Variable | Purpose |
|----------------|----------------|---------|
| `bg-white` | `bg-background` | Main background |
| `bg-gray-50` | `bg-muted` | Secondary background |
| `bg-gray-100` | `bg-muted` | Tertiary background |
| `bg-slate-900` | `bg-primary` | Primary buttons/elements |
| `bg-blue-500` | `bg-accent` | Accent elements |
| `text-black`, `text-gray-900`, `text-slate-900` | `text-foreground` | Primary text |
| `text-gray-600`, `text-gray-700` | `text-muted-foreground` | Secondary text |
| `text-gray-400`, `text-gray-500` | `text-muted-foreground` | Tertiary text |
| `text-white` | `text-primary-foreground` | Text on dark backgrounds |
| `border-black` | `border-border` | Standard borders |
| `border-gray-300` | `border-border` | Light borders |

**Special Cases:**
- Semantic colors (red, green, yellow) for errors, success, warnings should remain as-is initially
- Gradients will need custom CSS variables
- Shadow effects (`shadow-[...]`) will remain unchanged as they're part of the design aesthetic

## Error Handling

### Theme Loading Errors

**Scenario:** localStorage is unavailable or corrupted

**Handling:**
```typescript
try {
  const savedTheme = localStorage.getItem('theme-preference')
  return savedTheme as ThemeName || defaultTheme
} catch (error) {
  console.warn('Failed to load theme preference:', error)
  return defaultTheme
}
```

### Theme Saving Errors

**Scenario:** localStorage quota exceeded or unavailable

**Handling:**
```typescript
try {
  localStorage.setItem('theme-preference', theme)
} catch (error) {
  console.warn('Failed to save theme preference:', error)
  // Continue with theme application even if save fails
}
```

### Invalid Theme Name

**Scenario:** Stored theme name doesn't match available themes

**Handling:**
```typescript
const isValidTheme = (theme: string): theme is ThemeName => {
  return themes.some(t => t.name === theme)
}

const loadedTheme = localStorage.getItem('theme-preference')
const theme = loadedTheme && isValidTheme(loadedTheme) 
  ? loadedTheme 
  : defaultTheme
```

## Testing Strategy

### Unit Tests

**ThemeProvider Tests:**
- Initial theme loading from localStorage
- Theme switching functionality
- localStorage persistence
- Default theme fallback
- Invalid theme handling

**useTheme Hook Tests:**
- Context value access
- Theme state updates
- Toggle functionality

**ThemeToggle Component Tests:**
- Rendering with current theme
- Click handling
- Keyboard navigation
- Accessibility attributes

### Integration Tests

**Theme Application Tests:**
- CSS class application to HTML element
- CSS custom property updates
- Component re-rendering with new colors

**Persistence Tests:**
- Theme survives page reload
- Theme persists across sessions
- Multiple tabs sync (optional enhancement)

### Visual Regression Tests

**Component Appearance Tests:**
- Screenshot comparison for each theme
- Key components in both themes
- Ensure no visual regressions

### Manual Testing Checklist

- [ ] Theme toggle cycles through all themes
- [ ] Theme persists after page reload
- [ ] All migrated components display correctly in each theme
- [ ] Transitions are smooth and not jarring
- [ ] No flash of unstyled content on initial load
- [ ] Accessibility: keyboard navigation works
- [ ] Accessibility: sufficient color contrast in both themes
- [ ] Mobile: theme toggle is accessible on small screens
- [ ] Performance: no noticeable lag when switching themes

## Performance Considerations

### Optimization Strategies

1. **CSS Custom Properties:** Using CSS variables ensures instant theme updates without JavaScript recalculation

2. **Transition Management:** 
   - Disable transitions on initial load to prevent FOUC
   - Enable transitions only during user-initiated theme changes
   - Use `requestAnimationFrame` for smooth class application

3. **localStorage Access:**
   - Read once on mount
   - Write only on theme change
   - Use try-catch to prevent blocking

4. **Component Re-renders:**
   - Theme context updates trigger minimal re-renders
   - Only components consuming theme context re-render
   - CSS handles visual updates, not React

### Performance Metrics

- Theme switch should complete in < 300ms
- No layout shift during theme change
- No visible flash or flicker
- Smooth transition animations

## Accessibility Considerations

### WCAG 2.1 AA Compliance

**Color Contrast:**
- Light theme: Maintain current contrast ratios (already compliant)
- Halloween theme: Ensure 4.5:1 contrast for normal text, 3:1 for large text
- Test with contrast checker tools

**Keyboard Navigation:**
- Theme toggle accessible via Tab key
- Enter/Space activates theme toggle
- Focus indicator visible in both themes

**Screen Readers:**
- Theme toggle has descriptive aria-label
- Theme change announced to screen readers
- Current theme indicated in accessible way

**Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  html.theme-transitioning,
  html.theme-transitioning * {
    transition: none !important;
  }
}
```

### Implementation

```tsx
<button
  onClick={toggleTheme}
  aria-label={`Switch to ${nextTheme.label} theme`}
  aria-live="polite"
  className="theme-toggle"
>
  <span aria-hidden="true">{currentTheme.icon}</span>
  <span className="sr-only">{currentTheme.label} theme active</span>
</button>
```

## Future Enhancements

### Potential Additions

1. **System Theme Detection:**
   - Respect `prefers-color-scheme` media query
   - Auto-switch based on time of day

2. **Additional Themes:**
   - Christmas theme
   - Retro green terminal theme
   - High contrast theme for accessibility

3. **Theme Customization:**
   - User-defined color schemes
   - Theme editor interface
   - Export/import theme configurations

4. **Advanced Features:**
   - Per-page theme overrides
   - Animated theme transitions with custom effects
   - Theme preview before applying

5. **Halloween Theme Enhancements:**
   - Animated background effects (floating ghosts, bats)
   - Custom cursor (witch's broom, wand)
   - Sound effects on theme switch
   - Particle effects
   - Special Halloween fonts

## Documentation Requirements

### Developer Documentation

**README.md additions:**
- Theme system overview
- How to add a new theme
- How to use theme variables in components
- Migration guide for existing components

**Code Comments:**
- Document each CSS custom property
- Explain theme switching logic
- Note any browser compatibility considerations

### User Documentation

**Help/FAQ section:**
- How to change themes
- Available themes and their characteristics
- Troubleshooting theme issues

## Dependencies

### Existing Dependencies (No new packages required)
- React 19.2.0 (Context API)
- Tailwind CSS v4 (CSS custom properties)
- Next.js 16.0.1 (App Router, layouts)

### Browser Compatibility

- CSS Custom Properties: All modern browsers (IE11 not supported)
- localStorage: All modern browsers
- CSS Transitions: All modern browsers

Minimum browser versions:
- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 15+
