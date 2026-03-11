// Security Service Types
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface GeofenceConfig {
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number; // in meters
  name?: string;
}

export interface LocationValidationResult {
  isValid: boolean;
  distance: number; // in meters
  isWithinRadius: boolean;
  accuracy: number;
  confidence: number;
  warnings: string[];
  errors: string[];
}

export interface DeviceFingerprint {
  id: string;
  userAgent: string;
  screen: {
    width: number;
    height: number;
    colorDepth: number;
  };
  timezone: string;
  language: string;
  platform: string;
  hardware: {
    cores: number;
    memory: number;
    devicePixelRatio: number;
  };
  canvas: string;
  webgl: string;
  audio: string;
  fonts: string[];
  plugins: string[];
  battery?: {
    level: number;
    charging: boolean;
  };
  network: {
    connection: string;
    effectiveType: string;
  };
  timestamp: number;
}

export interface DeviceValidationResult {
  isValid: boolean;
  isNewDevice: boolean;
  confidence: number;
  riskScore: number;
  warnings: string[];
  errors: string[];
  deviceInfo: DeviceFingerprint;
}

export interface FraudDetectionConfig {
  locationWeight: number;
  deviceWeight: number;
  timeWeight: number;
  behaviorWeight: number;
  photoWeight: number;
  thresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export interface FraudScore {
  overall: number;
  location: number;
  device: number;
  time: number;
  behavior: number;
  photo: number;
  factors: string[];
  confidence: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface FraudAlert {
  id: string;
  type:
    | "LOCATION_SPOOFING"
    | "TIME_MANIPULATION"
    | "DEVICE_SHARING"
    | "MULTIPLE_DEVICES"
    | "SUSPICIOUS_PATTERN"
    | "QR_SHARING";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  metadata: Record<string, unknown>;
  timestamp: number;
  studentId: number;
  qrCodeId: number;
}

export interface TimeValidationConfig {
  gracePeriod: number; // in minutes
  timezone: string;
  serverTimeOffset: number; // in milliseconds
  maxTimeDrift: number; // in milliseconds
}

export interface TimeValidationResult {
  isValid: boolean;
  isWithinWindow: boolean;
  isWithinGracePeriod: boolean;
  serverTime: number;
  clientTime: number;
  timeDifference: number;
  timezone: string;
  warnings: string[];
  errors: string[];
}

export interface PhotoVerificationConfig {
  minQuality: number; // 0-1
  maxFileSize: number; // in bytes
  allowedFormats: string[];
  requireFaceDetection: boolean;
  maxDimensions: {
    width: number;
    height: number;
  };
  minDimensions: {
    width: number;
    height: number;
  };
}

export interface PhotoVerificationResult {
  isValid: boolean;
  quality: number;
  hasFace: boolean;
  dimensions: {
    width: number;
    height: number;
  };
  fileSize: number;
  format: string;
  metadata: Record<string, unknown>;
  warnings: string[];
  errors: string[];
}

export interface SecurityMetrics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  fraudDetected: number;
  averageFraudScore: number;
  topFraudTypes: Array<{
    type: string;
    count: number;
  }>;
  deviceChanges: number;
  locationViolations: number;
  timeViolations: number;
  photoFailures: number;
}

export interface SecurityReport {
  period: {
    start: Date;
    end: Date;
  };
  metrics: SecurityMetrics;
  trends: {
    fraudTrend: "INCREASING" | "DECREASING" | "STABLE";
    riskTrend: "INCREASING" | "DECREASING" | "STABLE";
  };
  recommendations: string[];
  alerts: FraudAlert[];
}

export interface SecurityConfig {
  location: {
    enableGeofencing: boolean;
    maxAccuracy: number;
    minAccuracy: number;
    spoofingDetection: boolean;
  };
  device: {
    enableFingerprinting: boolean;
    allowDeviceChanges: boolean;
    maxDevicesPerUser: number;
  };
  fraud: FraudDetectionConfig;
  time: TimeValidationConfig;
  photo: PhotoVerificationConfig;
  analytics: {
    enableRealTimeMonitoring: boolean;
    reportInterval: number; // in minutes
    alertThresholds: {
      fraudScore: number;
      attemptRate: number;
    };
  };
}

export interface SecurityContext {
  studentId: number;
  qrCodeId: number;
  sessionId: string;
  timestamp: number;
  location?: LocationData;
  device?: DeviceFingerprint;
  photo?: string;
  userAgent: string;
  ipAddress: string;
}

export interface SecurityValidationResult {
  isValid: boolean;
  fraudScore: FraudScore;
  location: LocationValidationResult;
  device: DeviceValidationResult;
  time: TimeValidationResult;
  photo?: PhotoVerificationResult;
  alerts: FraudAlert[];
  warnings: string[];
  errors: string[];
}
