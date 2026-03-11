"use client";
import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Bug,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import {
  AppError,
  getErrorBoundaryFallback,
  reportError,
} from "../utils/errorHandler";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  showTechnicalDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
      showTechnicalDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to external service (e.g., Sentry, LogRocket, etc.)
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    reportError(error, {
      componentStack: errorInfo.componentStack || undefined,
      errorId: this.state.errorId,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
      showTechnicalDetails: false,
    });
  };

  private toggleTechnicalDetails = () => {
    this.setState((prev) => ({
      showTechnicalDetails: !prev.showTechnicalDetails,
    }));
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleFileTextBug = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Copy error details to clipboard
    navigator.clipboard
      .writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        // Create mailto link with pre-filled subject and body
        const subject = encodeURIComponent(
          `Bug Report: ${this.state.error?.message || "Unknown Error"}`,
        );
        const body = encodeURIComponent(
          `Error ID: ${this.state.errorId}\n\n` +
            `Please provide the error details that were copied to your clipboard.\n\n` +
            `URL: ${window.location.href}\n` +
            `User Agent: ${navigator.userAgent}`,
        );
        window.location.href = `mailto:support@smartcampus.edu?subject=${subject}&body=${body}`;
      })
      .catch(() => {
        // Fallback: show error ID
        alert(
          `Please report this issue to support with the following error ID: ${this.state.errorId}`,
        );
      });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Get user-friendly error information
      const errorData = this.state.error
        ? this.state.error instanceof AppError
          ? {
              title: "We encountered an issue",
              message: this.state.error.userMessage,
            }
          : getErrorBoundaryFallback(this.state.error, this.handleRetry)
        : {
            title: "Something went wrong",
            message:
              "We're sorry, but something unexpected happened. Our team has been notified.",
            actions: [] as unknown[],
            retryable: true,
          };

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {errorData.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {errorData.message}
              </p>
            </div>

            <div className="px-6 pb-6 space-y-6">
              {/* Error ID */}
              <div className="border border-orange-200 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 flex items-start gap-3">
                <Bug className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-orange-800 dark:text-orange-200">
                  <strong>Error ID:</strong> {this.state.errorId}
                </div>
              </div>

              {/* Collapsible Technical Details */}
              {(process.env.NODE_ENV === "development" ||
                this.props.showDetails) &&
                this.state.error && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={this.toggleTechnicalDetails}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">
                        Technical Details
                      </span>
                      {this.state.showTechnicalDetails ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                    </button>

                    {this.state.showTechnicalDetails && (
                      <div className="p-4 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                        <div className="space-y-3">
                          <div>
                            <strong className="text-gray-900 dark:text-white">
                              Message:
                            </strong>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                              {this.state.error.message}
                            </p>
                          </div>
                          {this.state.error.stack && (
                            <div>
                              <strong className="text-gray-900 dark:text-white">
                                Stack Trace:
                              </strong>
                              <pre className="text-xs text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap overflow-auto max-h-64 bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                                {this.state.error.stack}
                              </pre>
                            </div>
                          )}
                          {this.state.errorInfo?.componentStack && (
                            <div>
                              <strong className="text-gray-900 dark:text-white">
                                Component Stack:
                              </strong>
                              <pre className="text-xs text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap overflow-auto max-h-64 bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                                {this.state.errorInfo.componentStack}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {errorData.retryable && (
                  <button
                    onClick={this.handleRetry}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                )}

                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>

                <button
                  onClick={this.handleFileTextBug}
                  className="flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <Bug className="w-4 h-4" />
                  Report Bug
                </button>
              </div>

              {/* Help Text */}
              <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                <p>
                  If this problem persists, please contact support with the
                  error ID above.
                </p>
                <p className="mt-1">
                  We&apos;ll use this information to help fix the issue.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
