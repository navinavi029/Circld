/**
 * Animation Configuration
 * 
 * Centralized animation constants for the swipe trading interface.
 * All durations are in milliseconds, all distances in pixels.
 */

export interface SpringConfig {
  type: 'spring';
  stiffness: number;
  damping: number;
  mass?: number;
}

export interface AnimationConfig {
  swipe: {
    threshold: number;
    velocityThreshold: number;
    exitDuration: number;
    springConfig: SpringConfig;
    rotationFactor: number;
  };
  entrance: {
    duration: number;
    scale: { from: number; to: number };
  };
  microInteractions: {
    buttonHover: { scale: number; duration: number };
    buttonPress: { scale: number; duration: number };
    imageFade: { duration: number };
    tipsPanelBounce: SpringConfig;
  };
  overlay: {
    threshold: number;
    maxOpacity: number;
  };
  stack: {
    scales: number[];
    offsets: number[];
    blur: number;
  };
}

export const animationConfig: AnimationConfig = {
  swipe: {
    threshold: 50, // Minimum drag distance to trigger swipe
    velocityThreshold: 0.5, // px/ms for velocity-based swipes
    exitDuration: 400, // Card exit animation duration
    springConfig: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
    rotationFactor: 0.1, // Rotation degrees per pixel dragged
  },
  entrance: {
    duration: 300, // Fade-in duration
    scale: { from: 0.95, to: 1.0 },
  },
  microInteractions: {
    buttonHover: { scale: 1.1, duration: 200 },
    buttonPress: { scale: 0.95, duration: 100 },
    imageFade: { duration: 200 },
    tipsPanelBounce: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  overlay: {
    threshold: 30, // Minimum drag distance to show overlay
    maxOpacity: 0.9,
  },
  stack: {
    scales: [1.0, 0.95, 0.90], // Scale for front, middle, back cards
    offsets: [0, 8, 16], // Vertical offset in pixels
    blur: 2, // Blur amount for stacked cards in pixels
  },
};

// Animation variants for Framer Motion
export const cardVariants = {
  initial: {
    scale: animationConfig.entrance.scale.from,
    opacity: 0,
  },
  animate: {
    scale: animationConfig.entrance.scale.to,
    opacity: 1,
    transition: {
      duration: animationConfig.entrance.duration / 1000,
    },
  },
  exit: (direction: 'left' | 'right') => ({
    x: direction === 'left' ? -500 : 500,
    opacity: 0,
    transition: {
      duration: animationConfig.swipe.exitDuration / 1000,
    },
  }),
};

export const overlayVariants = {
  hidden: { opacity: 0 },
  visible: (opacity: number) => ({
    opacity: Math.min(opacity, animationConfig.overlay.maxOpacity),
    transition: { duration: 0.1 },
  }),
};

export const buttonVariants = {
  hover: {
    scale: animationConfig.microInteractions.buttonHover.scale,
    transition: {
      duration: animationConfig.microInteractions.buttonHover.duration / 1000,
    },
  },
  tap: {
    scale: animationConfig.microInteractions.buttonPress.scale,
    transition: {
      duration: animationConfig.microInteractions.buttonPress.duration / 1000,
    },
  },
};

export const tipsPanelVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: animationConfig.microInteractions.tipsPanelBounce,
  },
};
