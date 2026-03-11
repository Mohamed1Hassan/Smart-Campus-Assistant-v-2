import jwt from "jsonwebtoken";
import { AppError, ErrorType, ErrorSeverity } from "./errorHandler";
// Try to use process.env instead, since config/environment.js doesn't seem to exist or types don't match.
const envConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || "default-secret-key-change-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
};

// JWT configuration interface
export interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: "student" | "professor" | "admin";
  iat?: number;
  exp?: number;
}

// JWT refresh payload interface
export interface JWTRefreshPayload {
  userId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

/**
 * JWT utility class for token generation and verification
 */
export class JWTUtils {
  private static config: JWTConfig = {
    secret: envConfig.jwt.secret,
    expiresIn: envConfig.jwt.expiresIn,
    refreshExpiresIn: envConfig.jwt.refreshExpiresIn,
  };

  /**
   * Generate access token
   * @param payload - User data to include in token
   * @returns JWT access token
   */
  static generateAccessToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
    try {
      return jwt.sign(payload, this.config.secret, {
        expiresIn: this.config.expiresIn as jwt.SignOptions["expiresIn"],
        issuer: "smart-campus-assistant",
        audience: "smart-campus-users",
      });
    } catch (error) {
      throw new Error(`Failed to generate access token: ${error}`);
    }
  }

  /**
   * Generate refresh token
   * @param payload - User data to include in refresh token
   * @returns JWT refresh token
   */
  static generateRefreshToken(
    payload: Omit<JWTRefreshPayload, "iat" | "exp">,
  ): string {
    try {
      return jwt.sign(payload, this.config.secret, {
        expiresIn: this.config.refreshExpiresIn as jwt.SignOptions["expiresIn"],
        issuer: "smart-campus-assistant",
        audience: "smart-campus-users",
      });
    } catch (error) {
      throw new Error(`Failed to generate refresh token: ${error}`);
    }
  }

  /**
   * Verify access token
   * @param token - JWT access token to verify
   * @returns Decoded token payload
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.config.secret, {
        issuer: "smart-campus-assistant",
        audience: "smart-campus-users",
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(
          "Access token has expired",
          "TOKEN_EXPIRED",
          ErrorType.AUTHENTICATION,
          ErrorSeverity.HIGH,
          { isAccessToken: true },
          false,
          "Your session has expired. Please log in again.",
        );
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError(
          "Invalid access token",
          "INVALID_TOKEN",
          ErrorType.AUTHENTICATION,
          ErrorSeverity.HIGH,
          {},
          false,
          "Your authentication token is invalid.",
        );
      } else {
        throw new AppError(
          `Token verification failed: ${error}`,
          "TOKEN_VERIFICATION_FAILED",
          ErrorType.AUTHENTICATION,
          ErrorSeverity.HIGH,
        );
      }
    }
  }

  /**
   * Verify refresh token
   * @param token - JWT refresh token to verify
   * @returns Decoded refresh token payload
   */
  static verifyRefreshToken(token: string): JWTRefreshPayload {
    try {
      const decoded = jwt.verify(token, this.config.secret, {
        issuer: "smart-campus-assistant",
        audience: "smart-campus-users",
      }) as JWTRefreshPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Refresh token has expired");
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid refresh token");
      } else {
        console.error(`[JWTUtils] Refresh token verification failed: ${error}`);
        throw new Error(`Refresh token verification failed: ${error}`);
      }
    }
  }

  /**
   * Decode token without verification (for debugging)
   * @param token - JWT token to decode
   * @returns Decoded token payload
   */
  static decodeToken(token: string): JWTPayload | JWTRefreshPayload | null {
    try {
      return jwt.decode(token) as JWTPayload | JWTRefreshPayload | null;
    } catch (error) {
      throw new Error(`Failed to decode token: ${error}`);
    }
  }

  /**
   * Check if token is expired
   * @param token - JWT token to check
   * @returns True if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return (decoded as { exp: number }).exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Get token expiration time
   * @param token - JWT token
   * @returns Expiration timestamp or null
   */
  static getTokenExpiration(token: string): number | null {
    try {
      const decoded = this.decodeToken(token);
      return (decoded as { exp?: number })?.exp || null;
    } catch {
      return null;
    }
  }

  /**
   * Update JWT configuration
   * @param config - New JWT configuration
   */
  static updateConfig(config: Partial<JWTConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current JWT configuration
   * @returns Current JWT configuration
   */
  static getConfig(): JWTConfig {
    return { ...this.config };
  }
}

export default JWTUtils;
