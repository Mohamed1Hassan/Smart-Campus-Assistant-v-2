import {
  SecurityMetrics,
  SecurityReport,
  FraudAlert,
  SecurityConfig,
  SecurityContext,
  FraudScore,
} from "./types";

/**
 * Security Analytics Service
 * Handles security metrics, reporting, and trend analysis
 */
export class SecurityAnalyticsService {
  private config: SecurityConfig;
  private metrics: Map<string, SecurityMetrics> = new Map();
  private alerts: FraudAlert[] = [];
  private performanceMetrics: Map<string, PerformanceMetric> = new Map();

  constructor(config: SecurityConfig) {
    this.config = config;
    this.initializeMetrics();
  }

  /**
   * Initialize security metrics
   */
  private initializeMetrics(): void {
    const initialMetrics: SecurityMetrics = {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      fraudDetected: 0,
      averageFraudScore: 0,
      topFraudTypes: [],
      deviceChanges: 0,
      locationViolations: 0,
      timeViolations: 0,
      photoFailures: 0,
    };

    this.metrics.set("overall", initialMetrics);
  }

  /**
   * Record security event
   */
  public recordSecurityEvent(
    eventType: SecurityEventType,
    context: SecurityContext,
    fraudScore?: FraudScore,
    alerts?: FraudAlert[],
  ): void {
    const timestamp = Date.now();
    const dateKey = this.getDateKey(timestamp);

    // Update overall metrics
    this.updateOverallMetrics(eventType, fraudScore, alerts);

    // Update daily metrics
    this.updateDailyMetrics(dateKey, eventType, fraudScore, alerts);

    // Record performance metrics
    this.recordPerformanceMetrics(eventType, timestamp);

    // Store alerts
    if (alerts) {
      this.alerts.push(...alerts);
    }

    // Log the event
    this.logSecurityEvent(eventType, context, fraudScore, alerts);
  }

  /**
   * Update overall metrics
   */
  private updateOverallMetrics(
    eventType: SecurityEventType,
    fraudScore?: FraudScore,
    alerts?: FraudAlert[],
  ): void {
    const metrics = this.metrics.get("overall")!;

    metrics.totalAttempts++;

    if (eventType === "SUCCESS") {
      metrics.successfulAttempts++;
    } else {
      metrics.failedAttempts++;
    }

    if (fraudScore && fraudScore.overall > 0.5) {
      metrics.fraudDetected++;
      metrics.averageFraudScore =
        (metrics.averageFraudScore * (metrics.fraudDetected - 1) +
          fraudScore.overall) /
        metrics.fraudDetected;
    }

    if (alerts) {
      this.updateFraudTypeMetrics(metrics, alerts);
    }
  }

  /**
   * Update daily metrics
   */
  private updateDailyMetrics(
    dateKey: string,
    eventType: SecurityEventType,
    fraudScore?: FraudScore,
    alerts?: FraudAlert[],
  ): void {
    let dailyMetrics = this.metrics.get(dateKey);
    if (!dailyMetrics) {
      dailyMetrics = {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        fraudDetected: 0,
        averageFraudScore: 0,
        topFraudTypes: [],
        deviceChanges: 0,
        locationViolations: 0,
        timeViolations: 0,
        photoFailures: 0,
      };
      this.metrics.set(dateKey, dailyMetrics);
    }

    dailyMetrics.totalAttempts++;

    if (eventType === "SUCCESS") {
      dailyMetrics.successfulAttempts++;
    } else {
      dailyMetrics.failedAttempts++;
    }

    if (fraudScore && fraudScore.overall > 0.5) {
      dailyMetrics.fraudDetected++;
      dailyMetrics.averageFraudScore =
        (dailyMetrics.averageFraudScore * (dailyMetrics.fraudDetected - 1) +
          fraudScore.overall) /
        dailyMetrics.fraudDetected;
    }

    if (alerts) {
      this.updateFraudTypeMetrics(dailyMetrics, alerts);
    }
  }

  /**
   * Update fraud type metrics
   */
  private updateFraudTypeMetrics(
    metrics: SecurityMetrics,
    alerts: FraudAlert[],
  ): void {
    for (const alert of alerts) {
      const existingType = metrics.topFraudTypes.find(
        (t) => t.type === alert.type,
      );
      if (existingType) {
        existingType.count++;
      } else {
        metrics.topFraudTypes.push({ type: alert.type, count: 1 });
      }
    }

    // Sort by count
    metrics.topFraudTypes.sort((a, b) => b.count - a.count);
  }

  /**
   * Record performance metrics
   */
  private recordPerformanceMetrics(
    eventType: SecurityEventType,
    timestamp: number,
  ): void {
    const metricKey = `${eventType}_${this.getDateKey(timestamp)}`;
    const existing = this.performanceMetrics.get(metricKey) || {
      eventType,
      count: 0,
      totalTime: 0,
      averageTime: 0,
      minTime: Infinity,
      maxTime: 0,
      lastUpdated: timestamp,
    };

    existing.count++;
    existing.lastUpdated = timestamp;
    this.performanceMetrics.set(metricKey, existing);
  }

  /**
   * Generate security report
   */
  public generateSecurityReport(
    startDate: Date,
    endDate: Date,
  ): SecurityReport {
    const period = { start: startDate, end: endDate };

    // Aggregate metrics for the period
    const aggregatedMetrics = this.aggregateMetricsForPeriod(
      startDate,
      endDate,
    );

    // Calculate trends
    const trends = this.calculateTrends(startDate, endDate);

    // Get alerts for the period
    const periodAlerts = this.getAlertsForPeriod(startDate, endDate);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      aggregatedMetrics,
      trends,
      periodAlerts,
    );

    return {
      period,
      metrics: aggregatedMetrics,
      trends,
      recommendations,
      alerts: periodAlerts,
    };
  }

  /**
   * Aggregate metrics for a specific period
   */
  private aggregateMetricsForPeriod(
    startDate: Date,
    endDate: Date,
  ): SecurityMetrics {
    const aggregated: SecurityMetrics = {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      fraudDetected: 0,
      averageFraudScore: 0,
      topFraudTypes: [],
      deviceChanges: 0,
      locationViolations: 0,
      timeViolations: 0,
      photoFailures: 0,
    };

    for (const [dateKey, metrics] of this.metrics) {
      if (dateKey === "overall") continue;

      const date = new Date(dateKey);
      if (date >= startDate && date <= endDate) {
        aggregated.totalAttempts += metrics.totalAttempts;
        aggregated.successfulAttempts += metrics.successfulAttempts;
        aggregated.failedAttempts += metrics.failedAttempts;
        aggregated.fraudDetected += metrics.fraudDetected;
        aggregated.deviceChanges += metrics.deviceChanges;
        aggregated.locationViolations += metrics.locationViolations;
        aggregated.timeViolations += metrics.timeViolations;
        aggregated.photoFailures += metrics.photoFailures;
      }
    }

    // Calculate average fraud score
    if (aggregated.fraudDetected > 0) {
      const totalFraudScore = Array.from(this.metrics.values())
        .filter((m) => m !== this.metrics.get("overall"))
        .reduce((sum, m) => sum + m.averageFraudScore * m.fraudDetected, 0);
      aggregated.averageFraudScore = totalFraudScore / aggregated.fraudDetected;
    }

    // Aggregate fraud types
    const fraudTypeMap = new Map<string, number>();
    for (const [dateKey, metrics] of this.metrics) {
      if (dateKey === "overall") continue;

      const date = new Date(dateKey);
      if (date >= startDate && date <= endDate) {
        for (const fraudType of metrics.topFraudTypes) {
          fraudTypeMap.set(
            fraudType.type,
            (fraudTypeMap.get(fraudType.type) || 0) + fraudType.count,
          );
        }
      }
    }

    aggregated.topFraudTypes = Array.from(fraudTypeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    return aggregated;
  }

  /**
   * Calculate security trends
   */
  private calculateTrends(
    startDate: Date,
    endDate: Date,
  ): {
    fraudTrend: "INCREASING" | "DECREASING" | "STABLE";
    riskTrend: "INCREASING" | "DECREASING" | "STABLE";
  } {
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000),
    );
    const midPoint = new Date(
      startDate.getTime() + (days / 2) * 24 * 60 * 60 * 1000,
    );

    const firstHalfMetrics = this.aggregateMetricsForPeriod(
      startDate,
      midPoint,
    );
    const secondHalfMetrics = this.aggregateMetricsForPeriod(midPoint, endDate);

    const fraudTrend = this.calculateTrend(
      firstHalfMetrics.fraudDetected,
      secondHalfMetrics.fraudDetected,
    );

    const riskTrend = this.calculateTrend(
      firstHalfMetrics.averageFraudScore,
      secondHalfMetrics.averageFraudScore,
    );

    return { fraudTrend, riskTrend };
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(
    first: number,
    second: number,
  ): "INCREASING" | "DECREASING" | "STABLE" {
    const change = ((second - first) / Math.max(first, 1)) * 100;

    if (change > 10) return "INCREASING";
    if (change < -10) return "DECREASING";
    return "STABLE";
  }

  /**
   * Get alerts for a specific period
   */
  private getAlertsForPeriod(startDate: Date, endDate: Date): FraudAlert[] {
    return this.alerts.filter((alert) => {
      const alertDate = new Date(alert.timestamp);
      return alertDate >= startDate && alertDate <= endDate;
    });
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(
    metrics: SecurityMetrics,
    trends: { fraudTrend: string; riskTrend: string },
    alerts: FraudAlert[],
  ): string[] {
    const recommendations: string[] = [];

    // High fraud rate recommendations
    if (metrics.fraudDetected / metrics.totalAttempts > 0.1) {
      recommendations.push(
        "High fraud rate detected. Consider implementing additional security measures.",
      );
    }

    // Device change recommendations
    if (metrics.deviceChanges > metrics.totalAttempts * 0.2) {
      recommendations.push(
        "Frequent device changes detected. Review device management policies.",
      );
    }

    // Location violation recommendations
    if (metrics.locationViolations > metrics.totalAttempts * 0.15) {
      recommendations.push(
        "High location violation rate. Review geofencing settings.",
      );
    }

    // Time violation recommendations
    if (metrics.timeViolations > metrics.totalAttempts * 0.1) {
      recommendations.push(
        "Time violations detected. Review time window settings.",
      );
    }

    // Photo failure recommendations
    if (metrics.photoFailures > metrics.totalAttempts * 0.2) {
      recommendations.push(
        "High photo verification failure rate. Review photo requirements.",
      );
    }

    // Trend-based recommendations
    if (trends.fraudTrend === "INCREASING") {
      recommendations.push(
        "Fraud trend is increasing. Consider tightening security measures.",
      );
    }

    if (trends.riskTrend === "INCREASING") {
      recommendations.push(
        "Risk trend is increasing. Review fraud detection thresholds.",
      );
    }

    // Alert-based recommendations
    const criticalAlerts = alerts.filter((a) => a.severity === "CRITICAL");
    if (criticalAlerts.length > 0) {
      recommendations.push(
        `${criticalAlerts.length} critical alerts require immediate attention.`,
      );
    }

    return recommendations;
  }

  /**
   * Get real-time security dashboard data
   */
  public getRealTimeDashboard(): {
    totalAttempts: number;
    successRate: number;
    fraudRate: number;
    activeAlerts: number;
    topFraudTypes: Array<{ type: string; count: number }>;
    recentAlerts: FraudAlert[];
  } {
    const overallMetrics = this.metrics.get("overall")!;
    const recentAlerts = this.alerts.filter(
      (alert) => Date.now() - alert.timestamp < 24 * 60 * 60 * 1000, // Last 24 hours
    );

    return {
      totalAttempts: overallMetrics.totalAttempts,
      successRate:
        overallMetrics.totalAttempts > 0
          ? overallMetrics.successfulAttempts / overallMetrics.totalAttempts
          : 0,
      fraudRate:
        overallMetrics.totalAttempts > 0
          ? overallMetrics.fraudDetected / overallMetrics.totalAttempts
          : 0,
      activeAlerts: recentAlerts.length,
      topFraudTypes: overallMetrics.topFraudTypes.slice(0, 5),
      recentAlerts: recentAlerts.slice(0, 10),
    };
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): {
    averageResponseTime: number;
    totalEvents: number;
    errorRate: number;
    peakHour: number;
  } {
    const allMetrics = Array.from(this.performanceMetrics.values());
    const totalEvents = allMetrics.reduce((sum, m) => sum + m.count, 0);
    const averageResponseTime =
      allMetrics.reduce((sum, m) => sum + m.averageTime, 0) / allMetrics.length;

    // Calculate error rate (simplified)
    const errorRate = 0; // This would be calculated based on actual error events

    // Calculate peak hour (simplified)
    const peakHour = 12; // This would be calculated based on actual data

    return {
      averageResponseTime,
      totalEvents,
      errorRate,
      peakHour,
    };
  }

  /**
   * Export security data
   */
  public exportSecurityData(
    startDate: Date,
    endDate: Date,
    format: "JSON" | "CSV" = "JSON",
  ): string {
    const report = this.generateSecurityReport(startDate, endDate);

    if (format === "JSON") {
      return JSON.stringify(report, null, 2);
    } else {
      return this.convertToCSV(report);
    }
  }

  /**
   * Convert report to CSV format
   */
  private convertToCSV(report: SecurityReport): string {
    const headers = [
      "Date",
      "Total Attempts",
      "Successful Attempts",
      "Failed Attempts",
      "Fraud Detected",
      "Average Fraud Score",
      "Device Changes",
      "Location Violations",
      "Time Violations",
      "Photo Failures",
    ];

    const rows = [headers.join(",")];

    // Add daily data
    for (const [dateKey, metrics] of this.metrics) {
      if (dateKey === "overall") continue;

      const date = new Date(dateKey);
      if (date >= report.period.start && date <= report.period.end) {
        const row = [
          dateKey,
          metrics.totalAttempts,
          metrics.successfulAttempts,
          metrics.failedAttempts,
          metrics.fraudDetected,
          metrics.averageFraudScore,
          metrics.deviceChanges,
          metrics.locationViolations,
          metrics.timeViolations,
          metrics.photoFailures,
        ];
        rows.push(row.join(","));
      }
    }

    return rows.join("\n");
  }

  /**
   * Get date key for metrics storage
   */
  private getDateKey(timestamp: number): string {
    return new Date(timestamp).toISOString().split("T")[0];
  }

  /**
   * Log security event
   */
  private logSecurityEvent(
    eventType: SecurityEventType,
    context: SecurityContext,
    fraudScore?: FraudScore,
    alerts?: FraudAlert[],
  ): void {
    const logData = {
      timestamp: new Date().toISOString(),
      eventType,
      context: {
        studentId: context.studentId,
        qrCodeId: context.qrCodeId,
        sessionId: context.sessionId,
      },
      fraudScore: fraudScore
        ? {
            overall: fraudScore.overall,
            riskLevel: fraudScore.riskLevel,
            factors: fraudScore.factors,
          }
        : null,
      alerts: alerts
        ? alerts.map((a) => ({
            type: a.type,
            severity: a.severity,
            description: a.description,
          }))
        : null,
    };

    console.log("Security event recorded:", logData);
  }

  /**
   * Clear old data to prevent memory issues
   */
  public cleanupOldData(daysToKeep: number = 30): void {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    // Remove old metrics
    for (const [dateKey] of this.metrics) {
      if (dateKey === "overall") continue;

      const date = new Date(dateKey);
      if (date < cutoffDate) {
        this.metrics.delete(dateKey);
      }
    }

    // Remove old alerts
    this.alerts = this.alerts.filter(
      (alert) => alert.timestamp > cutoffDate.getTime(),
    );

    // Remove old performance metrics
    for (const [key] of this.performanceMetrics) {
      const metric = this.performanceMetrics.get(key)!;
      if (metric.lastUpdated < cutoffDate.getTime()) {
        this.performanceMetrics.delete(key);
      }
    }
  }
}

// Supporting types
type SecurityEventType =
  | "SUCCESS"
  | "FAILED"
  | "FRAUD_DETECTED"
  | "LOCATION_INVALID"
  | "TIME_EXPIRED"
  | "DEVICE_MISMATCH";

interface PerformanceMetric {
  eventType: SecurityEventType;
  count: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  lastUpdated: number;
}
