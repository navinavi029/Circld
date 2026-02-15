# Implementation Plan: Dark Mode and Styling Improvements

## Overview

This implementation plan adds comprehensive dark mode support and improved styling to the React + TypeScript application. The approach follows a bottom-up strategy: first establishing the theme infrastructure (context, provider, utilities), then updating the Tailwind configuration, implementing the toggle control, and finally updating all components to support both themes. Property-based tests validate universal correctness properties while unit tests cover specific scenarios and edge cases.

## Tasks

- [ ] 1. Set up theme infrastructure and utilities
  - [ ] 1.1 Create ThemeContext and ThemeProvider
    - Create `src/contexts/ThemeContext.tsx` with Theme type, ThemeContext, and useTheme hook
    - Implement ThemeProvider with state management for theme (light/dark)
    - Add initialization logic: check localStorage → system preference → default to light
    - Add useEffect to apply/remove 'dark' class on document.documentElement
    - Add useEffect to persist theme changes to localStorage with error handling
    - Add useEffect to listen for system preference changes (only update if no stored preference)
    - Implement toggleTheme function to switch between light and dark
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3_

  - [ ]* 1.2 Write property test for theme initialization
    - **Property 2: Theme initialization respects preference hierarchy**
    - **Validates: Requirements 1.3, 5.3, 5.5, 6.1**

  - [ ]* 1.3 Write property test for theme persistence round-trip
    - **Property 9: Theme preference persists across sessions**
    - **Validates: Requirements 5.1, 5.2, 5.4**

  - [ ] 1.4 Create contrast calculation utility
    - Create `src/utils/contrast.ts` with functions to calculate WCAG contrast ratios
    - Implement relative luminance calculation for RGB colors
    - Implement contrast ratio calculation between two colors
    - Add helper to check if contrast meets WCAG AA standards (4.5:1 for normal, 3:1 for large text)
    - _Requirements: 2.1, 2.3, 3.2_

  - [ ]* 1.5 Write property test for contrast ratios
    - **Property 4: All color combinations meet WCAG AA contrast ratios**
    - **Validates: Requirements 2.1, 2.3, 3.2, 7.3, 10.1**

- [ ] 2. Update Tailwind configuration with theme colors
  - [ ] 2.1 Update tailwind.config.js with dark mode support
    - Set `darkMode: 'class'` to enable class-based dark mode strategy
    - Define comprehensive light mode color palette with all semantic tokens
    - Define comprehensive dark mode color palette with adjusted colors for dark backgrounds
    - Ensure all semantic tokens (background, text, primary, accent, border, info, success, warning, error) have light and dark variants
    - Add transition utilities for smooth theme switching
    - _Requirements: 2.2, 2.4, 3.1, 9.1, 9.2_

  - [ ]* 2.2 Write property test for semantic token completeness
    - **Property 5: All semantic tokens have dark mode variants**
    - **Validates: Requirements 2.4**

  - [ ]* 2.3 Write unit tests for Tailwind configuration
    - Test that darkMode is set to 'class'
    - Test that all required color tokens are defined
    - Test that dark mode color values differ from light mode
    - _Requirements: 9.1, 9.2_

- [ ] 3. Implement ThemeToggle component
  - [ ] 3.1 Create ThemeToggle component with icons
    - Create `src/components/ThemeToggle.tsx`
    - Implement button with onClick handler calling toggleTheme
    - Create SunIcon SVG component (displayed in dark mode)
    - Create MoonIcon SVG component (displayed in light mode)
    - Conditionally render icon based on current theme
    - Add proper className for styling and transitions
    - Add aria-label that updates based on current theme
    - Add title attribute for tooltip
    - Ensure keyboard accessibility (button handles Enter and Space by default)
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 10.2_

  - [ ]* 3.2 Write property test for theme toggle switching
    - **Property 7: Theme toggle switches modes immediately**
    - **Validates: Requirements 4.2, 9.3**

  - [ ]* 3.3 Write property test for icon display
    - **Property 8: Theme toggle displays correct icon**
    - **Validates: Requirements 4.3**

  - [ ]* 3.4 Write unit tests for ThemeToggle accessibility
    - Test keyboard accessibility (Enter and Space keys)
    - Test aria-label updates with theme changes
    - Test that button is focusable
    - _Requirements: 4.5, 10.2, 10.3_

- [ ] 4. Wrap application with ThemeProvider
  - [ ] 4.1 Update App.tsx to include ThemeProvider
    - Import ThemeProvider from contexts
    - Wrap BrowserRouter and all routes with ThemeProvider
    - Ensure ThemeProvider is at the root level for global access
    - _Requirements: 1.4_

  - [ ]* 4.2 Write property test for component updates without reload
    - **Property 3: Theme changes update components without reload**
    - **Validates: Requirements 1.5, 7.1, 7.2**

- [ ] 5. Add global transition styles
  - [ ] 5.1 Update index.css with theme transition styles
    - Add `.theme-transition` class with transitions for background-color, border-color, and color
    - Set transition duration to 200ms (within 150-300ms range)
    - Use ease-in-out timing function
    - Add script to apply theme-transition class after initial render (avoid transition on page load)
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 5.2 Write property test for transition durations
    - **Property 12: Transition durations fall within specified range**
    - **Validates: Requirements 8.2**

  - [ ]* 5.3 Write property test for simultaneous transitions
    - **Property 13: Multiple elements transition simultaneously**
    - **Validates: Requirements 8.4**

- [ ] 6. Update navigation and layout components
  - [ ] 6.1 Add ThemeToggle to Dashboard navigation
    - Import ThemeToggle component
    - Add ThemeToggle button to navigation bar next to logout button
    - Style with appropriate spacing and colors using dark: variants
    - _Requirements: 4.1, 7.1_

  - [ ] 6.2 Update Dashboard component with dark mode styles
    - Update all className attributes to include dark: variants
    - Update background colors: `bg-background dark:bg-background-dark`
    - Update text colors: `text-text dark:text-text-dark`
    - Update card backgrounds: `bg-white dark:bg-gray-800`
    - Update border colors: `border-border dark:border-border-dark`
    - Update navigation bar: `bg-primary dark:bg-primary-dark`
    - Ensure all interactive elements have hover states for both themes
    - _Requirements: 7.1, 7.2, 7.4_

  - [ ]* 6.3 Write unit tests for Dashboard theme rendering
    - Test Dashboard renders correctly in light mode
    - Test Dashboard renders correctly in dark mode
    - Test ThemeToggle is present in navigation
    - _Requirements: 7.1_

- [ ] 7. Update authentication pages with dark mode styles
  - [ ] 7.1 Update Login page with dark mode styles
    - Update all className attributes to include dark: variants
    - Update page background: `bg-background dark:bg-gray-900`
    - Update card background: `bg-white dark:bg-gray-800`
    - Update text colors for headings and labels
    - Update input fields: `bg-white dark:bg-gray-700 text-text dark:text-gray-100`
    - Update border colors for inputs and cards
    - Update button styles with dark mode variants
    - Update error message styling for dark mode
    - _Requirements: 7.1, 7.2_

  - [ ] 7.2 Update CompleteProfile page with dark mode styles
    - Apply same dark mode styling patterns as Login page
    - Update all backgrounds, text, inputs, and borders
    - Ensure info box has appropriate dark mode styling
    - _Requirements: 7.1, 7.2_

  - [ ]* 7.3 Write unit tests for authentication pages
    - Test Login renders correctly in both themes
    - Test CompleteProfile renders correctly in both themes
    - Test form inputs are readable in both themes
    - _Requirements: 7.1, 7.3_

- [ ] 8. Update profile management pages with dark mode styles
  - [ ] 8.1 Add ThemeToggle to EditProfile page
    - Add navigation bar similar to Dashboard
    - Include ThemeToggle in navigation
    - _Requirements: 4.1_

  - [ ] 8.2 Update EditProfile page with dark mode styles
    - Update all className attributes to include dark: variants
    - Update page background, card backgrounds, text colors
    - Update form inputs and labels for dark mode
    - Update ProfilePhotoUpload component styling
    - Ensure image previews are visible in both themes
    - _Requirements: 7.1, 7.2, 7.5_

  - [ ]* 8.3 Write unit tests for EditProfile theme rendering
    - Test EditProfile renders correctly in both themes
    - Test ThemeToggle is present
    - Test image upload component works in both themes
    - _Requirements: 7.1, 7.5_

- [ ] 9. Update reusable components with dark mode styles
  - [ ] 9.1 Update ProfilePhotoUpload component
    - Update all className attributes with dark: variants
    - Ensure upload button is visible in both themes
    - Ensure image preview has appropriate border/background in dark mode
    - Update placeholder icon colors for dark mode
    - _Requirements: 7.2, 7.5_

  - [ ] 9.2 Update ProtectedRoute component (if it has UI)
    - Add dark mode support if component renders any UI
    - Otherwise, no changes needed (logic-only component)
    - _Requirements: 7.2_

  - [ ]* 9.3 Write unit tests for reusable components
    - Test components render correctly in both themes
    - Test interactive states (hover, focus) in both themes
    - _Requirements: 7.2_

- [ ] 10. Checkpoint - Ensure all tests pass and verify theme switching
  - Ensure all tests pass, ask the user if questions arise.
  - Manually verify theme toggle works on all pages
  - Manually verify smooth transitions between themes
  - Manually verify all text is readable in both themes
  - Manually verify all interactive elements are visible in both themes

- [ ]* 11. Add comprehensive property-based tests for remaining properties
  - [ ]* 11.1 Write property test for semantic token resolution
    - **Property 1: Semantic tokens resolve to theme-specific values**
    - **Validates: Requirements 1.2**

  - [ ]* 11.2 Write property test for interactive element contrast
    - **Property 6: Interactive states maintain sufficient contrast**
    - **Validates: Requirements 2.5, 3.4, 7.4**

  - [ ]* 11.3 Write property test for system preference changes
    - **Property 10: System preference changes trigger theme updates**
    - **Validates: Requirements 6.2**

  - [ ]* 11.4 Write property test for system preference detection
    - **Property 11: System preference detection supports both modes**
    - **Validates: Requirements 6.3**

  - [ ]* 11.5 Write property test for screen reader announcements
    - **Property 14: Theme toggle announces changes to screen readers**
    - **Validates: Requirements 10.3**

  - [ ]* 11.6 Write property test for focus indicator visibility
    - **Property 15: Focus indicators remain visible in both themes**
    - **Validates: Requirements 10.5**

- [ ] 12. Final checkpoint and accessibility verification
  - Ensure all tests pass, ask the user if questions arise.
  - Manually test keyboard navigation in both themes
  - Manually test with screen reader (if available)
  - Verify focus indicators are visible in both themes
  - Verify all WCAG AA contrast requirements are met

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (contrast ratios, theme persistence, state transitions)
- Unit tests validate specific examples and edge cases (component rendering, error handling, accessibility)
- The implementation follows a bottom-up approach: infrastructure → configuration → components
- All color updates use Tailwind's `dark:` prefix for maintainability
- Theme transitions are applied globally but avoided on initial page load
- Error handling ensures graceful degradation when localStorage or matchMedia are unavailable
