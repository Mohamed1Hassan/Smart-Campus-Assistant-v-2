import { NextResponse } from "next/server";
import { AppError, ErrorType } from "./errorHandler";

/**
 * Centrally handles API errors and returns appropriate NextResponse
 */
export function handleApiError(error: unknown, context: string = "API Error") {
  const err = error as Error & {
    code?: string;
    type?: string;
    context?: Record<string, unknown>;
  };
  console.error(`[${context}] Error:`, {
    message: err.message,
    code: err.code,
    type: err.type,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  if (error instanceof AppError) {
    let status = 500;

    switch (error.type) {
      case ErrorType.AUTHENTICATION:
        status = 401;
        break;
      case ErrorType.AUTHORIZATION:
        status = 403;
        break;
      case ErrorType.VALIDATION:
        status = 400;
        break;
      case ErrorType.NOT_FOUND:
        status = 404;
        break;
      case ErrorType.API:
        status =
          ((error.context as Record<string, unknown>)?.statusCode as number) ||
          500;
        break;
      default:
        status = 500;
    }

    return NextResponse.json(
      {
        success: false,
        message: error.userMessage || error.message,
        code: error.code,
      },
      { status },
    );
  }

  // Handle standard Error or unknown types
  const message = error instanceof Error ? error.message : String(error);
  const isExpired = message.includes("expired");
  const status = isExpired ? 401 : 500;

  return NextResponse.json(
    {
      success: false,
      message: message || "Internal server error",
    },
    { status },
  );
}
