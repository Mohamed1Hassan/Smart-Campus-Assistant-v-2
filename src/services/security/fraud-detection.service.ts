import {
  FraudDetectionConfig,
  FraudScore,
  FraudAlert,
  LocationData,
  DeviceFingerprint,
  SecurityContext,
} from "./types";

/**
 * Fraud Detection Service
 * Machine learning-based fraud detection with pattern recognition
 */
export class FraudDetectionService {
  private config: FraudDetectionConfig;
  private behaviorPatterns: Map<number, BehaviorPattern> = new Map();
  private fraudHistory: Map<number, FraudAttempt[]> = new Map();

  constructor(config: FraudDetectionConfig) {
    this.config = config;
  }

  /**
   * Calculate comprehensive fraud score
   */
  public calculateFraudScore(
    context: SecurityContext,
    locationData?: LocationData,
    deviceData?: DeviceFingerprint,
    photoData?: string,
  ): FraudScore {
    const factors: string[] = [];
    let locationScore = 0;
    let deviceScore = 0;
    let timeScore = 0;
    let behaviorScore = 0;
    let photoScore = 0;

    // Location-based fraud detection
    if (locationData) {
      locationScore = this.analyzeLocationFraud(context, locationData);
      if (locationScore > 0.3) factors.push("Suspicious location pattern");
    }

    // Device-based fraud detection
    if (deviceData) {
      deviceScore = this.analyzeDeviceFraud(context, deviceData);
      if (deviceScore > 0.3) factors.push("Device sharing or spoofing");
    }

    // Time-based fraud detection
    timeScore = this.analyzeTimeFraud(context);
    if (timeScore > 0.3) factors.push("Time manipulation detected");

    // Behavior-based fraud detection
    behaviorScore = this.analyzeBehaviorFraud(context);
    if (behaviorScore > 0.3) factors.push("Unusual behavior pattern");

    // Photo-based fraud detection
    if (photoData) {
      photoScore = this.analyzePhotoFraud(photoData);
      if (photoScore > 0.3) factors.push("Photo verification issues");
    }

    // Calculate weighted overall score
    const overall =
      (locationScore * this.config.locationWeight +
        deviceScore * this.config.deviceWeight +
        timeScore * this.config.timeWeight +
        behaviorScore * this.config.behaviorWeight +
        photoScore * this.config.photoWeight) /
      (this.config.locationWeight +
        this.config.deviceWeight +
        this.config.timeWeight +
        this.config.behaviorWeight +
        this.config.photoWeight);

    // Determine risk level
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    if (overall >= this.config.thresholds.critical) {
      riskLevel = "CRITICAL";
    } else if (overall >= this.config.thresholds.high) {
      riskLevel = "HIGH";
    } else if (overall >= this.config.thresholds.medium) {
      riskLevel = "MEDIUM";
    }

    // Calculate confidence based on data availability
    const dataPoints = [locationData, deviceData, photoData].filter(
      Boolean,
    ).length;
    const confidence = Math.min(1, dataPoints / 3);

    return {
      overall,
      location: locationScore,
      device: deviceScore,
      time: timeScore,
      behavior: behaviorScore,
      photo: photoScore,
      factors,
      confidence,
      riskLevel,
    };
  }

  /**
   * Analyze location-based fraud
   */
  private analyzeLocationFraud(
    context: SecurityContext,
    locationData: LocationData,
  ): number {
    let fraudScore = 0;

    // Check for impossible location jumps
    const userHistory = this.getUserLocationHistory();
    if (userHistory.length > 0) {
      const lastLocation = userHistory[userHistory.length - 1];
      const timeDiff = (locationData.timestamp - lastLocation.timestamp) / 1000; // seconds
      const distance = this.calculateDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        locationData.latitude,
        locationData.longitude,
      );

      const speed = distance / timeDiff; // m/s
      if (speed > 100) {
        // 360 km/h
        fraudScore += 0.5;
      }
    }

    // Check for suspicious accuracy
    if (locationData.accuracy < 1) {
      fraudScore += 0.3; // Suspiciously high accuracy
    } else if (locationData.accuracy > 100) {
      fraudScore += 0.2; // Very low accuracy
    }

    // Check for repeated identical locations
    const identicalLocations = userHistory.filter(
      (loc) =>
        Math.abs(loc.latitude - locationData.latitude) < 0.000001 &&
        Math.abs(loc.longitude - locationData.longitude) < 0.000001,
    );

    if (identicalLocations.length > 2) {
      fraudScore += 0.4;
    }

    return Math.min(1, fraudScore);
  }

  /**
   * Analyze device-based fraud
   */
  private analyzeDeviceFraud(
    context: SecurityContext,
    deviceData: DeviceFingerprint,
  ): number {
    let fraudScore = 0;

    // Check for device sharing patterns
    const userDevices = this.getUserDeviceHistory();
    const uniqueDevices = new Set(userDevices.map((d) => d.id));

    if (uniqueDevices.size > 3) {
      fraudScore += 0.4; // Too many devices
    }

    // Check for rapid device switching
    const recentDevices = userDevices.filter(
      (d) => context.timestamp - d.timestamp < 24 * 60 * 60 * 1000, // Last 24 hours
    );

    if (recentDevices.length > 2) {
      fraudScore += 0.3;
    }

    // Check for suspicious device characteristics
    if (
      deviceData.userAgent.includes("bot") ||
      deviceData.userAgent.includes("crawler") ||
      deviceData.userAgent.includes("spider")
    ) {
      fraudScore += 0.6;
    }

    // Check for virtual machine indicators
    if (this.isVirtualMachine(deviceData)) {
      fraudScore += 0.4;
    }

    return Math.min(1, fraudScore);
  }

  /**
   * Analyze time-based fraud
   */
  private analyzeTimeFraud(context: SecurityContext): number {
    let fraudScore = 0;

    // Check for time manipulation
    const clientTime = context.timestamp;
    const serverTime = Date.now();
    const timeDiff = Math.abs(serverTime - clientTime);

    if (timeDiff > 5 * 60 * 1000) {
      // More than 5 minutes difference
      fraudScore += 0.4;
    }

    // Check for suspicious timing patterns
    const userAttempts = this.getUserAttemptHistory(context.studentId);
    const recentAttempts = userAttempts.filter(
      (attempt) => context.timestamp - attempt.timestamp < 60 * 60 * 1000, // Last hour
    );

    if (recentAttempts.length > 5) {
      fraudScore += 0.3; // Too many attempts
    }

    // Check for off-hours attempts
    const hour = new Date(context.timestamp).getHours();
    if (hour < 6 || hour > 22) {
      fraudScore += 0.2; // Unusual hours
    }

    return Math.min(1, fraudScore);
  }

  /**
   * Analyze behavior-based fraud
   */
  private analyzeBehaviorFraud(context: SecurityContext): number {
    let fraudScore = 0;

    // Get user behavior pattern
    const pattern = this.getUserBehaviorPattern(context.studentId);
    if (!pattern) return 0;

    // Check for unusual attempt frequency
    const recentAttempts = pattern.attempts.filter(
      (attempt) => context.timestamp - attempt.timestamp < 24 * 60 * 60 * 1000,
    );

    const avgAttemptsPerDay =
      pattern.attempts.length / Math.max(1, pattern.daysActive);
    if (recentAttempts.length > avgAttemptsPerDay * 2) {
      fraudScore += 0.3;
    }

    // Check for unusual timing
    const timeOfDay = new Date(context.timestamp).getHours();
    const usualHours = pattern.attemptHours;
    const isUnusualTime = !usualHours.includes(timeOfDay);

    if (isUnusualTime) {
      fraudScore += 0.2;
    }

    // Check for pattern deviations
    const deviationScore = this.calculatePatternDeviation(context, pattern);
    fraudScore += deviationScore * 0.4;

    return Math.min(1, fraudScore);
  }

  /**
   * Analyze photo-based fraud
   */
  private analyzePhotoFraud(photoData: string): number {
    let fraudScore = 0;

    // Check for photo quality
    const quality = this.assessPhotoQuality(photoData);
    if (quality < 0.3) {
      fraudScore += 0.4; // Poor quality photo
    }

    // Check for photo metadata
    const metadata = this.extractPhotoMetadata(photoData);
    if (metadata.isEdited) {
      fraudScore += 0.3;
    }
    if (metadata.isScreenshot) {
      fraudScore += 0.5;
    }

    return Math.min(1, fraudScore);
  }

  /**
   * Generate fraud alerts based on score
   */
  public generateFraudAlerts(
    fraudScore: FraudScore,
    context: SecurityContext,
  ): FraudAlert[] {
    const alerts: FraudAlert[] = [];

    if (fraudScore.overall >= this.config.thresholds.critical) {
      alerts.push({
        id: this.generateAlertId(),
        type: "SUSPICIOUS_PATTERN",
        severity: "CRITICAL",
        description: "Critical fraud risk detected",
        metadata: { score: fraudScore.overall, factors: fraudScore.factors },
        timestamp: Date.now(),
        studentId: context.studentId,
        qrCodeId: context.qrCodeId,
      });
    }

    if (fraudScore.location >= 0.7) {
      alerts.push({
        id: this.generateAlertId(),
        type: "LOCATION_SPOOFING",
        severity: fraudScore.location >= 0.9 ? "HIGH" : "MEDIUM",
        description: "Suspicious location pattern detected",
        metadata: { locationScore: fraudScore.location },
        timestamp: Date.now(),
        studentId: context.studentId,
        qrCodeId: context.qrCodeId,
      });
    }

    if (fraudScore.device >= 0.7) {
      alerts.push({
        id: this.generateAlertId(),
        type: "DEVICE_SHARING",
        severity: fraudScore.device >= 0.9 ? "HIGH" : "MEDIUM",
        description: "Device sharing or spoofing detected",
        metadata: { deviceScore: fraudScore.device },
        timestamp: Date.now(),
        studentId: context.studentId,
        qrCodeId: context.qrCodeId,
      });
    }

    if (fraudScore.time >= 0.7) {
      alerts.push({
        id: this.generateAlertId(),
        type: "TIME_MANIPULATION",
        severity: fraudScore.time >= 0.9 ? "HIGH" : "MEDIUM",
        description: "Time manipulation detected",
        metadata: { timeScore: fraudScore.time },
        timestamp: Date.now(),
        studentId: context.studentId,
        qrCodeId: context.qrCodeId,
      });
    }

    return alerts;
  }

  /**
   * Update user behavior pattern
   */
  public updateBehaviorPattern(
    studentId: number,
    context: SecurityContext,
  ): void {
    const pattern = this.behaviorPatterns.get(studentId) || {
      studentId,
      attempts: [],
      daysActive: 0,
      attemptHours: [],
      averageAttemptTime: 0,
      lastUpdated: Date.now(),
    };

    pattern.attempts.push({
      timestamp: context.timestamp,
      location: context.location,
      device: context.device,
      success: true, // This would be determined by the actual result
    });

    // Update attempt hours
    const hour = new Date(context.timestamp).getHours();
    if (!pattern.attemptHours.includes(hour)) {
      pattern.attemptHours.push(hour);
    }

    // Update days active
    const today = new Date(context.timestamp).toDateString();
    const lastAttemptDate =
      pattern.attempts.length > 1
        ? new Date(
            pattern.attempts[pattern.attempts.length - 2].timestamp,
          ).toDateString()
        : null;

    if (lastAttemptDate !== today) {
      pattern.daysActive++;
    }

    pattern.lastUpdated = Date.now();
    this.behaviorPatterns.set(studentId, pattern);
  }

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check if device is virtual machine
   */
  private isVirtualMachine(device: DeviceFingerprint): boolean {
    const vmIndicators = [
      "virtualbox",
      "vmware",
      "qemu",
      "xen",
      "hyper-v",
      "parallels",
      "docker",
      "container",
    ];

    const userAgent = device.userAgent.toLowerCase();
    return vmIndicators.some((indicator) => userAgent.includes(indicator));
  }

  /**
   * Assess photo quality
   */
  private assessPhotoQuality(photoData: string): number {
    // This is a simplified implementation
    // In a real system, you would analyze the actual image
    try {
      const img = new Image();
      img.src = photoData;

      // Basic quality assessment based on image size and format
      if (photoData.includes("data:image/jpeg")) {
        return 0.8; // JPEG is generally good quality
      } else if (photoData.includes("data:image/png")) {
        return 0.9; // PNG is high quality
      } else if (photoData.includes("data:image/webp")) {
        return 0.7; // WebP is modern but compressed
      }

      return 0.5; // Unknown format
    } catch {
      return 0.1; // Error in processing
    }
  }

  /**
   * Extract photo metadata
   */
  private extractPhotoMetadata(photoData: string): {
    isEdited: boolean;
    isScreenshot: boolean;
  } {
    // This is a simplified implementation
    // In a real system, you would use proper image analysis
    return {
      isEdited: photoData.includes("edited") || photoData.includes("modified"),
      isScreenshot:
        photoData.includes("screenshot") || photoData.includes("screen"),
    };
  }

  /**
   * Calculate pattern deviation
   */
  private calculatePatternDeviation(
    context: SecurityContext,
    pattern: BehaviorPattern,
  ): number {
    // Calculate how much the current attempt deviates from the user's normal pattern
    let deviation = 0;

    // Time deviation
    const currentHour = new Date(context.timestamp).getHours();
    const usualHours = pattern.attemptHours;
    if (usualHours.length > 0) {
      const avgHour =
        usualHours.reduce((sum, hour) => sum + hour, 0) / usualHours.length;
      const hourDeviation = Math.abs(currentHour - avgHour) / 24;
      deviation += hourDeviation * 0.5;
    }

    // Frequency deviation
    const recentAttempts = pattern.attempts.filter(
      (attempt) => context.timestamp - attempt.timestamp < 24 * 60 * 60 * 1000,
    );
    const avgAttemptsPerDay =
      pattern.attempts.length / Math.max(1, pattern.daysActive);
    const frequencyDeviation =
      Math.abs(recentAttempts.length - avgAttemptsPerDay) / avgAttemptsPerDay;
    deviation += Math.min(frequencyDeviation, 1) * 0.5;

    return Math.min(deviation, 1);
  }

  /**
   * Get user location history
   */
  private getUserLocationHistory(): LocationData[] {
    // This would typically fetch from database
    return [];
  }

  /**
   * Get user device history
   */
  private getUserDeviceHistory(): DeviceFingerprint[] {
    // This would typically fetch from database
    return [];
  }

  /**
   * Get user attempt history
   */
  private getUserAttemptHistory(studentId: number): FraudAttempt[] {
    return this.fraudHistory.get(studentId) || [];
  }

  /**
   * Get user behavior pattern
   */
  private getUserBehaviorPattern(studentId: number): BehaviorPattern | null {
    return this.behaviorPatterns.get(studentId) || null;
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log fraud detection
   */
  private logFraudDetection(
    context: SecurityContext,
    fraudScore: FraudScore,
    alerts: FraudAlert[],
  ): void {
    const logData = {
      timestamp: new Date().toISOString(),
      studentId: context.studentId,
      qrCodeId: context.qrCodeId,
      fraudScore: {
        overall: fraudScore.overall,
        riskLevel: fraudScore.riskLevel,
        factors: fraudScore.factors,
      },
      alerts: alerts.map((alert) => ({
        type: alert.type,
        severity: alert.severity,
        description: alert.description,
      })),
    };

    if (
      fraudScore.riskLevel === "CRITICAL" ||
      fraudScore.riskLevel === "HIGH"
    ) {
      console.error("High fraud risk detected:", logData);
    } else if (fraudScore.riskLevel === "MEDIUM") {
      console.warn("Medium fraud risk detected:", logData);
    } else {
      console.log("Fraud detection completed:", logData);
    }
  }
}

// Supporting interfaces
interface BehaviorPattern {
  studentId: number;
  attempts: FraudAttempt[];
  daysActive: number;
  attemptHours: number[];
  averageAttemptTime: number;
  lastUpdated: number;
}

interface FraudAttempt {
  timestamp: number;
  location?: LocationData;
  device?: DeviceFingerprint;
  success: boolean;
}
