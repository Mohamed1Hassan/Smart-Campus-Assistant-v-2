"use client";
import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useResponsive } from "../../utils/responsive";
import { focus } from "../../utils/accessibility";
import {
  backdropFade,
  modalContent,
  drawerSlideInBottom,
} from "../../utils/animations";

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  preventBodyScroll?: boolean;
  focusOnOpen?: boolean;
  restoreFocusOnClose?: boolean;
}

export default function ResponsiveModal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  className = "",
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  preventBodyScroll = true,
  focusOnOpen = true,
  restoreFocusOnClose = true,
}: ResponsiveModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const { isMobile } = useResponsive();

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      if (focusOnOpen) {
        // Focus the close button or first focusable element
        setTimeout(() => {
          if (closeButtonRef.current) {
            closeButtonRef.current.focus();
          } else if (modalRef.current) {
            const focusableElements = focus.getFocusableElements(
              modalRef.current,
            );
            if (focusableElements.length > 0) {
              focusableElements[0].focus();
            } else {
              modalRef.current.focus();
            }
          }
        }, 100);
      }
    } else if (restoreFocusOnClose && previousActiveElement.current) {
      // Restore focus when modal closes
      previousActiveElement.current.focus();
    }
  }, [isOpen, focusOnOpen, restoreFocusOnClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const modalNode = modalRef.current;
      if (modalNode) {
        focus.trapFocus(modalNode, e);
      }
    };

    const modalNode = modalRef.current;
    modalNode?.addEventListener("keydown", handleKeyDown);
    return () => {
      modalNode?.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);

      if (preventBodyScroll) {
        document.body.style.overflow = "hidden";
      }
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      if (preventBodyScroll) {
        document.body.style.overflow = "unset";
      }
    };
  }, [isOpen, closeOnEscape, preventBodyScroll, onClose]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  // Get responsive modal size
  const getModalSize = () => {
    if (isMobile) {
      return "w-full h-full max-w-none max-h-none rounded-none";
    }

    switch (size) {
      case "sm":
        return "w-full max-w-sm";
      case "md":
        return "w-full max-w-md";
      case "lg":
        return "w-full max-w-2xl";
      case "xl":
        return "w-full max-w-4xl";
      case "full":
        return "w-full h-full max-w-none max-h-none rounded-none";
      default:
        return "w-full max-w-md";
    }
  };

  // Use standardized animation variants
  const backdropVariants = backdropFade;
  const modalVariants = modalContent;
  const mobileModalVariants = drawerSlideInBottom;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              ref={modalRef}
              variants={isMobile ? mobileModalVariants : modalVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className={`
                ${isMobile ? "fixed inset-x-0 bottom-0" : "relative"}
                ${getModalSize()}
                ${isMobile ? "h-[90vh]" : "max-h-[90vh]"}
                bg-white dark:bg-cardDark rounded-lg shadow-xl
                ${className}
              `}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? "modal-title" : undefined}
              aria-describedby={title ? undefined : "modal-description"}
              tabIndex={-1}
              data-focus-trap
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                  {title && (
                    <h2
                      id="modal-title"
                      className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-textDark"
                    >
                      {title}
                    </h2>
                  )}

                  {showCloseButton && (
                    <button
                      ref={closeButtonRef}
                      onClick={onClose}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
