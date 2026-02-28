# Button Audit and Migration Scripts

Automated tools to help audit and migrate buttons in the codebase to use the standardized Button component from the design system.

## Overview

These scripts help maintain UI consistency by:
1. Identifying all button elements in the codebase
2. Analyzing native HTML buttons for migration opportunities
3. Providing automated suggestions with confidence levels
4. Generating detailed reports for manual review

---

## Scripts

### 1. Button Audit Tool (`audit-buttons.ts`)

Scans the codebase to identify all Button components and native button elements, generating a comprehensive report.

**Usage:**

```bash
npm run audit:buttons [directory] [output-file]
```

**Parameters:**
- `directory` (optional): Directory to scan. Default: `./src`
- `output-file` (optional): Output JSON file path. Default: `./button-audit-report.json`

**Examples:**

```bash
# Scan src directory (default)
npm run audit:buttons

# Scan specific directory
npm run audit:buttons ./src/components

# Custom output file
npm run audit:buttons ./src ./my-audit-report.json
```

**Output:**

The tool generates:
1. **Console output** - Summary statistics and detailed results
2. **JSON report** - Complete audit data for programmatic access

**Report Structure:**

```json
{
  "totalButtons": 67,
  "componentButtons": 0,
  "nativeButtons": 67,
  "results": [
    {
      "location": {
        "file": "src/pages/Login.tsx",
        "line": 157,
        "column": 17
      },
      "type": "Native_Button",
      "variant": null,
      "styling": "className",
      "props": {
        "type": "button",
        "onClick": "() => setShowPassword(!showPassword)",
        "className": "absolute right-3 top-1/2 -translate-y-1/2..."
      }
    }
  ]
}
```

---

### 2. Button Migration Helper (`migrate-buttons.ts`)

Analyzes native buttons and provides automated migration suggestions with confidence levels based on styling patterns.

**Usage:**

```bash
npm run migrate:buttons [directory] [output-file]
```

**Parameters:**
- `directory` (optional): Directory to scan. Default: `./src`
- `output-file` (optional): Output JSON file path. Default: `./button-migration-report.json`

**Examples:**

```bash
# Analyze src directory (default)
npm run migrate:buttons

# Analyze specific directory
npm run migrate:buttons ./src/components

# Custom output file
npm run migrate:buttons ./src ./my-migration-report.json
```

**Output:**

The tool generates:
1. **Console output** - Migration suggestions grouped by file with confidence indicators
2. **JSON report** - Complete migration data with reasoning and warnings

**Confidence Levels:**

- ✓ **High Confidence** - Clear styling patterns detected, safe to migrate automatically
- ~ **Medium Confidence** - Reasonable suggestions, verify before applying
- ⚠ **Low Confidence** - Unclear patterns, requires manual review

**Report Structure:**

```json
{
  "totalNativeButtons": 67,
  "highConfidenceMigrations": 35,
  "mediumConfidenceMigrations": 15,
  "lowConfidenceMigrations": 17,
  "manualReviewRequired": 25,
  "suggestions": [
    {
      "location": {
        "file": "src/pages/Login.tsx",
        "line": 157,
        "column": 17
      },
      "originalCode": "<button type=\"button\" onClick={...}>Show</button>",
      "suggestedCode": "<Button type=\"button\" onClick={...}>Show</Button>",
      "suggestedVariant": "ghost",
      "confidence": "medium",
      "reasoning": "Detected ghost/text-like styling (transparent background)",
      "manualReviewNeeded": false,
      "preservedProps": ["type", "onClick", "aria-label"],
      "warnings": []
    }
  ]
}
```

---

## Migration Workflow

### Step 1: Run Audit

First, identify all buttons in your codebase:

```bash
npm run audit:buttons
```

Review the console output to understand:
- Total number of buttons
- How many are already using Button component
- How many native buttons need migration

### Step 2: Run Migration Analysis

Generate migration suggestions:

```bash
npm run migrate:buttons
```

Review the suggestions and note:
- High confidence migrations (safe to apply)
- Medium/low confidence migrations (need review)
- Buttons flagged for manual review

### Step 3: Apply High-Confidence Migrations

Start with high-confidence migrations:

1. Open the file containing the native button
2. Import the Button component:
   ```typescript
   import { Button } from '@/components/ui/Button';
   ```
3. Replace the native button with the suggested Button component
4. Test the functionality and visual appearance

### Step 4: Review Medium/Low Confidence Cases

For medium/low confidence migrations:

1. Review the original button's purpose and styling
2. Choose the most appropriate variant (see guide below)
3. Ensure all props are preserved
4. Test thoroughly in both light and dark modes

### Step 5: Verify Changes

After migration:

1. Run tests: `npm test`
2. Check visual appearance in both themes
3. Verify keyboard navigation works
4. Test with screen readers if applicable
5. Ensure touch targets meet 48px minimum

---

## Variant Selection Guide

### Primary Variant (`variant="primary"`)

**Use for:** Main call-to-action buttons, submit buttons, primary actions

**Examples:**
- "Save Changes"
- "Submit"
- "Create Account"
- "Start Trading"

**Styling:** Gradient background (green), prominent shadow, hover lift effect

---

### Secondary Variant (`variant="secondary"`)

**Use for:** Alternative actions, less prominent than primary but still important

**Examples:**
- "Cancel"
- "View Profile"
- "Learn More"

**Styling:** Gradient background (teal/accent), medium shadow, hover lift effect

---

### Outline Variant (`variant="outline"`)

**Use for:** Tertiary actions, buttons that need less visual weight

**Examples:**
- "Edit"
- "Filter"
- "Select"

**Styling:** Transparent background with border, fills on hover, subtle shadow

---

### Ghost Variant (`variant="ghost"`)

**Use for:** Subtle actions, text-like buttons, icon-only buttons

**Examples:**
- "View More"
- "Close"
- Icon-only buttons (with aria-label)

**Styling:** Transparent background, minimal styling, subtle hover background

---

### Danger Variant (`variant="danger"`)

**Use for:** Destructive actions that need warning

**Examples:**
- "Delete"
- "Remove"
- "Cancel Subscription"

**Styling:** Red gradient background, prominent shadow, hover lift effect

---

## Common Migration Patterns

### Pattern 1: Simple Button

**Before:**
```tsx
<button onClick={handleClick}>Click Me</button>
```

**After:**
```tsx
<Button onClick={handleClick}>Click Me</Button>
```

---

### Pattern 2: Styled Button with Variant

**Before:**
```tsx
<button className="btn-primary" onClick={handleSubmit}>
  Submit
</button>
```

**After:**
```tsx
<Button variant="primary" onClick={handleSubmit}>
  Submit
</Button>
```

---

### Pattern 3: Icon-Only Button

**Before:**
```tsx
<button onClick={handleClose} aria-label="Close">
  <XIcon />
</button>
```

**After:**
```tsx
<Button variant="ghost" onClick={handleClose} aria-label="Close">
  <XIcon />
</Button>
```

---

### Pattern 4: Loading Button

**Before:**
```tsx
<button onClick={handleSubmit} disabled={isLoading}>
  {isLoading ? <Spinner /> : 'Submit'}
</button>
```

**After:**
```tsx
<Button onClick={handleSubmit} isLoading={isLoading}>
  Submit
</Button>
```

---

### Pattern 5: Button with Icon and Text

**Before:**
```tsx
<button onClick={handleAdd}>
  <PlusIcon />
  <span>Add Item</span>
</button>
```

**After:**
```tsx
<Button onClick={handleAdd} iconPosition="leading">
  <PlusIcon />
  Add Item
</Button>
```

---

## Troubleshooting

### Issue: Migration tool shows low confidence

**Solution:** Manually review the button's purpose and choose the appropriate variant based on the guidelines above. Consider the button's role in the UI hierarchy.

---

### Issue: Button has complex custom styling

**Solution:** 
1. Check if the styling should become a new Button variant
2. Use the `className` prop to extend Button styles if it's a one-off case
3. Discuss with the design team for potential standardization

---

### Issue: Button has spread attributes (`{...props}`)

**Solution:** Verify that all spread props are compatible with the Button component interface. The Button component extends `ButtonHTMLAttributes<HTMLButtonElement>`, so most standard button props should work.

---

### Issue: Button functionality breaks after migration

**Solution:**
1. Verify all event handlers are preserved (`onClick`, `onSubmit`, etc.)
2. Check that the `type` prop is set correctly for form buttons
3. Ensure the button isn't disabled unintentionally
4. Verify `isLoading` state is properly managed

---

### Issue: Styling looks different after migration

**Solution:**
1. Check if custom `className` props need to be preserved
2. Verify the correct variant is selected
3. Test in both light and dark modes
4. Ensure size prop matches the original button size

---

## Button Component Features

The standardized Button component includes:

- **5 Variants**: primary, secondary, outline, ghost, danger
- **3 Sizes**: sm (48px), md (52px), lg (56px)
- **Loading State**: Built-in spinner with `isLoading` prop
- **Icon Support**: Leading or trailing icon positions
- **Icon-Only Mode**: Automatic square sizing for icon buttons
- **Accessibility**: 48px minimum touch targets, ARIA support, keyboard navigation
- **Theming**: Full light/dark mode support
- **Animations**: Smooth hover, active, and focus states

See [src/components/ui/Button.tsx](../src/components/ui/Button.tsx) for implementation details.

---

## Additional Resources

- [Component Documentation](../src/components/README.md) - Full component guide
- [Main README](../README.md) - Project overview
- [Button Component](../src/components/ui/Button.tsx) - Source code
- [Button Demos](../src/components/ui/) - Icon and loading demos

---

## Contributing

If you find issues with the audit or migration tools, or have suggestions for improvements:

1. Document the issue with specific examples
2. Propose a solution or enhancement
3. Test your changes thoroughly
4. Update this README if needed

---

## Notes

- The migration tool uses pattern matching to suggest variants based on className analysis
- Always test functionality after migration
- Preserve all accessibility attributes (`aria-*`, `role`, etc.)
- Maintain keyboard navigation support
- Test in both light and dark themes
- Verify touch targets meet 48px minimum on mobile devices
- Icon-only buttons require `aria-label` for accessibility

---

## Technical Details

### Pattern Detection

The migration tool detects button variants by analyzing:
- Class names for color/style keywords
- Background and border properties
- Text color and opacity
- Presence of icons
- Form context (submit buttons)

### Confidence Scoring

Confidence levels are determined by:
- **High**: Clear variant indicators in className
- **Medium**: Partial matches or common patterns
- **Low**: Ambiguous styling or complex custom CSS

### Preserved Props

The following props are automatically preserved during migration:
- Event handlers (`onClick`, `onSubmit`, etc.)
- Accessibility attributes (`aria-*`, `role`)
- Form attributes (`type`, `disabled`, `form`)
- Data attributes (`data-*`)
- Custom props compatible with Button interface
