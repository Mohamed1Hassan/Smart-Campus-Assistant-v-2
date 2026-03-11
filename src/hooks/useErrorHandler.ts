import { useState, useCallback, useRef } from "react";
import {
  AppError,
  ErrorType,
  ErrorSeverity,
  reportError,
  retryWithBackoff,
} from "../utils/errorHandler";

interface ErrorState {
  error: AppError | null;
  isRetrying: boolean;
  retryCount: number;
}

interface UseErrorHandlerOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: AppError) => void;
  onRetry?: (error: AppError, retryCount: number) => void;
  onRetrySuccess?: (error: AppError) => void;
  onRetryFailure?: (error: AppError) => void;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onRetrySuccess,
    onRetryFailure,
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleError = useCallback(
    (error: Error | AppError, context: Record<string, unknown> = {}) => {
      let appError: AppError;

      if (error instanceof AppError) {
        appError = error;
      } else {
        // Convert regular errors to AppError
        appError = new AppError(
          error.message,
          "UNKNOWN_ERROR",
          ErrorType.UNKNOWN,
          ErrorSeverity.MEDIUM,
          context,
        );
      }

      // Report error
      reportError(appError, context);

      // Update state
      setErrorState({
        error: appError,
        isRetrying: false,
        retryCount: 0,
      });

      // Call error callback
      onError?.(appError);
    },
    [onError],
  );

  const retry = useCallback(
    async (retryFn: () => Promise<unknown>) => {
      if (!errorState.error || !errorState.error.retryable) {
        return;
      }

      setErrorState((prev) => ({
        ...prev,
        isRetrying: true,
      }));

      try {
        const result = await retryWithBackoff(retryFn, maxRetries, retryDelay);

        // Success - clear error
        setErrorState({
          error: null,
          isRetrying: false,
          retryCount: 0,
        });

        onRetrySuccess?.(errorState.error);
        return result;
      } catch (error) {
        // Retry failed
        const err = error as Error;
        const newError =
          error instanceof AppError
            ? error
            : new AppError(
                err.message,
                "RETRY_FAILED",
                ErrorType.UNKNOWN,
                ErrorSeverity.HIGH,
                { originalError: errorState.error },
              );

        setErrorState((prev) => ({
          ...prev,
          error: newError,
          isRetrying: false,
          retryCount: prev.retryCount + 1,
        }));

        onRetryFailure?.(newError);
        throw newError;
      }
    },
    [errorState.error, maxRetries, retryDelay, onRetrySuccess, onRetryFailure],
  );

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isRetrying: false,
      retryCount: 0,
    });
  }, []);

  const scheduleRetry = useCallback(
    (retryFn: () => Promise<unknown>, delay: number = retryDelay) => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      retryTimeoutRef.current = setTimeout(() => {
        retry(retryFn);
      }, delay);
    },
    [retry, retryDelay],
  );

  const createAsyncHandler = useCallback(
    <T extends unknown[], R>(
      asyncFn: (...args: T) => Promise<R>,
      options: {
        onSuccess?: (result: R) => void;
        onError?: (error: AppError) => void;
        retryable?: boolean;
      } = {},
    ) => {
      return async (...args: T): Promise<R | undefined> => {
        try {
          const result = await asyncFn(...args);
          clearError();
          options.onSuccess?.(result);
          return result;
        } catch (error) {
          const err = error as Error;
          const appError =
            error instanceof AppError
              ? error
              : new AppError(
                  err.message,
                  "ASYNC_HANDLER_ERROR",
                  ErrorType.UNKNOWN,
                  ErrorSeverity.MEDIUM,
                  { args },
                );

          if (options.retryable !== false) {
            Object.assign(appError, { retryable: true });
          }

          handleError(appError);
          options.onError?.(appError);
          return undefined;
        }
      };
    },
    [handleError, clearError],
  );

  const createNetworkHandler = useCallback(
    <T extends unknown[], R>(
      asyncFn: (...args: T) => Promise<R>,
      options: {
        onSuccess?: (result: R) => void;
        onError?: (error: AppError) => void;
      } = {},
    ) => {
      return createAsyncHandler(asyncFn, {
        ...options,
        onError: (error) => {
          // Convert network errors to user-friendly messages
          if (
            error.message.includes("fetch") ||
            error.message.includes("network")
          ) {
            const networkError = new AppError(
              "Unable to connect to the server",
              "NETWORK_ERROR",
              ErrorType.NETWORK,
              ErrorSeverity.HIGH,
              error.context,
              true,
              "Please check your internet connection and try again.",
              "Check your connection",
            );
            handleError(networkError);
            options.onError?.(networkError);
          } else {
            options.onError?.(error);
          }
        },
      });
    },
    [createAsyncHandler, handleError],
  );

  const createAPIHandler = useCallback(
    <T extends unknown[], R>(
      asyncFn: (...args: T) => Promise<R>,
      options: {
        onSuccess?: (result: R) => void;
        onError?: (error: AppError) => void;
      } = {},
    ) => {
      return createAsyncHandler(asyncFn, {
        ...options,
        onError: (error) => {
          // Handle API-specific errors
          if (
            error.message.includes("401") ||
            error.message.includes("Unauthorized")
          ) {
            const authError = new AppError(
              "Your session has expired",
              "AUTH_ERROR",
              ErrorType.AUTHENTICATION,
              ErrorSeverity.HIGH,
              error.context,
              false,
              "Please log in again to continue.",
              "Log in again",
            );
            handleError(authError);
            options.onError?.(authError);
          } else if (
            error.message.includes("403") ||
            error.message.includes("Forbidden")
          ) {
            const authError = new AppError(
              "Access denied",
              "AUTHORIZATION_ERROR",
              ErrorType.AUTHORIZATION,
              ErrorSeverity.HIGH,
              error.context,
              false,
              "You do not have permission to perform this action.",
              "Contact administrator",
            );
            handleError(authError);
            options.onError?.(authError);
          } else if (
            error.message.includes("404") ||
            error.message.includes("Not Found")
          ) {
            const notFoundError = new AppError(
              "Resource not found",
              "NOT_FOUND_ERROR",
              ErrorType.NOT_FOUND,
              ErrorSeverity.MEDIUM,
              error.context,
              false,
              "The requested resource was not found.",
              "Go back",
            );
            handleError(notFoundError);
            options.onError?.(notFoundError);
          } else if (
            error.message.includes("500") ||
            error.message.includes("Internal Server Error")
          ) {
            const serverError = new AppError(
              "Server error",
              "SERVER_ERROR",
              ErrorType.SERVER,
              ErrorSeverity.HIGH,
              error.context,
              true,
              "The server encountered an error. Please try again later.",
              "Try again later",
            );
            handleError(serverError);
            options.onError?.(serverError);
          } else {
            options.onError?.(error);
          }
        },
      });
    },
    [createAsyncHandler, handleError],
  );

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, []);

  return {
    error: errorState.error,
    isRetrying: errorState.isRetrying,
    retryCount: errorState.retryCount,
    hasError: !!errorState.error,
    handleError,
    retry,
    clearError,
    scheduleRetry,
    createAsyncHandler,
    createNetworkHandler,
    createAPIHandler,
    cleanup,
  };
}

export default useErrorHandler;
