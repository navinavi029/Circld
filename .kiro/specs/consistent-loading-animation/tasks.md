# Implementation Plan: Consistent Loading Animation

## Overview

This plan implements a reusable LoadingSpinner component that provides consistent loading states across the application. The implementation follows a bottom-up approach: create the core component, add testing, then integrate it into existing components and pages.

## Tasks

- [ ] 1. Create LoadingSpinner component with core functionality
  - Create `src/components/ui/LoadingSpinner.tsx` file
  - Implement TypeScript interface for props (message, size, fullscreen, className)
  - Implement component with spinning circle animation using CSS keyframes
  - Add theme integration using useTheme hook
  - Include ARIA attributes (role="status", aria-live="polite")
  - Support size variants: sm (16px), md (24px), lg (32px)
  - Support fullscreen overlay mode with fixed positioning
  - Apply theme-aware colors (primary for light mode, primary-light for dark mode)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4_

- [ ] 1.1 Write property test for message display consistency
  - **Property 1: Message Display Consistency**
  - **Validates: Requirements 2.1, 2.2**

- [ ] 1.2 Write property test for default message fallback
  - **Property 2: Default Message Fallback**
  - **Validates: Requirements 2.3**

- [ ] 1.3 Write property test for theme-aware colors
  - **Property 3: Theme-Aware Color Application**
  - **Validates: Requirements 3.1, 3.2, 3.4**

- [ ] 1.4 Write property test for size variant dimensions
  - **Property 4: Size Variant Dimensions**
  - **Validates: Requirements 1.5**

- [ ] 1.5 Write property test for accessibility attributes
  - **Property 5: Accessibility Attributes Presence**
  - **Validates: Requirements 5.1, 5.2, 5.3**

- [ ] 1.6 Write property test for fullscreen overlay behavior
  - **Property 6: Fullscreen Overlay Behavior**
  - **Validates: Requirements 5.5**

- [ ] 1.7 Write property test for animation performance
  - **Property 7: Animation Performance**
  - **Validates: Requirements 7.1, 7.2**

- [ ] 1.8 Write property test for custom class application
  - **Property 8: Custom Class Application**
  - **Validates: Requirements 1.3**

- [ ] 1.9 Write unit tests for LoadingSpinner edge cases
  - Test rendering with default props
  - Test invalid size prop defaults to 'md'
  - Test missing ThemeContext defaults to light mode
  - Test custom className application
  - _Requirements: 1.1, 1.3, 1.5, 2.3, 3.1_

- [ ] 2. Export LoadingSpinner from UI components index
  - Update `src/components/ui/index.ts` to export LoadingSpinner
  - Ensure LoadingSpinner is available for import alongside Button, Card, etc.
  - _Requirements: 1.3_

- [ ] 3. Update Button component to use LoadingSpinner
  - Import LoadingSpinner in `src/components/ui/Button.tsx`
  - Replace inline spinner SVG with `<LoadingSpinner size="sm" className="-ml-1 mr-2" />`
  - Maintain existing isLoading prop behavior
  - Remove old spinner SVG code
  - _Requirements: 4.1_

- [ ] 3.1 Write integration test for Button with LoadingSpinner
  - Test Button renders LoadingSpinner when isLoading is true
  - Test Button does not render LoadingSpinner when isLoading is false
  - _Requirements: 4.1_

- [ ] 4. Update Login page to use LoadingSpinner
  - Import LoadingSpinner in `src/pages/Login.tsx`
  - Replace isLoading state rendering with fullscreen LoadingSpinner
  - Use message "Signing in..." during login
  - Use message "Creating account..." during registration
  - _Requirements: 4.1_

- [ ] 5. Update Dashboard page to use LoadingSpinner
  - Import LoadingSpinner in `src/pages/Dashboard.tsx`
  - Add LoadingSpinner for initial data fetch state
  - Use message "Loading dashboard..."
  - _Requirements: 4.2_

- [ ] 6. Update CompleteProfile page to use LoadingSpinner
  - Import LoadingSpinner in `src/pages/CompleteProfile.tsx`
  - Add LoadingSpinner during profile creation
  - Use message "Creating profile..."
  - _Requirements: 4.3_

- [ ] 7. Update EditProfile page to use LoadingSpinner
  - Import LoadingSpinner in `src/pages/EditProfile.tsx`
  - Add LoadingSpinner during profile update
  - Use message "Updating profile..."
  - _Requirements: 4.4_

- [ ] 8. Update ProfilePhotoUpload component to use LoadingSpinner
  - Import LoadingSpinner in `src/components/ProfilePhotoUpload.tsx`
  - Replace "Uploading..." text with LoadingSpinner
  - Use message "Uploading image..."
  - _Requirements: 4.5_

- [ ] 9. Write integration tests for page loading states
  - Test Login page displays correct loading messages
  - Test Dashboard displays loading state during data fetch
  - Test CompleteProfile displays loading during submission
  - Test EditProfile displays loading during update
  - Test ProfilePhotoUpload displays loading during upload
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- Integration tests verify component works correctly in real application context
- The LoadingSpinner component uses CSS transforms for GPU-accelerated 60fps animation
- All loading states now provide contextual messages for better user experience
