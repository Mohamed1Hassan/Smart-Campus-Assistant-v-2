import { JWTUtils } from "../utils/jwt";
import type { JWTPayload, JWTRefreshPayload } from "../utils/jwt";
import { EncryptionUtils } from "../utils/encryption";
import prisma from "../lib/db";

// User interface for authentication
export interface User {
  id: string;
  universityId: string;
  name: string;
  email: string;
  password: string;
  role: "student" | "professor" | "admin";
  firstName: string;
  lastName: string;
  isActive: boolean;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

// Login request interface
export interface LoginRequest {
  universityId: string;
  password: string;
}

// Register request interface
export interface RegisterRequest {
  universityId: string;
  email?: string;
  password: string;
  role: "student" | "professor" | "admin";
  firstName: string;
  lastName: string;
  name?: string; // Optional - will be constructed from firstName + lastName if not provided
  major?: string;
  level?: number;
}

// Auth response interface
export interface AuthResponse {
  user: Omit<User, "password" | "tokenVersion">;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Refresh token request interface
export interface RefreshTokenRequest {
  refreshToken: string;
}

// Change password request interface
export interface ChangePasswordRequest {
  userId: string | number;
  currentPassword: string;
  newPassword: string;
}

class AuthService {
  private static prisma = prisma;

  /**
   * Register a new user
   * @param registerData - User registration data
   * @returns Authentication response with tokens
   */
  static async register(registerData: RegisterRequest): Promise<AuthResponse> {
    try {
      // Validate input
      this.validateRegisterData(registerData);

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { universityId: registerData.universityId },
      });

      if (existingUser) {
        throw new Error("User with this University ID already exists");
      }

      // Handle optional email - generate a deterministic placeholder if not provided
      const finalEmail = registerData.email
        ? registerData.email.toLowerCase()
        : `${registerData.universityId}@campus.local`;

      // Check if the final email (either provided or generated) already exists
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: finalEmail },
      });

      if (existingEmail) {
        throw new Error("User with this email already exists");
      }

      // Hash password
      const hashedPassword = await EncryptionUtils.hashPassword(
        registerData.password,
      );

      // Prepare user data
      const firstName = registerData.firstName;
      const lastName = registerData.lastName;
      const fullName = registerData.name || `${firstName} ${lastName}`;
      const roleUpper = registerData.role.toUpperCase() as
        | "STUDENT"
        | "PROFESSOR"
        | "ADMIN";
      const userData = {
        name: fullName.trim(), // Final trim and ensure it's a string
        universityId: registerData.universityId,
        email: finalEmail,
        password: hashedPassword,
        role: roleUpper, // Must match UserRole enum: STUDENT, PROFESSOR, or ADMIN
        firstName: firstName.trim(), // Final trim
        lastName: lastName.trim(), // Final trim
        major: registerData.major,
        level: registerData.level,
      };

      console.log("[AuthService] Creating user with data:", {
        ...userData,
        password: "***",
        nameLength: userData.name.length,
        firstNameLength: userData.firstName.length,
        lastNameLength: userData.lastName.length,
      });

      // Validate all required fields before database call
      if (!userData.name || userData.name.length === 0) {
        throw new Error(
          `Name is required but was empty. fullName: "${fullName}", firstName: "${firstName}", lastName: "${lastName}"`,
        );
      }

      const user = await this.prisma.user.create({
        data: userData,
      });

      // Auto-enroll student in courses based on major and level
      if (user.role === "STUDENT" && userData.major && userData.level) {
        console.log(
          `[AuthService] Auto-enrolling student ${user.id} in ${userData.major} Level ${userData.level} courses`,
        );

        try {
          const coursesToEnroll = await this.prisma.course.findMany({
            where: {
              major: userData.major,
              level: userData.level,
              isActive: true,
            },
          });

          console.log(
            `[AuthService] Found ${coursesToEnroll.length} courses for auto-enrollment`,
          );

          if (coursesToEnroll.length > 0) {
            const enrollmentPromises = coursesToEnroll.map((course) =>
              this.prisma.courseEnrollment.create({
                data: {
                  studentId: user.id,
                  courseId: course.id,
                  status: "ACTIVE",
                },
              }),
            );

            await Promise.all(enrollmentPromises);
            console.log(
              `[AuthService] Successfully enrolled student in ${coursesToEnroll.length} courses`,
            );
          }
        } catch {
          console.error("[AuthService] Auto-enrollment failed");
          // Don't fail the registration if enrollment fails, just log it
        }
      }

      // Convert to User interface
      const userWithTokenVersion: User = {
        id: String(user.id),
        universityId: user.universityId,
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role.toLowerCase() as "student" | "professor" | "admin",
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: true,
        tokenVersion: user.tokenVersion,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      // Generate tokens
      const { accessToken, refreshToken } =
        await this.generateTokens(userWithTokenVersion);

      return {
        user: this.sanitizeUser(userWithTokenVersion),
        accessToken,
        refreshToken,
        expiresIn: this.getTokenExpirationTime(),
      };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  /**
   * Login user
   * @param loginData - User login data
   * @returns Authentication response with tokens
   */
  static async login(loginData: LoginRequest): Promise<AuthResponse> {
    console.log(
      "[AuthService] Login process started for:",
      loginData.universityId,
    );

    try {
      // Validate input
      console.log("[AuthService] Validating login data...");
      this.validateLoginData(loginData);

      // Find user by university ID using Prisma
      console.log(
        `[AuthService] Searching for user with universityId: ${loginData.universityId}`,
      );
      const user = await this.prisma.user.findUnique({
        where: { universityId: loginData.universityId },
      });

      if (!user) {
        console.log(
          `[AuthService] User not found with universityId: ${loginData.universityId}`,
        );
        throw new Error("Invalid university ID or password");
      }

      console.log(`[AuthService] User found:`, {
        id: user.id,
        universityId: user.universityId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });

      // Note: User model does not have isActive field in schema
      // All users are considered active by default

      // Verify password
      console.log("[AuthService] Verifying password...");
      const isPasswordValid = await EncryptionUtils.verifyPassword(
        loginData.password,
        user.password,
      );
      if (!isPasswordValid) {
        console.log("[AuthService] Password verification failed");
        throw new Error("Invalid university ID or password");
      }

      // Convert Prisma user to User interface with explicit field mapping
      console.log("[AuthService] Converting user data...");
      const userWithTokenVersion: User = {
        id: String(user.id),
        universityId: user.universityId,
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role.toLowerCase() as "student" | "professor" | "admin",
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        tokenVersion: user.tokenVersion || 1,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      // Generate tokens
      console.log("[AuthService] Generating tokens phase start...");
      const tokens = await this.generateTokens(userWithTokenVersion).catch(
        (err) => {
          console.error("[AuthService] Token generation failed CRITICAL:", err);
          throw new Error(`Token generation failed: ${err.message}`);
        },
      );

      console.log(
        `[AuthService] Login successful for user: ${user.universityId}`,
      );

      return {
        user: this.sanitizeUser(userWithTokenVersion),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: this.getTokenExpirationTime(),
      };
    } catch (error) {
      console.error(`[AuthService] Login error details:`, {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        errorObject: error,
      });
      throw error;
    }
  }

  /**
   * Refresh access token
   * @param refreshData - Refresh token data
   * @returns New authentication response
   */
  static async refreshToken(
    refreshData: RefreshTokenRequest,
  ): Promise<AuthResponse> {
    try {
      console.log("[AuthService] Refresh token request received");

      // Verify refresh token
      const payload = JWTUtils.verifyRefreshToken(refreshData.refreshToken);
      console.log(
        "[AuthService] JWT verification successful, userId:",
        payload.userId,
      );

      // Check if RefreshToken model exists
      if (!this.prisma.refreshToken) {
        console.warn(
          "[AuthService] RefreshToken model not available. Migration needed.",
        );
        throw new Error(
          "Refresh token feature not available. Please contact administrator.",
        );
      }

      // Check if refresh token exists in database
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshData.refreshToken },
        include: { user: true },
      });

      if (!storedToken) {
        console.log("[AuthService] Refresh token not found in database");
        throw new Error("Invalid refresh token");
      }

      // Check if token is expired
      if (storedToken.expiresAt < new Date()) {
        console.log("[AuthService] Refresh token expired");
        await this.prisma.refreshToken.delete({
          where: { id: storedToken.id },
        });
        throw new Error("Refresh token expired");
      }

      // Check if userId matches
      if (storedToken.userId.toString() !== payload.userId) {
        console.log("[AuthService] User ID mismatch");
        throw new Error("Invalid refresh token");
      }

      const user = storedToken.user;
      console.log("[AuthService] User found:", user.id, user.universityId);

      // Check token version
      if ((user.tokenVersion || 1) !== payload.tokenVersion) {
        console.log("[AuthService] Token version mismatch");
        throw new Error("Token version mismatch");
      }

      // Delete old refresh token
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      // Convert Prisma user to User interface
      const userWithTokenVersion: User = {
        id: String(user.id),
        universityId: user.universityId,
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role.toLowerCase() as "student" | "professor" | "admin",
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: true,
        tokenVersion: user.tokenVersion || 1,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      // Generate new tokens
      const tokens = await this.generateTokens(userWithTokenVersion);
      console.log("[AuthService] New tokens generated successfully");

      return {
        user: this.sanitizeUser(userWithTokenVersion),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: this.getTokenExpirationTime(),
      };
    } catch (error) {
      console.error("[AuthService] Token refresh failed:", error);
      throw new Error(
        `Token refresh failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Logout user
   * @param refreshToken - Refresh token to invalidate
   */
  static async logout(refreshToken: string): Promise<void> {
    try {
      // Remove refresh token from database if model exists
      if (this.prisma.refreshToken) {
        await this.prisma.refreshToken.deleteMany({
          where: { token: refreshToken },
        });
      }
    } catch (error) {
      console.error("[AuthService] Logout error:", error);
      // Don't throw error on logout - just log it
      console.warn(
        "[AuthService] Failed to delete refresh token from database, but logout will continue",
      );
    }
  }

  /**
   * Change user password
   * @param changePasswordData - Password change data
   */
  static async changePassword(
    changePasswordData: ChangePasswordRequest,
  ): Promise<void> {
    try {
      // Find user using Prisma
      const user = await this.prisma.user.findUnique({
        where: { id: parseInt(changePasswordData.userId.toString()) },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Verify current password
      const isCurrentPasswordValid = await EncryptionUtils.verifyPassword(
        changePasswordData.currentPassword,
        user.password,
      );
      if (!isCurrentPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      // Validate new password
      if (changePasswordData.newPassword.length < 6) {
        throw new Error("New password must be at least 6 characters long");
      }

      // Hash new password
      const hashedNewPassword = await EncryptionUtils.hashPassword(
        changePasswordData.newPassword,
      );

      // Update user using Prisma
      await this.prisma.user.update({
        where: { id: parseInt(changePasswordData.userId.toString()) },
        data: {
          password: hashedNewPassword,
          tokenVersion: (user.tokenVersion || 1) + 1, // Invalidate all existing tokens
          updatedAt: new Date(),
        },
      });

      // Remove all refresh tokens for this user from database
      await this.prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      });
    } catch (error) {
      throw new Error(`Password change failed: ${error}`);
    }
  }

  /**
   * Get user by ID
   * @param userId - User ID
   * @returns User data without sensitive information
   */
  static async getUserById(
    userId: string,
  ): Promise<Omit<User, "password" | "tokenVersion"> | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: parseInt(userId) },
      });

      if (!user) return null;

      const userWithTokenVersion = {
        ...user,
        id: String(user.id),
        name: user.name,
        tokenVersion: user.tokenVersion || 1,
        role: user.role as "student" | "professor" | "admin",
        isActive: user.isActive,
      };

      return this.sanitizeUser(userWithTokenVersion);
    } catch (error) {
      throw new Error(`Failed to get user: ${error}`);
    }
  }

  /**
   * Verify access token and get user
   * @param accessToken - Access token to verify
   * @returns User data if token is valid
   */
  static async verifyAccessToken(
    accessToken: string,
  ): Promise<Omit<User, "password" | "tokenVersion"> | null> {
    try {
      const payload = JWTUtils.verifyAccessToken(accessToken);
      const user = await this.prisma.user.findUnique({
        where: { id: parseInt(payload.userId) },
      });

      if (!user) {
        return null;
      }

      const userWithTokenVersion = {
        ...user,
        id: String(user.id),
        name: user.name,
        tokenVersion: user.tokenVersion || 1,
        role: user.role as "student" | "professor" | "admin",
        isActive: user.isActive,
      };

      return this.sanitizeUser(userWithTokenVersion);
    } catch {
      return null;
    }
  }

  /**
   * Generate tokens for user
   * @param user - User to generate tokens for
   * @returns Object containing access and refresh tokens
   */
  private static async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessTokenPayload: Omit<JWTPayload, "iat" | "exp"> = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const refreshTokenPayload: Omit<JWTRefreshPayload, "iat" | "exp"> = {
      userId: user.id,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = JWTUtils.generateAccessToken(accessTokenPayload);
    const refreshToken = JWTUtils.generateRefreshToken(refreshTokenPayload);

    // Try to store refresh token in database
    try {
      // Calculate expiry date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Check if refreshToken model exists in Prisma Client
      if (this.prisma.refreshToken) {
        await this.prisma.refreshToken.create({
          data: {
            token: refreshToken,
            userId: parseInt(user.id),
            expiresAt,
          },
        });
        console.log(
          "[AuthService] Refresh token stored in database successfully",
        );
      } else {
        console.warn(
          "[AuthService] RefreshToken model not found in Prisma Client. Run migration first!",
        );
      }
    } catch (error) {
      // If database table doesn't exist yet, just log warning and continue
      console.warn(
        "[AuthService] Failed to store refresh token in database:",
        error instanceof Error ? error.message : error,
      );
      console.warn(
        "[AuthService] Please run: npx prisma migrate dev or npx prisma db push",
      );
    }

    return { accessToken, refreshToken };
  }

  /**
   * Sanitize user data (remove sensitive information)
   * @param user - User to sanitize
   * @returns Sanitized user data
   */
  private static sanitizeUser(
    user: User,
  ): Omit<User, "password" | "tokenVersion"> {
    const sanitized = { ...user };
    // @ts-expect-error sensitive fields removed
    delete sanitized.password;
    // @ts-expect-error sensitive fields removed
    delete sanitized.tokenVersion;
    return sanitized;
  }

  /**
   * Get token expiration time in seconds
   * @returns Expiration time in seconds
   */
  private static getTokenExpirationTime(): number {
    const expiresIn = process.env.JWT_EXPIRES_IN || "15m";
    const timeValue = parseInt(expiresIn);
    const timeUnit = expiresIn.slice(-1);

    switch (timeUnit) {
      case "m":
        return timeValue * 60;
      case "h":
        return timeValue * 3600;
      case "d":
        return timeValue * 86400;
      default:
        return 900; // 15 minutes default
    }
  }

  /**
   * Validate registration data
   * @param data - Registration data to validate
   */
  private static validateRegisterData(data: RegisterRequest): void {
    console.log("[AuthService] Validating registration data:", {
      universityId: data.universityId,
      email: data.email,
      password: data.password ? "***" : undefined,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      firstNameType: typeof data.firstName,
      lastNameType: typeof data.lastName,
    });

    if (!data.universityId || !data.password) {
      throw new Error("University ID and password are required");
    }

    // Check firstName and lastName separately for better error messages
    if (
      !data.firstName ||
      typeof data.firstName !== "string" ||
      data.firstName.trim().length === 0
    ) {
      throw new Error("First name is required and cannot be empty");
    }

    if (
      !data.lastName ||
      typeof data.lastName !== "string" ||
      data.lastName.trim().length === 0
    ) {
      throw new Error("Last name is required and cannot be empty");
    }

    if (!this.isValidUniversityId(data.universityId)) {
      throw new Error("University ID must be 7-10 digits");
    }

    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error("Invalid email format");
    }

    if (!this.isValidPassword(data.password)) {
      throw new Error("Password must be at least 6 characters long");
    }

    const role = data.role || "student";
    if (!["student", "professor", "admin"].includes(role)) {
      throw new Error("Invalid role. Must be student, professor, or admin");
    }

    console.log("[AuthService] Validation passed");
  }

  /**
   * Validate login data
   * @param data - Login data to validate
   */
  private static validateLoginData(data: LoginRequest): void {
    if (!data.universityId || !data.password) {
      throw new Error("University ID and password are required");
    }

    if (!this.isValidUniversityId(data.universityId)) {
      throw new Error("University ID must be 7-10 digits");
    }

    if (!this.isValidPassword(data.password)) {
      throw new Error("Password must be at least 6 characters long");
    }
  }

  /**
   * Validate university ID format
   * @param universityId - University ID to validate
   * @returns True if university ID is valid
   */
  private static isValidUniversityId(universityId: string): boolean {
    const universityIdRegex = /^\d{7,10}$/;
    return universityIdRegex.test(universityId);
  }

  /**
   * Validate password format (1-9 digits)
   * @param password - Password to validate
   * @returns True if password is valid
   */
  private static isValidPassword(password: string): boolean {
    // Password must be at least 6 characters and at most 100 characters
    // Can contain letters, numbers, and special characters
    return password.length >= 6 && password.length <= 100;
  }

  /**
   * Validate email format
   * @param email - Email to validate
   * @returns True if email is valid
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get all users (for admin purposes)
   * @returns Array of sanitized users
   */
  static async getAllUsers(): Promise<
    Omit<User, "password" | "tokenVersion">[]
  > {
    try {
      const users = await this.prisma.user.findMany();

      return users.map((user) => {
        const userWithTokenVersion = {
          ...user,
          id: String(user.id),
          name: user.name,
          tokenVersion: user.tokenVersion || 1,
          role: user.role as "student" | "professor" | "admin",
          isActive: true,
        };
        return this.sanitizeUser(userWithTokenVersion);
      });
    } catch (error) {
      throw new Error(`Failed to get all users: ${error}`);
    }
  }

  /**
   * Deactivate user account
   * @param userId - User ID to deactivate
   */
  static async deactivateUser(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: parseInt(userId) },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Note: User model doesn't have isActive field in current schema
      // Just increment token version to invalidate all tokens
      await this.prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
          tokenVersion: (user.tokenVersion || 1) + 1,
          updatedAt: new Date(),
        },
      });

      // Remove all refresh tokens for this user from database
      await this.prisma.refreshToken.deleteMany({
        where: { userId: parseInt(userId) },
      });
    } catch (error) {
      throw new Error(`Failed to deactivate user: ${error}`);
    }
  }
}

export default AuthService;
