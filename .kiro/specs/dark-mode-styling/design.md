# Design Document: Dark Mode and Styling Improvements

## Overview

This design implements a comprehensive theme system for the React + TypeScript application, providing both light and dark modes with improved color palettes. The solution uses React Context for state management, Tailwind CSS for styling with the class-based dark mode strategy, and browser localStorage for persistence. The design ensures accessibility compliance (WCAG AA), smooth transitions, and system preference detection.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Root                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              ThemeProvider (Context)                   │  │
│  │  - Manages theme state (light/dark)                   │  │
│  │  - Handles localStorage persistence                   │  │
│  │  - Detects system preference                          │  │
│  │  - Applies dark class to <html>                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                 │
│              ┌─────────────┴─────────────┐                  │
│              ▼                           ▼                   │
│  ┌──────────────────────┐   ┌──────────────────────┐       │
│  │   Theme Toggle       │   │   Page Components    │       │
│  │   - Button control   │   │   - Login            │       │
│  │   - Icon display     │   │   - Dashboard        │       │
│  │   - Accessibility    │   │   - CompleteProfile  │       │
│  └──────────────────────┘   │   - EditProfile      │       │
│                              └──────────────────────┘       │
│                                          │                   │
│                              ┌───────────┴───────────┐      │
│                              ▼                       ▼       │
│                  ┌──────────────────┐   ┌──────────────┐   │
│                  │  Tailwind CSS    │   │  Components  │   │
│                  │  - Color tokens  │   │  - Buttons   │   │
│                  │  - dark: classes │   │  - Inputs    │   │
│                  └──────────────────┘   │  - Cards     │   │
│                                          └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Theme State Flow

```
User Action / System Event
         │
         ▼
┌────────────────────┐
│  Toggle Theme or   │
│  Detect Preference │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  Update Context    │
│  State (theme)     │
└────────┬───────────┘
         │
         ├──────────────────┐
         ▼                  ▼
┌────────────────┐  ┌──────────────────┐
│ Save to        │  │ Apply/Remove     │
│ localStorage   │  │ 'dark' class on  │
└────────────────┘  │ <html> element   │
                    └──────┬───────────┘
                           │
                           ▼
                    ┌──────────────────┐
                    │ Tailwind applies │
                    │ dark: variants   │
                    └──────────────────┘
```

## Components and Interfaces

### 1. ThemeContext

**Purpose:** Provides theme state and toggle function to all components.

**Interface:**
```typescript
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
```

**Implementation Details:**
- Uses React Context API for global state
- Provides `useTheme` custom hook for consuming context
- Throws error if used outside ThemeProvider

### 2. ThemeProvider Component

**Purpose:** Manages theme state, persistence, and system preference detection.

**Props:**
```typescript
interface ThemeProviderProps {
  children: React.ReactNode;
}
```

**State:**
```typescript
const [theme, setTheme] = useState<Theme>(() => {
  // 1. Check localStorage
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  
  // 2. Check system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  // 3. Default to light
  return 'light';
});
```

**Effects:**
1. **Apply theme class to HTML element:**
   ```typescript
   useEffect(() => {
     const root = document.documentElement;
     if (theme === 'dark') {
       root.classList.add('dark');
     } else {
       root.classList.remove('dark');
     }
   }, [theme]);
   ```

2. **Persist theme to localStorage:**
   ```typescript
   useEffect(() => {
     localStorage.setItem('theme', theme);
   }, [theme]);
   ```

3. **Listen for system preference changes:**
   ```typescript
   useEffect(() => {
     const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
     const handleChange = (e: MediaQueryListEvent) => {
       // Only update if no explicit user preference
       const stored = localStorage.getItem('theme');
       if (!stored) {
         setTheme(e.matches ? 'dark' : 'light');
       }
     };
     
     mediaQuery.addEventListener('change', handleChange);
     return () => mediaQuery.removeEventListener('change', handleChange);
   }, []);
   ```

**Methods:**
```typescript
const toggleTheme = () => {
  setTheme(prev => prev === 'light' ? 'dark' : 'light');
};
```

### 3. ThemeToggle Component

**Purpose:** UI control for switching between light and dark modes.

**Props:**
```typescript
interface ThemeToggleProps {
  className?: string; // Optional additional styling
}
```

**Implementation:**
```typescript
export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-colors ${className}`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
```

**Icon Components:**
- **SunIcon:** Displayed in dark mode (indicates switching to light)
- **MoonIcon:** Displayed in light mode (indicates switching to dark)
- Both use SVG with currentColor for theme-aware coloring

### 4. Updated App Component

**Purpose:** Wrap application with ThemeProvider.

```typescript
function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* existing routes */}
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
```

## Data Models

### Theme Preference Storage

**localStorage Key:** `theme`

**Values:**
- `"light"` - Light mode selected
- `"dark"` - Dark mode selected
- `null` or absent - No explicit preference, use system default

**Type Definition:**
```typescript
type StoredTheme = 'light' | 'dark' | null;
```

### Color Token Structure

**Light Mode Palette:**
```typescript
const lightColors = {
  background: {
    primary: '#FFFFFF',
    secondary: '#FAFAF8',
    tertiary: '#F0EDE3',
  },
  text: {
    primary: '#1A1A1A',
    secondary: '#4A4A4A',
    tertiary: '#8A8A8A',
  },
  primary: {
    DEFAULT: '#1A5C3E',
    light: '#2D7A54',
    dark: '#0F3D28',
  },
  accent: {
    DEFAULT: '#45A049',
    light: '#5CB860',
    dark: '#3D8B40',
  },
  border: {
    DEFAULT: '#D4D4D4',
    light: '#E8E8E8',
    dark: '#B0B0B0',
  },
  // ... other semantic tokens
};
```

**Dark Mode Palette:**
```typescript
const darkColors = {
  background: {
    primary: '#1A1A1A',      // Main background
    secondary: '#242424',    // Elevated surfaces (cards)
    tertiary: '#2E2E2E',     // Nested surfaces
  },
  text: {
    primary: '#F5F5F5',      // Primary text
    secondary: '#B0B0B0',    // Secondary text
    tertiary: '#808080',     // Tertiary/disabled text
  },
  primary: {
    DEFAULT: '#2D7A54',      // Lighter than light mode for visibility
    light: '#3D9A6A',
    dark: '#1A5C3E',
  },
  accent: {
    DEFAULT: '#5CB860',      // Brighter for dark backgrounds
    light: '#70C674',
    dark: '#45A049',
  },
  border: {
    DEFAULT: '#404040',      // Subtle borders
    light: '#4A4A4A',
    dark: '#303030',
  },
  // ... other semantic tokens
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Semantic tokens resolve to theme-specific values

*For any* semantic color token (e.g., 'background', 'text-primary', 'border'), when the theme is light, the token should resolve to the light mode color value, and when the theme is dark, the token should resolve to the dark mode color value.

**Validates: Requirements 1.2**

### Property 2: Theme initialization respects preference hierarchy

*For any* combination of stored preference (present/absent) and system preference (light/dark), the initial theme should be determined by: (1) stored preference if present, (2) system preference if no stored preference, (3) light mode as final fallback.

**Validates: Requirements 1.3, 5.3, 5.5, 6.1**

### Property 3: Theme changes update components without reload

*For any* theme change from light to dark or dark to light, all rendered components should reflect the new theme without triggering a full page reload (verified by checking that component instances are preserved).

**Validates: Requirements 1.5, 7.1, 7.2**

### Property 4: All color combinations meet WCAG AA contrast ratios

*For any* text/background color combination used in the application, the contrast ratio should meet WCAG AA standards (minimum 4.5:1 for normal text, 3:1 for large text) in both light and dark modes.

**Validates: Requirements 2.1, 2.3, 3.2, 7.3, 10.1**

### Property 5: All semantic tokens have dark mode variants

*For any* semantic color token defined in light mode, there should exist a corresponding dark mode variant with a defined color value.

**Validates: Requirements 2.4**

### Property 6: Interactive states maintain sufficient contrast

*For any* interactive element (button, input, link) in any state (default, hover, active, disabled), the contrast between the element and its background should be sufficient for clear distinction (minimum 3:1 ratio) in both light and dark modes.

**Validates: Requirements 2.5, 3.4, 7.4**

### Property 7: Theme toggle switches modes immediately

*For any* current theme state (light or dark), clicking the theme toggle should immediately switch to the opposite theme and update the DOM by adding or removing the 'dark' class on the root element.

**Validates: Requirements 4.2, 9.3**

### Property 8: Theme toggle displays correct icon

*For any* current theme state, the theme toggle should display the moon icon when in light mode and the sun icon when in dark mode.

**Validates: Requirements 4.3**

### Property 9: Theme preference persists across sessions (round-trip)

*For any* theme selection (light or dark), after storing the preference to localStorage and simulating an application reload, the retrieved theme should match the originally selected theme.

**Validates: Requirements 5.1, 5.2, 5.4**

### Property 10: System preference changes trigger theme updates

*For any* system preference change event (light to dark or dark to light), if no explicit user preference is stored in localStorage, the application theme should update to match the new system preference.

**Validates: Requirements 6.2**

### Property 11: System preference detection supports both modes

*For any* system preference value (light or dark), the theme system should correctly detect and apply the corresponding theme when no stored preference exists.

**Validates: Requirements 6.3**

### Property 12: Transition durations fall within specified range

*For any* element with theme transition styling, the transition duration should be between 150ms and 300ms inclusive.

**Validates: Requirements 8.2**

### Property 13: Multiple elements transition simultaneously

*For any* theme change, all elements with color transitions should use the same transition duration to ensure simultaneous visual changes.

**Validates: Requirements 8.4**

### Property 14: Theme toggle announces changes to screen readers

*For any* theme change triggered by the toggle, the aria-label attribute should update to reflect the new state and announce the available action (e.g., "Switch to dark mode" when in light mode).

**Validates: Requirements 10.3**

### Property 15: Focus indicators remain visible in both themes

*For any* focusable element, the focus indicator should meet minimum contrast requirements (3:1 ratio) against the background in both light and dark modes.

**Validates: Requirements 10.5**

## Error Handling

### Theme Initialization Errors

**Scenario:** localStorage is unavailable or throws an error

**Handling:**
```typescript
function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return null;
  } catch (error) {
    console.warn('Failed to access localStorage:', error);
    return null;
  }
}
```

**Fallback:** Use system preference or default to light mode

### Theme Persistence Errors

**Scenario:** localStorage.setItem fails (quota exceeded, private browsing)

**Handling:**
```typescript
function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem('theme', theme);
  } catch (error) {
    console.warn('Failed to save theme preference:', error);
    // Continue without persistence - theme will work for current session
  }
}
```

**User Impact:** Theme preference not saved across sessions, but current session works normally

### Media Query Errors

**Scenario:** window.matchMedia is not supported (very old browsers)

**Handling:**
```typescript
function getSystemPreference(): Theme {
  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  } catch (error) {
    console.warn('Failed to detect system preference:', error);
    return 'light';
  }
}
```

**Fallback:** Default to light mode

### Context Usage Errors

**Scenario:** useTheme hook called outside ThemeProvider

**Handling:**
```typescript
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

**Developer Impact:** Clear error message during development to fix component hierarchy

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of theme initialization scenarios
- Component rendering with different themes
- Edge cases like localStorage errors
- Integration between ThemeProvider and ThemeToggle
- Accessibility attributes and keyboard interactions

**Property-Based Tests** focus on:
- Universal properties that hold for all color combinations (contrast ratios)
- Theme state transitions across all possible states
- Persistence round-trip properties
- System preference detection across different scenarios

Together, these approaches ensure both concrete behavior validation and comprehensive input coverage.

### Property-Based Testing Configuration

**Library:** fast-check (for TypeScript/JavaScript)

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with: **Feature: dark-mode-styling, Property {number}: {property_text}**

**Example Test Structure:**
```typescript
import fc from 'fast-check';

// Feature: dark-mode-styling, Property 4: All color combinations meet WCAG AA contrast ratios
test('all text/background combinations meet WCAG AA contrast', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...allTextColors),
      fc.constantFrom(...allBackgroundColors),
      fc.constantFrom('light', 'dark'),
      (textColor, bgColor, theme) => {
        const contrast = calculateContrast(textColor, bgColor, theme);
        expect(contrast).toBeGreaterThanOrEqual(4.5); // Normal text
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Strategy

**Test Files:**
- `src/contexts/ThemeContext.test.tsx` - Context and provider tests
- `src/components/ThemeToggle.test.tsx` - Toggle component tests
- `src/utils/contrast.test.ts` - Contrast calculation utilities
- Integration tests for each page component with theme switching

**Key Test Cases:**
1. ThemeProvider initializes with stored preference
2. ThemeProvider initializes with system preference when no stored preference
3. ThemeProvider defaults to light when no preference available
4. toggleTheme switches between light and dark
5. Theme changes persist to localStorage
6. Theme changes apply dark class to HTML element
7. ThemeToggle renders correct icon for current theme
8. ThemeToggle is keyboard accessible
9. ThemeToggle has proper ARIA labels
10. System preference changes trigger theme updates (when no stored preference)
11. localStorage errors don't crash the application
12. All page components render correctly in both themes

### Accessibility Testing

**Manual Testing Required:**
- Screen reader announcements for theme changes
- Keyboard navigation through all interactive elements
- Visual inspection of focus indicators in both themes
- Color blindness simulation for both themes

**Automated Testing:**
- ARIA attribute presence and correctness
- Keyboard event handler presence
- Contrast ratio calculations
- Focus indicator visibility

### Visual Regression Testing

**Recommended Tools:** Percy, Chromatic, or similar

**Test Scenarios:**
- All pages in light mode
- All pages in dark mode
- Theme toggle in both states
- Interactive element states (hover, active, focus) in both themes
- Transition animations during theme switch

### Integration Testing

**Test Scenarios:**
1. User logs in → theme persists across navigation
2. User toggles theme → all pages reflect change
3. User clears browser data → theme resets to system preference
4. System preference changes → theme updates (if no stored preference)
5. User sets preference → system preference changes don't override

## Implementation Notes

### Tailwind Configuration Updates

The `tailwind.config.js` must be updated to:
1. Enable class-based dark mode: `darkMode: 'class'`
2. Define all color tokens with dark mode variants
3. Add transition utilities for smooth theme switching

### CSS Transition Strategy

Add global transition styles that apply only after initial load:
```css
/* Add to index.css */
.theme-transition * {
  transition: background-color 200ms ease-in-out,
              border-color 200ms ease-in-out,
              color 200ms ease-in-out;
}
```

Apply the class after initial render to avoid transition on page load.

### Component Update Strategy

Update components incrementally:
1. Start with layout components (navigation, containers)
2. Update form components (inputs, buttons)
3. Update page components
4. Update specialized components (cards, modals)

Use Tailwind's `dark:` prefix for all theme-specific styles:
```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
```

### Performance Considerations

- Theme detection and initialization happen synchronously to avoid flash of wrong theme
- Use CSS classes rather than inline styles for better performance
- Leverage Tailwind's JIT compiler to generate only used dark mode variants
- Consider adding a `<script>` in `index.html` to apply theme class before React loads (prevents flash)

### Browser Compatibility

- localStorage: Supported in all modern browsers (IE8+)
- matchMedia: Supported in all modern browsers (IE10+)
- prefers-color-scheme: Supported in modern browsers (Chrome 76+, Firefox 67+, Safari 12.1+)
- Fallback to light mode for unsupported browsers
