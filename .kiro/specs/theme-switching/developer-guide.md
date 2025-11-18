# Theme System Developer Guide

This guide provides detailed information for developers working with the theme system.

## Architecture Overview

The theme system consists of three main parts:

1. **Theme Configuration** (`src/lib/theme/theme-config.ts`)
   - Defines available themes and their metadata
   - TypeScript types for type safety

2. **Theme Context** (`src/contexts/ThemeContext.tsx`)
   - React context for theme state management
   - Handles localStorage persistence
   - Manages theme transitions

3. **CSS Variables** (`src/app/globals.css`)
   - Defines color values for each theme
   - Provides utility classes for common patterns

## Color Variable Naming Convention

### Core Variables

| Variable | Purpose | Example Usage |
|----------|---------|---------------|
| `--background` | Main page background | `bg-background` |
| `--foreground` | Main text color | `text-foreground` |
| `--card` | Card/panel backgrounds | `bg-card` |
| `--card-foreground` | Text on cards | `text-card-foreground` |
| `--primary` | Primary actions | `bg-primary` |
| `--primary-foreground` | Text on primary elements | `text-primary-foreground` |
| `--secondary` | Secondary elements | `bg-secondary` |
| `--muted` | Muted/disabled states | `bg-muted` |
| `--accent` | Hover/focus states | `bg-accent` |
| `--destructive` | Error/delete actions | `bg-destructive` |
| `--border` | Border colors | `border-border` |
| `--input` | Input borders | `border-input` |
| `--ring` | Focus rings | `ring-ring` |

### Extended Palette

The theme system includes extended color scales for more granular control:

- **Slate scale**: `--slate-50` through `--slate-900`
- **Gray scale**: `--gray-50` through `--gray-900`
- **Semantic colors**: Blue, Green, Red, Yellow

## Component Migration Checklist

When converting a component to use theme variables:

- [ ] Replace `bg-white` with `bg-background` or `bg-card`
- [ ] Replace `bg-black` with `bg-foreground` (rare) or `bg-primary`
- [ ] Replace `bg-gray-*` with appropriate semantic variable
- [ ] Replace `text-black` / `text-gray-900` with `text-foreground`
- [ ] Replace `text-gray-500` / `text-gray-600` with `text-muted-foreground`
- [ ] Replace `border-black` / `border-gray-*` with `border-border`
- [ ] Replace hardcoded shadows with `shadow-theme` utilities
- [ ] Replace gradients with `bg-gradient-theme` utilities
- [ ] Test component in all available themes

## Common Patterns

### Buttons

```tsx
// Primary button
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Click me
</button>

// Secondary button
<button className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
  Cancel
</button>

// Destructive button
<button className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
  Delete
</button>
```

### Cards

```tsx
<div className="bg-card text-card-foreground border border-border rounded-lg p-4">
  <h2 className="text-foreground font-bold">Card Title</h2>
  <p className="text-muted-foreground">Card description</p>
</div>
```

### Inputs

```tsx
<input 
  className="bg-background text-foreground border-input focus:ring-ring"
  placeholder="Enter text..."
/>
```

### Gradients

```tsx
// Diagonal gradient
<div className="bg-gradient-theme">
  Content
</div>

// Vertical gradient
<div className="bg-gradient-theme-vertical">
  Content
</div>
```

### Overlays

```tsx
// Dark overlay (for modals)
<div className="overlay-dark backdrop-blur-sm">
  Modal content
</div>

// Light overlay (for hover effects)
<div className="overlay-light">
  Hover content
</div>
```

## Adding a New Theme

### Step 1: Define CSS Variables

Add a new class in `src/app/globals.css`:

```css
.my-theme {
  /* Core variables */
  --background: 200 20% 95%;
  --foreground: 200 20% 10%;
  /* ... define all required variables */
  
  /* Extended palette */
  --slate-50: 200 20% 98%;
  /* ... define all slate values */
  
  /* Semantic colors */
  --blue-500: 200 80% 50%;
  /* ... define all semantic colors */
  
  /* Gradients */
  --gradient-from: 200 20% 95%;
  --gradient-to: 200 20% 90%;
}
```

### Step 2: Register Theme

Add to `src/lib/theme/theme-config.ts`:

```typescript
export type ThemeName = 'light' | 'halloween' | 'my-theme'

export const themes: ThemeConfig[] = [
  // ... existing themes
  {
    name: 'my-theme',
    label: 'My Theme',
    icon: '🎨',
    description: 'A beautiful custom theme'
  }
]
```

### Step 3: Test

1. Switch to the new theme using the theme toggle
2. Verify all components display correctly
3. Check color contrast with accessibility tools
4. Test transitions between themes

## Performance Considerations

### Transition Duration

The theme system uses 200ms transitions by default. This provides smooth visual feedback without feeling sluggish.

```css
transition: background-color 200ms ease-in-out,
            color 200ms ease-in-out,
            border-color 200ms ease-in-out;
```

### Preventing FOUC (Flash of Unstyled Content)

The system uses the `no-transitions` class on initial load:

```typescript
// On mount
document.documentElement.classList.add('no-transitions')
document.documentElement.className = `${theme} no-transitions`

// After render
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.documentElement.classList.remove('no-transitions')
  })
})
```

### localStorage Access

Theme preference is saved to localStorage asynchronously to avoid blocking the main thread:

```typescript
const saveTheme = (theme: ThemeName): void => {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch (error) {
    console.warn('Failed to save theme preference:', error)
  }
}
```

## Accessibility

### Color Contrast

All theme colors meet WCAG 2.1 AA standards:
- Normal text: minimum 4.5:1 contrast ratio
- Large text: minimum 3:1 contrast ratio

See `.kiro/specs/theme-switching/color-contrast-verification.md` for detailed contrast information.

### Reduced Motion

The system respects the `prefers-reduced-motion` user preference:

```css
@media (prefers-reduced-motion: reduce) {
  html.theme-transitioning,
  html.theme-transitioning * {
    transition: none !important;
  }
}
```

### Screen Readers

The ThemeToggle component includes:
- Descriptive `aria-label` indicating current and next theme
- `aria-live` region for announcing theme changes
- Keyboard support (Enter/Space to activate)

## Browser Compatibility

The theme system uses CSS custom properties (CSS variables), which are supported in:

- Chrome/Edge 49+ (March 2016)
- Firefox 31+ (July 2014)
- Safari 9.1+ (March 2016)
- iOS Safari 9.3+ (March 2016)
- Android Chrome 49+ (March 2016)

For older browsers, consider using a CSS custom properties polyfill or providing a fallback theme.

## Troubleshooting

### Theme not persisting

Check that localStorage is available and not blocked:

```typescript
// Test localStorage
try {
  localStorage.setItem('test', 'test')
  localStorage.removeItem('test')
  console.log('localStorage is available')
} catch (e) {
  console.error('localStorage is blocked:', e)
}
```

### Transitions not working

Ensure the `theme-transitioning` class is applied during theme changes and removed after 300ms.

### Colors not updating

Verify that:
1. All required CSS variables are defined for the theme
2. Components use theme variables (not hardcoded colors)
3. The theme class is applied to the `<html>` element

### Flash of wrong theme on load

This can happen if the theme is loaded after the initial render. The system uses `no-transitions` class to prevent this, but ensure ThemeProvider is high in the component tree.

## Testing

### Manual Testing Checklist

- [ ] Theme persists across page reloads
- [ ] Theme persists across browser sessions
- [ ] Theme toggle cycles through all themes
- [ ] Transitions are smooth (not jarring)
- [ ] No flash of unstyled content on initial load
- [ ] Keyboard navigation works (Tab to toggle, Enter/Space to activate)
- [ ] Screen reader announces theme changes
- [ ] All components display correctly in each theme
- [ ] Color contrast meets WCAG 2.1 AA standards
- [ ] Respects prefers-reduced-motion

### Automated Testing

Consider adding tests for:

```typescript
describe('Theme System', () => {
  it('loads saved theme from localStorage', () => {
    localStorage.setItem('theme-preference', 'halloween')
    // render app
    // expect theme to be 'halloween'
  })
  
  it('applies default theme when no preference exists', () => {
    localStorage.removeItem('theme-preference')
    // render app
    // expect theme to be 'light'
  })
  
  it('saves theme to localStorage when changed', () => {
    // render app
    // change theme to 'halloween'
    // expect localStorage to contain 'halloween'
  })
})
```

## Best Practices

1. **Always use theme variables** - Never hardcode colors in components
2. **Test in all themes** - Verify components work in every available theme
3. **Consider contrast** - Ensure text is readable on all backgrounds
4. **Use semantic variables** - Prefer `bg-card` over `bg-white`
5. **Respect user preferences** - Honor `prefers-reduced-motion` and other accessibility settings
6. **Document custom colors** - If adding new variables, document their purpose
7. **Keep transitions consistent** - Use the same duration across the app
8. **Test on real devices** - Verify theme switching works on mobile devices

## Resources

- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [WCAG 2.1 Color Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [prefers-reduced-motion (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Tailwind CSS Theming](https://tailwindcss.com/docs/customizing-colors)
