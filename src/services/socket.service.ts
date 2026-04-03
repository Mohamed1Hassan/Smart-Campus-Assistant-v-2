import { supabase } from "@/lib/supabase";
import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/db";
import { Prisma, NotificationType, NotificationCategory } from "@prisma/client";

// Types
export interface NotificationMessage {
  id: string;
  type: "SECURITY" | "ATTENDANCE" | "SYSTEM" | "EMERGENCY";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  message: string;
  category: string;
  data?: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  courseId?: number;
}

export interface AttendanceEvent {
  sessionId: string;
  studentId: string;
  studentName: string;
  timestamp: Date;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  fraudScore?: number;
  deviceFingerprint?: string;
  photoUrl?: string;
}

export interface SessionEvent {
  sessionId: string;
  courseId: number;
  professorId: string;
  title: string;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  timestamp: Date;
  reason?: string;
}

// Event emitter for internal events
const eventEmitter = new EventEmitter();

export class SocketService {
  private supabase = supabase;
  private channel = this.supabase.channel('smart-campus-realtime');

  constructor() {
    this.channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log('[SocketService] Connected to Supabase Realtime');
      }
    });
    this.setupInternalEvents();
  }

  // Helper to send a broadcast
  private async broadcast(target: string, event: string, payload: Record<string, unknown>) {
    try {
      // Create or get a channel for the specific target
      const channel = this.supabase.channel(target);
      
      // We don't necessarily need to subscribe to send, 
      // but some Supabase versions require it to be initialized.
      // We'll use the send method directly.
      await channel.send({
        type: 'broadcast',
        event: `${target}:${event}`,
        payload: payload, 
      });
    } catch (error) {
      console.error(`[SocketService] Broadcast error (${target}:${event}):`, error);
    }
  }

  private setupEventHandlers(): void {
    // Legacy - not needed for Supabase Realtime
  }

  private setupInternalEvents(): void {
    // Attendance events
    eventEmitter.on("attendance:marked", (data: AttendanceEvent) => {
      this.broadcastToSession(data.sessionId, "attendance:marked", data as unknown as Record<string, unknown>);
      this.sendNotification({
        type: "ATTENDANCE",
        category: "ATTENDANCE",
        priority: "MEDIUM",
        title: "Attendance Marked",
        message: `${data.studentName} marked attendance`,
        data: data as unknown as Record<string, unknown>,
        sessionId: data.sessionId,
        timestamp: new Date(),
        id: uuidv4(),
      });
    });

    // ... (Add all other internal events from legacy socket.service.ts)
    // NOTE: For brevity, I'm focusing on the core structure first.
    // I will add the rest in subsequent steps.
  }

  private handleDisconnection(): void {
    // Legacy
  }

  private startHealthCheck(): void {
    // Legacy
  }

  // Public methods for broadcasting
  public broadcastToSession(
    sessionId: string,
    event: string,
    data: Record<string, unknown>,
  ): void {
    this.broadcast(`session:${sessionId}`, event, data);
  }

  public broadcastToCourse(
    courseId: number,
    event: string,
    data: Record<string, unknown>,
  ): void {
    this.broadcast(`course:${courseId}`, event, data);
  }

  public broadcastToUser(userId: string, event: string, data: Record<string, unknown>): void {
    this.broadcast(`user:${userId}`, event, data);
  }

  public broadcastToRole(role: string, event: string, data: Record<string, unknown>): void {
    this.broadcast(`role:${role}`, event, data);
  }

  public sendNotification(
    notification: NotificationMessage,
    saveToDb: boolean = true,
  ): void {
    const notificationData = {
      ...notification,
      id: notification.id || uuidv4(),
    };
    if (notification.userId)
      this.broadcastToUser(
        notification.userId,
        "notification",
        notificationData,
      );
    if (notification.sessionId)
      this.broadcastToSession(
        notification.sessionId,
        "notification",
        notificationData,
      );
    if (notification.courseId)
      this.broadcastToCourse(
        notification.courseId,
        "notification",
        notificationData,
      );

    // Store in DB asynchronously
    if (saveToDb) {
      this.storeNotification(notificationData);
    }
  }

  private async storeNotification(
    notification: NotificationMessage,
  ): Promise<void> {
    try {
      if (!notification.userId) return;

      // Map internal types to Prisma NotificationType
      let dbType: NotificationType;
      switch (notification.type) {
        case "SECURITY":
          dbType = NotificationType.WARNING;
          break;
        case "EMERGENCY":
          dbType = NotificationType.URGENT;
          break;
        default:
          dbType = NotificationType.INFO;
      }

      await prisma.notification.create({
        data: {
          userId: parseInt(notification.userId),
          title: notification.title,
          message: notification.message,
          type: dbType,
          category: NotificationCategory.SYSTEM,
          metadata: (notification.data as Prisma.InputJsonValue) || {},
          isRead: false,
        },
      });
    } catch (error) {
      console.error("[SocketService] Failed to store notification:", error);
    }
  }

  // Emitters for other services to use
  public emitAttendanceMarked(data: AttendanceEvent): void {
    eventEmitter.emit("attendance:marked", data);
  }

  public emitAttendanceFailed(data: unknown): void {
    eventEmitter.emit("attendance:failed", data);
  }

  public emitFraudDetected(data: unknown): void {
    eventEmitter.emit("attendance:fraud_detected", data);
  }

  public emitSessionStarted(data: SessionEvent): void {
    eventEmitter.emit("session:started", data);
  }

  public emitSessionEnded(data: SessionEvent): void {
    eventEmitter.emit("session:ended", data);
  }

  public sendNotificationToUser(
    userId: number,
    notification: {
      id?: string;
      type?: string;
      category?: string;
      title: string;
      message: string;
      metadata?: unknown;
      data?: unknown;
      createdAt?: Date;
      timestamp?: Date;
    },
    saveToDb: boolean = true,
  ): void {
    this.sendNotification(
      {
        id: String(notification.id || uuidv4()),
        userId: String(userId),
        type: (notification.type || "SYSTEM") as
          | "SECURITY"
          | "ATTENDANCE"
          | "SYSTEM"
          | "EMERGENCY",
        priority: "MEDIUM",
        title: notification.title,
        message: notification.message,
        data: (notification.metadata || notification.data) as Record<string, unknown>,
        timestamp:
          notification.createdAt || notification.timestamp || new Date(),
        category: notification.category || "SYSTEM",
      },
      saveToDb,
    );
  }

  public getIO(): null {
    return null;
  }
}

// Export singleton
const socketService = new SocketService();
export default socketService;
