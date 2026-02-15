# Design Document: Consistent Loading Animation

## Overview

This design provides a reusable `LoadingSpinner` component that displays a consistent loading animation with contextual messages across the React + TypeScript application. The component integrates with the existing ThemeContext for dark mode support and follows the established UI component patterns. The design emphasizes accessibility, performance, and developer experience.

The component will use CSS animations for smooth 60fps rendering and include proper ARIA attributes for screen reader support. It will be placed in the `src/components/ui/` directory alongside other reusable UI components like Button and Card.

## Architecture

### Component Structure

```
src/
├── components/
│   └── ui/
│       ├── LoadingSpinner.tsx    (New: Main loading component)
│       ├── Button.tsx             (Existing: Update to use LoadingSpinner)
│       ├── Card.tsx               (Existing: No changes)
│       └── index.ts               (Existing: Add LoadingSpinner export)
├── pages/
│   ├── Login.tsx                  (Update: Use LoadingSpinner)
│   ├── Dashboard.tsx              (Update: Use LoadingSpinner)
│   ├── CompleteProfile.tsx        (Update: Use LoadingSpinner)
│   └── EditProfile.tsx            (Update: Use LoadingSpinner)
└── components/
    └── ProfilePhotoUpload.tsx     (Update: Use LoadingSpinner)
```

### Integration Points

1. **ThemeContext**: The LoadingSpinner will use the `useTheme` hook to access current theme
2. **Existing Components**: Button component already has loading state - will be refactored to use LoadingSpinner
3. **Page Components**: All pages with async operations will use LoadingSpinner for loading states
4. **Tailwind CSS**: Component will use existing Tailwind utility classes for styling

## Components and Interfaces

### LoadingSpinner Component

**File**: `src/components/ui/LoadingSpinner.tsx`

**TypeScript Interface**:
```typescript
interface LoadingSpinnerProps {
  /** Message describing what is loading */
  message?: string;
  /** Size variant of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to display as fullscreen overlay */
  fullscreen?: boolean;
  /** Additional CSS classes */
  className?: string;
}
```

**Props**:
- `message` (optional): Context message to display. Defaults to "Loading..."
- `size` (optional): Size variant - 'sm' (16px), 'md' (24px), 'lg' (32px). Defaults to 'md'
- `fullscreen` (optional): If true, renders as a centered overlay covering the viewport
- `className` (optional): Additional Tailwind classes for customization

**Behavior**:
- Renders a spinning circle animation using CSS transforms
- Displays the context message below the spinner
- Adapts colors based on current theme (light/dark)
- Includes ARIA live region for screen reader announcements
- Uses `role="status"` for non-critical loading states
- Prevents interaction with underlying content when fullscreen

**Animation**:
- CSS keyframe animation rotating 360 degrees
- Animation duration: 1 second
- Timing function: linear for smooth continuous rotation
- Uses `transform: rotate()` for GPU-accelerated rendering

**Styling**:
- Light mode: Primary color (#6366F1) for spinner, dark gray for text
- Dark mode: Primary-light color (#818CF8) for spinner, light gray for text
- Maintains WCAG AA contrast ratios in both modes
- Responsive spacing using Tailwind utilities

### Updated Button Component

**File**: `src/components/ui/Button.tsx`

**Changes**:
- Replace inline spinner SVG with `<LoadingSpinner size="sm" />`
- Remove `isLoading` spinner implementation
- Import and use LoadingSpinner component
- Maintain existing `isLoading` prop behavior

**Before**:
```typescript
{isLoading && (
  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)}
```

**After**:
```typescript
{isLoading && <LoadingSpinner size="sm" className="-ml-1 mr-2" />}
```

### Page Component Updates

**Login.tsx**:
- Replace `isLoading` state rendering with fullscreen LoadingSpinner
- Message: "Signing in..." during login, "Creating account..." during registration

**Dashboard.tsx**:
- Add LoadingSpinner for initial data fetch
- Message: "Loading dashboard..."

**CompleteProfile.tsx**:
- Add LoadingSpinner during profile creation
- Message: "Creating profile..."

**EditProfile.tsx**:
- Add LoadingSpinner during profile update
- Message: "Updating profile..."

**ProfilePhotoUpload.tsx**:
- Replace "Uploading..." text with LoadingSpinner
- Message: "Uploading image..."

## Data Models

No new data models are required. The component operates on props only and maintains no internal state beyond the animation.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Message Display Consistency

*For any* LoadingSpinner instance with a provided message prop, the rendered output should contain that exact message text.

**Validates: Requirements 2.1, 2.2**

### Property 2: Default Message Fallback

*For any* LoadingSpinner instance without a message prop, the rendered output should contain the default message "Loading...".

**Validates: Requirements 2.3**

### Property 3: Theme-Aware Color Application

*For any* theme state (light or dark), the LoadingSpinner should render with colors appropriate to that theme, maintaining contrast ratios above WCAG AA standards.

**Validates: Requirements 3.1, 3.2, 3.4**

### Property 4: Size Variant Dimensions

*For any* size prop value ('sm', 'md', 'lg'), the spinner element should have dimensions matching the specified size (sm=16px, md=24px, lg=32px).

**Validates: Requirements 1.5**

### Property 5: Accessibility Attributes Presence

*For any* LoadingSpinner instance, the rendered DOM should include `role="status"` and `aria-live="polite"` attributes.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 6: Fullscreen Overlay Behavior

*For any* LoadingSpinner with `fullscreen={true}`, the component should render with fixed positioning covering the entire viewport and centered content.

**Validates: Requirements 5.5**

### Property 7: Animation Performance

*For any* LoadingSpinner instance, the CSS animation should use `transform` property (not layout-affecting properties like `margin` or `top`) to ensure GPU acceleration.

**Validates: Requirements 7.1, 7.2**

### Property 8: Custom Class Application

*For any* LoadingSpinner with a `className` prop, the rendered element should include those classes in addition to base classes.

**Validates: Requirements 1.3**

## Error Handling

### Invalid Props

- **Invalid size prop**: Component will default to 'md' if an invalid size is provided
- **Missing message**: Component will use default "Loading..." message
- **Invalid className**: Tailwind will ignore invalid classes, component remains functional

### Theme Context Errors

- If ThemeContext is unavailable, component will default to light mode colors
- Component will not throw errors, ensuring loading states always display

### Runtime Errors

- Component is purely presentational with no async operations
- No error boundaries needed as component has no failure modes
- Parent components handle their own loading state errors

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Rendering with default props**: Verify component renders with "Loading..." message
2. **Rendering with custom message**: Verify custom message displays correctly
3. **Size variants**: Test each size renders with correct dimensions
4. **Fullscreen mode**: Verify fullscreen prop adds overlay styles
5. **Custom className**: Verify additional classes are applied
6. **Accessibility attributes**: Verify ARIA attributes are present
7. **Theme integration**: Mock ThemeContext and verify color classes change

### Property-Based Tests

Property-based tests will verify universal properties across all inputs. Each test will run a minimum of 100 iterations with randomized inputs.

1. **Property 1 Test**: Generate random message strings, verify they appear in rendered output
   - Tag: **Feature: consistent-loading-animation, Property 1: Message Display Consistency**

2. **Property 2 Test**: Render without message prop multiple times, verify default message always appears
   - Tag: **Feature: consistent-loading-animation, Property 2: Default Message Fallback**

3. **Property 3 Test**: Generate random theme states, verify appropriate color classes are applied
   - Tag: **Feature: consistent-loading-animation, Property 3: Theme-Aware Color Application**

4. **Property 4 Test**: Test all size variants, verify dimensions match specifications
   - Tag: **Feature: consistent-loading-animation, Property 4: Size Variant Dimensions**

5. **Property 5 Test**: Generate random prop combinations, verify ARIA attributes always present
   - Tag: **Feature: consistent-loading-animation, Property 5: Accessibility Attributes Presence**

6. **Property 6 Test**: Test fullscreen prop, verify fixed positioning and centering styles
   - Tag: **Feature: consistent-loading-animation, Property 6: Fullscreen Overlay Behavior**

7. **Property 7 Test**: Inspect generated CSS, verify transform property is used for animation
   - Tag: **Feature: consistent-loading-animation, Property 7: Animation Performance**

8. **Property 8 Test**: Generate random className strings, verify they're included in output
   - Tag: **Feature: consistent-loading-animation, Property 8: Custom Class Application**

### Integration Tests

1. **Button integration**: Verify Button component uses LoadingSpinner correctly
2. **Page loading states**: Test each page's loading state displays appropriate message
3. **Theme switching**: Verify LoadingSpinner updates when theme changes
4. **Multiple instances**: Test multiple LoadingSpinners can render simultaneously

### Testing Library

- **Framework**: Vitest (already used in the project)
- **Property-Based Testing**: fast-check (TypeScript/JavaScript PBT library)
- **React Testing**: @testing-library/react
- **Configuration**: Minimum 100 iterations per property test

### Manual Testing Checklist

1. Visual verification in light and dark modes
2. Screen reader announcement testing
3. Animation smoothness at 60fps
4. Loading states across all pages
5. Responsive behavior on different screen sizes
