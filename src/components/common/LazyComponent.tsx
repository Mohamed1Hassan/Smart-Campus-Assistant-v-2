"use client";
/**
 * LazyComponent - Higher-order component for lazy loading
 * Provides loading states, error boundaries, and retry functionality
 */

import React, {
  Suspense,
  ComponentType,
  lazy,
  useState,
  useCallback,
} from "react";
import ErrorBoundary from "../ErrorBoundary";

interface LazyComponentProps {
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  retryable?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface LazyComponentState {
  hasError: boolean;
  retryCount: number;
  isRetrying: boolean;
}

// Default loading fallback
const DefaultFallback: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
);

// Default error fallback
const DefaultErrorFallback: React.FC<{
  error?: Error;
  retry?: () => void;
  retryable?: boolean;
}> = ({ error, retry, retryable = true }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="text-red-500 mb-4">
      <svg
        className="w-12 h-12 mx-auto"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      Failed to load component
    </h3>
    <p className="text-gray-600 mb-4">
      {error?.message ||
        "An unexpected error occurred while loading this component."}
    </p>
    {retryable && retry && (
      <button
        onClick={retry}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

// Lazy component wrapper with retry functionality
const LazyComponentWrapper = <P extends object>({
  component: Component,
  props,
  fallback,
  errorFallback,
  onError,
  retryable = true,
  maxRetries = 3,
  retryDelay = 1000,
}: {
  component: ComponentType<P>;
  props?: P;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  retryable?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}) => {
  const [state, setState] = useState<LazyComponentState>({
    hasError: false,
    retryCount: 0,
    isRetrying: false,
  });

  const handleRetry = useCallback(() => {
    if (state.retryCount >= maxRetries) return;

    setState((prev) => ({
      ...prev,
      isRetrying: true,
      hasError: false,
    }));

    // Delay retry to prevent immediate retry loops
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        isRetrying: false,
        retryCount: prev.retryCount + 1,
      }));
    }, retryDelay);
  }, [state.retryCount, maxRetries, retryDelay]);

  const handleError = useCallback(
    (error: Error, errorInfo: React.ErrorInfo) => {
      setState((prev) => ({
        ...prev,
        hasError: true,
      }));

      if (onError) {
        onError(error, errorInfo);
      }
    },
    [onError],
  );

  if (state.hasError) {
    if (errorFallback) {
      if (React.isValidElement(errorFallback)) {
        return React.cloneElement(
          errorFallback as React.ReactElement<{
            error: Error;
            retry: () => void;
            retryable: boolean;
          }>,
          {
            error: new Error("Component failed to load"),
            retry: handleRetry,
            retryable: retryable && state.retryCount < maxRetries,
          },
        );
      }
      return <>{errorFallback}</>;
    }
    return (
      <DefaultErrorFallback
        error={new Error("Component failed to load")}
        retry={handleRetry}
        retryable={retryable && state.retryCount < maxRetries}
      />
    );
  }

  if (state.isRetrying) {
    return <>{fallback || <DefaultFallback />}</>;
  }

  return (
    <ErrorBoundary onError={handleError}>
      <Suspense fallback={fallback || <DefaultFallback />}>
        <Component {...(props as P)} />
      </Suspense>
    </ErrorBoundary>
  );
};

// Higher-order component for creating lazy components
export const createLazyComponent = <P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options: LazyComponentProps = {},
) => {
  const LazyComponent = lazy(importFunc);

  return React.forwardRef<HTMLElement, P>((props) => (
    <LazyComponentWrapper<P>
      component={LazyComponent}
      props={props as P}
      fallback={options.fallback}
      errorFallback={options.errorFallback}
      onError={options.onError}
      retryable={options.retryable}
      maxRetries={options.maxRetries}
      retryDelay={options.retryDelay}
    />
  ));
};

// Pre-configured lazy components for common use cases
export const LazyPage = createLazyComponent;
export const LazyModal = createLazyComponent;
export const LazyChart = createLazyComponent;
export const LazyTable = createLazyComponent;

// Hook for lazy loading with intersection observer
export const useLazyLoad = <T extends HTMLElement = HTMLDivElement>(
  options: {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
  } = {},
) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = React.useRef<T>(null);

  const { threshold = 0.1, rootMargin = "50px", triggerOnce = true } = options;

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            setHasTriggered(true);
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return {
    ref: elementRef,
    isVisible: triggerOnce ? hasTriggered || isVisible : isVisible,
  };
};

// Lazy image component with intersection observer
export const LazyImage: React.FC<{
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}> = ({ src, alt, placeholder, className, onLoad, onError }) => {
  const { ref, isVisible } = useLazyLoad();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  return (
    <div ref={ref} className={className}>
      {isVisible && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      {!isLoaded && !hasError && placeholder && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <span className="text-gray-500 text-sm">Loading...</span>
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-500 text-sm">Failed to load</span>
        </div>
      )}
    </div>
  );
};

// Lazy list component for virtual scrolling
export const LazyList = <T,>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length,
  );

  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(items.length, visibleEnd + overscan);

  const visibleItems = items.slice(startIndex, endIndex);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // NOTE: CSS custom properties are intentionally used here for performance-critical
  // virtual scrolling. These dynamic values are calculated at runtime based on
  // scroll position and item count, and are essential for efficient virtualization.
  // This is an accepted exception to the "no inline styles" rule for performance.
  // The CSS classes (virtual-container, virtual-spacer, etc.) are defined in src/index.css
  // and use these custom properties for performant virtualization.
  return (
    <div
      ref={containerRef}
      className="virtual-container"
      style={
        {
          "--container-height": `${containerHeight}px`,
        } as React.CSSProperties
      }
      onScroll={handleScroll}
    >
      <div
        className="virtual-spacer"
        style={
          {
            "--spacer-height": `${items.length * itemHeight}px`,
          } as React.CSSProperties
        }
      >
        <div
          className="virtual-wrapper"
          style={
            {
              "--wrapper-transform": `${startIndex * itemHeight}px`,
            } as React.CSSProperties
          }
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              className="virtual-item"
              style={
                {
                  "--item-height": `${itemHeight}px`,
                } as React.CSSProperties
              }
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default createLazyComponent;
