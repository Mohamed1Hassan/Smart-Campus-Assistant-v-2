/**
 * Accessibility utilities for better user experience
 * Provides ARIA helpers, focus management, and keyboard navigation utilities
 */

// ARIA helpers
export const aria = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix: string = "aria") =>
    `${prefix}-${Math.random().toString(36).substr(2, 9)}`,

  // Create ARIA describedby relationship
  describedBy: (id: string) => ({ "aria-describedby": id }),

  // Create ARIA labelledby relationship
  labelledBy: (id: string) => ({ "aria-labelledby": id }),

  // Create ARIA controls relationship
  controls: (id: string) => ({ "aria-controls": id }),

  // Create ARIA owns relationship
  owns: (id: string) => ({ "aria-owns": id }),

  // Create ARIA expanded state
  expanded: (expanded: boolean) => ({ "aria-expanded": expanded }),

  // Create ARIA selected state
  selected: (selected: boolean) => ({ "aria-selected": selected }),

  // Create ARIA checked state
  checked: (checked: boolean) => ({ "aria-checked": checked }),

  // Create ARIA disabled state
  disabled: (disabled: boolean) => ({ "aria-disabled": disabled }),

  // Create ARIA hidden state
  hidden: (hidden: boolean) => ({ "aria-hidden": hidden }),

  // Create ARIA live region
  live: (polite: boolean = true) => ({
    "aria-live": polite ? "polite" : "assertive",
  }),

  // Create ARIA atomic live region
  atomic: (atomic: boolean = true) => ({ "aria-atomic": atomic }),

  // Create ARIA relevant live region
  relevant: (relevant: "additions" | "removals" | "text" | "all" = "all") => ({
    "aria-relevant": relevant,
  }),

  // Create ARIA busy state
  busy: (busy: boolean) => ({ "aria-busy": busy }),

  // Create ARIA current state
  current: (
    current: boolean | "page" | "step" | "location" | "date" | "time",
  ) => ({ "aria-current": current }),

  // Create ARIA pressed state
  pressed: (pressed: boolean | "mixed") => ({ "aria-pressed": pressed }),

  // Create ARIA invalid state
  invalid: (invalid: boolean) => ({ "aria-invalid": invalid }),

  // Create ARIA required state
  required: (required: boolean) => ({ "aria-required": required }),

  // Create ARIA readonly state
  readonly: (readonly: boolean) => ({ "aria-readonly": readonly }),

  // Create ARIA multiselectable state
  multiselectable: (multiselectable: boolean) => ({
    "aria-multiselectable": multiselectable,
  }),

  // Create ARIA sort state
  sort: (sort: "ascending" | "descending" | "none" | "other") => ({
    "aria-sort": sort,
  }),

  // Create ARIA orientation
  orientation: (orientation: "horizontal" | "vertical") => ({
    "aria-orientation": orientation,
  }),

  // Create ARIA valuemin, valuemax, valuenow
  value: (min?: number, max?: number, now?: number) => ({
    ...(min !== undefined && { "aria-valuemin": min }),
    ...(max !== undefined && { "aria-valuemax": max }),
    ...(now !== undefined && { "aria-valuenow": now }),
  }),

  // Create ARIA valuetext
  valueText: (text: string) => ({ "aria-valuetext": text }),

  // Create ARIA label
  label: (label: string) => ({ "aria-label": label }),

  // Create ARIA role
  role: (role: string) => ({ role }),

  // Create ARIA level
  level: (level: number) => ({ "aria-level": level }),

  // Create ARIA posinset
  posInSet: (pos: number) => ({ "aria-posinset": pos }),

  // Create ARIA setsize
  setSize: (size: number) => ({ "aria-setsize": size }),

  // Create ARIA flowto
  flowTo: (id: string) => ({ "aria-flowto": id }),

  // Create ARIA dropeffect
  dropEffect: (
    effect: "copy" | "move" | "link" | "execute" | "popup" | "none",
  ) => ({ "aria-dropeffect": effect }),

  // Create ARIA grabed
  grabbed: (grabbed: boolean) => ({ "aria-grabbed": grabbed }),
};

// Focus management utilities
export const focus = {
  // Focus an element
  focus: (element: HTMLElement | null) => {
    if (element) {
      element.focus();
    }
  },

  // Focus the first focusable element in a container
  focusFirst: (container: HTMLElement | null) => {
    if (!container) return;

    const focusableElements = focus.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  },

  // Focus the last focusable element in a container
  focusLast: (container: HTMLElement | null) => {
    if (!container) return;

    const focusableElements = focus.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  },

  // Focus the next focusable element
  focusNext: (currentElement: HTMLElement) => {
    const focusableElements = focus.getFocusableElements(document.body);
    const currentIndex = focusableElements.indexOf(currentElement);

    if (currentIndex !== -1 && currentIndex < focusableElements.length - 1) {
      focusableElements[currentIndex + 1].focus();
    }
  },

  // Focus the previous focusable element
  focusPrevious: (currentElement: HTMLElement) => {
    const focusableElements = focus.getFocusableElements(document.body);
    const currentIndex = focusableElements.indexOf(currentElement);

    if (currentIndex !== -1 && currentIndex > 0) {
      focusableElements[currentIndex - 1].focus();
    }
  },

  // Get all focusable elements in a container
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "a[href]",
      "area[href]",
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ];

    const elements: HTMLElement[] = [];
    focusableSelectors.forEach((selector) => {
      elements.push(
        ...(Array.from(container.querySelectorAll(selector)) as HTMLElement[]),
      );
    });

    return elements.filter((element) => {
      const style = window.getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden";
    });
  },

  // Trap focus within a container
  trapFocus: (container: HTMLElement, event: KeyboardEvent) => {
    if (event.key !== "Tab") return;

    const focusableElements = focus.getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  },

  // Restore focus to a previously focused element
  restoreFocus: (element: HTMLElement | null) => {
    if (element) {
      element.focus();
    }
  },

  // Store the currently focused element
  storeFocus: (): HTMLElement | null => {
    return document.activeElement as HTMLElement;
  },
};

// Keyboard navigation utilities
export const keyboard = {
  // Common keyboard event handlers
  onEnter: (callback: () => void) => (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      callback();
    }
  },

  onEscape: (callback: () => void) => (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      callback();
    }
  },

  onSpace: (callback: () => void) => (event: KeyboardEvent) => {
    if (event.key === " ") {
      event.preventDefault();
      callback();
    }
  },

  onArrowUp: (callback: () => void) => (event: KeyboardEvent) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      callback();
    }
  },

  onArrowDown: (callback: () => void) => (event: KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      callback();
    }
  },

  onArrowLeft: (callback: () => void) => (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      callback();
    }
  },

  onArrowRight: (callback: () => void) => (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      callback();
    }
  },

  onHome: (callback: () => void) => (event: KeyboardEvent) => {
    if (event.key === "Home") {
      event.preventDefault();
      callback();
    }
  },

  onEnd: (callback: () => void) => (event: KeyboardEvent) => {
    if (event.key === "End") {
      event.preventDefault();
      callback();
    }
  },

  onPageUp: (callback: () => void) => (event: KeyboardEvent) => {
    if (event.key === "PageUp") {
      event.preventDefault();
      callback();
    }
  },

  onPageDown: (callback: () => void) => (event: KeyboardEvent) => {
    if (event.key === "PageDown") {
      event.preventDefault();
      callback();
    }
  },

  onTab: (callback: () => void) => (event: KeyboardEvent) => {
    if (event.key === "Tab") {
      callback();
    }
  },

  // Check if a key is a navigation key
  isNavigationKey: (key: string): boolean => {
    const navigationKeys = [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
      "PageUp",
      "PageDown",
      "Tab",
      "Enter",
      "Space",
      "Escape",
    ];
    return navigationKeys.includes(key);
  },

  // Check if a key is a printable character
  isPrintableKey: (key: string): boolean => {
    return key.length === 1 && !key.match(/[\x00-\x1F\x7F]/);
  },
};

// Screen reader utilities
export const screenReader = {
  // Announce a message to screen readers
  announce: (message: string, priority: "polite" | "assertive" = "polite") => {
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  // Create a screen reader only element
  srOnly: (text: string) => <span className="sr-only">{text}</span>,

  // Create a visually hidden element
  visuallyHidden: (text: string) => (
    <span className="visually-hidden">{text}</span>
  ),
};

// Color contrast utilities
export const contrast = {
  // Calculate relative luminance
  getLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio
  getContrastRatio: (color1: string, color2: string): number => {
    const rgb1 = contrast.hexToRgb(color1);
    const rgb2 = contrast.hexToRgb(color2);

    if (!rgb1 || !rgb2) return 0;

    const lum1 = contrast.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = contrast.getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Check if contrast meets WCAG AA standards
  meetsWCAGAA: (
    color1: string,
    color2: string,
    largeText: boolean = false,
  ): boolean => {
    const ratio = contrast.getContrastRatio(color1, color2);
    return largeText ? ratio >= 3 : ratio >= 4.5;
  },

  // Check if contrast meets WCAG AAA standards
  meetsWCAGAAA: (
    color1: string,
    color2: string,
    largeText: boolean = false,
  ): boolean => {
    const ratio = contrast.getContrastRatio(color1, color2);
    return largeText ? ratio >= 4.5 : ratio >= 7;
  },

  // Convert hex color to RGB
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },
};

const accessibilityUtils = {
  aria,
  focus,
  keyboard,
  screenReader,
  contrast,
};

export default accessibilityUtils;
