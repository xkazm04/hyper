# Implementation Plan

- [x] 1. Set up theme infrastructure





  - Create theme configuration file with light and Halloween theme definitions
  - Define TypeScript types for theme names and configuration
  - Export theme metadata (names, labels, icons, descriptions)
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 1.1 Create theme configuration file


  - Create `src/lib/theme/theme-config.ts` with ThemeName type and ThemeConfig interface
  - Define themes array with light and Halloween theme metadata
  - Export defaultTheme constant set to 'light'
  - _Requirements: 5.1, 5.2, 5.3_


- [x] 1.2 Implement ThemeProvider context

  - Create `src/contexts/ThemeContext.tsx` with ThemeContextType interface
  - Implement ThemeProvider component with state management for current theme
  - Add localStorage persistence logic (load on mount, save on change)
  - Implement theme application to HTML element via className
  - Add transition management (disable on initial load, enable on user change)
  - Create useTheme hook for consuming theme context
  - _Requirements: 1.1, 1.2, 1.4, 5.1, 8.5_

- [x] 1.3 Integrate ThemeProvider into application


  - Update `src/app/layout.tsx` to wrap children with ThemeProvider
  - Ensure ThemeProvider is placed above other providers for proper context hierarchy
  - _Requirements: 1.1, 1.2_

- [x] 2. Define Halloween theme CSS variables







  - Update `src/app/globals.css` with Halloween theme CSS custom properties
  - Define `.halloween` class selector with all required color variables
  - Create dark purple-black backgrounds and light purple foregrounds
  - Define purple-tinted borders, inputs, and interactive elements
  - Map all existing color variables to Halloween-appropriate values
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

-

- [x] 2.1 Add extended color palette variables





  - Define slate color scale variables (50-900) for both light and Halloween themes
  - Define gray color scale variables for both themes
  - Add semantic color variables (blue, green, red, yellow) for both themes
  - Ensure Halloween theme uses purple-tinted versions of neutral colors
  - _Requirements: 3.1, 3.2, 3.3, 4.4_
-

- [x] 2.2 Implement theme transition styles





  - Add `.theme-transitioning` class with CSS transitions for color properties
  - Set transition duration to 200ms with ease-in-out timing
  - Add `.no-transitions` class to disable all transitions
  - Implement prefers-reduced-motion media query to respect user preferences
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

-

- [x] 3. Create ThemeToggle component





  - Create `src/components/theme/ThemeToggle.tsx` component
  - Implement button that displays current theme icon
  - Add click handler to cycle through available themes using toggleTheme from context
  - Style with retro aesthetic (border-2, shadow effects) matching app design
  - Ensure minimum 44x44px touch target size
  - Add hover and active states with appropriate visual feedback
  - _Requirements: 6.1, 6.2, 6.5_
- [x] 3.1 Add accessibility features to ThemeToggle




- [x] 3.1 Add accessibility features to ThemeToggle


  - Add descriptive aria-label indicating current theme and next theme
  - Implement keyboard navigation support (Enter/Space to activate)
  - Add aria-live region for screen reader announcements
  - Ensure focus indicator is visible in both themes
  - Test color contrast meets WCAG 2.1 AA standards
  - _Requirements: 6.4_

- [x] 3.2 Position ThemeToggle in application





  - Add ThemeToggle to main navigation or fixed position in top-right corner
  - Ensure component is accessible on mobile devices
  - Test positioning across different screen sizes
  - _Requirements: 6.3_




- [x] 4. Migrate high-priority components to theme variables




  - Migrate StoryPlayer component background, text, and border colors
  - Migrate StoryEditorToolbar component colors
  - Migrate Dashboard page colors
  - Migrate Button component variant colors
  - Replace hardcoded classes like `bg-white`, `text-slate-900`, `border-black` with theme variables
  - _Requirements: 4.1, 4.2, 4.3, 2.1, 2.2, 2.3_
-

- [x] 4.1 Migrate StoryPlayer component






  - Replace `bg-gradient-to-br from-slate-50 to-slate-100` with theme-aware gradient
  - Replace `bg-white` with `bg-card`
  - Replace `text-slate-900` with `text-foreground`
  - Replace `text-slate-600`, `text-slate-700` with `text-muted-foreground`
  - Replace `bg-slate-900` button with `bg-primary text-primary-foreground`
  - Replace `border-slate-300` with `border-border`
  - Test component appearance in both light and Halloween themes
  - _Requirements: 4.1, 4.2, 4.3, 4.4_


- [x] 4.2 Migrate StoryEditorToolbar component






  - Replace `bg-white` with `bg-background`
  - Replace `border-black` with `border-border`
  - Replace `text-gray-500` with `text-muted-foreground`
  - Replace `hover:bg-gray-100` with `hover:bg-muted`
  - Update button color classes to use theme variables
  - Test toolbar appearance in both themes
  - _Requirements: 4.1, 4.2, 4.3_
- [x] 4.3 Migrate Dashboard page




- [x] 4.3 Migrate Dashboard page



  - Replace `bg-gray-200`, `bg-gray-100` skeleton colors with theme variables
  - Replace `text-gray-600` with `text-muted-foreground`
  - Replace `text-gray-500` with `text-muted-foreground`
  - Update card backgrounds to use `bg-card`
  - Test dashboard appearance in both themes
  - _Requirements: 4.1, 4.2, 4.3_


- [x] 4.4 Migrate Button component variants






  - Update buttonVariants CVA configuration to use theme variables
  - Replace `bg-primary` and other variant colors with CSS custom properties
  - Ensure all button variants work correctly in both themes
  - Test button states (hover, active, disabled) in both themes
  - _Requirements: 4.1, 4.2, 4.3, 4.4_
-

- [x] 5. Migrate medium-priority components to theme variables








  - Migrate CardEditor component colors
  - Migrate CardList component colors
  - Migrate StoryGraph component colors
  - Migrate dialog components (PublishDialog, CreateStoryDialog, DeleteConfirmDialog)
  - Replace hardcoded color classes with appropriate theme variables
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5.1 Migrate CardEditor component



  - Replace `bg-gray-50` with `bg-muted`
  - Replace `text-gray-300`, `text-gray-700` with theme variables
  - Replace `bg-white` card backgrounds with `bg-card`
  - Test editor appearance in both themes
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5.2 Migrate StoryGraph component



  - Replace `bg-white` with `bg-background`
  - Replace `border-black` with `border-border`
  - Replace `text-gray-600` with `text-muted-foreground`
  - Update node background colors to use theme variables
  - Test graph visualization in both themes
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5.3 Migrate dialog components




  - Update PublishDialog color classes to use theme variables
  - Update CreateStoryDialog color classes to use theme variables
  - Update DeleteConfirmDialog color classes to use theme variables
  - Replace warning/error background colors with theme-aware versions
  - Test dialog appearance and readability in both themes
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 6. Migrate remaining UI components to theme variables

  - Migrate Select component colors
  - Migrate DropdownMenu component colors
  - Migrate Label component colors
  - Migrate Dialog component colors
  - Migrate Tabs component colors
  - Replace any remaining hardcoded color classes with theme variables
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 6.1 Migrate shadcn/ui components

  - Update `src/components/ui/select.tsx` separator color
  - Update `src/components/ui/dropdown-menu.tsx` separator color
  - Update `src/components/ui/dialog.tsx` overlay and content colors
  - Update `src/components/ui/label.tsx` text colors
  - Update `src/components/ui/tabs.tsx` colors
  - Test all UI components in both themes
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Handle special cases and semantic colors

  - Review gradient usage and create theme-aware gradient variables if needed
  - Ensure semantic colors (success, error, warning) have appropriate contrast in Halloween theme
  - Verify shadow effects remain visible in both themes
  - Test image overlays and ensure proper contrast
  - _Requirements: 4.4, 3.4_

- [x] 7.1 Create theme-aware gradient utilities

  - Define CSS custom properties for gradient colors
  - Create utility classes for common gradients (background, overlays)
  - Update components using gradients to use new utilities
  - Test gradient appearance in both themes
  - _Requirements: 4.1, 4.4_

- [x] 7.2 Verify semantic color contrast

  - Test error messages (red) in Halloween theme for sufficient contrast
  - Test success messages (green) in Halloween theme for sufficient contrast
  - Test warning messages (yellow) in Halloween theme for sufficient contrast
  - Adjust semantic color values in Halloween theme if needed
  - _Requirements: 3.4, 4.4_

- [ ] 8. Create theme system documentation

  - Add theme system section to README.md
  - Document how to add a new theme
  - Document color mapping reference for developers
  - Create migration guide for converting components to use theme variables
  - Document theme variable naming conventions
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 8.1 Write inline code documentation

  - Add JSDoc comments to ThemeProvider explaining its functionality
  - Add comments to theme-config.ts explaining theme structure
  - Add comments to CSS custom properties explaining their purpose
  - Document any browser compatibility considerations
  - _Requirements: 7.1_

- [ ] 9. Test theme system functionality

  - Test theme switching between light and Halloween themes
  - Test theme persistence across page reloads
  - Test theme persistence across browser sessions
  - Test initial load with no saved preference (should default to light)
  - Test initial load with saved preference (should apply saved theme)
  - Test theme toggle keyboard navigation
  - Test theme toggle on mobile devices
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.2, 6.3, 6.4_

- [ ] 9.1 Test visual appearance in both themes

  - Verify all migrated components display correctly in light theme
  - Verify all migrated components display correctly in Halloween theme
  - Test color contrast ratios meet WCAG 2.1 AA standards
  - Test transitions are smooth and not jarring
  - Verify no flash of unstyled content on initial load
  - Test on multiple browsers (Chrome, Firefox, Safari, Edge)
  - _Requirements: 2.1, 2.2, 2.3, 4.4, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 9.2 Test accessibility features

  - Test screen reader announcements when theme changes
  - Test keyboard navigation to and activation of theme toggle
  - Test focus indicators are visible in both themes
  - Test with prefers-reduced-motion enabled
  - Verify aria-labels are descriptive and accurate
  - _Requirements: 6.4, 8.4_

- [x] 10. Performance testing and optimization

  - Measure theme switch completion time (should be < 300ms)
  - Verify no layout shift during theme change
  - Test localStorage access doesn't block rendering
  - Verify minimal component re-renders on theme change
  - Test theme system on low-end devices
  - _Requirements: 8.1, 8.2, 8.3_
