/**
 * Code Splitting Utilities
 * Advanced code splitting strategies for optimal bundle loading
 */

import React, { ComponentType, lazy } from "react";
import { createLazyComponent } from "../components/common/LazyComponent";

// Route-based code splitting
export const createLazyRoute = <P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options: {
    fallback?: React.ReactNode;
    preload?: boolean;
    chunkName?: string;
  } = {},
) => {
  const LazyComponent = lazy(importFunc);

  // Preload the component if requested
  if (options.preload) {
    importFunc().catch(() => {
      // Ignore preload errors
    });
  }

  return LazyComponent;
};

// Feature-based code splitting
export const createFeatureModule = <P extends object>(
  featureName: string,
  importFunc: () => Promise<{ default: ComponentType<P> }>,
) => {
  return createLazyComponent(importFunc, {
    fallback: React.createElement(
      "div",
      { className: "flex items-center justify-center p-8" },
      React.createElement("div", {
        className:
          "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600",
      }),
      React.createElement(
        "span",
        { className: "ml-2 text-gray-600" },
        `Loading ${featureName}...`,
      ),
    ),
    errorFallback: React.createElement(
      "div",
      {
        className: "flex flex-col items-center justify-center p-8 text-center",
      },
      React.createElement(
        "div",
        { className: "text-red-500 mb-4" },
        React.createElement(
          "svg",
          {
            className: "w-12 h-12 mx-auto",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
          },
          React.createElement("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z",
          }),
        ),
      ),
      React.createElement(
        "h3",
        { className: "text-lg font-medium text-gray-900 mb-2" },
        `Failed to load ${featureName}`,
      ),
      React.createElement(
        "p",
        { className: "text-gray-600" },
        "Please refresh the page and try again.",
      ),
    ),
  });
};

// Component-based code splitting
export const createLazyComponentWithPreload = <P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  preloadTrigger?: () => boolean,
) => {
  const LazyComponent = lazy(importFunc);

  // Preload when trigger condition is met
  if (preloadTrigger) {
    const checkPreload = () => {
      if (preloadTrigger()) {
        importFunc().catch(() => {
          // Ignore preload errors
        });
      }
    };

    // Check on mount and periodically
    setTimeout(checkPreload, 1000);
    setInterval(checkPreload, 5000);
  }

  return LazyComponent;
};

// Library-based code splitting
export const createLazyLibrary = <T>(
  libraryName: string,
  importFunc: () => Promise<T>,
) => {
  let libraryPromise: Promise<T> | null = null;
  let library: T | null = null;

  const loadLibrary = async (): Promise<T> => {
    if (library) return library;
    if (libraryPromise) return libraryPromise;

    libraryPromise = importFunc().then((loadedLibrary) => {
      library = loadedLibrary;
      return loadedLibrary;
    });

    return libraryPromise;
  };

  return {
    load: loadLibrary,
    isLoaded: () => library !== null,
    getLibrary: () => library,
  };
};

// Dynamic imports with error handling
export const safeImport = async <T>(
  importFunc: () => Promise<T>,
  fallback?: T,
): Promise<T | null> => {
  try {
    return await importFunc();
  } catch (error) {
    console.error("Failed to import module:", error);
    return fallback || null;
  }
};

// Bundle analyzer for development
export const analyzeBundle = () => {
  if (process.env.NODE_ENV === "development") {
    import("webpack-bundle-analyzer").then(() => {
      console.log(
        "Bundle analyzer available. Use webpack-bundle-analyzer to analyze your bundle.",
      );
    });
  }
};

// Preload strategies
export const preloadStrategies = {
  // Preload on hover
  onHover: (importFunc: () => Promise<unknown>) => {
    let preloaded = false;
    return {
      onMouseEnter: () => {
        if (!preloaded) {
          preloaded = true;
          importFunc().catch(() => {
            // Ignore preload errors
          });
        }
      },
    };
  },

  // Preload on focus
  onFocus: (importFunc: () => Promise<unknown>) => {
    let preloaded = false;
    return {
      onFocus: () => {
        if (!preloaded) {
          preloaded = true;
          importFunc().catch(() => {
            // Ignore preload errors
          });
        }
      },
    };
  },

  // Preload on intersection
  onIntersection: (
    importFunc: () => Promise<unknown>,
    options: IntersectionObserverInit = {},
  ) => {
    let preloaded = false;
    return {
      ref: (element: HTMLElement | null) => {
        if (element && !preloaded) {
          const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
              preloaded = true;
              importFunc().catch(() => {
                // Ignore preload errors
              });
              observer.disconnect();
            }
          }, options);
          observer.observe(element);
        }
      },
    };
  },

  // Preload after delay
  afterDelay: (importFunc: () => Promise<unknown>, delay: number = 2000) => {
    setTimeout(() => {
      importFunc().catch(() => {
        // Ignore preload errors
      });
    }, delay);
  },
};

// Route preloading
export const preloadRoute = (routePath: string) => {
  // This would typically integrate with your router
  // For React Router, you might do:
  // import(`../pages${routePath}`).catch(() => {});
  console.log(`Preloading route: ${routePath}`);
};

// Critical path optimization
export const optimizeCriticalPath = {
  // Preload critical resources
  preloadCritical: () => {
    // Preload critical CSS
    const criticalCSS = document.createElement("link");
    criticalCSS.rel = "preload";
    criticalCSS.as = "style";
    criticalCSS.href = "/critical.css";
    document.head.appendChild(criticalCSS);

    // Preload critical fonts
    const criticalFont = document.createElement("link");
    criticalFont.rel = "preload";
    criticalFont.as = "font";
    criticalFont.type = "font/woff2";
    criticalFont.href = "/fonts/critical.woff2";
    criticalFont.crossOrigin = "anonymous";
    document.head.appendChild(criticalFont);
  },

  // Defer non-critical resources
  deferNonCritical: () => {
    // Defer non-critical CSS
    const nonCriticalCSS = document.querySelectorAll(
      'link[rel="stylesheet"]:not([data-critical])',
    );
    nonCriticalCSS.forEach((el) => {
      const link = el as HTMLLinkElement;
      link.setAttribute("media", "print");
      link.onload = () => {
        link.setAttribute("media", "all");
      };
    });

    // Defer non-critical JavaScript
    const nonCriticalJS = document.querySelectorAll("script[data-defer]");
    nonCriticalJS.forEach((script) => {
      script.setAttribute("defer", "");
    });
  },
};

// Bundle splitting configuration
export const bundleSplitting = {
  // Split vendor libraries
  vendor: {
    test: /[\\/]node_modules[\\/]/,
    name: "vendors",
    chunks: "all",
  },

  // Split common chunks
  common: {
    name: "common",
    minChunks: 2,
    chunks: "all",
    enforce: true,
  },

  // Split async chunks
  async: {
    chunks: "async",
    minSize: 20000,
    maxSize: 244000,
    cacheGroups: {
      default: {
        minChunks: 2,
        priority: -20,
        reuseExistingChunk: true,
      },
    },
  },
};

// Performance monitoring for code splitting
export const monitorCodeSplitting = {
  // Track chunk loading times
  trackChunkLoad: (chunkName: string, startTime: number) => {
    const loadTime = performance.now() - startTime;
    console.log(`Chunk ${chunkName} loaded in ${loadTime.toFixed(2)}ms`);

    // Send to analytics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== "undefined" && (window as any).gtag) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).gtag("event", "chunk_load", {
        chunk_name: chunkName,
        load_time: loadTime,
      });
    }
  },

  // Track failed chunk loads
  trackChunkError: (chunkName: string, error: Error) => {
    console.error(`Failed to load chunk ${chunkName}:`, error);

    // Send to error tracking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== "undefined" && (window as any).Sentry) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).Sentry.captureException(error, {
        tags: {
          chunk: chunkName,
          type: "chunk_load_error",
        },
      });
    }
  },
};

// Export all utilities
const codeSplittingUtils = {
  createLazyRoute,
  createFeatureModule,
  createLazyComponentWithPreload,
  createLazyLibrary,
  safeImport,
  analyzeBundle,
  preloadStrategies,
  preloadRoute,
  optimizeCriticalPath,
  bundleSplitting,
  monitorCodeSplitting,
};

export default codeSplittingUtils;
