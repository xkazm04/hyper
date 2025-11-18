This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Theme System

This application features a dynamic theme system that allows users to switch between different visual themes. Currently supports Light and Halloween themes with smooth transitions.

### Features

- Multiple theme support (Light, Halloween)
- Persistent theme selection (localStorage)
- Smooth theme transitions with accessibility support
- CSS custom properties for easy customization
- Respects `prefers-reduced-motion` user preference
- WCAG 2.1 AA compliant color contrast

### Using Themes in Components

All components should use theme variables instead of hardcoded colors:

```tsx
// ❌ Don't use hardcoded colors
<div className="bg-white text-black border-gray-300">

// ✅ Use theme variables
<div className="bg-card text-foreground border-border">
```

### Available Theme Variables

**Core Variables:**
- `bg-background` / `text-foreground` - Main background and text
- `bg-card` / `text-card-foreground` - Card backgrounds
- `bg-primary` / `text-primary-foreground` - Primary actions
- `bg-secondary` / `text-secondary-foreground` - Secondary elements
- `bg-muted` / `text-muted-foreground` - Muted/disabled states
- `bg-accent` / `text-accent-foreground` - Accent/hover states
- `bg-destructive` / `text-destructive-foreground` - Error/destructive actions
- `border-border` - Border colors
- `border-input` - Input borders

**Utility Classes:**
- `bg-gradient-theme` - Theme-aware gradient (diagonal)
- `bg-gradient-theme-vertical` - Vertical gradient
- `bg-gradient-theme-horizontal` - Horizontal gradient
- `overlay-dark` - Dark overlay (80% opacity)
- `overlay-light` - Light overlay (10% opacity)
- `shadow-theme` - Theme-aware shadow (8px)
- `shadow-theme-sm` - Small shadow (4px)
- `shadow-theme-lg` - Large shadow (12px)

### Using the Theme Context

```tsx
import { useTheme } from '@/contexts/ThemeContext'

function MyComponent() {
  const { theme, setTheme, toggleTheme } = useTheme()
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('halloween')}>Halloween Mode</button>
    </div>
  )
}
```

### Adding a New Theme

1. **Define theme colors in `src/app/globals.css`:**

```css
.my-new-theme {
  --background: 0 0% 100%;
  --foreground: 0 0% 0%;
  /* ... add all required variables */
}
```

2. **Register theme in `src/lib/theme/theme-config.ts`:**

```typescript
export const themes = [
  // ... existing themes
  {
    name: 'my-new-theme' as const,
    label: 'My New Theme',
    icon: '🎨',
    description: 'A beautiful new theme'
  }
] as const
```

3. **Update TypeScript types:**

The `ThemeName` type will automatically include your new theme.

### Migration Guide

When converting existing components to use theme variables:

1. Replace `bg-white` → `bg-background` or `bg-card`
2. Replace `bg-gray-*` → `bg-muted` or `bg-secondary`
3. Replace `text-black` / `text-gray-900` → `text-foreground`
4. Replace `text-gray-500` / `text-gray-600` → `text-muted-foreground`
5. Replace `border-black` / `border-gray-*` → `border-border`
6. Replace hardcoded shadows → `shadow-theme` utilities
7. Replace gradients → `bg-gradient-theme` utilities

### Browser Compatibility

The theme system uses CSS custom properties and is compatible with:
- Chrome/Edge 49+
- Firefox 31+
- Safari 9.1+
- All modern mobile browsers

### Accessibility

- Theme toggle has proper ARIA labels
- Screen reader announcements on theme change
- Keyboard navigation support (Enter/Space)
- Respects `prefers-reduced-motion`
- All color combinations meet WCAG 2.1 AA standards

For detailed color contrast information, see `.kiro/specs/theme-switching/color-contrast-verification.md`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
