import { TimeValidationConfig, TimeValidationResult } from "./types";

/**
 * Time Validation Service
 * Handles time window validation, timezone conversion, and time manipulation detection
 */
export class TimeValidationService {
  private config: TimeValidationConfig;
  private serverTimeOffset: number = 0;

  constructor(config: TimeValidationConfig) {
    this.config = config;
    this.calculateServerTimeOffset();
  }

  /**
   * Calculate server time offset for client-server sync
   */
  private calculateServerTimeOffset(): void {
    // In a real implementation, this would be calculated by comparing
    // client and server timestamps during handshake
    this.serverTimeOffset = 0;
  }

  /**
   * Validate time window for attendance
   */
  public validateTimeWindow(
    clientTime: number,
    validFrom: number,
    validTo: number,
    gracePeriodMinutes?: number,
  ): TimeValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    const gracePeriod = gracePeriodMinutes || this.config.gracePeriod;
    const gracePeriodMs = gracePeriod * 60 * 1000;

    // Calculate server time
    const serverTime = this.getServerTime(clientTime);

    // Check if time is within valid window
    const isWithinWindow = serverTime >= validFrom && serverTime <= validTo;

    // Check if within grace period
    const isWithinGracePeriod = serverTime <= validTo + gracePeriodMs;

    // Check for time manipulation
    const timeDifference = Math.abs(serverTime - clientTime);
    if (timeDifference > this.config.maxTimeDrift) {
      errors.push(`Time manipulation detected: ${timeDifference}ms difference`);
    } else if (timeDifference > this.config.maxTimeDrift / 2) {
      warnings.push(`Large time difference: ${timeDifference}ms`);
    }

    // Check for suspicious timing patterns
    const hour = new Date(serverTime).getHours();
    if (hour < 6 || hour > 22) {
      warnings.push(`Unusual attendance time: ${hour}:00`);
    }

    // Check for rapid successive attempts
    const recentAttempts = this.getRecentAttempts();
    if (recentAttempts.length > 3) {
      warnings.push(
        `Multiple rapid attempts detected: ${recentAttempts.length} attempts`,
      );
    }

    // Validate timezone
    const clientTimezone = this.getClientTimezone();
    const expectedTimezone = this.config.timezone;
    if (clientTimezone !== expectedTimezone) {
      warnings.push(
        `Timezone mismatch: client=${clientTimezone}, expected=${expectedTimezone}`,
      );
    }

    const isValid =
      errors.length === 0 && (isWithinWindow || isWithinGracePeriod);

    return {
      isValid,
      isWithinWindow,
      isWithinGracePeriod,
      serverTime,
      clientTime,
      timeDifference,
      timezone: clientTimezone,
      warnings,
      errors,
    };
  }

  /**
   * Get server time based on client time and offset
   */
  private getServerTime(clientTime: number): number {
    return clientTime + this.serverTimeOffset;
  }

  /**
   * Get client timezone
   */
  private getClientTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      console.warn("Failed to get client timezone:", error);
      return "UTC";
    }
  }

  /**
   * Convert time between timezones
   */
  public convertTimezone(
    timestamp: number,
    fromTimezone: string,
    toTimezone: string,
  ): number {
    try {
      const date = new Date(timestamp);
      new Date(date.toLocaleString("en-US", { timeZone: fromTimezone }));
      const toDate = new Date(
        date.toLocaleString("en-US", { timeZone: toTimezone }),
      );

      return toDate.getTime();
    } catch (error) {
      console.error("Timezone conversion failed:", error);
      return timestamp;
    }
  }

  /**
   * Detect time manipulation attempts
   */
  public detectTimeManipulation(
    clientTime: number,
    serverTime: number,
    previousAttempts: number[],
  ): {
    isManipulated: boolean;
    confidence: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let confidence = 0;

    // Check for impossible time jumps
    if (previousAttempts.length > 0) {
      const lastAttempt = previousAttempts[previousAttempts.length - 1];
      const timeDiff = clientTime - lastAttempt;

      // Check for time going backwards
      if (timeDiff < 0) {
        reasons.push("Time went backwards");
        confidence += 0.4;
      }

      // Check for impossible time jumps
      if (timeDiff > 24 * 60 * 60 * 1000) {
        // More than 24 hours
        reasons.push("Impossible time jump detected");
        confidence += 0.3;
      }
    }

    // Check for client-server time mismatch
    const timeDifference = Math.abs(clientTime - serverTime);
    if (timeDifference > this.config.maxTimeDrift) {
      reasons.push(`Large time difference: ${timeDifference}ms`);
      confidence += 0.5;
    }

    // Check for suspicious timing patterns
    const minute = new Date(clientTime).getMinutes();
    const second = new Date(clientTime).getSeconds();

    // Check for exact round times (suspicious)
    if (minute === 0 && second === 0) {
      reasons.push("Suspicious exact time");
      confidence += 0.2;
    }

    // Check for repeated identical timestamps
    const identicalTimestamps = previousAttempts.filter(
      (attempt) => Math.abs(attempt - clientTime) < 1000, // Within 1 second
    );

    if (identicalTimestamps.length > 1) {
      reasons.push("Repeated identical timestamps");
      confidence += 0.3;
    }

    return {
      isManipulated: confidence > 0.6,
      confidence,
      reasons,
    };
  }

  /**
   * Validate grace period
   */
  public validateGracePeriod(
    attemptTime: number,
    sessionEndTime: number,
    gracePeriodMinutes: number,
  ): {
    isValid: boolean;
    isLate: boolean;
    minutesLate: number;
    withinGracePeriod: boolean;
  } {
    const isLate = attemptTime > sessionEndTime;
    const minutesLate = isLate
      ? Math.floor((attemptTime - sessionEndTime) / (60 * 1000))
      : 0;
    const withinGracePeriod = isLate && minutesLate <= gracePeriodMinutes;

    return {
      isValid: !isLate || withinGracePeriod,
      isLate,
      minutesLate,
      withinGracePeriod,
    };
  }

  /**
   * Get time window status
   */
  public getTimeWindowStatus(
    currentTime: number,
    validFrom: number,
    validTo: number,
  ): {
    status: "BEFORE" | "DURING" | "AFTER" | "EXPIRED";
    timeUntilStart: number;
    timeUntilEnd: number;
    timeSinceEnd: number;
  } {
    const now = currentTime;

    if (now < validFrom) {
      return {
        status: "BEFORE",
        timeUntilStart: validFrom - now,
        timeUntilEnd: validTo - now,
        timeSinceEnd: 0,
      };
    } else if (now >= validFrom && now <= validTo) {
      return {
        status: "DURING",
        timeUntilStart: 0,
        timeUntilEnd: validTo - now,
        timeSinceEnd: 0,
      };
    } else {
      return {
        status: "AFTER",
        timeUntilStart: 0,
        timeUntilEnd: 0,
        timeSinceEnd: now - validTo,
      };
    }
  }

  /**
   * Format time for display
   */
  public formatTimeForDisplay(timestamp: number, timezone?: string): string {
    try {
      const date = new Date(timestamp);
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: timezone || this.config.timezone,
      };

      return date.toLocaleString("en-US", options);
    } catch (error) {
      console.error("Time formatting failed:", error);
      return new Date(timestamp).toISOString();
    }
  }

  /**
   * Get timezone offset in minutes
   */
  public getTimezoneOffset(timezone: string): number {
    try {
      const now = new Date();
      const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
      const targetTime = new Date(
        utc.toLocaleString("en-US", { timeZone: timezone }),
      );
      const offset = (targetTime.getTime() - utc.getTime()) / (1000 * 60);

      return offset;
    } catch (error) {
      console.error("Timezone offset calculation failed:", error);
      return 0;
    }
  }

  /**
   * Check if time is within business hours
   */
  public isWithinBusinessHours(
    timestamp: number,
    timezone: string,
    businessHours: { start: number; end: number } = { start: 8, end: 18 },
  ): boolean {
    try {
      const date = new Date(timestamp);
      const localTime = new Date(
        date.toLocaleString("en-US", { timeZone: timezone }),
      );
      const hour = localTime.getHours();

      return hour >= businessHours.start && hour <= businessHours.end;
    } catch (error) {
      console.error("Business hours check failed:", error);
      return true; // Default to allowing if check fails
    }
  }

  /**
   * Get recent attempts for pattern analysis
   */
  private getRecentAttempts(): number[] {
    // This would typically fetch from database
    // For now, return empty array
    return [];
  }

  /**
   * Update server time offset
   */
  public updateServerTimeOffset(offset: number): void {
    this.serverTimeOffset = offset;
  }

  /**
   * Get current server time
   */
  public getCurrentServerTime(): number {
    return Date.now() + this.serverTimeOffset;
  }

  /**
   * Log time validation
   */
  private logTimeValidation(
    result: TimeValidationResult,
    context: string,
  ): void {
    const logData = {
      timestamp: new Date().toISOString(),
      context,
      validation: {
        isValid: result.isValid,
        isWithinWindow: result.isWithinWindow,
        isWithinGracePeriod: result.isWithinGracePeriod,
        timeDifference: result.timeDifference,
        timezone: result.timezone,
        warnings: result.warnings,
        errors: result.errors,
      },
    };

    if (result.errors.length > 0) {
      console.error("Time validation failed:", logData);
    } else if (result.warnings.length > 0) {
      console.warn("Time validation warnings:", logData);
    } else {
      console.log("Time validation successful:", logData);
    }
  }

  /**
   * Create time validation summary
   */
  public createTimeValidationSummary(results: TimeValidationResult[]): {
    totalAttempts: number;
    validAttempts: number;
    invalidAttempts: number;
    averageTimeDifference: number;
    timezoneIssues: number;
    manipulationAttempts: number;
  } {
    const totalAttempts = results.length;
    const validAttempts = results.filter((r) => r.isValid).length;
    const invalidAttempts = totalAttempts - validAttempts;

    const averageTimeDifference =
      results.reduce((sum, r) => sum + r.timeDifference, 0) / totalAttempts;

    const timezoneIssues = results.filter((r) =>
      r.warnings.some((w) => w.includes("Timezone")),
    ).length;

    const manipulationAttempts = results.filter((r) =>
      r.errors.some((e) => e.includes("manipulation")),
    ).length;

    return {
      totalAttempts,
      validAttempts,
      invalidAttempts,
      averageTimeDifference,
      timezoneIssues,
      manipulationAttempts,
    };
  }
}
