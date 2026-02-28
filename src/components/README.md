# Components Documentation

This directory contains all React components for the Circl'd trading platform, organized by functionality and reusability.

## Directory Structure

```
components/
├── ui/                      # Base UI components (design system)
│   ├── Button.tsx          # Primary button component
│   ├── LoadingSpinner.tsx  # Loading state indicators
│   ├── Card.tsx            # Card container component
│   ├── Input.tsx           # Form input component
│   ├── Select.tsx          # Dropdown select component
│   ├── Modal.tsx           # Modal dialog component
│   ├── Toast.tsx           # Toast notification component
│   ├── Alert.tsx           # Alert message component
│   ├── Dropdown.tsx        # Dropdown menu component
│   ├── Checkbox.tsx        # Checkbox input component
│   ├── Pagination.tsx      # Pagination controls
│   └── index.ts            # Barrel exports
├── SwipeInterface.tsx       # Main swipe trading interface
├── ConversationView.tsx     # Chat messaging interface
├── TradeAnchorDisplay.tsx   # Floating trade anchor display
├── TradeAnchorSelector.tsx  # Trade anchor selection modal
├── Navigation.tsx           # Main navigation component
├── ItemHistory.tsx          # Item view history
├── NotificationList.tsx     # Notification center
└── ...                      # Other feature components
```

---

## UI Components (Design System)

### Button Component

A versatile button component with multiple variants, sizes, loading states, and full accessibility support.

**Variants:**
- `primary` - Main call-to-action (gradient green)
- `secondary` - Alternative actions (gradient teal)
- `outline` - Tertiary actions (bordered)
- `ghost` - Subtle actions (transparent)
- `danger` - Destructive actions (gradient red)

**Sizes:**
- `sm` - Small (48px min height)
- `md` - Medium (52px min height) - default
- `lg` - Large (56px min height)

**Features:**
- Loading state with integrated spinner
- Icon support (leading/trailing positions)
- Icon-only mode with automatic square sizing
- Accessibility: 48px minimum touch targets, ARIA labels, keyboard navigation
- Dark mode support
- Smooth animations and hover effects

**Usage:**

```tsx
import { Button } from '@/components/ui/Button';

// Basic usage
<Button onClick={handleClick}>Click Me</Button>

// With variant and size
<Button variant="primary" size="lg" onClick={handleSubmit}>
  Submit
</Button>

// Loading state
<Button isLoading={isSubmitting} onClick={handleSubmit}>
  Save Changes
</Button>

// Icon button
<Button variant="ghost" aria-label="Close">
  <XIcon />
</Button>

// Icon with text
<Button iconPosition="leading">
  <PlusIcon />
  Add Item
</Button>
```

**Demo Files:**
- `Button.icon.demo.tsx` - Icon button examples
- `Button.loading.demo.tsx` - Loading state examples

---

### LoadingSpinner Component

Animated loading indicators with 9 stylish variants for different use cases.

**Variants:**
- `default` - Classic spinning circle
- `dots` - Three bouncing dots
- `pulse` - Pulsing circle with expanding rings
- `gradient` - Gradient spinning arc
- `orbit` - Orbiting dots around center
- `bars` - Vertical bars with wave animation
- `flow` - Liquid flowing gradient (default)
- `ripple` - Expanding ripple circles
- `wave` - Rotating wave with color animation

**Sizes:**
- `sm` - 16px (4 Tailwind units)
- `md` - 32px (8 Tailwind units) - default
- `lg` - 48px (12 Tailwind units)
- `xl` - 64px (16 Tailwind units)

**Features:**
- Optional loading message with animated dots
- Theme-aware colors (inherits from parent or uses gradients)
- Smooth GPU-accelerated animations
- Accessible (aria-hidden on decorative elements)

**Usage:**

```tsx
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Basic usage
<LoadingSpinner />

// With variant and size
<LoadingSpinner variant="orbit" size="lg" />

// With message
<LoadingSpinner 
  variant="flow" 
  size="md" 
  message="Loading your items" 
/>

// In a button (automatically sized)
<Button isLoading={true}>Submit</Button>
```

**Demo File:**
- `LoadingSpinner.demo.tsx` - All variants showcase

---

### Other UI Components

**Card** - Container component with consistent styling and shadow
**Input** - Text input with label, error states, and validation
**Select** - Dropdown select with custom styling
**Modal** - Dialog overlay with backdrop and animations
**Toast** - Temporary notification messages
**Alert** - Persistent alert messages with variants
**Dropdown** - Menu dropdown with positioning
**Checkbox** - Checkbox input with label
**Pagination** - Page navigation controls

---

## Feature Components

### TradeAnchorDisplay

A collapsible floating button component that displays the user's selected trade anchor item during the swipe trading experience.

**Features:**
- Floating button in top-right corner with trade icon
- Expandable panel revealing item details
- Item preview with image, title, and category
- Quick change button to select different anchor
- Responsive design with touch-optimized interactions
- Full accessibility with keyboard navigation
- Dark mode support
- Backdrop overlay when expanded

**Props:**

```typescript
interface TradeAnchorDisplayProps {
  item: Item | null;           // The selected trade anchor item
  onChangeClick: () => void;   // Callback when user wants to change the anchor
}
```

**Usage:**

```tsx
import { TradeAnchorDisplay } from '@/components/TradeAnchorDisplay';

function SwipeTradingPage() {
  const [tradeAnchor, setTradeAnchor] = useState<Item | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  return (
    <div>
      <TradeAnchorDisplay 
        item={tradeAnchor}
        onChangeClick={() => setShowSelector(true)}
      />
      {/* Rest of your swipe interface */}
    </div>
  );
}
```

**Component States:**
- **Collapsed** - Circular floating button (48x48px minimum)
- **Expanded** - 320px wide card panel with item details
- **No Anchor** - Component returns null when no item selected

**Animations:**
- Button hover: scales to 1.1x
- Button tap: scales to 0.95x
- Panel expansion: smooth slide-in with spring physics
- Change button: pulse animation on click

**Accessibility:**
- `aria-label` on all interactive elements
- `aria-expanded` indicates panel state
- Keyboard navigation with focus rings
- Screen reader support

**Z-Index Layers:**
- Backdrop: `z-10`
- Button & Panel: `z-20`

---

## Component Best Practices

### Accessibility
- Always provide `aria-label` for icon-only buttons
- Use semantic HTML elements
- Ensure 48px minimum touch targets on mobile
- Support keyboard navigation
- Include focus-visible styles

### Performance
- Use lazy loading for images via Cloudinary
- Optimize animations with GPU acceleration
- Minimize re-renders with proper state management
- Use AnimatePresence for mount/unmount animations

### Styling
- Follow design system color tokens
- Support both light and dark themes
- Use Tailwind utility classes
- Maintain consistent spacing and sizing

### Testing
- Write unit tests for component logic
- Test accessibility with screen readers
- Verify responsive behavior
- Test keyboard navigation

---

## Adding New Components

When creating new components:

1. **Location**: Place in appropriate directory (ui/ for design system, root for features)
2. **TypeScript**: Define clear prop interfaces
3. **Accessibility**: Include ARIA attributes and keyboard support
4. **Theming**: Support light and dark modes
5. **Documentation**: Add usage examples and prop descriptions
6. **Testing**: Write tests for critical functionality
7. **Demo**: Create demo file for complex components (optional)

---

## Related Documentation

- [Main README](../../README.md) - Project overview
- [Scripts README](../../scripts/README.md) - Development tools
- [Button Migration Guide](../../scripts/README.md#migration-workflow) - Button standardization

---

## Requirements Mapping

Components are built to satisfy specific requirements:

- **TradeAnchorDisplay**: Requirements 9.1-9.6, 7.6
- **Button**: Requirements 6.1-6.5, 8.1-8.3, 11.1-11.4, 12.1-12.2, 13.1-13.5, 15.1-15.5
- **LoadingSpinner**: Loading state requirements across all features

---

## Browser Support

All components support:
- Modern browsers with CSS Grid and Flexbox
- JavaScript required for interactivity
- Graceful degradation for reduced motion preferences
- Touch and mouse input
