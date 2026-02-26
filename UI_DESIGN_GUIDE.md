# Circl'd UI Design Guide

## Overview
This guide documents the cohesive design system for Circl'd, ensuring consistency across all components and pages.

## Design Philosophy
- **Modern & Clean**: Refined glassmorphism with subtle shadows and gradients
- **Accessible**: High contrast ratios, clear typography, and semantic colors
- **Responsive**: Mobile-first approach with smooth breakpoint transitions
- **Performant**: Optimized animations with `will-change` and hardware acceleration
- **Cohesive**: Unified color palette, spacing, and interaction patterns

## Color System

### Primary Colors (Emerald Green)
- `primary`: #10b981 - Main brand color
- `primary-light`: #34d399 - Lighter variant for dark mode
- `primary-dark`: #059669 - Darker variant for emphasis

### Accent Colors (Teal)
- `accent`: #14b8a6 - Secondary brand color
- `accent-light`: #2dd4bf - Lighter variant
- `accent-dark`: #0f766e - Darker variant

### Semantic Colors
- **Success**: Emerald green (same as primary)
- **Warning**: Amber (#f59e0b)
- **Error**: Red (#ef4444)
- **Info**: Blue (#3b82f6)

### Neutral Colors
- **Light Mode**: Slate-50 base (#f8fafc)
- **Dark Mode**: Slate-950 base (#020617)

## Typography

### Font Family
- Primary: Inter, Poppins, system-ui
- Optimized with `-webkit-font-smoothing: antialiased`

### Type Scale
```typescript
// Page titles with gradient
typography.pageTitle.combined
// → text-2xl sm:text-3xl lg:text-4xl font-extrabold

// Section headings
typography.sectionHeading
// → text-xl sm:text-2xl font-bold

// Body text
typography.body
// → text-sm sm:text-base

// Subtitles
typography.subtitle
// → text-sm sm:text-base text-text-secondary
```

## Spacing System

### Container Widths
- `xs`: max-w-2xl
- `sm`: max-w-4xl
- `md`: max-w-5xl
- `lg`: max-w-6xl (default)
- `xl`: max-w-7xl

### Padding
- Normal: p-4 sm:p-6
- Large: p-6 sm:p-8
- XL: p-8 sm:p-10

### Gaps
- Normal: gap-3 sm:gap-4
- Large: gap-4 sm:gap-6
- XL: gap-6 sm:gap-8

## Components

### Buttons
```tsx
<Button variant="primary" size="md">
  Primary Action
</Button>
```

**Variants:**
- `primary`: Gradient emerald, elevated shadow
- `secondary`: Gradient teal, elevated shadow
- `outline`: Border with hover fill
- `ghost`: Transparent with hover background
- `danger`: Gradient red for destructive actions

**Sizes:** `sm`, `md`, `lg`

**Features:**
- Hover lift effect (-translate-y-0.5)
- Active scale (0.98)
- Loading state with spinner
- Focus ring for accessibility

### Cards
```tsx
<Card variant="elevated">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

**Variants:**
- `default`: Standard card with border
- `elevated`: Shadow with hover effect
- `outlined`: Transparent with border
- `glass`: Glassmorphism effect

### Inputs
```tsx
<Input
  label="Email"
  type="email"
  error={errors.email}
  helperText="We'll never share your email"
/>
```

**Features:**
- Floating label support
- Error states with icon
- Helper text
- Hover and focus states
- Required field indicator

### Alerts
```tsx
<Alert variant="success" title="Success!">
  Your changes have been saved.
</Alert>
```

**Variants:** `info`, `success`, `warning`, `error`

**Features:**
- Gradient backgrounds
- Icon indicators
- Optional title
- Border accent

### Loading Spinner
```tsx
<LoadingSpinner
  size="md"
  message="Loading..."
  fullscreen={false}
/>
```

**Features:**
- Animated glow ring
- Pulsing message
- Fullscreen overlay option
- Three sizes: sm, md, lg

## Animations

### Entrance Animations
- `animate-fadeIn`: Standard fade with slide up (0.5s)
- `animate-fadeInFast`: Quick fade (0.3s)
- `animate-scaleIn`: Scale from 95% to 100%
- `animate-slideUp`: Slide up from bottom
- `animate-authCardIn`: Special auth page entrance

### Hover Effects
```typescript
// Transform + shadow
getHoverClasses('all', 'normal')

// Just transform
getHoverClasses('transform', 'subtle')

// Just scale
getHoverClasses('scale', 'normal')
```

### Stagger Delays
Use `delay-{n}` classes (75, 100, 150, 200, 250, 300, 350ms) for sequential animations.

## Backgrounds

### Page Backgrounds
```typescript
// Standard gradient
getPageBackgroundClasses()
// → bg-gradient-to-br from-gray-50 via-white to-primary/5

// Alternative with color
backgrounds.pageAlt

// Neutral solid
backgrounds.pageNeutral
```

### Glass Effects
- Backdrop blur: `backdrop-blur-md` or `backdrop-blur-xl`
- Semi-transparent backgrounds: `bg-white/90 dark:bg-gray-800/90`
- Border with opacity: `border-white/60 dark:border-gray-700/50`

## Shadows

### Elevation Levels
- **sm**: `shadow-sm` - Subtle lift
- **md**: `shadow-md` - Standard elevation
- **lg**: `shadow-lg` - Prominent elevation
- **xl**: `shadow-xl` - Maximum elevation
- **2xl**: `shadow-2xl` - Hero elements

### Colored Shadows
```css
shadow-lg shadow-primary/25
hover:shadow-xl hover:shadow-primary/40
```

## Responsive Design

### Breakpoints
- `xs`: 480px (custom)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Mobile-First Approach
Always start with mobile styles, then add larger breakpoint overrides:
```tsx
className="text-sm sm:text-base lg:text-lg"
className="p-4 sm:p-6 lg:p-8"
className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
```

## Dark Mode

### Implementation
- Class-based toggling (`.dark` class on root)
- Automatic color transitions (0.2s ease)
- Refined contrast ratios for readability

### Color Adjustments
- Backgrounds: Darker slate tones
- Text: Higher contrast whites
- Borders: Subtle grays
- Shadows: Increased opacity for depth

## Accessibility

### Focus States
All interactive elements have visible focus rings:
```css
focus:outline-none focus:ring-2 focus:ring-primary
```

### Color Contrast
- Text on backgrounds: WCAG AA compliant
- Interactive elements: Clear hover/active states
- Error states: High contrast red

### Semantic HTML
- Proper heading hierarchy
- ARIA labels on icons
- Role attributes on custom components

## Best Practices

### Do's ✅
- Use design system utilities (`getCardClasses`, `getPrimaryButtonClasses`)
- Apply consistent spacing with system values
- Use semantic color names (primary, success, error)
- Add hover states to interactive elements
- Include loading states for async actions
- Test in both light and dark modes

### Don'ts ❌
- Don't use arbitrary color values
- Don't mix spacing scales
- Don't skip responsive breakpoints
- Don't forget focus states
- Don't use inline styles for theme values
- Don't create one-off component variants

## Performance

### Optimizations
- Hardware-accelerated animations with `will-change`
- Debounced scroll handlers
- Lazy-loaded images
- Memoized expensive computations
- Efficient re-renders with React.memo

### Animation Performance
```css
/* Good - GPU accelerated */
transform: translateY(-4px);
opacity: 0.8;

/* Avoid - triggers layout */
top: -4px;
height: 100px;
```

## Maintenance

### Adding New Components
1. Follow existing component patterns
2. Use design system utilities
3. Support all variants (light/dark, sizes)
4. Add TypeScript types
5. Include accessibility features
6. Test responsive behavior

### Updating the Design System
1. Update `src/styles/designSystem.ts`
2. Update this guide
3. Test across all components
4. Check for breaking changes
5. Update component examples

## Resources

### Key Files
- `src/styles/designSystem.ts` - Design tokens and utilities
- `src/index.css` - Global styles and animations
- `src/components/ui/` - Reusable UI components

### External References
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
