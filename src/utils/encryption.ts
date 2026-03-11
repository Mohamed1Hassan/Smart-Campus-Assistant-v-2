import bcrypt from "bcryptjs";

// Encryption configuration interface
export interface EncryptionConfig {
  saltRounds: number;
}

/**
 * Encryption utility class for password hashing and verification
 */
export class EncryptionUtils {
  private static config: EncryptionConfig = {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || "12"),
  };

  /**
   * Hash a password using bcrypt
   * @param password - Plain text password to hash
   * @returns Promise resolving to hashed password
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      if (!password || password.trim().length === 0) {
        throw new Error("Password cannot be empty");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      const salt = await bcrypt.genSalt(this.config.saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);

      return hashedPassword;
    } catch (error) {
      throw new Error(`Password hashing failed: ${error}`);
    }
  }

  /**
   * Verify a password against its hash
   * @param password - Plain text password to verify
   * @param hashedPassword - Hashed password to compare against
   * @returns Promise resolving to true if password matches
   */
  static async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      if (!password || !hashedPassword) {
        return false;
      }

      const isMatch = await bcrypt.compare(password, hashedPassword);
      return isMatch;
    } catch (error) {
      throw new Error(`Password verification failed: ${error}`);
    }
  }

  /**
   * Generate a random salt
   * @returns Promise resolving to generated salt
   */
  static async generateSalt(): Promise<string> {
    try {
      return await bcrypt.genSalt(this.config.saltRounds);
    } catch (error) {
      throw new Error(`Salt generation failed: ${error}`);
    }
  }

  /**
   * Hash a password with a specific salt
   * @param password - Plain text password to hash
   * @param salt - Salt to use for hashing
   * @returns Promise resolving to hashed password
   */
  static async hashPasswordWithSalt(
    password: string,
    salt: string,
  ): Promise<string> {
    try {
      if (!password || !salt) {
        throw new Error("Password and salt are required");
      }

      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
    } catch (error) {
      throw new Error(`Password hashing with salt failed: ${error}`);
    }
  }

  /**
   * Check if a string is a valid bcrypt hash
   * @param hash - String to check
   * @returns True if string is a valid bcrypt hash
   */
  static isValidHash(hash: string): boolean {
    try {
      // bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters long
      const bcryptRegex = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
      return bcryptRegex.test(hash);
    } catch {
      return false;
    }
  }

  /**
   * Get the number of rounds used in a bcrypt hash
   * @param hash - bcrypt hash to analyze
   * @returns Number of rounds or null if invalid
   */
  static getRoundsFromHash(hash: string): number | null {
    try {
      if (!this.isValidHash(hash)) {
        return null;
      }

      const parts = hash.split("$");
      if (parts.length >= 3) {
        return parseInt(parts[2]);
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Update encryption configuration
   * @param config - New encryption configuration
   */
  static updateConfig(config: Partial<EncryptionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current encryption configuration
   * @returns Current encryption configuration
   */
  static getConfig(): EncryptionConfig {
    return { ...this.config };
  }

  /**
   * Generate a secure random string
   * @param length - Length of the random string
   * @returns Random string
   */
  static generateRandomString(length: number = 32): string {
    try {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let result = "";

      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      return result;
    } catch (error) {
      throw new Error(`Random string generation failed: ${error}`);
    }
  }

  /**
   * Generate a secure random token
   * @param length - Length of the token
   * @returns Random token
   */
  static generateSecureToken(length: number = 64): string {
    try {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
      let result = "";

      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      return result;
    } catch (error) {
      throw new Error(`Secure token generation failed: ${error}`);
    }
  }
}

export default EncryptionUtils;
