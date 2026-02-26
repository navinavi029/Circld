/**
 * Central design system for consistent styling across all pages
 * Exports style tokens, utility functions, and common patterns
 */

// ─── Typography ───────────────────────────────────────────────────────────

export const typography = {
  // Page titles with gradient
  pageTitle: {
    base: 'text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight',
    gradient: 'bg-gradient-to-r from-primary via-accent to-primary-dark bg-clip-text text-transparent dark:from-primary-light dark:via-accent-light dark:to-primary',
    combined: 'text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-accent to-primary-dark bg-clip-text text-transparent dark:from-primary-light dark:via-accent-light dark:to-primary leading-tight pb-0.5',
  },
  
  // Subtitles and descriptions
  subtitle: 'text-sm sm:text-base text-text-secondary dark:text-gray-400 font-medium',
  subtitleSmall: 'text-xs sm:text-sm text-text-secondary dark:text-gray-400',
  
  // Section headings
  sectionHeading: 'text-xl sm:text-2xl font-bold text-text dark:text-gray-100',
  sectionSubheading: 'text-lg sm:text-xl font-semibold text-text dark:text-gray-100',
  
  // Body text
  body: 'text-sm sm:text-base text-text dark:text-gray-200',
  bodySmall: 'text-xs sm:text-sm text-text dark:text-gray-300',
} as const;

// ─── Backgrounds ──────────────────────────────────────────────────────────

export const backgrounds = {
  // Page background gradient - refined for better contrast
  page: 'bg-gradient-to-br from-gray-50 via-white to-primary/5 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900',
  
  // Alternative page background with subtle color
  pageAlt: 'bg-gradient-to-br from-primary/8 via-background to-accent/8 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900',
  
  // Neutral background
  pageNeutral: 'bg-background dark:bg-gray-950',
  
  // Minimum height for full-page layouts
  minHeight: 'min-h-screen',
} as const;

// ─── Cards and Containers ─────────────────────────────────────────────────

export const containers = {
  // Standard card with refined glass effect
  card: 'bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-xl shadow-black/5 dark:shadow-black/20',
  
  // Card with stronger glass effect
  cardGlass: 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-2xl shadow-black/10 dark:shadow-black/30',
  
  // Elevated card with hover effect
  cardElevated: 'bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl hover:shadow-primary/10 dark:hover:shadow-primary/20 transition-all duration-300',
  
  // Subtle card
  cardSubtle: 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200/40 dark:border-gray-700/40 shadow-sm',
  
  // Container max widths
  maxWidth: {
    xs: 'max-w-2xl',
    sm: 'max-w-4xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
  },
  
  // Standard padding
  padding: 'p-4 sm:p-6',
  paddingLarge: 'p-6 sm:p-8',
  paddingXL: 'p-8 sm:p-10',
} as const;

// ─── Buttons ──────────────────────────────────────────────────────────────

export const buttons = {
  // Primary button gradient - refined for better visual hierarchy
  primary: 'bg-gradient-to-r from-primary to-primary-dark dark:from-primary-light dark:to-primary hover:shadow-xl hover:shadow-primary/30 dark:hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5',
  
  // Primary button with stronger gradient
  primaryStrong: '!bg-gradient-to-r !from-primary !to-primary-dark dark:!from-primary-light dark:!to-primary hover:shadow-xl hover:shadow-primary/30 dark:hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5',
  
  // Secondary button
  secondary: 'bg-gradient-to-r from-accent to-accent-dark dark:from-accent-light dark:to-accent hover:shadow-xl hover:shadow-accent/30 dark:hover:shadow-accent/40 transition-all duration-300 hover:-translate-y-0.5',
  
  // Outline button
  outline: 'border-2 border-primary dark:border-primary-light hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-300',
  
  // Ghost button
  ghost: 'hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-300',
} as const;

// ─── Spacing and Layout ───────────────────────────────────────────────────

export const spacing = {
  // Page container
  pageContainer: 'container mx-auto px-4 sm:px-6 py-6 sm:py-8',
  pageContainerLarge: 'container mx-auto px-4 sm:px-6 py-8 sm:py-12',
  pageContainerXL: 'container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16',
  
  // Section spacing
  sectionGap: 'space-y-4 sm:space-y-6',
  sectionGapLarge: 'space-y-6 sm:space-y-8',
  sectionGapXL: 'space-y-8 sm:space-y-12',
  
  // Grid gaps
  gridGap: 'gap-3 sm:gap-4',
  gridGapLarge: 'gap-4 sm:gap-6',
  gridGapXL: 'gap-6 sm:gap-8',
} as const;

// ─── Animations and Transitions ──────────────────────────────────────────

export const animations = {
  // Hover transitions
  hoverTransform: 'hover:-translate-y-1 transition-all duration-300 ease-out',
  hoverTransformSubtle: 'hover:-translate-y-0.5 transition-all duration-200 ease-out',
  hoverShadow: 'hover:shadow-2xl hover:shadow-primary/10 dark:hover:shadow-primary/20 transition-all duration-300',
  hoverScale: 'hover:scale-105 transition-transform duration-300 ease-out',
  hoverScaleSubtle: 'hover:scale-[1.02] transition-transform duration-200 ease-out',
  
  // Standard transitions
  transition: 'transition-all duration-300 ease-out',
  transitionFast: 'transition-all duration-200 ease-out',
  transitionColors: 'transition-colors duration-200 ease-out',
  
  // Interactive states
  activeScale: 'active:scale-95 transition-transform duration-100',
} as const;

// ─── Utility Functions ────────────────────────────────────────────────────

/**
 * Combines page title classes
 * @returns Complete className string for page titles
 */
export function getPageTitleClasses(): string {
  return typography.pageTitle.combined;
}

/**
 * Combines page background classes
 * @param includeMinHeight - Whether to include min-h-screen
 * @returns Complete className string for page backgrounds
 */
export function getPageBackgroundClasses(includeMinHeight = true): string {
  return includeMinHeight 
    ? `${backgrounds.page} ${backgrounds.minHeight}`
    : backgrounds.page;
}

/**
 * Combines card classes with optional size
 * @param variant - 'standard', 'glass', 'elevated', or 'subtle'
 * @param padding - 'normal', 'large', or 'xl'
 * @returns Complete className string for cards
 */
export function getCardClasses(
  variant: 'standard' | 'glass' | 'elevated' | 'subtle' = 'standard',
  padding: 'normal' | 'large' | 'xl' = 'normal'
): string {
  const variantMap = {
    standard: containers.card,
    glass: containers.cardGlass,
    elevated: containers.cardElevated,
    subtle: containers.cardSubtle,
  };
  const paddingMap = {
    normal: containers.padding,
    large: containers.paddingLarge,
    xl: containers.paddingXL,
  };
  return `${variantMap[variant]} ${paddingMap[padding]}`;
}

/**
 * Combines page container classes with max width
 * @param maxWidth - 'xs', 'sm', 'md', 'lg', or 'xl'
 * @param paddingSize - 'normal', 'large', or 'xl'
 * @returns Complete className string for page containers
 */
export function getPageContainerClasses(
  maxWidth: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'lg',
  paddingSize: 'normal' | 'large' | 'xl' = 'normal'
): string {
  const paddingMap = {
    normal: spacing.pageContainer,
    large: spacing.pageContainerLarge,
    xl: spacing.pageContainerXL,
  };
  return `${paddingMap[paddingSize]} ${containers.maxWidth[maxWidth]}`;
}

/**
 * Combines primary button classes
 * @param useImportant - Whether to use !important flags (for overriding component styles)
 * @returns Complete className string for primary buttons
 */
export function getPrimaryButtonClasses(useImportant = false): string {
  return useImportant ? buttons.primaryStrong : buttons.primary;
}

/**
 * Get section heading classes
 * @param size - 'normal' or 'large'
 * @returns Complete className string for section headings
 */
export function getSectionHeadingClasses(size: 'normal' | 'large' = 'normal'): string {
  return size === 'large' ? typography.sectionHeading : typography.sectionSubheading;
}

/**
 * Get hover animation classes
 * @param type - 'transform', 'shadow', 'scale', or 'all'
 * @param intensity - 'subtle' or 'normal'
 * @returns Complete className string for hover animations
 */
export function getHoverClasses(
  type: 'transform' | 'shadow' | 'scale' | 'all' = 'all',
  intensity: 'subtle' | 'normal' = 'normal'
): string {
  const classes: string[] = [];
  
  if (type === 'transform' || type === 'all') {
    classes.push(intensity === 'subtle' ? animations.hoverTransformSubtle : animations.hoverTransform);
  }
  if (type === 'shadow' || type === 'all') {
    classes.push(animations.hoverShadow);
  }
  if (type === 'scale') {
    classes.push(intensity === 'subtle' ? animations.hoverScaleSubtle : animations.hoverScale);
  }
  
  return classes.join(' ');
}

/**
 * Get spacing classes for sections
 * @param size - 'normal', 'large', or 'xl'
 * @returns Complete className string for section spacing
 */
export function getSectionSpacingClasses(size: 'normal' | 'large' | 'xl' = 'normal'): string {
  const spacingMap = {
    normal: spacing.sectionGap,
    large: spacing.sectionGapLarge,
    xl: spacing.sectionGapXL,
  };
  return spacingMap[size];
}

/**
 * Get grid gap classes
 * @param size - 'normal', 'large', or 'xl'
 * @returns Complete className string for grid gaps
 */
export function getGridGapClasses(size: 'normal' | 'large' | 'xl' = 'normal'): string {
  const gapMap = {
    normal: spacing.gridGap,
    large: spacing.gridGapLarge,
    xl: spacing.gridGapXL,
  };
  return gapMap[size];
}

// ─── Type Exports ─────────────────────────────────────────────────────────

export type TypographyKey = keyof typeof typography;
export type BackgroundKey = keyof typeof backgrounds;
export type ContainerKey = keyof typeof containers;
export type ButtonKey = keyof typeof buttons;
export type SpacingKey = keyof typeof spacing;
export type AnimationKey = keyof typeof animations;
