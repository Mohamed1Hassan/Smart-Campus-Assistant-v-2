import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/db";
import { JWTPayload } from "../utils/jwt";
import { Prisma, NotificationType, NotificationCategory } from "@prisma/client";

// Types
export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  userPermissions?: string[];
  sessionId?: string;
  courseId?: number;
}

export interface NotificationMessage {
  id: string;
  type: "SECURITY" | "ATTENDANCE" | "SYSTEM" | "EMERGENCY";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  message: string;
  category: string;
  data?: unknown;
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

export interface SecurityEvent {
  type: "FRAUD_ALERT" | "RISK_HIGH" | "DEVICE_CHANGE" | "LOCATION_SPOOF";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  sessionId: string;
  studentId?: string;
  description: string;
  metadata?: unknown;
  timestamp: Date;
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

export interface ConnectionStats {
  totalConnections: number;
  authenticatedConnections: number;
  sessionConnections: Map<string, number>;
  userConnections: Map<string, number>;
  lastActivity: Date;
}

// Event emitter for internal events
const eventEmitter = new EventEmitter();

export class SocketService {
  private io: SocketIOServer | null = null;
  private connections: Map<string, AuthenticatedSocket> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();
  private sessionUsers: Map<string, Set<string>> = new Map();
  private connectionStats: ConnectionStats = {
    totalConnections: 0,
    authenticatedConnections: 0,
    sessionConnections: new Map(),
    userConnections: new Map(),
    lastActivity: new Date(),
  };

  public initialize(server: HTTPServer): SocketIOServer {
    if (this.io) {
      console.warn("[SocketService] Already initialized");
      return this.io;
    }

    this.io = new SocketIOServer(server, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupEventHandlers();
    this.setupInternalEvents();
    this.startHealthCheck();

    console.log("[SocketService] Initialized successfully");
    return this.io;
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on("connection", (socket: AuthenticatedSocket) => {
      console.log(`[SocketService] New connection: ${socket.id}`);
      this.connectionStats.totalConnections++;
      this.connectionStats.lastActivity = new Date();

      // Handle authentication
      socket.on("authenticate", async (data: { token: string }) => {
        try {
          const secret = process.env.JWT_SECRET;
          if (!secret) {
            console.error("[SocketService] JWT_SECRET not configured");
            socket.emit("auth_error", {
              message: "Server configuration error",
            });
            return;
          }

          const decoded = jwt.verify(data.token, secret) as JWTPayload;
          const user = await prisma.user.findUnique({
            where: { id: Number(decoded.userId) },
            select: {
              id: true,
              email: true,
              role: true,
            },
          });

          if (!user) {
            socket.emit("auth_error", { message: "Invalid user" });
            return;
          }

          socket.userId = String(user.id);
          socket.userRole = user.role;
          this.connections.set(socket.id, socket);
          this.connectionStats.authenticatedConnections++;

          // Join user-specific room
          socket.join(`user:${user.id}`);

          // Join role-based rooms
          socket.join(`role:${user.role}`);

          socket.emit("authenticated", {
            userId: user.id,
            role: user.role,
          });

          console.log(
            `[SocketService] User authenticated: ${user.id} (${user.role})`,
          );
        } catch (error) {
          console.error("[SocketService] Authentication error:", error);
          socket.emit("auth_error", { message: "Authentication failed" });
        }
      });

      // Handle session joining
      socket.on("join_session", async (data: { sessionId: string }) => {
        try {
          if (!socket.userId) {
            socket.emit("error", { message: "Not authenticated" });
            return;
          }

          const session = await prisma.attendanceSession.findUnique({
            where: { id: data.sessionId },
            include: {
              course: {
                select: {
                  enrollments: {
                    select: { studentId: true },
                  },
                },
              },
            },
          });

          if (!session) {
            socket.emit("error", { message: "Session not found" });
            return;
          }

          // Check access permissions
          if (
            socket.userRole === "PROFESSOR" &&
            String(session.professorId) !== socket.userId
          ) {
            socket.emit("error", { message: "Access denied" });
            return;
          }

          if (socket.userRole === "STUDENT") {
            const isEnrolled = session.course.enrollments.some(
              (enrollment: { studentId: number }) =>
                String(enrollment.studentId) === socket.userId,
            );
            if (!isEnrolled) {
              socket.emit("error", { message: "Not enrolled in course" });
              return;
            }
          }

          socket.sessionId = data.sessionId;
          socket.courseId = session.courseId;

          // Join session room
          socket.join(`session:${data.sessionId}`);
          socket.join(`course:${session.courseId}`);

          // Update tracking
          if (!this.userSessions.has(socket.userId)) {
            this.userSessions.set(socket.userId, new Set());
          }
          this.userSessions.get(socket.userId)!.add(data.sessionId);

          if (!this.sessionUsers.has(data.sessionId)) {
            this.sessionUsers.set(data.sessionId, new Set());
          }
          this.sessionUsers.get(data.sessionId)!.add(socket.userId);

          // Update connection stats
          const currentCount =
            this.connectionStats.sessionConnections.get(data.sessionId) || 0;
          this.connectionStats.sessionConnections.set(
            data.sessionId,
            currentCount + 1,
          );

          socket.emit("session_joined", {
            sessionId: data.sessionId,
            courseId: session.courseId,
            title: session.title,
          });

          console.log(
            `[SocketService] User ${socket.userId} joined session ${data.sessionId}`,
          );
        } catch (error) {
          console.error("[SocketService] Join session error:", error);
          socket.emit("error", { message: "Failed to join session" });
        }
      });

      // ... (Other handlers like leave_session, disconnect, etc.)
      socket.on("leave_session", () => {
        if (socket.sessionId) {
          const sessionId = socket.sessionId;
          socket.leave(`session:${sessionId}`);
          socket.sessionId = undefined;
          socket.courseId = undefined;

          if (socket.userId && this.userSessions.has(socket.userId)) {
            this.userSessions.get(socket.userId)!.delete(sessionId);
          }

          if (this.sessionUsers.has(sessionId) && socket.userId) {
            this.sessionUsers.get(sessionId)!.delete(socket.userId);
          }

          const currentCount =
            this.connectionStats.sessionConnections.get(sessionId) || 0;
          if (currentCount > 0) {
            this.connectionStats.sessionConnections.set(
              sessionId,
              currentCount - 1,
            );
          }

          socket.emit("session_left", { sessionId });
        }
      });

      socket.on("disconnect", () => {
        this.handleDisconnection(socket);
      });
    });
  }

  private setupInternalEvents(): void {
    // Attendance events
    eventEmitter.on("attendance:marked", (data: AttendanceEvent) => {
      this.broadcastToSession(data.sessionId, "attendance:marked", data);
      this.sendNotification({
        type: "ATTENDANCE",
        category: "ATTENDANCE",
        priority: "MEDIUM",
        title: "Attendance Marked",
        message: `${data.studentName} marked attendance`,
        data,
        sessionId: data.sessionId,
        timestamp: new Date(),
        id: uuidv4(),
      });
    });

    // ... (Add all other internal events from legacy socket.service.ts)
    // NOTE: For brevity, I'm focusing on the core structure first.
    // I will add the rest in subsequent steps.
  }

  private handleDisconnection(socket: AuthenticatedSocket): void {
    if (socket.userId) {
      const currentCount =
        this.connectionStats.userConnections.get(socket.userId) || 0;
      if (currentCount > 0) {
        this.connectionStats.userConnections.set(
          socket.userId,
          currentCount - 1,
        );
      }

      if (socket.sessionId) {
        const sessCount =
          this.connectionStats.sessionConnections.get(socket.sessionId) || 0;
        if (sessCount > 0)
          this.connectionStats.sessionConnections.set(
            socket.sessionId,
            sessCount - 1,
          );

        if (this.sessionUsers.has(socket.sessionId)) {
          this.sessionUsers.get(socket.sessionId)!.delete(socket.userId);
        }
      }
    }

    this.connections.delete(socket.id);
    this.connectionStats.totalConnections--;
    if (socket.userId) this.connectionStats.authenticatedConnections--;
  }

  private startHealthCheck(): void {
    setInterval(() => {
      if (this.io) {
        this.io.emit("health_check", {
          timestamp: new Date(),
          stats: {
            totalConnections: this.connectionStats.totalConnections,
            authenticatedConnections:
              this.connectionStats.authenticatedConnections,
          },
        });
      }
    }, 30000);
  }

  // Public methods for broadcasting
  public broadcastToSession(
    sessionId: string,
    event: string,
    data: unknown,
  ): void {
    this.io?.to(`session:${sessionId}`).emit(event, data);
  }

  public broadcastToCourse(
    courseId: number,
    event: string,
    data: unknown,
  ): void {
    this.io?.to(`course:${courseId}`).emit(event, data);
  }

  public broadcastToUser(userId: string, event: string, data: unknown): void {
    this.io?.to(`user:${userId}`).emit(event, data);
  }

  public broadcastToRole(role: string, event: string, data: unknown): void {
    this.io?.to(`role:${role}`).emit(event, data);
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
        data: notification.metadata || notification.data,
        timestamp:
          notification.createdAt || notification.timestamp || new Date(),
        category: notification.category || "SYSTEM",
      },
      saveToDb,
    );
  }

  public getIO(): SocketIOServer | null {
    return this.io;
  }
}

// Export singleton
const socketService = new SocketService();
export default socketService;
