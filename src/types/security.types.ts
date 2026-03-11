// Security and Privacy Types

export interface PrivacySettings {
  enableLocation: boolean;
  enableDeviceTracking: boolean;
  enablePhotoCapture: boolean;
  enableBiometricData: boolean;
  enableAnalytics: boolean;
  enableCrashFileTexting: boolean;
  dataRetentionDays: number;
  allowDataSharing: boolean;
  allowThirdPartyAccess: boolean;
}

export interface PermissionSettings {
  locationPermission: "GRANTED" | "DENIED" | "PROMPT";
  cameraPermission: "GRANTED" | "DENIED" | "PROMPT";
  microphonePermission: "GRANTED" | "DENIED" | "PROMPT";
  storagePermission: "GRANTED" | "DENIED" | "PROMPT";
  notificationPermission: "GRANTED" | "DENIED" | "PROMPT";
  autoGrantPermissions: boolean;
  permissionTimeout: number;
}

export type SecurityLevel = "LOW" | "MEDIUM" | "HIGH" | "MAXIMUM";

export interface SecurityPreferences {
  securityLevel: SecurityLevel;
  enableTwoFactor: boolean;
  enableBiometricAuth: boolean;
  enableDeviceLock: boolean;
  enableAutoLock: boolean;
  autoLockTimeout: number;
  enableFraudDetection: boolean;
  enableRiskAssessment: boolean;
  riskThreshold: number;
  enableEncryption: boolean;
  enableSecureStorage: boolean;
}

export interface DeviceSettings {
  enableDeviceRegistration: boolean;
  enableDeviceFingerprinting: boolean;
  enableHardwareFingerprinting: boolean;
  enableBrowserFingerprinting: boolean;
  enableNetworkFingerprinting: boolean;
  enableCanvasFingerprinting: boolean;
  enableWebGLFingerprinting: boolean;
  enableAudioFingerprinting: boolean;
  enableFontFingerprinting: boolean;
  maxDevices: number;
  deviceTimeout: number;
}

export interface NotificationSettings {
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  enableInAppNotifications: boolean;
  notificationFrequency: "IMMEDIATE" | "HOURLY" | "DAILY" | "WEEKLY";
  enableSecurityAlerts: boolean;
  enableFraudWarnings: boolean;
  enableSystemUpdates: boolean;
  enableMarketingEmails: boolean;
}

export interface DataSettings {
  enableDataSync: boolean;
  enableCloudBackup: boolean;
  enableLocalBackup: boolean;
  backupFrequency: "DAILY" | "WEEKLY" | "MONTHLY";
  enableDataCompression: boolean;
  enableDataEncryption: boolean;
  maxStorageSize: number;
  enableDataExport: boolean;
  enableDataImport: boolean;
}

export interface SecuritySettings {
  id: string;
  userId: string;
  lastUpdated: Date;
  privacy: PrivacySettings;
  permissions: PermissionSettings;
  security: SecurityPreferences;
  device: DeviceSettings;
  notifications: NotificationSettings;
  data: DataSettings;
}
