/**
 * Responsive utilities for mobile-first design
 * Provides breakpoint helpers, device detection, and responsive utilities
 */

// Breakpoint definitions matching Tailwind CSS
export const breakpoints = {
  xs: "320px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

export type Breakpoint = keyof typeof breakpoints;

// Device type detection
export const deviceTypes = {
  mobile: "mobile",
  tablet: "tablet",
  desktop: "desktop",
} as const;

export type DeviceType = (typeof deviceTypes)[keyof typeof deviceTypes];

// Screen size categories
export const screenSizes = {
  xs: { min: 0, max: 639 },
  sm: { min: 640, max: 767 },
  md: { min: 768, max: 1023 },
  lg: { min: 1024, max: 1279 },
  xl: { min: 1280, max: 1535 },
  "2xl": { min: 1536, max: Infinity },
} as const;

/**
 * Get current viewport width
 */
export const getViewportWidth = (): number => {
  if (typeof window === "undefined") return 0;
  return window.innerWidth;
};

/**
 * Get current viewport height
 */
export const getViewportHeight = (): number => {
  if (typeof window === "undefined") return 0;
  return window.innerHeight;
};

/**
 * Check if current viewport matches a breakpoint
 */
export const isBreakpoint = (breakpoint: Breakpoint): boolean => {
  const width = getViewportWidth();
  const size = screenSizes[breakpoint];
  return width >= size.min && width <= size.max;
};

/**
 * Check if current viewport is at or above a breakpoint
 */
export const isBreakpointUp = (breakpoint: Breakpoint): boolean => {
  const width = getViewportWidth();
  const size = screenSizes[breakpoint];
  return width >= size.min;
};

/**
 * Check if current viewport is below a breakpoint
 */
export const isBreakpointDown = (breakpoint: Breakpoint): boolean => {
  const width = getViewportWidth();
  const size = screenSizes[breakpoint];
  return width < size.min;
};

/**
 * Detect device type based on viewport width
 */
export const getDeviceType = (): DeviceType => {
  const width = getViewportWidth();

  if (width < 768) return deviceTypes.mobile;
  if (width < 1024) return deviceTypes.tablet;
  return deviceTypes.desktop;
};

/**
 * Check if device is mobile
 */
export const isMobile = (): boolean => {
  return getDeviceType() === deviceTypes.mobile;
};

/**
 * Check if device is tablet
 */
export const isTablet = (): boolean => {
  return getDeviceType() === deviceTypes.tablet;
};

/**
 * Check if device is desktop
 */
export const isDesktop = (): boolean => {
  return getDeviceType() === deviceTypes.desktop;
};

/**
 * Check if device is touch-enabled
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
};

/**
 * Get responsive value based on breakpoint
 */
export const getResponsiveValue = <T>(
  values: Partial<Record<Breakpoint, T>>,
  defaultValue: T,
): T => {
  const width = getViewportWidth();

  // Check breakpoints from largest to smallest
  const breakpointOrder: Breakpoint[] = ["2xl", "xl", "lg", "md", "sm", "xs"];

  for (const breakpoint of breakpointOrder) {
    if (values[breakpoint] && width >= screenSizes[breakpoint].min) {
      return values[breakpoint]!;
    }
  }

  return defaultValue;
};

/**
 * Get responsive grid columns based on device type
 */
export const getResponsiveGridCols = (): number => {
  const deviceType = getDeviceType();

  switch (deviceType) {
    case deviceTypes.mobile:
      return 1;
    case deviceTypes.tablet:
      return 2;
    case deviceTypes.desktop:
      return 3;
    default:
      return 1;
  }
};

/**
 * Get responsive spacing based on device type
 */
export const getResponsiveSpacing = (): {
  padding: string;
  margin: string;
  gap: string;
} => {
  const deviceType = getDeviceType();

  switch (deviceType) {
    case deviceTypes.mobile:
      return {
        padding: "p-4",
        margin: "m-2",
        gap: "gap-4",
      };
    case deviceTypes.tablet:
      return {
        padding: "p-6",
        margin: "m-4",
        gap: "gap-6",
      };
    case deviceTypes.desktop:
      return {
        padding: "p-8",
        margin: "m-6",
        gap: "gap-8",
      };
    default:
      return {
        padding: "p-4",
        margin: "m-2",
        gap: "gap-4",
      };
  }
};

/**
 * Get responsive text size based on device type
 */
export const getResponsiveTextSize = (): {
  heading: string;
  body: string;
  small: string;
} => {
  const deviceType = getDeviceType();

  switch (deviceType) {
    case deviceTypes.mobile:
      return {
        heading: "text-2xl",
        body: "text-base",
        small: "text-sm",
      };
    case deviceTypes.tablet:
      return {
        heading: "text-3xl",
        body: "text-lg",
        small: "text-base",
      };
    case deviceTypes.desktop:
      return {
        heading: "text-4xl",
        body: "text-xl",
        small: "text-lg",
      };
    default:
      return {
        heading: "text-2xl",
        body: "text-base",
        small: "text-sm",
      };
  }
};

/**
 * Get responsive modal size
 */
export const getResponsiveModalSize = (): string => {
  const deviceType = getDeviceType();

  switch (deviceType) {
    case deviceTypes.mobile:
      return "w-full h-full max-w-none max-h-none rounded-none";
    case deviceTypes.tablet:
      return "w-11/12 max-w-2xl h-auto max-h-[90vh] rounded-lg";
    case deviceTypes.desktop:
      return "w-11/12 max-w-4xl h-auto max-h-[90vh] rounded-lg";
    default:
      return "w-full h-full max-w-none max-h-none rounded-none";
  }
};

/**
 * Get responsive table layout
 */
export const getResponsiveTableLayout = (): {
  container: string;
  table: string;
  wrapper: string;
} => {
  const deviceType = getDeviceType();

  switch (deviceType) {
    case deviceTypes.mobile:
      return {
        container: "overflow-x-auto -mx-4 px-4",
        table: "min-w-full",
        wrapper: "block space-y-4",
      };
    case deviceTypes.tablet:
      return {
        container: "overflow-x-auto",
        table: "min-w-full",
        wrapper: "block space-y-4",
      };
    case deviceTypes.desktop:
      return {
        container: "",
        table: "w-full",
        wrapper: "table",
      };
    default:
      return {
        container: "overflow-x-auto -mx-4 px-4",
        table: "min-w-full",
        wrapper: "block space-y-4",
      };
  }
};

/**
 * Get responsive navigation layout
 */
export const getResponsiveNavigationLayout = (): {
  type: "sidebar" | "drawer" | "top";
  position: string;
  width: string;
} => {
  const deviceType = getDeviceType();

  switch (deviceType) {
    case deviceTypes.mobile:
      return {
        type: "drawer",
        position: "fixed inset-y-0 left-0 z-50",
        width: "w-64",
      };
    case deviceTypes.tablet:
      return {
        type: "drawer",
        position: "fixed inset-y-0 left-0 z-50",
        width: "w-64",
      };
    case deviceTypes.desktop:
      return {
        type: "sidebar",
        position: "relative",
        width: "w-64",
      };
    default:
      return {
        type: "drawer",
        position: "fixed inset-y-0 left-0 z-50",
        width: "w-64",
      };
  }
};

// Import React hooks (placed here to avoid circular type issues)
import { useState, useEffect } from "react";

/**
 * Hook for responsive values
 *
 * IMPORTANT for Next.js:
 * - We avoid reading window size during the initial render so that
 *   server-rendered HTML matches the first client render (no hydration mismatch).
 * - Actual viewport-based values are applied after mount via useEffect.
 */
export const useResponsive = () => {
  // Use a stable default that is the same on server and first client render
  const [deviceType, setDeviceType] = useState<DeviceType>(deviceTypes.desktop);

  useEffect(() => {
    const handleResize = () => {
      // Now it's safe to read from window in the browser
      setDeviceType(getDeviceType());
    };

    // Initialize on mount
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = deviceType === deviceTypes.mobile;
  const isTablet = deviceType === deviceTypes.tablet;
  const isDesktop = deviceType === deviceTypes.desktop;

  return {
    // We no longer track raw viewport width during SSR to keep markup stable
    viewportWidth: null as number | null,
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    // Keep touch / breakpoint helpers simple and SSR-safe
    isTouchDevice: false,
    breakpoint: {
      isXs: false,
      isSm: false,
      isMd: false,
      isLg: false,
      isXl: false,
      is2Xl: false,
    },
    // Expose helpers for future use; they rely on runtime viewport when called
    getResponsiveValue,
    getResponsiveGridCols,
    getResponsiveSpacing,
    getResponsiveTextSize,
    getResponsiveModalSize,
    getResponsiveTableLayout,
    getResponsiveNavigationLayout,
  };
};
