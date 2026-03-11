import prisma from "@/lib/db";
import { AlertSeverity, Prisma } from "@prisma/client";

export class SecurityService {
  /**
   * Search and paginate fraud alerts
   */
  static async searchFraudAlerts(params: {
    page?: number;
    limit?: number;
    search?: string;
    severity?: AlertSeverity;
    isResolved?: boolean;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.FraudAlertWhereInput = {};

    if (params.search) {
      where.OR = [
        {
          student: {
            OR: [
              { firstName: { contains: params.search, mode: "insensitive" } },
              { lastName: { contains: params.search, mode: "insensitive" } },
              {
                universityId: { contains: params.search, mode: "insensitive" },
              },
            ],
          },
        },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    if (params.severity) {
      where.severity = params.severity;
    }

    if (params.isResolved !== undefined) {
      where.isResolved = params.isResolved;
    }

    const [alerts, total] = await Promise.all([
      prisma.fraudAlert.findMany({
        where,
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
              universityId: true,
            },
          },
          qrCode: {
            select: {
              course: {
                select: {
                  courseCode: true,
                  courseName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.fraudAlert.count({ where }),
    ]);

    const formattedAlerts = alerts.map((alert) => ({
      id: alert.id.toString(),
      studentName: `${alert.student.firstName} ${alert.student.lastName}`,
      studentId: alert.student.universityId,
      courseCode: alert.qrCode?.course?.courseCode || "N/A",
      courseName: alert.qrCode?.course?.courseName || "N/A",
      type: alert.alertType,
      severity: alert.severity,
      description: alert.description,
      isResolved: alert.isResolved,
      createdAt: alert.createdAt,
    }));

    return {
      alerts: formattedAlerts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Resolve or Dismiss a fraud alert
   */
  static async resolveAlert(alertId: number, resolvedBy: number) {
    return prisma.fraudAlert.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy,
      },
    });
  }

  /**
   * Get security dashboard summary stats
   */
  static async getSecuritySummary() {
    const [highRiskCount, pendingReviewCount] = await Promise.all([
      prisma.fraudAlert.count({
        where: {
          severity: { in: ["HIGH", "CRITICAL"] },
          isResolved: false,
        },
      }),
      prisma.fraudAlert.count({
        where: { isResolved: false },
      }),
    ]);

    return {
      highRiskCount,
      pendingReviewCount,
    };
  }
}
