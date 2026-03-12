import { EmailService } from "./email.service";
import socketService, { SocketService } from "./socket.service";
import {
  CreateNotificationRequest,
  NotificationResponse,
  NotificationSettingsResponse,
  UpdateNotificationSettingsRequest,
  NotificationStats,
  NotificationFilters,
  BulkNotificationRequest,
  EmailFrequency,
  NotificationType,
  NotificationCategory,
  NotificationMetadata,
  ExamNotificationData,
  AssignmentNotificationData,
  AttendanceNotificationData,
  CourseNotificationData,
  SystemNotificationData,
} from "@/types/notification.types";

import prisma from "@/lib/db";
import {
  Prisma,
  NotificationType as PrismaType,
  NotificationCategory as PrismaCategory,
} from "@prisma/client";

export class NotificationService {
  private emailService: EmailService;
  private socketService: SocketService;

  constructor() {
    this.emailService = new EmailService();
    this.socketService = socketService;
  }

  /**
   * Create a new notification
   */
  async createNotification(
    request: CreateNotificationRequest,
  ): Promise<NotificationResponse> {
    try {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: request.userId,
          title: request.title,
          message: request.message,
          type: request.type as PrismaType,
          category: request.category as PrismaCategory,
          metadata:
            (request.metadata as unknown as Prisma.InputJsonValue) || {},
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Send real-time notification via Socket.io
      if (this.socketService) {
        this.socketService.sendNotificationToUser(
          request.userId,
          {
            id: String(notification.id),
            title: notification.title,
            message: notification.message,
            type: notification.type,
            category: notification.category,
            metadata: notification.metadata as NotificationMetadata,
            createdAt: notification.createdAt,
          },
          false,
        ); // Pass false to prevent double-saving to DB
      }

      // Send email notification if requested
      if (request.sendEmail) {
        await this.sendEmailNotification(
          notification as unknown as Parameters<
            typeof this.sendEmailNotification
          >[0],
        );
      }

      return {
        id: notification.id,
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type as unknown as NotificationType,
        category: notification.category as unknown as NotificationCategory,
        isRead: notification.isRead,
        isEmailSent: notification.isEmailSent,
        metadata: notification.metadata as NotificationMetadata,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
        readAt: notification.readAt ?? undefined,
      };
    } catch (error) {
      console.error("Error creating notification:", error);
      throw new Error("Failed to create notification");
    }
  }

  /**
   * Create bulk notifications
   */
  async createBulkNotifications(
    request: BulkNotificationRequest,
  ): Promise<NotificationResponse[]> {
    try {
      const notifications = await Promise.all(
        request.userIds.map((userId) =>
          this.createNotification({
            userId,
            title: request.title,
            message: request.message,
            type: request.type,
            category: request.category,
            metadata: request.metadata,
            sendEmail: request.sendEmail,
          }),
        ),
      );

      return notifications;
    } catch (error) {
      console.error("Error creating bulk notifications:", error);
      throw new Error("Failed to create bulk notifications");
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: number,
    filters?: NotificationFilters,
  ): Promise<NotificationResponse[]> {
    try {
      const whereClause: Prisma.NotificationWhereInput = { userId };

      if (filters) {
        if (filters.category) whereClause.category = filters.category;
        if (filters.type) whereClause.type = filters.type;
        if (filters.isRead !== undefined) whereClause.isRead = filters.isRead;
        if (filters.startDate || filters.endDate) {
          whereClause.createdAt = {};
          if (filters.startDate) whereClause.createdAt.gte = filters.startDate;
          if (filters.endDate) whereClause.createdAt.lte = filters.endDate;
        }
      }

      const notifications = await prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      });

      return notifications.map((notification) => ({
        id: notification.id,
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type as unknown as NotificationType,
        category: notification.category as unknown as NotificationCategory,
        isRead: notification.isRead,
        isEmailSent: notification.isEmailSent,
        metadata: notification.metadata as NotificationMetadata,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
        readAt: notification.readAt ?? undefined,
      }));
    } catch (error) {
      console.error("Error getting user notifications:", error);
      throw new Error("Failed to get user notifications");
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(
    notificationId: number,
    userId: number,
  ): Promise<boolean> {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return notification.count > 0;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw new Error("Failed to mark notification as read");
    }
  }

  /**
   * Alias for markNotificationAsRead for backward compatibility/consistency
   */
  async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    return this.markNotificationAsRead(notificationId, userId);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllNotificationsAsRead(userId: number): Promise<number> {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return result.count;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw new Error("Failed to mark all notifications as read");
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(
    notificationId: number,
    userId: number,
  ): Promise<boolean> {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId,
        },
      });

      return result.count > 0;
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw new Error("Failed to delete notification");
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId: number): Promise<number> {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      return count;
    } catch (error) {
      console.error("Error getting unread count:", error);
      throw new Error("Failed to get unread count");
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId: number): Promise<NotificationStats> {
    try {
      console.log(`[NotificationService] Getting stats for user: ${userId}`);
      const [unread, categoryCounts, typeCounts] = await Promise.all([
        prisma.notification.count({
          where: { userId, isRead: false },
        }),
        prisma.notification.groupBy({
          by: ["category"],
          where: { userId },
          _count: { category: true },
        }),
        prisma.notification.groupBy({
          by: ["type"],
          where: { userId },
          _count: { type: true },
        }),
      ]);

      console.log(`[NotificationService] Stats fetched. Unread: ${unread}`);

      const byCategory = categoryCounts.reduce(
        (acc, item) => {
          acc[item.category as NotificationCategory] = item._count.category;
          return acc;
        },
        {} as { [key in NotificationCategory]: number },
      );

      const byType = typeCounts.reduce(
        (acc, item) => {
          acc[item.type as NotificationType] = item._count.type;
          return acc;
        },
        {} as { [key in NotificationType]: number },
      );

      // Calculate total from the grouped counts to avoid an extra query
      const total = Object.values(byCategory).reduce(
        (sum, count) => sum + count,
        0,
      );

      return {
        total,
        unread,
        byCategory,
        byType,
      };
    } catch (error) {
      console.error("Error getting notification stats:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      throw new Error("Failed to get notification statistics");
    }
  }


  /**
   * Get or create notification settings for user
   */
  async getNotificationSettings(
    userId: number,
  ): Promise<NotificationSettingsResponse> {
    try {
      let settings = await prisma.notificationSettings.findUnique({
        where: { userId },
      });

      if (!settings) {
        // Create default settings
        settings = await prisma.notificationSettings.create({
          data: { userId },
        });
      }

      return {
        id: settings.id,
        userId: settings.userId,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        examNotifications: settings.examNotifications,
        assignmentNotifications: settings.assignmentNotifications,
        attendanceNotifications: settings.attendanceNotifications,
        courseNotifications: settings.courseNotifications,
        systemNotifications: settings.systemNotifications,
        emailFrequency: settings.emailFrequency as unknown as EmailFrequency,
        quietHoursStart: settings.quietHoursStart ?? undefined,
        quietHoursEnd: settings.quietHoursEnd ?? undefined,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      };
    } catch (error) {
      console.error("Error getting notification settings:", error);
      throw new Error("Failed to get notification settings");
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(
    userId: number,
    settings: UpdateNotificationSettingsRequest,
  ): Promise<NotificationSettingsResponse> {
    try {
      const updatedSettings = await prisma.notificationSettings.upsert({
        where: { userId },
        update: settings,
        create: {
          userId,
          ...settings,
        },
      });

      return {
        id: updatedSettings.id,
        userId: updatedSettings.userId,
        emailNotifications: updatedSettings.emailNotifications,
        pushNotifications: updatedSettings.pushNotifications,
        examNotifications: updatedSettings.examNotifications,
        assignmentNotifications: updatedSettings.assignmentNotifications,
        attendanceNotifications: updatedSettings.attendanceNotifications,
        courseNotifications: updatedSettings.courseNotifications,
        systemNotifications: updatedSettings.systemNotifications,
        emailFrequency:
          updatedSettings.emailFrequency as unknown as EmailFrequency,
        quietHoursStart: updatedSettings.quietHoursStart ?? undefined,
        quietHoursEnd: updatedSettings.quietHoursEnd ?? undefined,
        createdAt: updatedSettings.createdAt,
        updatedAt: updatedSettings.updatedAt,
      };
    } catch (error) {
      console.error("Error updating notification settings:", error);
      throw new Error("Failed to update notification settings");
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: {
    userId: number;
    category: PrismaCategory;
    type: PrismaType;
    title: string;
    message: string;
    metadata: Prisma.JsonValue;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
    id: number;
  }): Promise<void> {
    try {
      // Check if email notifications are enabled
      const emailEnabled = await this.emailService.isEmailNotificationEnabled(
        notification.userId,
        notification.category as unknown as NotificationCategory,
      );

      if (!emailEnabled) {
        console.log(
          `Email notifications disabled for user ${notification.userId}`,
        );
        return;
      }

      // Check quiet hours
      const inQuietHours = await this.emailService.isWithinQuietHours(
        notification.userId,
      );
      if (inQuietHours) {
        console.log(`User ${notification.userId} is in quiet hours`);
        return;
      }

      // Generate email template based on category
      let template;
      const user = notification.user;
      const userName = `${user.firstName} ${user.lastName}`;
      const metadata =
        (notification.metadata as unknown as NotificationMetadata) ||
        ({} as NotificationMetadata);
      const category = notification.category as unknown as NotificationCategory;

      switch (category) {
        case NotificationCategory.EXAM:
          template = this.emailService.generateExamNotificationTemplate({
            studentName: userName,
            courseName: (metadata.courseName as string) || "Unknown Course",
            examTitle: (metadata.examTitle as string) || notification.title,
            examDate: (metadata.examDate as string) || "TBD",
            examTime: (metadata.examTime as string) || "TBD",
            examLocation: (metadata.examLocation as string) || "TBD",
            examDuration: (metadata.examDuration as string) || "TBD",
          });
          break;

        case NotificationCategory.ASSIGNMENT:
          template = this.emailService.generateAssignmentNotificationTemplate({
            studentName: userName,
            courseName: (metadata.courseName as string) || "Unknown Course",
            assignmentTitle:
              (metadata.assignmentTitle as string) || notification.title,
            dueDate: (metadata.dueDate as string) || "TBD",
            dueTime: (metadata.dueTime as string) || "TBD",
            assignmentDescription:
              (metadata.assignmentDescription as string) || "",
          });
          break;

        case NotificationCategory.ATTENDANCE:
          template = this.emailService.generateAttendanceNotificationTemplate({
            studentName: userName,
            courseName: (metadata.courseName as string) || "Unknown Course",
            attendanceDate:
              (metadata.attendanceDate as string) || new Date().toISOString(),
            attendanceStatus:
              (metadata.attendanceStatus as string) || "Updated",
            attendancePercentage:
              (metadata.attendancePercentage as number) || 0,
          });
          break;

        case NotificationCategory.COURSE:
          template = this.emailService.generateCourseNotificationTemplate({
            studentName: userName,
            courseName: (metadata.courseName as string) || "Unknown Course",
            courseCode: (metadata.courseCode as string) || "N/A",
            professorName: (metadata.professorName as string) || "Professor",
            notificationMessage: notification.message,
            actionRequired: (metadata.actionRequired as boolean) || false,
          });
          break;

        case NotificationCategory.SYSTEM:
          template = this.emailService.generateSystemNotificationTemplate({
            userName,
            systemMessage: notification.message,
            actionRequired: (metadata.actionRequired as boolean) || false,
            supportContact: (metadata.supportContact as string) || "",
          });
          break;

        default:
          template = this.emailService.generateGenericNotificationTemplate(
            notification.title,
            notification.message,
            userName,
            category,
            notification.type as unknown as NotificationType,
          );
      }

      // Send email
      const emailSent = await this.emailService.sendEmailNotification(
        user.email,
        template,
      );

      // Update notification with email status
      if (emailSent) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: { isEmailSent: true },
        });
      }
    } catch (error) {
      console.error("Error sending email notification:", error);
    }
  }

  /**
   * Create exam notification
   */
  async createExamNotification(
    userId: number,
    examData: ExamNotificationData,
    sendEmail: boolean = true,
  ): Promise<NotificationResponse> {
    return this.createNotification({
      userId,
      title: `Exam Reminder: ${examData.examTitle}`,
      message: `Upcoming exam in ${examData.courseName} on ${examData.examDate} at ${examData.examTime}`,
      type: NotificationType.WARNING,
      category: NotificationCategory.EXAM,
      metadata: examData as unknown as Record<string, unknown>,
      sendEmail,
    });
  }

  /**
   * Create assignment notification
   */
  async createAssignmentNotification(
    userId: number,
    assignmentData: AssignmentNotificationData,
    sendEmail: boolean = true,
  ): Promise<NotificationResponse> {
    return this.createNotification({
      userId,
      title: `Assignment Due: ${assignmentData.assignmentTitle}`,
      message: `Assignment due in ${assignmentData.courseName} on ${assignmentData.dueDate} at ${assignmentData.dueTime}`,
      type: NotificationType.WARNING,
      category: NotificationCategory.ASSIGNMENT,
      metadata: assignmentData as unknown as Record<string, unknown>,
      sendEmail,
    });
  }

  /**
   * Create attendance notification
   */
  async createAttendanceNotification(
    userId: number,
    attendanceData: AttendanceNotificationData,
    sendEmail: boolean = false,
  ): Promise<NotificationResponse> {
    return this.createNotification({
      userId,
      title: `Attendance Updated: ${attendanceData.courseName}`,
      message: `Your attendance has been marked as ${attendanceData.attendanceStatus}`,
      type: NotificationType.INFO,
      category: NotificationCategory.ATTENDANCE,
      metadata: attendanceData as unknown as Record<string, unknown>,
      sendEmail,
    });
  }

  /**
   * Create course notification
   */
  async createCourseNotification(
    userId: number,
    courseData: CourseNotificationData,
    sendEmail: boolean = true,
  ): Promise<NotificationResponse> {
    return this.createNotification({
      userId,
      title: `Course Update: ${courseData.courseName}`,
      message: courseData.notificationMessage,
      type: courseData.actionRequired
        ? NotificationType.WARNING
        : NotificationType.INFO,
      category: NotificationCategory.COURSE,
      metadata: courseData as unknown as Record<string, unknown>,
      sendEmail,
    });
  }

  /**
   * Create system notification
   */
  async createSystemNotification(
    userId: number,
    systemData: SystemNotificationData,
    sendEmail: boolean = true,
  ): Promise<NotificationResponse> {
    return this.createNotification({
      userId,
      title: "System Notification",
      message: systemData.systemMessage,
      type: systemData.actionRequired
        ? NotificationType.ERROR
        : NotificationType.INFO,
      category: NotificationCategory.SYSTEM,
      metadata: systemData as unknown as Record<string, unknown>,
      sendEmail,
    });
  }
}

export const getNotificationService = () => new NotificationService();
export default NotificationService;
