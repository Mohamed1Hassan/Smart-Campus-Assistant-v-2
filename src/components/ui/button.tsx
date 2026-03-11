import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";
import { buttonHover, prefersReducedMotion } from "../../utils/animations";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg";
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      children,
      disabled,
      isLoading,
      loadingText,
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none min-h-[44px]";

    const variants = {
      default:
        "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800",
      outline:
        "border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800",
      ghost:
        "hover:bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800",
      destructive:
        "bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800",
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 px-3",
      lg: "h-11 px-8",
    };

    // Spinner size based on button size
    const spinnerSizes = {
      sm: "w-3 h-3",
      default: "w-4 h-4",
      lg: "w-5 h-5",
    };

    // Reduce motion if user prefers it
    const shouldAnimate = !prefersReducedMotion();

    return (
      <motion.button
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        ref={ref}
        variants={shouldAnimate ? buttonHover : undefined}
        initial="rest"
        whileHover={
          shouldAnimate && !disabled && !isLoading ? "hover" : undefined
        }
        whileTap={shouldAnimate && !disabled && !isLoading ? "tap" : undefined}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className={cn("animate-spin mr-2", spinnerSizes[size])} />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </motion.button>
    );
  },
);

Button.displayName = "Button";
