"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Switch } from "../../ui/switch";
import { Slider } from "../../ui/slider";
import {
  AlertTriangle,
  Save,
  RefreshCw,
  Download,
  Upload,
  Activity,
  Shield,
  MapPin,
  Clock,
  Camera,
  Smartphone,
} from "lucide-react";

type NotificationFrequency = "IMMEDIATE" | "HOURLY" | "DAILY" | "WEEKLY";

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case "HIGH":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "LOW":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

const getActionBadge = (action: string) => {
  switch (action) {
    case "BLOCK":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "FLAG":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "NOTIFY":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

// Types
interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  priority: number;
  rules: SecurityRule[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface SecurityRule {
  id: string;
  name: string;
  type: "LOCATION" | "DEVICE" | "TIME" | "PHOTO" | "BEHAVIOR" | "FRAUD";
  condition: string;
  action: "ALLOW" | "DENY" | "WARN" | "REQUIRE_VERIFICATION";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  isEnabled: boolean;
  parameters: Record<string, unknown>;
}

interface LocationSettings {
  isRequired: boolean;
  accuracy: number;
  radius: number;
  allowSpoofing: boolean;
  requireGPS: boolean;
  fallbackToIP: boolean;
  timezone: string;
  gracePeriod: number;
}

interface DeviceSettings {
  isRequired: boolean;
  allowDeviceChange: boolean;
  allowDeviceSharing: boolean;
  requireFingerprint: boolean;
  allowMultipleDevices: boolean;
  deviceTimeout: number;
  requireHardware: boolean;
  allowVirtualDevices: boolean;
}

interface TimeSettings {
  isRequired: boolean;
  allowTimeManipulation: boolean;
  requireServerTime: boolean;
  gracePeriod: number;
  timezone: string;
  allowFutureTime: boolean;
  allowPastTime: boolean;
  timeWindow: number;
}

interface PhotoSettings {
  isRequired: boolean;
  allowScreenshots: boolean;
  requireFaceDetection: boolean;
  allowMultiplePhotos: boolean;
  photoQuality: number;
  maxPhotoSize: number;
  allowEditing: boolean;
  requireMetadata: boolean;
}

interface FraudSettings {
  isEnabled: boolean;
  riskThreshold: number;
  allowHighRisk: boolean;
  requireVerification: boolean;
  autoBlock: boolean;
  notifyOnFraud: boolean;
  allowAppeal: boolean;
  fraudTimeout: number;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  webhookNotifications: boolean;
  notificationFrequency: "IMMEDIATE" | "HOURLY" | "DAILY" | "WEEKLY";
  notificationChannels: string[];
  escalationRules: EscalationRule[];
}

interface EscalationRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  delay: number;
  isEnabled: boolean;
}

export interface SecuritySettingsData {
  location: LocationSettings;
  device: DeviceSettings;
  time: TimeSettings;
  photo: PhotoSettings;
  fraud: FraudSettings;
  notifications: NotificationSettings;
}

interface SecuritySettingsProps {
  onSaveSettings?: (settings: SecuritySettingsData) => void | Promise<void>;
  onExportSettings?: (settings: SecuritySettingsData) => void;
}

export function SecuritySettings({
  onSaveSettings,
  onExportSettings,
}: SecuritySettingsProps) {
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>(
    [],
  );
  const [locationSettings, setLocationSettings] = useState<LocationSettings>({
    isRequired: true,
    accuracy: 10,
    radius: 50,
    allowSpoofing: false,
    requireGPS: true,
    fallbackToIP: true,
    timezone: "UTC",
    gracePeriod: 5,
  });
  const [deviceSettings, setDeviceSettings] = useState<DeviceSettings>({
    isRequired: true,
    allowDeviceChange: false,
    allowDeviceSharing: false,
    requireFingerprint: true,
    allowMultipleDevices: false,
    deviceTimeout: 30,
    requireHardware: true,
    allowVirtualDevices: false,
  });
  const [timeSettings, setTimeSettings] = useState<TimeSettings>({
    isRequired: true,
    allowTimeManipulation: false,
    requireServerTime: true,
    gracePeriod: 5,
    timezone: "UTC",
    allowFutureTime: false,
    allowPastTime: true,
    timeWindow: 60,
  });
  const [photoSettings, setPhotoSettings] = useState<PhotoSettings>({
    isRequired: true,
    allowScreenshots: false,
    requireFaceDetection: true,
    allowMultiplePhotos: false,
    photoQuality: 80,
    maxPhotoSize: 5,
    allowEditing: false,
    requireMetadata: true,
  });
  const [fraudSettings, setFraudSettings] = useState<FraudSettings>({
    isEnabled: true,
    riskThreshold: 70,
    allowHighRisk: false,
    requireVerification: true,
    autoBlock: false,
    notifyOnFraud: true,
    allowAppeal: true,
    fraudTimeout: 300,
  });
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      webhookNotifications: false,
      notificationFrequency: "IMMEDIATE",
      notificationChannels: ["email", "push"],
      escalationRules: [],
    });
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    loadSecuritySettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [
    locationSettings,
    deviceSettings,
    timeSettings,
    photoSettings,
    fraudSettings,
    notificationSettings,
  ]);

  const loadSecuritySettings = async () => {
    try {
      await Promise.all([
        loadSecurityPolicies(),
        loadLocationSettings(),
        loadDeviceSettings(),
        loadTimeSettings(),
        loadPhotoSettings(),
        loadFraudSettings(),
        loadNotificationSettings(),
      ]);
    } catch (error) {
      console.error("Failed to load security settings:", error);
    }
  };

  const loadSecurityPolicies = async () => {
    try {
      // Mock data - replace with actual API call
      const mockPolicies: SecurityPolicy[] = [
        {
          id: "policy-1",
          name: "Standard Security Policy",
          description: "Default security policy for attendance sessions",
          isActive: true,
          priority: 1,
          rules: [
            {
              id: "rule-1",
              name: "Location Verification",
              type: "LOCATION",
              condition: "location.accuracy < 10",
              action: "ALLOW",
              severity: "MEDIUM",
              isEnabled: true,
              parameters: { accuracy: 10, radius: 50 },
            },
            {
              id: "rule-2",
              name: "Device Fingerprint",
              type: "DEVICE",
              condition: "device.fingerprint == previous.fingerprint",
              action: "ALLOW",
              severity: "HIGH",
              isEnabled: true,
              parameters: { timeout: 30 },
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: "admin",
        },
      ];
      setSecurityPolicies(mockPolicies);
    } catch (error) {
      console.error("Failed to load security policies:", error);
    }
  };

  const loadLocationSettings = async () => {
    try {
      // Mock data - replace with actual API call
      const settings: LocationSettings = {
        isRequired: true,
        accuracy: 10,
        radius: 50,
        allowSpoofing: false,
        requireGPS: true,
        fallbackToIP: true,
        timezone: "UTC",
        gracePeriod: 5,
      };
      setLocationSettings(settings);
    } catch (error) {
      console.error("Failed to load location settings:", error);
    }
  };

  const loadDeviceSettings = async () => {
    try {
      // Mock data - replace with actual API call
      const settings: DeviceSettings = {
        isRequired: true,
        allowDeviceChange: false,
        allowDeviceSharing: false,
        requireFingerprint: true,
        allowMultipleDevices: false,
        deviceTimeout: 30,
        requireHardware: true,
        allowVirtualDevices: false,
      };
      setDeviceSettings(settings);
    } catch (error) {
      console.error("Failed to load device settings:", error);
    }
  };

  const loadTimeSettings = async () => {
    try {
      // Mock data - replace with actual API call
      const settings: TimeSettings = {
        isRequired: true,
        allowTimeManipulation: false,
        requireServerTime: true,
        gracePeriod: 5,
        timezone: "UTC",
        allowFutureTime: false,
        allowPastTime: true,
        timeWindow: 60,
      };
      setTimeSettings(settings);
    } catch (error) {
      console.error("Failed to load time settings:", error);
    }
  };

  const loadPhotoSettings = async () => {
    try {
      // Mock data - replace with actual API call
      const settings: PhotoSettings = {
        isRequired: true,
        allowScreenshots: false,
        requireFaceDetection: true,
        allowMultiplePhotos: false,
        photoQuality: 80,
        maxPhotoSize: 5,
        allowEditing: false,
        requireMetadata: true,
      };
      setPhotoSettings(settings);
    } catch (error) {
      console.error("Failed to load photo settings:", error);
    }
  };

  const loadFraudSettings = async () => {
    try {
      // Mock data - replace with actual API call
      const settings: FraudSettings = {
        isEnabled: true,
        riskThreshold: 70,
        allowHighRisk: false,
        requireVerification: true,
        autoBlock: false,
        notifyOnFraud: true,
        allowAppeal: true,
        fraudTimeout: 300,
      };
      setFraudSettings(settings);
    } catch (error) {
      console.error("Failed to load fraud settings:", error);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      // Mock data - replace with actual API call
      const settings: NotificationSettings = {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        webhookNotifications: false,
        notificationFrequency: "IMMEDIATE",
        notificationChannels: ["email", "push"],
        escalationRules: [],
      };
      setNotificationSettings(settings);
    } catch (error) {
      console.error("Failed to load notification settings:", error);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const settings = {
        location: locationSettings,
        device: deviceSettings,
        time: timeSettings,
        photo: photoSettings,
        fraud: fraudSettings,
        notifications: notificationSettings,
      };

      await onSaveSettings?.(settings);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportSettings = () => {
    const settings: SecuritySettingsData = {
      location: locationSettings,
      device: deviceSettings,
      time: timeSettings,
      photo: photoSettings,
      fraud: fraudSettings,
      notifications: notificationSettings,
    };
    onExportSettings?.(settings);
  };

  const handleImportSettings = (settings: Partial<SecuritySettingsData>) => {
    if (settings.location) setLocationSettings(settings.location);
    if (settings.device) setDeviceSettings(settings.device);
    if (settings.time) setTimeSettings(settings.time);
    if (settings.photo) setPhotoSettings(settings.photo);
    if (settings.fraud) setFraudSettings(settings.fraud);
    if (settings.notifications) setNotificationSettings(settings.notifications);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Settings</h2>
          <p className="text-muted-foreground">
            Comprehensive security configuration and policy management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-orange-600">
              Unsaved Changes
            </Badge>
          )}
          {lastSaved && (
            <span className="text-sm text-muted-foreground">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" onClick={handleExportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => handleImportSettings({})}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
      </div>

      {/* Security Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security Policies</span>
          </CardTitle>
          <CardDescription>Manage security policies and rules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityPolicies.map((policy) => (
              <div key={policy.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium">{policy.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {policy.description}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={
                        policy.isActive ? "bg-green-500" : "bg-gray-500"
                      }
                    >
                      {policy.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">Priority: {policy.priority}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  {policy.rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Shield className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {rule.condition}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityBadge(rule.severity)}>
                          {rule.severity}
                        </Badge>
                        <Badge className={getActionBadge(rule.action)}>
                          {rule.action}
                        </Badge>
                        <Switch
                          checked={rule.isEnabled}
                          onCheckedChange={() => {
                            // Handle rule toggle
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Location Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Location Settings</span>
          </CardTitle>
          <CardDescription>
            Configure location-based security requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Require Location</div>
                <div className="text-sm text-muted-foreground">
                  Students must provide location data
                </div>
              </div>
              <Switch
                checked={locationSettings.isRequired}
                onCheckedChange={(checked) =>
                  setLocationSettings((prev) => ({
                    ...prev,
                    isRequired: checked,
                  }))
                }
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Location Accuracy (meters)
                </label>
                <Slider
                  value={[locationSettings.accuracy]}
                  onValueChange={(val) =>
                    setLocationSettings((prev) => ({
                      ...prev,
                      accuracy: val[0],
                    }))
                  }
                  min={1}
                  max={100}
                  step={1}
                  className="mt-2"
                />
                <div className="text-sm text-muted-foreground mt-1">
                  Current: {locationSettings.accuracy}m
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Allowed Radius (meters)
                </label>
                <Slider
                  value={[locationSettings.radius]}
                  onValueChange={(val) =>
                    setLocationSettings((prev) => ({ ...prev, radius: val[0] }))
                  }
                  min={10}
                  max={500}
                  step={10}
                  className="mt-2"
                />
                <div className="text-sm text-muted-foreground mt-1">
                  Current: {locationSettings.radius}m
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Allow Location Spoofing</div>
                  <div className="text-sm text-muted-foreground">
                    Allow students to use fake locations
                  </div>
                </div>
                <Switch
                  checked={locationSettings.allowSpoofing}
                  onCheckedChange={(checked) =>
                    setLocationSettings((prev) => ({
                      ...prev,
                      allowSpoofing: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Require GPS</div>
                  <div className="text-sm text-muted-foreground">
                    Require GPS coordinates
                  </div>
                </div>
                <Switch
                  checked={locationSettings.requireGPS}
                  onCheckedChange={(checked) =>
                    setLocationSettings((prev) => ({
                      ...prev,
                      requireGPS: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Fallback to IP</div>
                  <div className="text-sm text-muted-foreground">
                    Use IP location as fallback
                  </div>
                </div>
                <Switch
                  checked={locationSettings.fallbackToIP}
                  onCheckedChange={(checked) =>
                    setLocationSettings((prev) => ({
                      ...prev,
                      fallbackToIP: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Grace Period (minutes)</div>
                  <div className="text-sm text-muted-foreground">
                    Allow late arrivals
                  </div>
                </div>
                <Select
                  value={locationSettings.gracePeriod.toString()}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setLocationSettings((prev) => ({
                      ...prev,
                      gracePeriod: parseInt(e.target.value),
                    }))
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5" />
            <span>Device Settings</span>
          </CardTitle>
          <CardDescription>
            Configure device-based security requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Require Device Verification</div>
                <div className="text-sm text-muted-foreground">
                  Students must verify their device
                </div>
              </div>
              <Switch
                checked={deviceSettings.isRequired}
                onCheckedChange={(checked) =>
                  setDeviceSettings((prev) => ({
                    ...prev,
                    isRequired: checked,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Allow Device Change</div>
                  <div className="text-sm text-muted-foreground">
                    Allow students to change devices
                  </div>
                </div>
                <Switch
                  checked={deviceSettings.allowDeviceChange}
                  onCheckedChange={(checked) =>
                    setDeviceSettings((prev) => ({
                      ...prev,
                      allowDeviceChange: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Allow Device Sharing</div>
                  <div className="text-sm text-muted-foreground">
                    Allow multiple students per device
                  </div>
                </div>
                <Switch
                  checked={deviceSettings.allowDeviceSharing}
                  onCheckedChange={(checked) =>
                    setDeviceSettings((prev) => ({
                      ...prev,
                      allowDeviceSharing: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Require Fingerprint</div>
                  <div className="text-sm text-muted-foreground">
                    Require device fingerprinting
                  </div>
                </div>
                <Switch
                  checked={deviceSettings.requireFingerprint}
                  onCheckedChange={(checked) =>
                    setDeviceSettings((prev) => ({
                      ...prev,
                      requireFingerprint: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Allow Multiple Devices</div>
                  <div className="text-sm text-muted-foreground">
                    Allow students to use multiple devices
                  </div>
                </div>
                <Switch
                  checked={deviceSettings.allowMultipleDevices}
                  onCheckedChange={(checked) =>
                    setDeviceSettings((prev) => ({
                      ...prev,
                      allowMultipleDevices: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Require Hardware</div>
                  <div className="text-sm text-muted-foreground">
                    Require physical hardware
                  </div>
                </div>
                <Switch
                  checked={deviceSettings.requireHardware}
                  onCheckedChange={(checked) =>
                    setDeviceSettings((prev) => ({
                      ...prev,
                      requireHardware: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Allow Virtual Devices</div>
                  <div className="text-sm text-muted-foreground">
                    Allow virtual machines and emulators
                  </div>
                </div>
                <Switch
                  checked={deviceSettings.allowVirtualDevices}
                  onCheckedChange={(checked) =>
                    setDeviceSettings((prev) => ({
                      ...prev,
                      allowVirtualDevices: checked,
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">
                Device Timeout (minutes)
              </label>
              <Slider
                value={[deviceSettings.deviceTimeout]}
                onValueChange={(val) =>
                  setDeviceSettings((prev) => ({
                    ...prev,
                    deviceTimeout: val[0],
                  }))
                }
                min={5}
                max={120}
                step={5}
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">
                Current: {deviceSettings.deviceTimeout} minutes
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Time Settings</span>
          </CardTitle>
          <CardDescription>
            Configure time-based security requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Require Time Verification</div>
                <div className="text-sm text-muted-foreground">
                  Students must provide accurate time
                </div>
              </div>
              <Switch
                checked={timeSettings.isRequired}
                onCheckedChange={(checked) =>
                  setTimeSettings((prev) => ({ ...prev, isRequired: checked }))
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Allow Time Manipulation</div>
                  <div className="text-sm text-muted-foreground">
                    Allow students to manipulate time
                  </div>
                </div>
                <Switch
                  checked={timeSettings.allowTimeManipulation}
                  onCheckedChange={(checked) =>
                    setTimeSettings((prev) => ({
                      ...prev,
                      allowTimeManipulation: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Require Server Time</div>
                  <div className="text-sm text-muted-foreground">
                    Use server time for verification
                  </div>
                </div>
                <Switch
                  checked={timeSettings.requireServerTime}
                  onCheckedChange={(checked) =>
                    setTimeSettings((prev) => ({
                      ...prev,
                      requireServerTime: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Allow Future Time</div>
                  <div className="text-sm text-muted-foreground">
                    Allow future timestamps
                  </div>
                </div>
                <Switch
                  checked={timeSettings.allowFutureTime}
                  onCheckedChange={(checked) =>
                    setTimeSettings((prev) => ({
                      ...prev,
                      allowFutureTime: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Allow Past Time</div>
                  <div className="text-sm text-muted-foreground">
                    Allow past timestamps
                  </div>
                </div>
                <Switch
                  checked={timeSettings.allowPastTime}
                  onCheckedChange={(checked) =>
                    setTimeSettings((prev) => ({
                      ...prev,
                      allowPastTime: checked,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">
                  Grace Period (minutes)
                </label>
                <Select
                  value={timeSettings.gracePeriod.toString()}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setTimeSettings((prev) => ({
                      ...prev,
                      gracePeriod: parseInt(e.target.value),
                    }))
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Time Window (minutes)
                </label>
                <Select
                  value={timeSettings.timeWindow.toString()}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setTimeSettings((prev) => ({
                      ...prev,
                      timeWindow: parseInt(e.target.value),
                    }))
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="60">60</SelectItem>
                    <SelectItem value="120">120</SelectItem>
                    <SelectItem value="240">240</SelectItem>
                    <SelectItem value="480">480</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>Photo Settings</span>
          </CardTitle>
          <CardDescription>
            Configure photo-based security requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Require Photo</div>
                <div className="text-sm text-muted-foreground">
                  Students must provide a photo
                </div>
              </div>
              <Switch
                checked={photoSettings.isRequired}
                onCheckedChange={(checked) =>
                  setPhotoSettings((prev) => ({ ...prev, isRequired: checked }))
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Allow Screenshots</div>
                  <div className="text-sm text-muted-foreground">
                    Allow screenshot photos
                  </div>
                </div>
                <Switch
                  checked={photoSettings.allowScreenshots}
                  onCheckedChange={(checked) =>
                    setPhotoSettings((prev) => ({
                      ...prev,
                      allowScreenshots: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Require Face Detection</div>
                  <div className="text-sm text-muted-foreground">
                    Require face detection in photos
                  </div>
                </div>
                <Switch
                  checked={photoSettings.requireFaceDetection}
                  onCheckedChange={(checked) =>
                    setPhotoSettings((prev) => ({
                      ...prev,
                      requireFaceDetection: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Allow Multiple Photos</div>
                  <div className="text-sm text-muted-foreground">
                    Allow multiple photo submissions
                  </div>
                </div>
                <Switch
                  checked={photoSettings.allowMultiplePhotos}
                  onCheckedChange={(checked) =>
                    setPhotoSettings((prev) => ({
                      ...prev,
                      allowMultiplePhotos: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Allow Editing</div>
                  <div className="text-sm text-muted-foreground">
                    Allow photo editing
                  </div>
                </div>
                <Switch
                  checked={photoSettings.allowEditing}
                  onCheckedChange={(checked) =>
                    setPhotoSettings((prev) => ({
                      ...prev,
                      allowEditing: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Require Metadata</div>
                  <div className="text-sm text-muted-foreground">
                    Require photo metadata
                  </div>
                </div>
                <Switch
                  checked={photoSettings.requireMetadata}
                  onCheckedChange={(checked) =>
                    setPhotoSettings((prev) => ({
                      ...prev,
                      requireMetadata: checked,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Photo Quality (%)</label>
                <Slider
                  value={[photoSettings.photoQuality]}
                  onValueChange={(val) =>
                    setPhotoSettings((prev) => ({
                      ...prev,
                      photoQuality: val[0],
                    }))
                  }
                  min={50}
                  max={100}
                  step={5}
                  className="mt-2"
                />
                <div className="text-sm text-muted-foreground mt-1">
                  Current: {photoSettings.photoQuality}%
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Max Photo Size (MB)
                </label>
                <Slider
                  value={[photoSettings.maxPhotoSize]}
                  onValueChange={(val) =>
                    setPhotoSettings((prev) => ({
                      ...prev,
                      maxPhotoSize: val[0],
                    }))
                  }
                  min={1}
                  max={20}
                  step={1}
                  className="mt-2"
                />
                <div className="text-sm text-muted-foreground mt-1">
                  Current: {photoSettings.maxPhotoSize}MB
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fraud Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Fraud Detection Settings</span>
          </CardTitle>
          <CardDescription>
            Configure fraud detection and prevention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Enable Fraud Detection</div>
                <div className="text-sm text-muted-foreground">
                  Enable AI-powered fraud detection
                </div>
              </div>
              <Switch
                checked={fraudSettings.isEnabled}
                onCheckedChange={(checked) =>
                  setFraudSettings((prev) => ({ ...prev, isEnabled: checked }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Risk Threshold (%)</label>
              <Slider
                value={[fraudSettings.riskThreshold]}
                onValueChange={(val) =>
                  setFraudSettings((prev) => ({
                    ...prev,
                    riskThreshold: val[0],
                  }))
                }
                min={0}
                max={100}
                step={5}
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">
                Current: {fraudSettings.riskThreshold}%
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Allow High Risk</div>
                  <div className="text-sm text-muted-foreground">
                    Allow high-risk attempts
                  </div>
                </div>
                <Switch
                  checked={fraudSettings.allowHighRisk}
                  onCheckedChange={(checked) =>
                    setFraudSettings((prev) => ({
                      ...prev,
                      allowHighRisk: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Require Verification</div>
                  <div className="text-sm text-muted-foreground">
                    Require additional verification
                  </div>
                </div>
                <Switch
                  checked={fraudSettings.requireVerification}
                  onCheckedChange={(checked) =>
                    setFraudSettings((prev) => ({
                      ...prev,
                      requireVerification: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Auto Block</div>
                  <div className="text-sm text-muted-foreground">
                    Automatically block fraud attempts
                  </div>
                </div>
                <Switch
                  checked={fraudSettings.autoBlock}
                  onCheckedChange={(checked) =>
                    setFraudSettings((prev) => ({
                      ...prev,
                      autoBlock: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Notify on Fraud</div>
                  <div className="text-sm text-muted-foreground">
                    Send notifications for fraud attempts
                  </div>
                </div>
                <Switch
                  checked={fraudSettings.notifyOnFraud}
                  onCheckedChange={(checked) =>
                    setFraudSettings((prev) => ({
                      ...prev,
                      notifyOnFraud: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Allow Appeal</div>
                  <div className="text-sm text-muted-foreground">
                    Allow students to appeal fraud decisions
                  </div>
                </div>
                <Switch
                  checked={fraudSettings.allowAppeal}
                  onCheckedChange={(checked) =>
                    setFraudSettings((prev) => ({
                      ...prev,
                      allowAppeal: checked,
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">
                Fraud Timeout (seconds)
              </label>
              <Slider
                value={[fraudSettings.fraudTimeout]}
                onValueChange={(val) =>
                  setFraudSettings((prev) => ({
                    ...prev,
                    fraudTimeout: val[0],
                  }))
                }
                min={60}
                max={600}
                step={30}
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">
                Current: {fraudSettings.fraudTimeout} seconds
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Notification Settings</span>
          </CardTitle>
          <CardDescription>
            Configure notification preferences and channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-muted-foreground">
                    Send email notifications
                  </div>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      emailNotifications: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Push Notifications</div>
                  <div className="text-sm text-muted-foreground">
                    Send push notifications
                  </div>
                </div>
                <Switch
                  checked={notificationSettings.pushNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      pushNotifications: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">SMS Notifications</div>
                  <div className="text-sm text-muted-foreground">
                    Send SMS notifications
                  </div>
                </div>
                <Switch
                  checked={notificationSettings.smsNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      smsNotifications: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Webhook Notifications</div>
                  <div className="text-sm text-muted-foreground">
                    Send webhook notifications
                  </div>
                </div>
                <Switch
                  checked={notificationSettings.webhookNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      webhookNotifications: checked,
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">
                Notification Frequency
              </label>
              <Select
                value={notificationSettings.notificationFrequency}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setNotificationSettings((prev) => ({
                    ...prev,
                    notificationFrequency: e.target
                      .value as NotificationFrequency,
                  }))
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMMEDIATE">Immediate</SelectItem>
                  <SelectItem value="HOURLY">Hourly</SelectItem>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
