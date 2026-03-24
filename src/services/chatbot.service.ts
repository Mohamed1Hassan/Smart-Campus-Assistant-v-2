import {
  ChatMessage,
  ChatSession,
  ChatRequest,
  ChatResponse,
  ContextEnhancement,
  ChatbotError,
} from "../types/chatbot.types";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { AIService } from "./ai.service";
import { KnowledgeBaseService } from "./knowledgeBase.service";
import { ChatAnalyticsService } from "./chatAnalytics.service";

export class ChatbotService {
  private prisma = prisma;
  private aiService: AIService;
  private knowledgeBaseService: KnowledgeBaseService;
  private analyticsService: ChatAnalyticsService;

  constructor() {
    this.aiService = new AIService();
    this.knowledgeBaseService = new KnowledgeBaseService();
    this.analyticsService = new ChatAnalyticsService();
  }

  /**
   * Process a chat message and generate response
   */
  async processMessage(
    request: ChatRequest,
    userId: number,
  ): Promise<ChatResponse> {
    try {
      // Get or create chat session
      const session = await this.getOrCreateSession(
        request.sessionId || 0,
        userId,
        request.language || "en",
      );

      // Save user message
      await this.saveMessage({
        sessionId: session.id!,
        role: "USER",
        content: request.message,
        language: request.language || "en",
        metadata: request.context as Prisma.InputJsonValue,
      });

      // Build context for AI
      const context = await this.buildContext(userId, session, request);

      // Check for secret admin command
      if (request.message.trim() === "AdminPassword@tiba99") {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });

        if (user?.role === "ADMIN") {
          // Admin identified, send redirect response without calling AI
          const adminMessage = await this.saveMessage({
            sessionId: session.id!,
            role: "ASSISTANT",
            content: "Admin verified. Initializing system override...",
            language: request.language || "en",
            metadata: { redirect: "/dashboard/admin" },
          });

          await this.updateSession(session.id!, {
            lastMessageAt: new Date(),
          });

          return {
            message: adminMessage,
            session,
            suggestions: [],
            analytics: await this.analyticsService.getUserAnalytics(userId),
          };
        } else {
          // Regular user trying to be smart
          const denialMessage = await this.saveMessage({
            sessionId: session.id!,
            role: "ASSISTANT",
            content: "Command not recognized or access denied.",
            language: request.language || "en",
          });

          return {
            message: denialMessage,
            session,
            suggestions: [],
            analytics: await this.analyticsService.getUserAnalytics(userId),
          };
        }
      }

      // Generate AI response
      const aiResponse = await this.aiService.generateResponse(
        request.message,
        context,
        request.language || "en",
      );

      // Save AI response
      const assistantMessage = await this.saveMessage({
        sessionId: session.id!,
        role: "ASSISTANT",
        content: aiResponse.content,
        language: aiResponse.language,
        metadata: aiResponse.metadata as Prisma.InputJsonValue,
        responseTime: aiResponse.responseTime,
      });

      // Update session
      await this.updateSession(session.id!, {
        lastMessageAt: new Date(),
        language: aiResponse.language,
      });

      // Track analytics
      await this.analyticsService.trackMessage(
        session.id!,
        assistantMessage.id!,
        {
          type: "received",
          responseTime: aiResponse.responseTime,
        },
      );

      // Get suggestions
      const suggestions = await this.knowledgeBaseService.getSuggestions(
        request.message,
        aiResponse.language,
        5,
      );

      // Get user analytics
      const analytics = await this.analyticsService.getUserAnalytics(userId);

      return {
        message: assistantMessage,
        session,
        suggestions,
        analytics,
      };
    } catch (error) {
      console.error("Error processing message:", error);

      // Track error
      if (request.sessionId) {
        await this.analyticsService.trackMessage(request.sessionId, 0, {
          type: "error",
        });
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new ChatbotError({
        code: "MESSAGE_PROCESSING_ERROR",
        message: "Failed to process message",
        details: { error: errorMessage },
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get or create chat session
   */
  private async getOrCreateSession(
    sessionId: number,
    userId: number,
    language: string,
  ): Promise<ChatSession> {
    if (sessionId > 0) {
      const existingSession = await this.prisma.chatSession.findFirst({
        where: {
          id: sessionId,
          userId,
          isActive: true,
        },
      });

      if (existingSession) {
        return existingSession as ChatSession;
      }
    }

    // Create new session
    const newSession = await this.prisma.chatSession.create({
      data: {
        userId,
        language,
        isActive: true,
        context: {},
      },
    });

    return newSession as ChatSession;
  }

  /**
   * Save message to database
   */
  private async saveMessage(messageData: {
    sessionId: number;
    role: "USER" | "ASSISTANT" | "SYSTEM";
    content: string;
    language: string;
    metadata?: Prisma.InputJsonValue;
    responseTime?: number;
  }): Promise<ChatMessage> {
    const message = await this.prisma.chatMessage.create({
      data: {
        sessionId: messageData.sessionId,
        role: messageData.role,
        content: messageData.content,
        language: messageData.language,
        metadata: messageData.metadata,
        responseTime: messageData.responseTime,
        isProcessed: true,
      },
    });

    return message as ChatMessage;
  }

  /**
   * Update session
   */
  private async updateSession(
    sessionId: number,
    updates: {
      lastMessageAt?: Date | null;
      language?: string;
      context?: Prisma.InputJsonValue;
    },
  ): Promise<void> {
    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Build context for AI processing
   */
  private async buildContext(
    userId: number,
    session: ChatSession,
    request: ChatRequest,
  ): Promise<ContextEnhancement> {
    const context: ContextEnhancement = {};

    try {
      // Get user profile
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          enrollments: {
            include: {
              course: {
                include: {
                  professor: true,
                  schedules: true,
                },
              },
            },
          },
        },
      });

      if (user) {
        context.userProfile = {
          role: user.role,
          courses: user.enrollments.map((e) => e.course.courseCode),
          preferences: {
            language: session.language,
            notifications: true,
          },
        };

        // Get course context for enrolled courses
        if (user.enrollments.length > 0) {
          const primaryCourse = user.enrollments[0].course;
          context.courseContext = {
            courseId: primaryCourse.id,
            courseCode: primaryCourse.courseCode,
            courseName: primaryCourse.courseName,
            professorName: `${primaryCourse.professor.firstName} ${primaryCourse.professor.lastName}`,
            schedule: primaryCourse.schedules,
            assignments: [], // Would be loaded from assignments table
            announcements: [], // Would be loaded from announcements
          };

          // Add all user courses for better context
          context.userCourses = user.enrollments.map((enrollment) => ({
            courseId: enrollment.course.id,
            courseCode: enrollment.course.courseCode,
            courseName: enrollment.course.courseName,
            professorName: `${enrollment.course.professor.firstName} ${enrollment.course.professor.lastName}`,
            schedule: enrollment.course.schedules,
            assignments: [],
            announcements: [],
          }));
        }
      }

      // Add request context
      if (request.context) {
        context.systemContext = {
          ...context.systemContext,
          ...request.context,
        };
      }

      // Add session context
      if (session.context) {
        context.systemContext = {
          ...context.systemContext,
          sessionContext: session.context,
        };
      }
    } catch (error) {
      console.error("Error building context:", error);
    }

    return context;
  }

  /**
   * Get chat history for a session
   */
  async getChatHistory(
    sessionId: number,
    userId: number,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{
    messages: ChatMessage[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      // Verify session belongs to user
      const session = await this.prisma.chatSession.findFirst({
        where: {
          id: sessionId,
          userId,
        },
      });

      if (!session) {
        throw new ChatbotError({
          code: "SESSION_NOT_FOUND",
          message: "Chat session not found",
          timestamp: new Date(),
        });
      }

      // Get messages
      const [messages, totalCount] = await Promise.all([
        this.prisma.chatMessage.findMany({
          where: { sessionId },
          orderBy: { createdAt: "asc" },
          skip: offset,
          take: limit,
        }),
        this.prisma.chatMessage.count({
          where: { sessionId },
        }),
      ]);

      return {
        messages: messages as ChatMessage[],
        totalCount,
        hasMore: offset + limit < totalCount,
      };
    } catch (error) {
      console.error("Error getting chat history:", error);
      throw error;
    }
  }

  /**
   * Get user's chat sessions
   */
  async getUserSessions(
    userId: number,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{
    sessions: ChatSession[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      const [sessions, totalCount] = await Promise.all([
        this.prisma.chatSession.findMany({
          where: { userId },
          orderBy: { lastMessageAt: "desc" },
          skip: offset,
          take: limit,
          include: {
            messages: {
              take: 1,
              orderBy: { createdAt: "desc" },
            },
          },
        }),
        this.prisma.chatSession.count({
          where: { userId },
        }),
      ]);

      return {
        sessions: sessions as ChatSession[],
        totalCount,
        hasMore: offset + limit < totalCount,
      };
    } catch (error) {
      console.error("Error getting user sessions:", error);
      throw error;
    }
  }

  /**
   * Clear chat history for a session
   */
  async clearChatHistory(sessionId: number, userId: number): Promise<void> {
    try {
      // Verify session belongs to user
      const session = await this.prisma.chatSession.findFirst({
        where: {
          id: sessionId,
          userId,
        },
      });

      if (!session) {
        throw new ChatbotError({
          code: "SESSION_NOT_FOUND",
          message: "Chat session not found",
          timestamp: new Date(),
        });
      }

      // Delete all messages in the session
      await this.prisma.chatMessage.deleteMany({
        where: { sessionId },
      });

      // Reset session
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          lastMessageAt: null,
          context: {},
        },
      });
    } catch (error) {
      console.error("Error clearing chat history:", error);
      throw error;
    }
  }

  /**
   * Clear all chat history for a user
   */
  async clearAllUserHistory(userId: number): Promise<void> {
    try {
      // Get all user sessions
      const sessions = await this.prisma.chatSession.findMany({
        where: { userId },
        select: { id: true },
      });

      const sessionIds = sessions.map((s) => s.id);

      if (sessionIds.length > 0) {
        // Delete all messages
        await this.prisma.chatMessage.deleteMany({
          where: {
            sessionId: { in: sessionIds },
          },
        });

        // Delete all sessions
        await this.prisma.chatSession.deleteMany({
          where: { userId },
        });
      }
    } catch (error) {
      console.error("Error clearing all user history:", error);
      throw error;
    }
  }

  /**
   * Get quick suggestions
   */
  async getQuickSuggestions(
    userId: number,
    language: string = "en",
    limit: number = 5,
  ): Promise<string[]> {
    try {
      // Get user's recent messages for context
      const recentMessages = await this.prisma.chatMessage.findMany({
        where: {
          session: { userId },
          role: "USER",
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { content: true },
      });

      // Generate suggestions based on recent activity
      const recentContent = recentMessages.map((m) => m.content).join(" ");
      const suggestions = await this.knowledgeBaseService.getSuggestions(
        recentContent,
        language,
        limit,
      );

      return suggestions;
    } catch (error) {
      console.error("Error getting quick suggestions:", error);
      return this.knowledgeBaseService
        .getDefaultSuggestions(language)
        .slice(0, limit);
    }
  }

  /**
   * Get FAQ items
   */
  async getFAQItems(
    language: string = "en",
    limit: number = 10,
  ): Promise<
    Array<{
      question: string;
      answer: string;
      category: string;
    }>
  > {
    try {
      const faqItems = await this.knowledgeBaseService.getFAQItems(
        language,
        limit,
      );
      return faqItems.map((item) => ({
        question: item.question,
        answer: item.answer,
        category: item.category,
      }));
    } catch (error) {
      console.error("Error getting FAQ items:", error);
      return [];
    }
  }

  /**
   * Update session name
   */
  async updateSessionName(
    sessionId: number,
    userId: number,
    sessionName: string,
  ): Promise<void> {
    try {
      const session = await this.prisma.chatSession.findFirst({
        where: {
          id: sessionId,
          userId,
        },
      });

      if (!session) {
        throw new ChatbotError({
          code: "SESSION_NOT_FOUND",
          message: "Chat session not found",
          timestamp: new Date(),
        });
      }

      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { sessionName },
      });
    } catch (error) {
      console.error("Error updating session name:", error);
      throw error;
    }
  }

  /**
   * Deactivate session
   */
  async deactivateSession(sessionId: number, userId: number): Promise<void> {
    try {
      const session = await this.prisma.chatSession.findFirst({
        where: {
          id: sessionId,
          userId,
        },
      });

      if (!session) {
        throw new ChatbotError({
          code: "SESSION_NOT_FOUND",
          message: "Chat session not found",
          timestamp: new Date(),
        });
      }

      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { isActive: false },
      });
    } catch (error) {
      console.error("Error deactivating session:", error);
      throw error;
    }
  }

  /**
   * Get chatbot statistics
   */
  async getChatbotStats(timeRange?: { start: Date; end: Date }) {
    return await this.analyticsService.getChatStats(timeRange);
  }

  /**
   * Get chatbot metrics
   */
  async getChatbotMetrics() {
    return await this.analyticsService.getChatbotMetrics();
  }

  /**
   * Track user feedback
   */
  async trackFeedback(
    sessionId: number,
    messageId: number,
    feedback: {
      satisfaction: number;
      comment?: string;
    },
  ): Promise<void> {
    try {
      await this.analyticsService.trackMessage(sessionId, messageId, {
        type: "received",
        satisfaction: feedback.satisfaction,
        feedback: feedback.comment,
      });
    } catch (error) {
      console.error("Error tracking feedback:", error);
    }
  }

  /**
   * Refresh knowledge base
   */
  async refreshKnowledgeBase(): Promise<void> {
    await this.knowledgeBaseService.refreshKnowledgeBase();
  }

  /**
   * Clear AI cache
   */
  clearAICache(): void {
    this.aiService.clearCache();
  }

  /**
   * Clear analytics cache
   */
  clearAnalyticsCache(): void {
    this.analyticsService.clearCache();
  }
}

export const getChatbotService = () => new ChatbotService();
export default ChatbotService;
