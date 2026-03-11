"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Smartphone,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Lock,
  Wifi,
  Battery,
  Signal,
  Settings,
  HelpCircle,
  Eye,
  XCircle,
  AlertCircle,
  Bell,
  Database,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  SecuritySettings as SecuritySettingsType,
  SecurityLevel,
} from "@/types/security.types";

interface SecuritySettingsProps {
  settings: SecuritySettingsType;
  onUpdate: (settings: SecuritySettingsType) => void;
  userId: string;
  enableRealTimeUpdates: boolean;
  updateInterval: number;
}

export default function SecuritySettings({
  settings: initialSettings,
  onUpdate,
  userId,
  enableRealTimeUpdates,
  updateInterval,
}: SecuritySettingsProps) {
  const [settings, setSettings] =
    useState<SecuritySettingsType>(initialSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "ONLINE" | "OFFLINE" | "POOR"
  >("ONLINE");
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [signalStrength, setSignalStrength] = useState(4);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("privacy");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize settings
  useEffect(() => {
    loadSettings();
    const cleanupMonitoring = startStatusMonitoring();
    let cleanupUpdates: (() => void) | undefined;
    if (enableRealTimeUpdates) {
      cleanupUpdates = startRealTimeUpdates();
    }
    return () => {
      cleanupMonitoring();
      if (cleanupUpdates) cleanupUpdates();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableRealTimeUpdates, updateInterval]);

  // Handle settings updates
  useEffect(() => {
    if (settings) {
      onUpdate(settings);
    }
  }, [settings, onUpdate]);

  // Track changes
  useEffect(() => {
    if (
      settings &&
      JSON.stringify(settings) !== JSON.stringify(initialSettings)
    ) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [settings, initialSettings]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Mock settings data matching the real SecuritySettings interface
      const settingsData: SecuritySettingsType = {
        id: "settings-1",
        userId: userId,
        lastUpdated: new Date(),
        privacy: {
          enableLocation: true,
          enableDeviceTracking: true,
          enablePhotoCapture: true,
          enableBiometricData: false,
          enableAnalytics: true,
          enableCrashFileTexting: true,
          dataRetentionDays: 90,
          allowDataSharing: false,
          allowThirdPartyAccess: false,
        },
        permissions: {
          locationPermission: "GRANTED",
          cameraPermission: "GRANTED",
          microphonePermission: "PROMPT",
          storagePermission: "GRANTED",
          notificationPermission: "GRANTED",
          autoGrantPermissions: false,
          permissionTimeout: 30,
        },
        security: {
          securityLevel: "MEDIUM",
          enableTwoFactor: false,
          enableBiometricAuth: false,
          enableDeviceLock: true,
          enableAutoLock: true,
          autoLockTimeout: 5,
          enableFraudDetection: true,
          enableRiskAssessment: true,
          riskThreshold: 15,
          enableEncryption: true,
          enableSecureStorage: true,
        },
        device: {
          enableDeviceRegistration: true,
          enableDeviceFingerprinting: true,
          enableHardwareFingerprinting: true,
          enableBrowserFingerprinting: true,
          enableNetworkFingerprinting: true,
          enableCanvasFingerprinting: true,
          enableWebGLFingerprinting: true,
          enableAudioFingerprinting: false,
          enableFontFingerprinting: true,
          maxDevices: 3,
          deviceTimeout: 30,
        },
        notifications: {
          enablePushNotifications: true,
          enableEmailNotifications: true,
          enableSMSNotifications: false,
          enableInAppNotifications: true,
          notificationFrequency: "IMMEDIATE",
          enableSecurityAlerts: true,
          enableFraudWarnings: true,
          enableSystemUpdates: true,
          enableMarketingEmails: false,
        },
        data: {
          enableDataSync: true,
          enableCloudBackup: false,
          enableLocalBackup: true,
          backupFrequency: "WEEKLY",
          enableDataCompression: true,
          enableDataEncryption: true,
          maxStorageSize: 500,
          enableDataExport: true,
          enableDataImport: true,
        },
      };

      setSettings(settingsData);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startStatusMonitoring = (): (() => void) => {
    const interval = setInterval(() => {
      updateConnectionStatus();
      updateBatteryLevel();
      updateSignalStrength();
    }, 5000);

    return () => clearInterval(interval);
  };

  const startRealTimeUpdates = (): (() => void) => {
    const interval = setInterval(() => {
      loadSettings();
    }, updateInterval);

    return () => clearInterval(interval);
  };

  const updateConnectionStatus = (): void => {
    if (typeof navigator !== "undefined") {
      setConnectionStatus(navigator.onLine ? "ONLINE" : "OFFLINE");
    }
  };

  const updateBatteryLevel = (): void => {
    if (typeof navigator !== "undefined" && "getBattery" in navigator) {
      const nav = navigator as Navigator & {
        getBattery?: () => Promise<{ level: number }>;
      };
      nav.getBattery?.().then((battery: { level: number }) => {
        setBatteryLevel(Math.round(battery.level * 100));
      });
    }
  };

  const updateSignalStrength = (): void => {
    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const connection = (
        navigator as Navigator & {
          connection?: { effectiveType: string; downlink: number };
        }
      ).connection;
      if (connection) {
        const strength = Math.round((connection.downlink / 10) * 4);
        setSignalStrength(Math.min(4, Math.max(1, strength)));
      }
    }
  };

  const handleSettingChange = <
    C extends keyof SecuritySettingsType,
    S extends keyof SecuritySettingsType[C],
  >(
    category: C,
    setting: S,
    value: SecuritySettingsType[C][S],
  ) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const updatedSettings = { ...prev };

      // Update the specific nested property safely
      const categoryData = { ...(updatedSettings[category] as object) };
      Object.assign(categoryData, { [setting]: value });

      // @ts-expect-error - Dynamic assignment to nested keys
      updatedSettings[category] = categoryData;
      updatedSettings.lastUpdated = new Date();

      return updatedSettings;
    });
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      // Mock save operation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Save failed:", error);
      setSaveError("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case "GRANTED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "DENIED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "PROMPT":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPermissionBadge = (permission: string) => {
    switch (permission) {
      case "GRANTED":
        return "bg-green-500";
      case "DENIED":
        return "bg-red-500";
      case "PROMPT":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading security settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Security Settings</h2>
        </div>
        <div className="flex items-center space-x-2">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-orange-600">
              Unsaved Changes
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={() => setShowHelp(true)}>
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center space-x-2">
          <Wifi
            className={`h-4 w-4 ${connectionStatus === "ONLINE" ? "text-green-600" : "text-red-600"}`}
          />
          <span className="text-sm font-medium">{connectionStatus}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Battery className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">{batteryLevel}%</span>
        </div>
        <div className="flex items-center space-x-2">
          <Signal className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">{signalStrength}/4</span>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium">
            {settings?.security.securityLevel}
          </span>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {[
          { id: "privacy", Label: "Privacy", icon: Eye },
          { id: "permissions", Label: "Permissions", icon: Lock },
          { id: "security", Label: "Security", icon: Shield },
          { id: "device", Label: "Device", icon: Smartphone },
          { id: "notifications", Label: "Notifications", icon: Bell },
          { id: "data", Label: "Data", icon: Database },
        ].map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="flex items-center space-x-2 whitespace-nowrap"
          >
            <category.icon className="h-4 w-4" />
            <span>{category.Label}</span>
          </Button>
        ))}
      </div>

      {/* Settings Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {settings && (
            <div className="space-y-6">
              {/* Privacy Settings */}
              {selectedCategory === "privacy" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Eye className="h-5 w-5" />
                      <span>Privacy Settings</span>
                    </CardTitle>
                    <CardDescription>
                      Control your privacy and data collection preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Location Tracking</div>
                          <div className="text-sm text-muted-foreground">
                            Allow the app to track your location
                          </div>
                        </div>
                        <Switch
                          checked={settings.privacy.enableLocation}
                          onCheckedChange={(newVal) =>
                            handleSettingChange(
                              "privacy",
                              "enableLocation",
                              newVal,
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Device Tracking</div>
                          <div className="text-sm text-muted-foreground">
                            Allow the app to track your device
                          </div>
                        </div>
                        <Switch
                          checked={settings.privacy.enableDeviceTracking}
                          onCheckedChange={(newVal) =>
                            handleSettingChange(
                              "privacy",
                              "enableDeviceTracking",
                              newVal,
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Photo Capture</div>
                          <div className="text-sm text-muted-foreground">
                            Allow the app to capture photos
                          </div>
                        </div>
                        <Switch
                          checked={settings.privacy.enablePhotoCapture}
                          onCheckedChange={(newVal) =>
                            handleSettingChange(
                              "privacy",
                              "enablePhotoCapture",
                              newVal,
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Biometric Data</div>
                          <div className="text-sm text-muted-foreground">
                            Allow the app to use biometric data
                          </div>
                        </div>
                        <Switch
                          checked={settings.privacy.enableBiometricData}
                          onCheckedChange={(newVal) =>
                            handleSettingChange(
                              "privacy",
                              "enableBiometricData",
                              newVal,
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Analytics</div>
                          <div className="text-sm text-muted-foreground">
                            Allow the app to collect analytics data
                          </div>
                        </div>
                        <Switch
                          checked={settings.privacy.enableAnalytics}
                          onCheckedChange={(newVal) =>
                            handleSettingChange(
                              "privacy",
                              "enableAnalytics",
                              newVal,
                            )
                          }
                        />
                      </div>

                      <div className="pt-2">
                        <label className="text-sm font-medium">
                          Data Retention (Days)
                        </label>
                        <Slider
                          defaultValue={[
                            String(settings.privacy.dataRetentionDays),
                          ]}
                          onValueChange={([value]) =>
                            handleSettingChange(
                              "privacy",
                              "dataRetentionDays",
                              Number(value),
                            )
                          }
                          min={30}
                          max={365}
                          step={30}
                          className="mt-3"
                        />
                        <div className="text-xs text-muted-foreground mt-2">
                          History will be kept for{" "}
                          {settings.privacy.dataRetentionDays} days
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Permission Settings */}
              {selectedCategory === "permissions" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Lock className="h-5 w-5" />
                      <span>Permission Settings</span>
                    </CardTitle>
                    <CardDescription>
                      Manage app permissions and access controls
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(settings.permissions).map(
                        ([key, value]) => {
                          if (
                            typeof value === "boolean" ||
                            typeof value === "number"
                          )
                            return null;

                          return (
                            <div
                              key={key}
                              className="flex items-center justify-between"
                            >
                              <div>
                                <div className="font-medium capitalize">
                                  {key
                                    .replace("Permission", "")
                                    .replace(/([A-Z])/g, " $1")
                                    .trim()}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Current status: {value}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getPermissionIcon(value as string)}
                                <Badge
                                  className={getPermissionBadge(
                                    value as string,
                                  )}
                                >
                                  {value as string}
                                </Badge>
                              </div>
                            </div>
                          );
                        },
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <div className="font-medium">
                            Auto Grant Permissions
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Automatically grant permissions when requested
                          </div>
                        </div>
                        <Switch
                          checked={settings.permissions.autoGrantPermissions}
                          onCheckedChange={(newVal) =>
                            handleSettingChange(
                              "permissions",
                              "autoGrantPermissions",
                              newVal,
                            )
                          }
                        />
                      </div>

                      <div className="pt-2">
                        <label className="text-sm font-medium">
                          Permission Timeout (seconds)
                        </label>
                        <Slider
                          defaultValue={[
                            String(settings.permissions.permissionTimeout),
                          ]}
                          onValueChange={([value]) =>
                            handleSettingChange(
                              "permissions",
                              "permissionTimeout",
                              Number(value),
                            )
                          }
                          min={5}
                          max={60}
                          step={5}
                          className="mt-3"
                        />
                        <div className="text-xs text-muted-foreground mt-2">
                          Timeout: {settings.permissions.permissionTimeout}{" "}
                          seconds
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Security Preferences */}
              {selectedCategory === "security" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Security Preferences</span>
                    </CardTitle>
                    <CardDescription>
                      Configure security levels and authentication methods
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Security Level
                        </label>
                        <Select
                          value={settings.security.securityLevel}
                          onChange={(e) =>
                            handleSettingChange(
                              "security",
                              "securityLevel",
                              e.currentTarget.value as SecurityLevel,
                            )
                          }
                        >
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="MAXIMUM">Maximum</SelectItem>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            Two-Factor Authentication
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Require 2FA for sensitive actions
                          </div>
                        </div>
                        <Switch
                          checked={settings.security.enableTwoFactor}
                          onCheckedChange={(newVal) =>
                            handleSettingChange(
                              "security",
                              "enableTwoFactor",
                              newVal,
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            Biometric Authentication
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Use fingerprint or face ID when available
                          </div>
                        </div>
                        <Switch
                          checked={settings.security.enableBiometricAuth}
                          onCheckedChange={(newVal) =>
                            handleSettingChange(
                              "security",
                              "enableBiometricAuth",
                              newVal,
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Encryption</div>
                          <div className="text-sm text-muted-foreground">
                            Always encrypt local data
                          </div>
                        </div>
                        <Switch
                          checked={settings.security.enableEncryption}
                          onCheckedChange={(newVal) =>
                            handleSettingChange(
                              "security",
                              "enableEncryption",
                              newVal,
                            )
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Device Settings */}
              {selectedCategory === "device" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Smartphone className="h-5 w-5" />
                      <span>Device Settings</span>
                    </CardTitle>
                    <CardDescription>
                      Manage device registration and profiling
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Device Registration</div>
                          <div className="text-sm text-muted-foreground">
                            Limit login to registered devices
                          </div>
                        </div>
                        <Switch
                          checked={settings.device.enableDeviceRegistration}
                          onCheckedChange={(newVal) =>
                            handleSettingChange(
                              "device",
                              "enableDeviceRegistration",
                              newVal,
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            Network Fingerprinting
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Verify network patterns
                          </div>
                        </div>
                        <Switch
                          checked={settings.device.enableNetworkFingerprinting}
                          onCheckedChange={(newVal) =>
                            handleSettingChange(
                              "device",
                              "enableNetworkFingerprinting",
                              newVal,
                            )
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notifications Settings */}
              {selectedCategory === "notifications" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="h-5 w-5" />
                      <span>Notification Settings</span>
                    </CardTitle>
                    <CardDescription>
                      Configure how you receive alerts and updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Push Notifications</div>
                          <div className="text-sm text-muted-foreground">
                            Receive real-time alerts
                          </div>
                        </div>
                        <Switch
                          checked={
                            settings.notifications.enablePushNotifications
                          }
                          onCheckedChange={(newVal) =>
                            handleSettingChange(
                              "notifications",
                              "enablePushNotifications",
                              newVal,
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Security Alerts</div>
                          <div className="text-sm text-muted-foreground">
                            Get notified about security events
                          </div>
                        </div>
                        <Switch
                          checked={settings.notifications.enableSecurityAlerts}
                          onCheckedChange={(newVal) =>
                            handleSettingChange(
                              "notifications",
                              "enableSecurityAlerts",
                              newVal,
                            )
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Data Settings */}
              {selectedCategory === "data" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Database className="h-5 w-5" />
                      <span>Data Settings</span>
                    </CardTitle>
                    <CardDescription>
                      Manage synchronization and backups
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Cloud Backup</div>
                          <div className="text-sm text-muted-foreground">
                            Securely back up data to the cloud
                          </div>
                        </div>
                        <Switch
                          checked={settings.data.enableCloudBackup}
                          onCheckedChange={(newVal) =>
                            handleSettingChange(
                              "data",
                              "enableCloudBackup",
                              newVal,
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Local Sync</div>
                          <div className="text-sm text-muted-foreground">
                            Sync data with local storage
                          </div>
                        </div>
                        <Switch
                          checked={settings.data.enableDataSync}
                          onCheckedChange={(newVal) =>
                            handleSettingChange(
                              "data",
                              "enableDataSync",
                              newVal,
                            )
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Save Button */}
      <div className="flex items-center justify-end space-x-4 pt-4 border-t">
        {saveError && (
          <div className="text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle className="h-4 w-4" />
            <span>{saveError}</span>
          </div>
        )}
        <Button
          variant="outline"
          onClick={() => setSettings(initialSettings)}
          disabled={!hasUnsavedChanges || isSaving}
        >
          Reset
        </Button>
        <Button
          onClick={handleSaveSettings}
          disabled={!hasUnsavedChanges || isSaving}
          className="min-w-[120px]"
        >
          {isSaving ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowHelp(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Security Help</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHelp(false)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      These settings control how your data is handled and what
                      permissions the application has. Changes are only applied
                      after clicking <strong>Save Changes</strong>.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Security Levels</h4>
                    <p className="text-xs text-muted-foreground">
                      <strong>Maximum:</strong> Requires all verification
                      methods.
                      <br />
                      <strong>High:</strong> Requires most verification methods.
                      <br />
                      <strong>Medium/Low:</strong> Standard verification
                      methods.
                    </p>
                  </div>
                  <Button className="w-full" onClick={() => setShowHelp(false)}>
                    Got it
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
