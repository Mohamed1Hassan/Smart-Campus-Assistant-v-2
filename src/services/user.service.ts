import { EncryptionUtils } from "../utils/encryption";
import { uploadMiddleware } from "../middleware/upload.middleware";
import { Prisma, UserRole } from "@prisma/client";
import prisma from "../lib/db";

/**
 * User Service
 * Business logic for user management operations
 */

// User interface extending the auth service user
export interface UserProfile {
  id: string;
  universityId: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role: "STUDENT" | "PROFESSOR" | "ADMIN";
  phone?: string;
  dob?: string;
  address?: string;
  emergencyContact?: string;
  bio?: string;
  department?: string;
  year?: number;
  major?: string;
  avatarUrl?: string;
  isActive: boolean;
  attendancePercent?: number;
  gpa?: number;
  faceDescriptor?: Prisma.JsonValue;
  courses?: {
    id: string;
    courseCode: string;
    courseName: string;
    semester: string;
    academicYear: string;
    capacity: number;
    studentCount: number;
    isArchived: boolean;
    coverImage?: string;
    scheduleTime?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Profile update request interface
export interface UpdateProfileRequest {
  userId: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  universityId?: string;
  phone?: string;
  dob?: string;
  address?: string;
  emergencyContact?: string;
  bio?: string;
  department?: string;
  year?: number;
  major?: string;
  avatarUrl?: string;
}

// Password change request interface
export interface ChangePasswordRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

// Avatar upload request interface
export interface AvatarUploadRequest {
  userId: string;
  file: Express.Multer.File;
}

// Search users request interface
export interface SearchUsersRequest {
  query?: string;
  role?: "STUDENT" | "PROFESSOR" | "ADMIN";
  page?: number;
  limit?: number;
}

// Student statistics interface
export interface StudentStats {
  gpa: number;
  upcomingClasses: number;
  completedCourses: number;
  pendingAssignments: number;
  attendancePercentage: number;
  totalCredits: number;
  currentSemester: string;
}

// Professor settings interface
export interface ProfessorSettings {
  security: {
    defaultGracePeriod: number;
    defaultMaxAttempts: number;
    defaultRiskThreshold: number;
  };
  location: {
    defaultRadius: number;
    enableGeofencing: boolean;
    requireLocationAccuracy: boolean;
  };
  device: {
    enableDeviceFingerprinting: boolean;
    enableDeviceSharingDetection: boolean;
  };
  photo: {
    requirePhotoVerification: boolean;
    enableFaceDetection: boolean;
  };
  time: {
    enableTimeValidation: boolean;
  };
  notifications: {
    enableEmailNotifications: boolean;
    enablePushNotifications: boolean;
    notifyOnFraudDetection: boolean;
  };
}

export interface UpdateProfessorSettingsRequest {
  security?: Partial<ProfessorSettings["security"]>;
  location?: Partial<ProfessorSettings["location"]>;
  device?: Partial<ProfessorSettings["device"]>;
  photo?: Partial<ProfessorSettings["photo"]>;
  time?: Partial<ProfessorSettings["time"]>;
  notifications?: Partial<ProfessorSettings["notifications"]>;
}

// Search users response interface
export interface SearchUsersResponse {
  users: UserProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// User service class
export class UserService {
  /**
   * Get user profile by ID
   * @param userId - User ID
   * @returns User profile or null if not found
   */
  static async getUserProfile(
    userId: string | number,
  ): Promise<UserProfile | null> {
    try {
      const userIdNum = typeof userId === "string" ? parseInt(userId) : userId;
      const user = await prisma.user.findUnique({
        where: { id: userIdNum },
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            include: {
              course: true,
            },
          },
          attendanceRecords: {
            take: 10,
            orderBy: { markedAt: "desc" },
            include: {
              course: {
                select: {
                  courseCode: true,
                  courseName: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        return null;
      }

      const allAttendanceRecords = await prisma.attendanceRecord.findMany({
        where: { studentId: userIdNum },
      });

      const totalRecords = allAttendanceRecords.length;
      const presentRecords = allAttendanceRecords.filter(
        (r) => r.status === "PRESENT" || r.status === "LATE",
      ).length;
      const attendancePercent =
        totalRecords > 0
          ? Math.round((presentRecords / totalRecords) * 100)
          : 0;

      // Calculate GPA based on attendance percentage as requested
      // Map 0-100% attendance to 0-4.0 GPA
      const gpa = parseFloat(((attendancePercent * 4) / 100).toFixed(2));

      return {
        id: String(user.id),
        universityId: user.universityId,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as "STUDENT" | "PROFESSOR" | "ADMIN",
        phone: user.phone ?? undefined,
        dob: user.dob ?? undefined,
        address: user.address ?? undefined,
        emergencyContact: user.emergencyContact ?? undefined,
        bio: user.bio ?? undefined,
        department: user.department ?? undefined,
        year: user.level ?? undefined,
        major: user.major ?? undefined,
        avatarUrl: user.profilePhoto ?? undefined,
        attendancePercent,
        gpa,
        faceDescriptor: user.faceDescriptor ?? undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isActive: true,
      };
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw new Error(`Failed to get user profile: ${error}`);
    }
  }

  /**
   * Update user profile
   * @param updateData - Profile update data
   * @returns Updated user profile
   */
  static async updateProfile(
    updateData: UpdateProfileRequest,
  ): Promise<UserProfile> {
    try {
      const userIdNum = parseInt(updateData.userId);

      const updatePayload: Prisma.UserUpdateInput = {};

      if (updateData.name !== undefined) {
        updatePayload.name = updateData.name;

        // Synchronize firstName and lastName if not explicitly provided
        if (
          updateData.firstName === undefined &&
          updateData.lastName === undefined
        ) {
          const nameParts = updateData.name.trim().split(/\s+/);
          updatePayload.firstName = nameParts[0] || "";
          updatePayload.lastName =
            nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
        }
      }

      if (updateData.firstName !== undefined)
        updatePayload.firstName = updateData.firstName;
      if (updateData.lastName !== undefined)
        updatePayload.lastName = updateData.lastName;
      if (updateData.email !== undefined)
        updatePayload.email = updateData.email.toLowerCase();
      if (updateData.universityId !== undefined)
        updatePayload.universityId = updateData.universityId;
      if (updateData.phone !== undefined)
        updatePayload.phone = updateData.phone;
      if (updateData.dob !== undefined) updatePayload.dob = updateData.dob;
      if (updateData.address !== undefined)
        updatePayload.address = updateData.address;
      if (updateData.emergencyContact !== undefined)
        updatePayload.emergencyContact = updateData.emergencyContact;
      if (updateData.bio !== undefined) updatePayload.bio = updateData.bio;
      if (updateData.department !== undefined)
        updatePayload.department = updateData.department;
      if (updateData.year !== undefined) updatePayload.level = updateData.year;
      if (updateData.major !== undefined)
        updatePayload.major = updateData.major;
      if (updateData.avatarUrl !== undefined)
        updatePayload.profilePhoto = updateData.avatarUrl;

      const user = await prisma.user.update({
        where: { id: userIdNum },
        data: {
          ...updatePayload,
          updatedAt: new Date(),
        },
      });

      return {
        id: String(user.id),
        universityId: user.universityId,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as "STUDENT" | "PROFESSOR" | "ADMIN",
        phone: user.phone ?? undefined,
        dob: user.dob ?? undefined,
        address: user.address ?? undefined,
        emergencyContact: user.emergencyContact ?? undefined,
        bio: user.bio ?? undefined,
        department: user.department ?? undefined,
        year: user.level ?? undefined,
        major: user.major ?? undefined,
        faceDescriptor: user.faceDescriptor ?? undefined,
        avatarUrl: user.profilePhoto ?? undefined,
        isActive: true,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      throw new Error(`Failed to update profile: ${error}`);
    }
  }

  /**
   * Change user password
   * @param changePasswordData - Password change data
   */
  static async changePassword(
    changePasswordData: ChangePasswordRequest,
  ): Promise<void> {
    const userIdNum = parseInt(changePasswordData.userId);
    const user = await prisma.user.findUnique({ where: { id: userIdNum } });
    if (!user) throw new Error("User not found");

    const isMatch = await EncryptionUtils.verifyPassword(
      changePasswordData.currentPassword,
      user.password,
    );
    if (!isMatch) throw new Error("Invalid current password");

    const hashedPassword = await EncryptionUtils.hashPassword(
      changePasswordData.newPassword,
    );
    await prisma.user.update({
      where: { id: userIdNum },
      data: {
        password: hashedPassword,
        tokenVersion: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    if (prisma.refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { userId: userIdNum } });
    }
  }

  /**
   * Upload user avatar
   * @param avatarData - Avatar upload data
   * @returns Updated user profile with avatar URL
   */
  static async uploadAvatar(
    avatarData: AvatarUploadRequest,
  ): Promise<UserProfile> {
    try {
      const userIdNum = parseInt(avatarData.userId);
      const user = await prisma.user.findUnique({ where: { id: userIdNum } });

      if (!user) {
        throw new Error("User not found");
      }

      // Process the uploaded image (runs side-effect for optimization)
      await uploadMiddleware.processImage(avatarData.file.path);

      // Generate avatar URL
      const avatarUrl = uploadMiddleware.getFileUrl(avatarData.file.filename);

      // Update user profile in database
      const updatedUser = await prisma.user.update({
        where: { id: userIdNum },
        data: {
          profilePhoto: avatarUrl,
          updatedAt: new Date(),
        },
      });

      return {
        id: String(updatedUser.id),
        universityId: updatedUser.universityId,
        email: updatedUser.email,
        name: updatedUser.name,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role as "STUDENT" | "PROFESSOR" | "ADMIN",
        phone: updatedUser.phone ?? undefined,
        dob: updatedUser.dob ?? undefined,
        address: updatedUser.address ?? undefined,
        emergencyContact: updatedUser.emergencyContact ?? undefined,
        bio: updatedUser.bio ?? undefined,
        department: updatedUser.department ?? undefined,
        year: updatedUser.level ?? undefined,
        major: updatedUser.major ?? undefined,
        avatarUrl: updatedUser.profilePhoto ?? undefined,
        isActive: true,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };
    } catch (error) {
      throw new Error(`Failed to upload avatar: ${error}`);
    }
  }

  /**
   * Delete user avatar
   * @param userId - User ID
   * @returns Updated user profile
   */
  static async deleteAvatar(userId: string): Promise<UserProfile> {
    try {
      const userIdNum = parseInt(userId);
      const user = await prisma.user.update({
        where: { id: userIdNum },
        data: {
          updatedAt: new Date(),
        },
      });

      return {
        id: String(user.id),
        universityId: user.universityId,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as "STUDENT" | "PROFESSOR" | "ADMIN",
        faceDescriptor: user.faceDescriptor ?? undefined,
        isActive: true,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      throw new Error(`Failed to delete avatar: ${error}`);
    }
  }

  /**
   * Search users
   * @param searchData - Search parameters
   * @returns Array of matching users
   */
  static async searchUsers(
    searchData: SearchUsersRequest,
  ): Promise<SearchUsersResponse> {
    try {
      const page = searchData.page || 1;
      const limit = searchData.limit || 10;
      const skip = (page - 1) * limit;

      const where: Prisma.UserWhereInput = {};
      if (searchData.role) where.role = searchData.role;
      if (searchData.query) {
        where.OR = [
          { firstName: { contains: searchData.query, mode: "insensitive" } },
          { lastName: { contains: searchData.query, mode: "insensitive" } },
          { email: { contains: searchData.query, mode: "insensitive" } },
          { universityId: { contains: searchData.query, mode: "insensitive" } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { firstName: "asc" },
          include: {
            coursesCreated: {
              select: {
                id: true,
                courseCode: true,
                courseName: true,
                semester: true,
                academicYear: true,
                capacity: true,
                isArchived: true,
                coverImage: true,
                _count: {
                  select: { enrollments: true },
                },
                schedules: {
                  take: 1,
                  where: { isActive: true },
                },
              },
            },
          },
        }),
        prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        users: users.map((u) => ({
          id: String(u.id),
          universityId: u.universityId,
          email: u.email,
          name: u.name,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role as "STUDENT" | "PROFESSOR" | "ADMIN",
          department: u.department ?? undefined,
          major: u.major ?? undefined,
          year: u.level ?? undefined,
          courses: u.coursesCreated?.map((c) => ({
            id: String(c.id),
            courseCode: c.courseCode,
            courseName: c.courseName,
            semester: String(c.semester),
            academicYear: c.academicYear,
            capacity: c.capacity,
            isArchived: c.isArchived,
            studentCount: c._count.enrollments,
            coverImage: c.coverImage ?? undefined,
            scheduleTime: c.schedules?.[0]
              ? `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][c.schedules[0].dayOfWeek]} ${c.schedules[0].startTime}`
              : undefined,
          })) ?? undefined,
          faceDescriptor: u.faceDescriptor ?? undefined,
          isActive: u.isActive,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        })),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      throw new Error(`Failed to search users: ${error}`);
    }
  }

  /**
   * Get all users (admin only)
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated list of users
   */
  static async getAllUsers(
    page: number = 1,
    limit: number = 10,
  ): Promise<SearchUsersResponse> {
    try {
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            coursesCreated: {
              select: {
                id: true,
                courseCode: true,
                courseName: true,
                semester: true,
                academicYear: true,
                capacity: true,
                isArchived: true,
                coverImage: true,
                _count: {
                  select: { enrollments: true },
                },
                schedules: {
                  take: 1,
                  where: { isActive: true },
                },
              },
            },
          },
        }),
        prisma.user.count(),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        users: users.map((u) => ({
          id: String(u.id),
          universityId: u.universityId,
          email: u.email,
          name: u.name,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role as "STUDENT" | "PROFESSOR" | "ADMIN",
          department: u.department ?? undefined,
          major: u.major ?? undefined,
          year: u.level ?? undefined,
          courses: u.coursesCreated?.map((c) => ({
            id: String(c.id),
            courseCode: c.courseCode,
            courseName: c.courseName,
            semester: String(c.semester),
            academicYear: c.academicYear,
            capacity: c.capacity,
            isArchived: c.isArchived,
            studentCount: c._count.enrollments,
            coverImage: c.coverImage ?? undefined,
            scheduleTime: c.schedules?.[0]
              ? `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][c.schedules[0].dayOfWeek]} ${c.schedules[0].startTime}`
              : undefined,
          })) ?? undefined,
          faceDescriptor: u.faceDescriptor ?? undefined,
          isActive: u.isActive,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        })),
        total,
        page,
        limit,
        totalPages,
      };
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
      const userIdNum = parseInt(userId);
      await prisma.user.update({
        where: { id: userIdNum },
        data: {
          isActive: false,
          tokenVersion: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      if (prisma.refreshToken) {
        await prisma.refreshToken.deleteMany({ where: { userId: userIdNum } });
      }
    } catch (error) {
      throw new Error(`Failed to deactivate user: ${error}`);
    }
  }

  /**
   * Activate user account
   * @param userId - User ID to activate
   */
  static async activateUser(userId: string): Promise<void> {
    try {
      const userIdNum = parseInt(userId);
      await prisma.user.update({
        where: { id: userIdNum },
        data: {
          isActive: true,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      throw new Error(`Failed to activate user: ${error}`);
    }
  }

  /**
   * Delete user account
   * @param userId - User ID to delete
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      const userIdNum = parseInt(userId);
      await prisma.user.delete({ where: { id: userIdNum } });
    } catch (error) {
      throw new Error(`Failed to delete user: ${error}`);
    }
  }

  /**
   * Create a new user (admin only)
   * @param userData - User data
   * @returns Created user profile
   */
  static async createUser(userData: {
    universityId: string;
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
    role?: UserRole;
    year?: string;
    major?: string;
    department?: string;
  }): Promise<UserProfile> {
    try {
      // Check for existing user
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: (userData.email as string).toLowerCase() },
            { universityId: userData.universityId as string },
          ],
        },
      });

      if (existingUser) {
        const field =
          existingUser.email.toLowerCase() ===
          (userData.email as string).toLowerCase()
            ? "Email"
            : "University ID";
        throw new Error(`${field} already registered`);
      }

      const hashedPassword = await EncryptionUtils.hashPassword(
        (userData.password as string | undefined) || "password123",
      );

      const user = await prisma.user.create({
        data: {
          universityId: userData.universityId as string,
          email: (userData.email as string).toLowerCase(),
          password: hashedPassword,
          role: (userData.role as UserRole) || "STUDENT",
          firstName: userData.firstName as string,
          lastName: userData.lastName as string,
          name: `${userData.firstName} ${userData.lastName}`,
          level: userData.year ? parseInt(userData.year as string) : undefined,
          major: userData.major as string | undefined,
          department: userData.department as string | undefined,
          isActive: true,
        },
      });

      return {
        id: String(user.id),
        universityId: user.universityId,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as "STUDENT" | "PROFESSOR" | "ADMIN",
        faceDescriptor: user.faceDescriptor ?? undefined,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  /**
   * Get student statistics for dashboard
   * @param userId - Student user ID
   * @returns Student statistics
   */
  static async getStudentStats(userId: string | number): Promise<StudentStats> {
    try {
      const studentId = typeof userId === "string" ? parseInt(userId) : userId;

      // Fetch student's major and level
      const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { major: true, level: true },
      });

      if (!student || !student.major || student.level === null) {
        return {
          gpa: 0,
          upcomingClasses: 0,
          completedCourses: 0,
          pendingAssignments: 0,
          attendancePercentage: 0,
          totalCredits: 0,
          currentSemester: "N/A",
        };
      }

      // 1. Get courses matching student's major and level (ACTIVE only)
      const courses = await prisma.course.findMany({
        where: {
          major: student.major,
          level: student.level,
          isActive: true,
          isArchived: false,
        },
      });

      // 2. Calculate total credits from these courses
      const totalCredits = courses.reduce(
        (sum, c) => sum + (c.credits || 3),
        0,
      );
      const courseIds = courses.map((c) => c.id);

      // 3. Get COMPLETED courses count (not from active enrollments)
      const completedCourses = await prisma.courseEnrollment.count({
        where: {
          studentId: studentId,
          status: "COMPLETED",
        },
      });

      // 4. Calculate attendance percentage correctly (including missed classes)
      const now = new Date();

      // Get all relevant QR code sessions for these courses in one query to avoid N+1
      const relevantQRCodes =
        courseIds.length > 0
          ? await prisma.qRCode.findMany({
              where: {
                courseId: { in: courseIds },
                validTo: { lt: now },
                isActive: true,
              },
              select: {
                courseId: true,
                validFrom: true,
              },
            })
          : [];

      // Calculate total expected sessions for these courses
      const totalExpectedSessions = relevantQRCodes.length;

      // Get attendance records for these courses
      const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: {
          studentId: studentId,
          courseId: { in: courseIds },
        },
      });

      const presentSessions = attendanceRecords.filter(
        (r) => r.status === "PRESENT" || r.status === "LATE",
      ).length;

      const attendancePercentage =
        totalExpectedSessions > 0
          ? Math.round((presentSessions / totalExpectedSessions) * 100)
          : 0;

      // 5. Calculate today's upcoming classes from Schedule
      const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
      let upcomingClasses = 0;
      if (courseIds.length > 0) {
        const todaySchedule = await prisma.schedule.findMany({
          where: {
            dayOfWeek: today,
            isActive: true,
            courseId: { in: courseIds },
          },
          include: {
            course: true,
          },
        });

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

        upcomingClasses = todaySchedule.filter((schedule) => {
          const [hours, minutes] = schedule.startTime.split(":").map(Number);
          const scheduleTime = hours * 60 + minutes; // Schedule time in minutes
          return scheduleTime >= currentTime; // Upcoming or current classes
        }).length;
      }

      // 6. Calculate Pending Assignments from Notifications
      // Count unread notifications with ASSIGNMENT or DEADLINE category
      const pendingAssignments = await prisma.notification.count({
        where: {
          userId: studentId,
          isRead: false,
          category: {
            in: ["ASSIGNMENT", "DEADLINE"],
          },
        },
      });

      // 7. Calculate GPA from attendance percentage as requested
      // Map 0-100% attendance to 0-4.0 GPA
      const gpa = parseFloat(((attendancePercentage * 4) / 100).toFixed(2));

      // 8. Get current semester from most recent schedule or default
      let currentSemester = "Current Semester";

      if (courseIds.length > 0) {
        const latestSchedule = await prisma.schedule.findFirst({
          where: {
            courseId: { in: courseIds },
            isActive: true,
          },
          orderBy: { createdAt: "desc" },
          select: {
            semester: true,
          },
        });

        if (latestSchedule?.semester) {
          currentSemester = latestSchedule.semester;
        }
      }

      return {
        gpa: gpa,
        upcomingClasses: upcomingClasses,
        completedCourses: completedCourses, // Only completed courses, no fallback
        pendingAssignments: pendingAssignments, // Real count from notifications
        attendancePercentage: attendancePercentage,
        totalCredits: totalCredits,
        currentSemester: currentSemester,
      };
    } catch (error) {
      console.error("Error getting student stats:", error);
      return {
        gpa: 0,
        upcomingClasses: 0,
        completedCourses: 0,
        pendingAssignments: 0,
        attendancePercentage: 0,
        totalCredits: 0,
        currentSemester: "Current Semester",
      };
    }
  }

  /**
   * Get user statistics
   * @returns User statistics
   */
  static async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: {
      STUDENT: number;
      PROFESSOR: number;
      ADMIN: number;
    };
  }> {
    try {
      const [total, students, professors, admins] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "STUDENT" } }),
        prisma.user.count({ where: { role: "PROFESSOR" } }),
        prisma.user.count({ where: { role: "ADMIN" } }),
      ]);

      return {
        total,
        active: total, // All considered active for now
        inactive: 0,
        byRole: {
          STUDENT: students,
          PROFESSOR: professors,
          ADMIN: admins,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get user statistics: ${error}`);
    }
  }

  /**
   * Get professor settings
   * @param userId - Professor user ID
   * @returns Professor settings in nested format for UI compatibility
   */
  static async getProfessorSettings(
    userId: string | number,
  ): Promise<ProfessorSettings> {
    try {
      const professorId =
        typeof userId === "string" ? parseInt(userId) : userId;

      let settings = await prisma.professorSettings.findUnique({
        where: { professorId },
      });

      if (!settings) {
        // Create default settings if they don't exist
        settings = await prisma.professorSettings.create({
          data: {
            professorId,
          },
        });
      }

      // Map flat database structure to nested UI structure
      return {
        security: {
          defaultGracePeriod: settings.defaultGracePeriod,
          defaultMaxAttempts: settings.defaultMaxAttempts,
          defaultRiskThreshold: settings.defaultRiskThreshold,
        },
        location: {
          defaultRadius: settings.defaultRadius,
          enableGeofencing: settings.enableGeofencing,
          requireLocationAccuracy: settings.requireLocationAccuracy,
        },
        device: {
          enableDeviceFingerprinting: settings.enableDeviceFingerprinting,
          enableDeviceSharingDetection: settings.enableDeviceSharingDetection,
        },
        photo: {
          requirePhotoVerification: settings.requirePhotoVerification,
          enableFaceDetection: settings.enableFaceDetection,
        },
        time: {
          enableTimeValidation: settings.enableTimeValidation,
        },
        notifications: {
          enableEmailNotifications: settings.enableEmailNotifications,
          enablePushNotifications: settings.enablePushNotifications,
          notifyOnFraudDetection: settings.notifyOnFraudDetection,
        },
      };
    } catch (error) {
      console.error("Error getting professor settings:", error);
      throw new Error(`Failed to get professor settings: ${error}`);
    }
  }

  /**
   * Update professor settings
   * @param userId - Professor user ID
   * @param settingsData - Nested settings data from UI
   * @returns Updated professor settings
   */
  static async updateProfessorSettings(
    userId: string | number,
    settingsData: UpdateProfessorSettingsRequest,
  ): Promise<ProfessorSettings> {
    try {
      const professorId =
        typeof userId === "string" ? parseInt(userId) : userId;

      // Flatten nested UI structure to database structure
      const flatData: Prisma.ProfessorSettingsUncheckedUpdateInput = {};

      if (settingsData.security) {
        if (settingsData.security.defaultGracePeriod !== undefined)
          flatData.defaultGracePeriod =
            settingsData.security.defaultGracePeriod;
        if (settingsData.security.defaultMaxAttempts !== undefined)
          flatData.defaultMaxAttempts =
            settingsData.security.defaultMaxAttempts;
        if (settingsData.security.defaultRiskThreshold !== undefined)
          flatData.defaultRiskThreshold =
            settingsData.security.defaultRiskThreshold;
      }

      if (settingsData.location) {
        if (settingsData.location.defaultRadius !== undefined)
          flatData.defaultRadius = settingsData.location.defaultRadius;
        if (settingsData.location.enableGeofencing !== undefined)
          flatData.enableGeofencing = settingsData.location.enableGeofencing;
        if (settingsData.location.requireLocationAccuracy !== undefined)
          flatData.requireLocationAccuracy =
            settingsData.location.requireLocationAccuracy;
      }

      if (settingsData.device) {
        if (settingsData.device.enableDeviceFingerprinting !== undefined)
          flatData.enableDeviceFingerprinting =
            settingsData.device.enableDeviceFingerprinting;
        if (settingsData.device.enableDeviceSharingDetection !== undefined)
          flatData.enableDeviceSharingDetection =
            settingsData.device.enableDeviceSharingDetection;
      }

      if (settingsData.photo) {
        if (settingsData.photo.requirePhotoVerification !== undefined)
          flatData.requirePhotoVerification =
            settingsData.photo.requirePhotoVerification;
        if (settingsData.photo.enableFaceDetection !== undefined)
          flatData.enableFaceDetection = settingsData.photo.enableFaceDetection;
      }

      if (settingsData.time) {
        if (settingsData.time.enableTimeValidation !== undefined)
          flatData.enableTimeValidation =
            settingsData.time.enableTimeValidation;
      }

      if (settingsData.notifications) {
        if (settingsData.notifications.enableEmailNotifications !== undefined)
          flatData.enableEmailNotifications =
            settingsData.notifications.enableEmailNotifications;
        if (settingsData.notifications.enablePushNotifications !== undefined)
          flatData.enablePushNotifications =
            settingsData.notifications.enablePushNotifications;
        if (settingsData.notifications.notifyOnFraudDetection !== undefined)
          flatData.notifyOnFraudDetection =
            settingsData.notifications.notifyOnFraudDetection;
      }

      await prisma.professorSettings.upsert({
        where: { professorId },
        update: {
          ...flatData,
          updatedAt: new Date(),
        },
        create: {
          ...(flatData as Prisma.ProfessorSettingsUncheckedCreateInput),
          professorId,
        },
      });

      return await this.getProfessorSettings(professorId);
    } catch (error) {
      console.error("Error updating professor settings:", error);
      throw new Error(`Failed to update professor settings: ${error}`);
    }
  }
}

export default UserService;
