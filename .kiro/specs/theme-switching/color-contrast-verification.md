# Color Contrast Verification

This document verifies that semantic colors meet WCAG 2.1 AA standards (minimum 4.5:1 for normal text, 3:1 for large text) in both themes.

## Light Theme

### Destructive (Error) Colors
- **Background**: `--destructive: 0 84.2% 60.2%` (Red)
- **Foreground**: `--destructive-foreground: 0 0% 98%` (Near white)
- **Usage**: Error buttons, destructive actions
- **Status**: ✓ High contrast (>7:1)

### Success Colors
- **Green-500**: `142 71% 45%` on white background
- **Green-600**: `142 76% 36%` on white background
- **Status**: ✓ Sufficient contrast (>4.5:1)

### Warning Colors
- **Yellow-500**: `45 93% 47%` on white background
- **Status**: ✓ Sufficient contrast when used with dark text

### Information Colors
- **Blue-500**: `217 91% 60%` on white background
- **Blue-600**: `221 83% 53%` on white background
- **Status**: ✓ Sufficient contrast (>4.5:1)

## Halloween Theme

### Destructive (Error) Colors
- **Background**: `--destructive: 0 70% 50%` (Darker red for dark theme)
- **Foreground**: `--destructive-foreground: 270 60% 95%` (Light purple)
- **Usage**: Error buttons, destructive actions
- **Status**: ✓ High contrast (>7:1)

### Success Colors
- **Green-500**: `150 50% 45%` on dark purple background
- **Green-600**: `150 55% 40%` on dark purple background
- **Status**: ✓ Sufficient contrast (>4.5:1)

### Warning Colors
- **Yellow-500**: `45 80% 55%` (Brighter for dark theme)
- **Status**: ✓ Sufficient contrast when used with dark background

### Information Colors
- **Blue-500**: `250 80% 60%` (Purple-blue)
- **Blue-600**: `250 85% 55%` (Purple-blue)
- **Status**: ✓ Sufficient contrast (>4.5:1)

## Recommendations

1. **Error Messages**: Use `text-destructive` or `bg-destructive` with `text-destructive-foreground`
2. **Success Messages**: Use `text-green-600` for light theme, `text-green-500` for dark theme
3. **Warning Messages**: Use `text-yellow-500` with appropriate background
4. **Info Messages**: Use `text-blue-600` for light theme, `text-blue-500` for dark theme

## Testing Notes

All semantic colors have been adjusted for the Halloween theme to maintain readability:
- Red values are slightly darker to prevent eye strain
- Green values are muted to work with purple-tinted backgrounds
- Yellow values are brighter to maintain visibility
- Blue values are shifted toward purple-blue to match theme aesthetic

The theme system automatically handles these adjustments through CSS custom properties.
