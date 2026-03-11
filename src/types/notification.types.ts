export enum NotificationType {
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  SUCCESS = "SUCCESS",
  URGENT = "URGENT",
}

export enum NotificationCategory {
  EXAM = "EXAM",
  ASSIGNMENT = "ASSIGNMENT",
  ATTENDANCE = "ATTENDANCE",
  COURSE = "COURSE",
  SYSTEM = "SYSTEM",
  ANNOUNCEMENT = "ANNOUNCEMENT",
  DEADLINE = "DEADLINE",
  REMINDER = "REMINDER",
}

export enum EmailFrequency {
  IMMEDIATE = "IMMEDIATE",
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  NEVER = "NEVER",
}

export interface NotificationMetadata {
  courseId?: number;
  courseName?: string;
  examId?: number;
  assignmentId?: number;
  attendanceSessionId?: string;
  dueDate?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  actionUrl?: string;
  [key: string]: unknown;
}

export interface CreateNotificationRequest {
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  metadata?: NotificationMetadata;
  sendEmail?: boolean;
}

export interface NotificationResponse {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  isRead: boolean;
  isEmailSent: boolean;
  metadata?: NotificationMetadata;
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
}

export interface NotificationSettingsResponse {
  id: number;
  userId: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  examNotifications: boolean;
  assignmentNotifications: boolean;
  attendanceNotifications: boolean;
  courseNotifications: boolean;
  systemNotifications: boolean;
  emailFrequency: EmailFrequency;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateNotificationSettingsRequest {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  examNotifications?: boolean;
  assignmentNotifications?: boolean;
  attendanceNotifications?: boolean;
  courseNotifications?: boolean;
  systemNotifications?: boolean;
  emailFrequency?: EmailFrequency;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byCategory: {
    [key in NotificationCategory]: number;
  };
  byType: {
    [key in NotificationType]: number;
  };
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface SocketNotificationData {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  metadata?: NotificationMetadata;
  createdAt: Date;
}

export interface NotificationFilters {
  category?: NotificationCategory;
  type?: NotificationType;
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface BulkNotificationRequest {
  userIds: number[];
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  metadata?: NotificationMetadata;
  sendEmail?: boolean;
}

// Email template types
export interface ExamNotificationData {
  studentName: string;
  courseName: string;
  examTitle: string;
  examDate: string;
  examTime: string;
  examLocation?: string;
  examDuration?: string;
}

export interface AssignmentNotificationData {
  studentName: string;
  courseName: string;
  assignmentTitle: string;
  dueDate: string;
  dueTime: string;
  assignmentDescription?: string;
}

export interface AttendanceNotificationData {
  studentName: string;
  courseName: string;
  attendanceDate: string;
  attendanceStatus: string;
  attendancePercentage?: number;
}

export interface CourseNotificationData {
  studentName: string;
  courseName: string;
  courseCode: string;
  professorName: string;
  notificationMessage: string;
  actionRequired?: boolean;
}

export interface SystemNotificationData {
  userName: string;
  systemMessage: string;
  actionRequired?: boolean;
  supportContact?: string;
}
