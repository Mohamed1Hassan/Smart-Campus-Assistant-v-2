import { useEffect, useRef, useCallback, useState } from "react";
import { focus } from "../utils/accessibility";

interface UseFocusManagementOptions {
  trapFocus?: boolean;
  restoreFocus?: boolean;
  initialFocus?: HTMLElement | null;
  onFocusChange?: (element: HTMLElement | null) => void;
}

export function useFocusManagement(options: UseFocusManagementOptions = {}) {
  const {
    trapFocus = false,
    restoreFocus = true,
    initialFocus = null,
    onFocusChange,
  } = options;

  const containerRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [currentFocus, setCurrentFocus] = useState<HTMLElement | null>(null);

  // Store the previously focused element
  useEffect(() => {
    if (restoreFocus) {
      previousFocusRef.current = focus.storeFocus();
    }
  }, [restoreFocus]);

  // Set initial focus
  useEffect(() => {
    const container = containerRef.current;
    if (initialFocus) {
      focus.focus(initialFocus);
      requestAnimationFrame(() => {
        setCurrentFocus(initialFocus);
      });
      onFocusChange?.(initialFocus);
    } else if (container && trapFocus) {
      focus.focusFirst(container);
      const firstElement = focus.getFocusableElements(container)[0];
      requestAnimationFrame(() => {
        setCurrentFocus(firstElement);
      });
      onFocusChange?.(firstElement);
    }
  }, [initialFocus, trapFocus, onFocusChange]);

  // Handle focus trapping
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!trapFocus || !containerRef.current) return;

      focus.trapFocus(containerRef.current, event);
    },
    [trapFocus],
  );

  // Set up focus trapping
  useEffect(() => {
    const container = containerRef.current;
    if (trapFocus && container) {
      container.addEventListener("keydown", handleKeyDown);

      return () => {
        container.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [trapFocus, handleKeyDown]);

  // Focus management functions
  const focusFirst = useCallback(() => {
    if (containerRef.current) {
      focus.focusFirst(containerRef.current);
      const firstElement = focus.getFocusableElements(containerRef.current)[0];
      setCurrentFocus(firstElement);
      onFocusChange?.(firstElement);
    }
  }, [onFocusChange]);

  const focusLast = useCallback(() => {
    if (containerRef.current) {
      focus.focusLast(containerRef.current);
      const focusableElements = focus.getFocusableElements(
        containerRef.current,
      );
      const lastElement = focusableElements[focusableElements.length - 1];
      setCurrentFocus(lastElement);
      onFocusChange?.(lastElement);
    }
  }, [onFocusChange]);

  const focusNext = useCallback(() => {
    if (currentFocus) {
      focus.focusNext(currentFocus);
      const focusableElements = focus.getFocusableElements(document.body);
      const currentIndex = focusableElements.indexOf(currentFocus);
      if (currentIndex !== -1 && currentIndex < focusableElements.length - 1) {
        const nextElement = focusableElements[currentIndex + 1];
        setCurrentFocus(nextElement);
        onFocusChange?.(nextElement);
      }
    }
  }, [onFocusChange, currentFocus]);

  const focusPrevious = useCallback(() => {
    if (currentFocus) {
      focus.focusPrevious(currentFocus);
      const focusableElements = focus.getFocusableElements(document.body);
      const currentIndex = focusableElements.indexOf(currentFocus);
      if (currentIndex !== -1 && currentIndex > 0) {
        const prevElement = focusableElements[currentIndex - 1];
        setCurrentFocus(prevElement);
        onFocusChange?.(prevElement);
      }
    }
  }, [onFocusChange, currentFocus]);

  const restorePreviousFocus = useCallback(() => {
    if (restoreFocus && previousFocusRef.current) {
      focus.restoreFocus(previousFocusRef.current);
      setCurrentFocus(previousFocusRef.current);
      onFocusChange?.(previousFocusRef.current);
    }
  }, [restoreFocus, onFocusChange]);

  const setFocus = useCallback(
    (element: HTMLElement | null) => {
      focus.focus(element);
      setCurrentFocus(element);
      onFocusChange?.(element);
    },
    [onFocusChange],
  );

  const getFocusableElements = useCallback(() => {
    if (containerRef.current) {
      return focus.getFocusableElements(containerRef.current);
    }
    return [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (restoreFocus && previousFocusRef.current) {
        focus.restoreFocus(previousFocusRef.current);
      }
    };
  }, [restoreFocus]);

  return {
    containerRef,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    restorePreviousFocus,
    setFocus,
    getFocusableElements,
    currentFocus,
  };
}

export default useFocusManagement;
