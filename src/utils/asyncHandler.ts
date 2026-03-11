import { Request, Response, NextFunction } from "express";

/**
 * Higher-order function to wrap async route handlers.
 * Catches any errors thrown during execution and passes them to the next middleware.
 * This eliminates the need for try-catch blocks in every controller method.
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
