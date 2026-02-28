/**
 * Button animation configurations for micro-interactions
 * Requirements: 7.1, 7.2
 */

/**
 * Standard button hover and press animation configuration
 * - Hover: Scale to 110% with smooth transition
 * - Press: Scale to 95% with quick transition
 */
export const buttonAnimationConfig = {
  whileHover: { scale: 1.1 },
  whileTap: { scale: 0.95 },
  transition: { duration: 0.2, ease: 'easeInOut' },
};

/**
 * Subtle button animation for smaller buttons or less prominent actions
 */
export const subtleButtonAnimationConfig = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.15, ease: 'easeInOut' },
};

/**
 * Primary action button animation with more emphasis
 */
export const primaryButtonAnimationConfig = {
  whileHover: { scale: 1.1 },
  whileTap: { scale: 0.95 },
  transition: { duration: 0.2, ease: 'easeOut' },
};
