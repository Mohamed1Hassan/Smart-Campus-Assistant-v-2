"use client";
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useState,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
// import { scaleIn } from '../../utils/animations';

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    Tag: string;
    onClick: () => void;
  };
  persistent?: boolean;
  showProgress?: boolean; // Show progress bar
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center"; // Position
}

interface ToastState {
  toasts: Toast[];
}

type ToastAction =
  | { type: "ADD_TOAST"; payload: Toast }
  | { type: "REMOVE_TOAST"; payload: string }
  | { type: "CLEAR_TOASTS" };

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  success: (
    message: string,
    options?: Partial<Omit<Toast, "id" | "type" | "message">>,
  ) => string;
  error: (
    message: string,
    options?: Partial<Omit<Toast, "id" | "type" | "message">>,
  ) => string;
  warning: (
    message: string,
    options?: Partial<Omit<Toast, "id" | "type" | "message">>,
  ) => string;
  info: (
    message: string,
    options?: Partial<Omit<Toast, "id" | "type" | "message">>,
  ) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case "ADD_TOAST":
      // Limit to max 5 toasts visible at once
      const maxToasts = 5;
      const existingToasts = state.toasts;
      const newToasts = [...existingToasts, action.payload];
      return {
        ...state,
        toasts: newToasts.slice(-maxToasts),
      };
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.payload),
      };
    case "CLEAR_TOASTS":
      return {
        ...state,
        toasts: [],
      };
    default:
      return state;
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    };

    dispatch({ type: "ADD_TOAST", payload: newToast });

    // Auto-remove toast after duration (unless persistent)
    if (!newToast.persistent && newToast.duration) {
      setTimeout(() => {
        dispatch({ type: "REMOVE_TOAST", payload: id });
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    dispatch({ type: "REMOVE_TOAST", payload: id });
  }, []);

  const clearToasts = useCallback(() => {
    dispatch({ type: "CLEAR_TOASTS" });
  }, []);

  const success = useCallback(
    (
      message: string,
      options?: Partial<Omit<Toast, "id" | "type" | "message">>,
    ) => {
      return addToast({ type: "success", message, ...options });
    },
    [addToast],
  );

  const error = useCallback(
    (
      message: string,
      options?: Partial<Omit<Toast, "id" | "type" | "message">>,
    ) => {
      return addToast({ type: "error", message, ...options });
    },
    [addToast],
  );

  const warning = useCallback(
    (
      message: string,
      options?: Partial<Omit<Toast, "id" | "type" | "message">>,
    ) => {
      return addToast({ type: "warning", message, ...options });
    },
    [addToast],
  );

  const info = useCallback(
    (
      message: string,
      options?: Partial<Omit<Toast, "id" | "type" | "message">>,
    ) => {
      return addToast({ type: "info", message, ...options });
    },
    [addToast],
  );

  const value: ToastContextType = {
    toasts: state.toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  // Group toasts by position (default: top-right)
  const groupedToasts = toasts.reduce(
    (acc, toast) => {
      const pos = toast.position || "top-right";
      if (!acc[pos]) acc[pos] = [];
      acc[pos].push(toast);
      return acc;
    },
    {} as Record<string, Toast[]>,
  );

  // Position classes
  const getPositionClasses = (position: string) => {
    switch (position) {
      case "top-left":
        return "top-4 left-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      case "top-center":
        return "top-4 left-1/2 -translate-x-1/2";
      case "bottom-center":
        return "bottom-4 left-1/2 -translate-x-1/2";
      case "top-right":
      default:
        return "top-4 right-4";
    }
  };

  return (
    <>
      {Object.entries(groupedToasts).map(([position, positionToasts]) => (
        <div
          key={position}
          className={`fixed ${getPositionClasses(position)} z-50 space-y-2 max-w-sm w-full`}
        >
          <AnimatePresence>
            {positionToasts.map((toast) => (
              <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
          </AnimatePresence>
        </div>
      ))}
    </>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (toast.showProgress && toast.duration && !toast.persistent) {
      const startTime = Date.now();
      const totalDuration = toast.duration;
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(
          0,
          ((totalDuration - elapsed) / totalDuration) * 100,
        );
        setProgress(remaining);
      }, 50);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [toast.showProgress, toast.duration, toast.persistent]);

  const getIcon = () => {
    const iconClass = "w-5 h-5";
    switch (toast.type) {
      case "success":
        return (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
          >
            <CheckCircle className={`${iconClass} text-green-500`} />
          </motion.div>
        );
      case "error":
        return <XCircle className={`${iconClass} text-red-500`} />;
      case "warning":
        return <AlertCircle className={`${iconClass} text-yellow-500`} />;
      case "info":
        return <Info className={`${iconClass} text-blue-500`} />;
      default:
        return <Info className={`${iconClass} text-blue-500`} />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
      case "info":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      default:
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
    }
  };

  const getTextColor = () => {
    switch (toast.type) {
      case "success":
        return "text-green-800 dark:text-green-200";
      case "error":
        return "text-red-800 dark:text-red-200";
      case "warning":
        return "text-yellow-800 dark:text-yellow-200";
      case "info":
        return "text-blue-800 dark:text-blue-200";
      default:
        return "text-blue-800 dark:text-blue-200";
    }
  };

  const getProgressColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      case "info":
        return "bg-blue-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`
        ${getBackgroundColor()}
        border rounded-lg shadow-lg p-4
        backdrop-blur-sm relative overflow-hidden
      `}
    >
      <div className="flex items-start space-x-3 relative z-10">
        <div className="flex-shrink-0">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4 className={`text-sm font-semibold ${getTextColor()} mb-1`}>
              {toast.title}
            </h4>
          )}
          <p className={`text-sm ${getTextColor()}`}>{toast.message}</p>

          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className={`mt-2 text-sm font-medium ${getTextColor()} hover:underline`}
            >
              {toast.action.Tag}
            </button>
          )}
        </div>

        <button
          onClick={() => onRemove(toast.id)}
          className={`flex-shrink-0 p-1 rounded-md ${getTextColor()} hover:bg-black/10 dark:hover:bg-white/10 transition-colors`}
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      {toast.showProgress && toast.duration && !toast.persistent && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10">
          <motion.div
            className={`h-full ${getProgressColor()}`}
            initial={{ width: "100%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>
      )}
    </motion.div>
  );
}

export default ToastProvider;
