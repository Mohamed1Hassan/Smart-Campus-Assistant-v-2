import {
  ChatStats,
  ChatAnalytics,
  ChatbotMetrics,
} from "../types/chatbot.types";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";

export class ChatAnalyticsService {
  private prisma = prisma;
  private metricsCache: Map<string, { data: unknown; timestamp: number }> =
    new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {}

  /**
   * Get comprehensive chat statistics
   */
  async getChatStats(timeRange?: {
    start: Date;
    end: Date;
  }): Promise<ChatStats> {
    const cacheKey = `chat_stats_${timeRange ? `${timeRange.start.getTime()}_${timeRange.end.getTime()}` : "all"}`;

    // Check cache first
    const cached = this.metricsCache.get(cacheKey);
    if (cached && this.isCacheValid(cacheKey)) {
      return cached.data as ChatStats;
    }

    try {
      const whereClause = timeRange
        ? {
            createdAt: {
              gte: timeRange.start,
              lte: timeRange.end,
            },
          }
        : {};

      // Get basic counts
      const [totalSessions, totalMessages, sessionsWithMessages] =
        await Promise.all([
          this.prisma.chatSession.count({ where: whereClause }),
          this.prisma.chatMessage.count({ where: whereClause }),
          this.prisma.chatSession.count({
            where: {
              ...whereClause,
              messages: {
                some: {},
              },
            },
          }),
        ]);

      // Calculate average session length
      const averageSessionLength =
        sessionsWithMessages > 0 ? totalMessages / sessionsWithMessages : 0;

      // Get most active users
      const mostActiveUsers = await this.getMostActiveUsers(whereClause);

      // Get popular questions
      const popularQuestions = await this.getPopularQuestions(whereClause);

      // Get response time statistics
      const responseTimeStats = await this.getResponseTimeStats(whereClause);

      const stats: ChatStats = {
        totalSessions,
        totalMessages,
        averageSessionLength: Math.round(averageSessionLength * 100) / 100,
        mostActiveUsers,
        popularQuestions,
        responseTimeStats,
      };

      // Cache the results
      this.cacheMetrics(cacheKey, stats);

      return stats;
    } catch (error) {
      console.error("Error getting chat stats:", error);
      throw error;
    }
  }

  /**
   * Get analytics for a specific user
   */
  async getUserAnalytics(
    userId: number,
    timeRange?: { start: Date; end: Date },
  ): Promise<ChatAnalytics> {
    try {
      const whereClause = {
        userId,
        ...(timeRange && {
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        }),
      };

      // Get user's message count
      const totalMessages = await this.prisma.chatMessage.count({
        where: {
          session: whereClause,
        },
      });

      // Get average response time for user's messages
      const responseTimes = await this.prisma.chatMessage.findMany({
        where: {
          session: whereClause,
          role: "ASSISTANT",
          responseTime: { not: null },
        },
        select: { responseTime: true },
      });

      const averageResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce(
              (sum, msg) => sum + (msg.responseTime || 0),
              0,
            ) / responseTimes.length
          : 0;

      // Get popular questions for this user
      const userMessages = await this.prisma.chatMessage.findMany({
        where: {
          session: whereClause,
          role: "USER",
        },
        select: { content: true, language: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      const popularQuestions = this.extractPopularQuestions(userMessages);

      // Get language distribution
      const languageDistribution =
        await this.getLanguageDistribution(whereClause);

      return {
        totalMessages,
        averageResponseTime: Math.round(averageResponseTime),
        popularQuestions,
        userSatisfaction: await this.calculateUserSatisfaction(userId),
        languageDistribution,
      };
    } catch (error) {
      console.error("Error getting user analytics:", error);
      throw error;
    }
  }

  /**
   * Get real-time chatbot metrics
   */
  async getChatbotMetrics(): Promise<ChatbotMetrics> {
    const cacheKey = "chatbot_metrics";

    // Check cache first
    const cached = this.metricsCache.get(cacheKey);
    if (cached && this.isCacheValid(cacheKey)) {
      return cached.data as ChatbotMetrics;
    }

    try {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Get requests per minute
      const requestsPerMinute = await this.prisma.chatMessage.count({
        where: {
          createdAt: { gte: oneMinuteAgo },
        },
      });

      // Get average response time (last hour)
      const recentResponses = await this.prisma.chatMessage.findMany({
        where: {
          createdAt: { gte: oneHourAgo },
          role: "ASSISTANT",
          responseTime: { not: null },
        },
        select: { responseTime: true },
      });

      const averageResponseTime =
        recentResponses.length > 0
          ? recentResponses.reduce(
              (sum, msg) => sum + (msg.responseTime || 0),
              0,
            ) / recentResponses.length
          : 0;

      // Get error rate (last hour)
      const totalRequests = await this.prisma.chatMessage.count({
        where: {
          createdAt: { gte: oneHourAgo },
        },
      });

      const errorCount = await this.prisma.chatMessage.count({
        where: {
          createdAt: { gte: oneHourAgo },
          metadata: {
            path: ["error"],
            not: null as unknown as Prisma.JsonNullValueFilter,
          },
        },
      });

      const errorRate =
        totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

      // Get active sessions
      const activeSessions = await this.prisma.chatSession.count({
        where: {
          isActive: true,
          lastMessageAt: { gte: oneHourAgo },
        },
      });

      // Get total users
      const totalUsers = await this.prisma.user.count();

      // Get language distribution
      const languageDistribution = await this.getLanguageDistribution({});

      // Get category distribution
      const categoryDistribution = await this.getCategoryDistribution();

      const metrics: ChatbotMetrics = {
        requestsPerMinute,
        averageResponseTime: Math.round(averageResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        activeSessions,
        totalUsers,
        languageDistribution,
        categoryDistribution,
      };

      // Cache the results
      this.cacheMetrics(cacheKey, metrics);

      return metrics;
    } catch (error) {
      console.error("Error getting chatbot metrics:", error);
      throw error;
    }
  }

  /**
   * Track message interaction
   */
  async trackMessage(
    sessionId: number,
    messageId: number,
    interaction: {
      type: "sent" | "received" | "error";
      responseTime?: number;
      satisfaction?: number;
      feedback?: string;
    },
  ): Promise<void> {
    try {
      const metadata = {
        interaction: {
          type: interaction.type,
          timestamp: new Date(),
          responseTime: interaction.responseTime,
          satisfaction: interaction.satisfaction,
          feedback: interaction.feedback,
        },
      };

      await this.prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          metadata: metadata as Prisma.InputJsonValue,
          responseTime: interaction.responseTime,
          isProcessed: interaction.type !== "error",
        },
      });

      // Update session last message time
      if (interaction.type === "sent") {
        await this.prisma.chatSession.update({
          where: { id: sessionId },
          data: { lastMessageAt: new Date() },
        });
      }
    } catch (error) {
      console.error("Error tracking message:", error);
    }
  }

  /**
   * Get most active users
   */
  private async getMostActiveUsers(
    whereClause: Prisma.ChatSessionWhereInput,
  ): Promise<
    Array<{
      userId: number;
      userName: string;
      messageCount: number;
    }>
  > {
    const userStats = await this.prisma.chatMessage.groupBy({
      by: ["sessionId"],
      where: {
        session: whereClause,
        role: "USER",
      },
      _count: { id: true },
    });

    const userIds = await this.prisma.chatSession.findMany({
      where: {
        id: { in: userStats.map((stat) => stat.sessionId) },
      },
      select: { userId: true, id: true },
    });

    const userMessageCounts = new Map<number, number>();
    userStats.forEach((stat) => {
      const session = userIds.find((s) => s.id === stat.sessionId);
      if (session) {
        const current = userMessageCounts.get(session.userId) || 0;
        userMessageCounts.set(session.userId, current + stat._count.id);
      }
    });

    const topUsers = Array.from(userMessageCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    const users = await this.prisma.user.findMany({
      where: { id: { in: topUsers.map(([userId]) => userId) } },
      select: { id: true, firstName: true, lastName: true },
    });

    return topUsers.map(([userId, messageCount]) => {
      const user = users.find((u) => u.id === userId);
      return {
        userId,
        userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
        messageCount,
      };
    });
  }

  /**
   * Get popular questions
   */
  private async getPopularQuestions(
    whereClause: Prisma.ChatSessionWhereInput,
  ): Promise<
    Array<{
      question: string;
      count: number;
      language: string;
    }>
  > {
    const userMessages = await this.prisma.chatMessage.findMany({
      where: {
        session: whereClause,
        role: "USER",
      },
      select: { content: true, language: true },
    });

    return this.extractPopularQuestions(userMessages);
  }

  /**
   * Extract popular questions from messages
   */
  private extractPopularQuestions(
    messages: Array<{ content: string; language: string }>,
  ): Array<{
    question: string;
    count: number;
    language: string;
  }> {
    const questionCounts = new Map<
      string,
      { count: number; language: string }
    >();

    messages.forEach((msg) => {
      const normalizedQuestion = msg.content.toLowerCase().trim();
      if (normalizedQuestion.length > 3) {
        // Filter out very short messages
        const existing = questionCounts.get(normalizedQuestion);
        if (existing) {
          existing.count++;
        } else {
          questionCounts.set(normalizedQuestion, {
            count: 1,
            language: msg.language,
          });
        }
      }
    });

    return Array.from(questionCounts.entries())
      .map(([question, data]) => ({
        question,
        count: data.count,
        language: data.language,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Get response time statistics
   */
  private async getResponseTimeStats(
    whereClause: Prisma.ChatSessionWhereInput,
  ): Promise<{
    average: number;
    median: number;
    p95: number;
  }> {
    const responseTimes = await this.prisma.chatMessage.findMany({
      where: {
        session: whereClause,
        role: "ASSISTANT",
        responseTime: { not: null },
      },
      select: { responseTime: true },
      orderBy: { responseTime: "asc" },
    });

    if (responseTimes.length === 0) {
      return { average: 0, median: 0, p95: 0 };
    }

    const times = responseTimes
      .map((msg) => msg.responseTime!)
      .filter((time) => time > 0);

    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    const median = times[Math.floor(times.length / 2)];
    const p95Index = Math.floor(times.length * 0.95);
    const p95 = times[p95Index] || times[times.length - 1];

    return {
      average: Math.round(average),
      median: Math.round(median),
      p95: Math.round(p95),
    };
  }

  /**
   * Get language distribution
   */
  private async getLanguageDistribution(
    whereClause: Prisma.ChatSessionWhereInput,
  ): Promise<Record<string, number>> {
    const languageStats = await this.prisma.chatMessage.groupBy({
      by: ["language"],
      where: {
        session: whereClause,
      },
      _count: { id: true },
    });

    const distribution: Record<string, number> = {};
    languageStats.forEach((stat) => {
      distribution[stat.language] = stat._count.id;
    });

    return distribution;
  }

  /**
   * Get category distribution
   */
  private async getCategoryDistribution(): Promise<Record<string, number>> {
    const messages = await this.prisma.chatMessage.findMany({
      where: {
        metadata: {
          path: ["type"],
          not: null as unknown as Prisma.JsonNullValueFilter,
        },
      },
      select: { metadata: true },
    });

    const distribution: Record<string, number> = {};
    messages.forEach((msg) => {
      const metadata = msg.metadata as Record<string, string>;
      if (metadata?.type) {
        distribution[metadata.type] = (distribution[metadata.type] || 0) + 1;
      }
    });

    return distribution;
  }

  /**
   * Calculate user satisfaction score
   */
  private async calculateUserSatisfaction(userId: number): Promise<number> {
    try {
      const satisfactionData = await this.prisma.chatMessage.findMany({
        where: {
          session: { userId },
          metadata: {
            path: ["interaction", "satisfaction"],
            not: null as unknown as Prisma.JsonNullValueFilter,
          },
        },
        select: { metadata: true },
      });

      if (satisfactionData.length === 0) {
        return 0;
      }

      const totalSatisfaction = satisfactionData.reduce((sum, msg) => {
        const metadata = msg.metadata as {
          interaction?: { satisfaction?: number };
        };
        return sum + (metadata?.interaction?.satisfaction || 0);
      }, 0);

      return (
        Math.round((totalSatisfaction / satisfactionData.length) * 100) / 100
      );
    } catch (error) {
      console.error("Error calculating user satisfaction:", error);
      return 0;
    }
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(key: string): boolean {
    const cached = this.metricsCache.get(key);
    if (!cached) return false;

    const now = Date.now();
    return now - cached.timestamp < this.CACHE_TTL;
  }

  /**
   * Cache metrics data
   */
  private cacheMetrics(
    key: string,
    data: ChatStats | ChatAnalytics | ChatbotMetrics,
  ): void {
    this.metricsCache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Clean up old cache entries
    if (this.metricsCache.size > 50) {
      const firstKey = this.metricsCache.keys().next().value;
      if (firstKey) {
        this.metricsCache.delete(firstKey);
      }
    }
  }

  /**
   * Clear analytics cache
   */
  clearCache(): void {
    this.metricsCache.clear();
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(timeRange?: { start: Date; end: Date }): Promise<{
    stats: ChatStats;
    metrics: ChatbotMetrics;
    exportDate: Date;
  }> {
    const [stats, metrics] = await Promise.all([
      this.getChatStats(timeRange),
      this.getChatbotMetrics(),
    ]);

    return {
      stats,
      metrics,
      exportDate: new Date(),
    };
  }
}

export const getChatAnalyticsService = () => new ChatAnalyticsService();
export default ChatAnalyticsService;
