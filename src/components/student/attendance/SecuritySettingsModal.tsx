"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Shield,
  MapPin,
  Smartphone,
  Camera,
  Bell,
  Lock,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectItem } from "@/components/ui/select";

export interface AttendanceSecuritySettings {
  locationPermission: boolean;
  highAccuracy: boolean;
  deviceRegistration: boolean;
  deviceFingerprinting: boolean;
  allowDeviceChange: boolean;
  photoCapture: boolean;
  faceDetection: boolean;
  photoQuality: number;
  privacyMode: boolean;
  dataEncryption: boolean;
  autoSync: boolean;
  notifications: boolean;
  emailNotifications: boolean;
  securityLevel: "LOW" | "MEDIUM" | "HIGH" | "MAXIMUM";
}

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AttendanceSecuritySettings;
  onSave: (settings: AttendanceSecuritySettings) => void;
}

export function SecuritySettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
}: SecuritySettingsModalProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localSettings);
      onClose();
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalSettings(settings);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Security Settings</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Location Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Location Settings</span>
              </CardTitle>
              <CardDescription>
                Configure location-based security preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Location Permission</div>
                    <div className="text-sm text-muted-foreground">
                      Allow the app to access your location
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.locationPermission}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        locationPermission: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">High Accuracy Mode</div>
                    <div className="text-sm text-muted-foreground">
                      Use GPS for more accurate location
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.highAccuracy}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        highAccuracy: checked,
                      }))
                    }
                  />
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
                Configure device-based security preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Device Registration</div>
                    <div className="text-sm text-muted-foreground">
                      Register this device for attendance
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.deviceRegistration}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        deviceRegistration: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Device Fingerprinting</div>
                    <div className="text-sm text-muted-foreground">
                      Use device fingerprinting for security
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.deviceFingerprinting}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        deviceFingerprinting: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Allow Device Change</div>
                    <div className="text-sm text-muted-foreground">
                      Allow attendance from different devices
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.allowDeviceChange}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        allowDeviceChange: checked,
                      }))
                    }
                  />
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
                Configure photo-based security preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Photo Capture</div>
                    <div className="text-sm text-muted-foreground">
                      Require photo for attendance verification
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.photoCapture}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        photoCapture: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Face Detection</div>
                    <div className="text-sm text-muted-foreground">
                      Use face detection for photo verification
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.faceDetection}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        faceDetection: checked,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Photo Quality</label>
                  <Slider
                    value={[localSettings.photoQuality || 80]}
                    onValueChange={([value]) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        photoQuality: value,
                      }))
                    }
                    min={50}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    Current: {localSettings.photoQuality || 80}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5" />
                <span>Privacy Settings</span>
              </CardTitle>
              <CardDescription>
                Configure privacy and data protection preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Privacy Mode</div>
                    <div className="text-sm text-muted-foreground">
                      Limit data collection and sharing
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.privacyMode}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        privacyMode: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Data Encryption</div>
                    <div className="text-sm text-muted-foreground">
                      Encrypt sensitive data
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.dataEncryption}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        dataEncryption: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto Sync</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically sync attendance data
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.autoSync}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        autoSync: checked,
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notification Settings</span>
              </CardTitle>
              <CardDescription>
                Configure notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Push Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Receive push notifications
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.notifications}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        notifications: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Receive email notifications
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        emailNotifications: checked,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Security Level</label>
                  <Select
                    value={localSettings.securityLevel}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        securityLevel: e.currentTarget
                          .value as AttendanceSecuritySettings["securityLevel"],
                      }))
                    }
                  >
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MAXIMUM">Maximum</SelectItem>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
