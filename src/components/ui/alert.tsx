import React from "react";
import { cn } from "../../utils/cn";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn("relative w-full rounded-lg border p-4", className)}
      {...props}
    >
      {children}
    </div>
  ),
);
Alert.displayName = "Alert";

export const AlertDescription = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    >
      {children}
    </div>
  ),
);
AlertDescription.displayName = "AlertDescription";
