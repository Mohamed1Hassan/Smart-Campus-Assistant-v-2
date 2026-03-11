import { Variants } from "framer-motion";

// Check if user prefers reduced motion
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Transition constants
export const TRANSITION_FAST = {
  duration: 0.2,
  ease: [0.4, 0, 0.2, 1],
} as const;

export const TRANSITION_MEDIUM = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
} as const;

export const TRANSITION_SLOW = {
  duration: 0.5,
  ease: [0.4, 0, 0.2, 1],
} as const;

// Card elevation animation
export const cardElevated: Variants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
    transition: TRANSITION_FAST,
  },
  tap: {
    scale: 0.98,
    y: -2,
    transition: { duration: 0.1 },
  },
};

// Item fade in animation
export const itemFadeIn: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: TRANSITION_MEDIUM,
  },
};

// Button hover animation
export const buttonHover: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
    transition: TRANSITION_FAST,
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};

// Backdrop fade animation
// Supports both "hidden"/"visible" and "closed"/"open" states for compatibility
export const backdropFade: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: TRANSITION_MEDIUM,
  },
  closed: {
    opacity: 0,
  },
  open: {
    opacity: 1,
    transition: TRANSITION_MEDIUM,
  },
};

// Modal content animation
// Supports both "hidden"/"visible" and "closed"/"open" states for compatibility
export const modalContent: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: TRANSITION_MEDIUM,
  },
  closed: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  open: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: TRANSITION_MEDIUM,
  },
};

// Drawer slide in from bottom
// Supports both "hidden"/"visible" and "closed"/"open" states for compatibility
export const drawerSlideInBottom: Variants = {
  hidden: {
    opacity: 0,
    y: "100%",
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: TRANSITION_MEDIUM,
  },
  closed: {
    opacity: 0,
    y: "100%",
  },
  open: {
    opacity: 1,
    y: 0,
    transition: TRANSITION_MEDIUM,
  },
};

// Scale in animation
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: TRANSITION_MEDIUM,
  },
};

// Shake animation for validation errors
export const shake: Variants = {
  rest: {
    x: 0,
  },
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.4,
      ease: "easeInOut",
    },
  },
};

// Checkmark animation for validation success
export const checkmark: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
      duration: 0.3,
    },
  },
};

// Error X animation for validation errors
export const errorX: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
      duration: 0.3,
    },
  },
};
