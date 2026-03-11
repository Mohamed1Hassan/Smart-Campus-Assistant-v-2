"use client";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Switch } from "../../ui/switch";

import { Input } from "../../ui/input";
import { Slider } from "../../ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Shield,
  MapPin,
  Camera,
  Smartphone,
  AlertTriangle,
  Clock,
  Save,
  RefreshCw,
  Settings,
} from "lucide-react";

export function SecuritySettings() {
  const [settings, setSettings] = useState({
    // Location Settings
    location: {
      enabled: true,
      accuracy: 10,
      radius: 50,
      spoofingDetection: true,
      timezone: "UTC",
    },
    // Device Settings
    device: {
      fingerprinting: true,
      maxDevices: 3,
      deviceSharingDetection: true,
      virtualMachineDetection: true,
    },
    // Photo Settings
    photo: {
      required: false,
      quality: 0.6,
      faceDetection: false,
      manipulationDetection: true,
    },
    // Time Settings
    time: {
      gracePeriod: 5,
      timezoneValidation: true,
      timeManipulationDetection: true,
    },
    // Fraud Detection
    fraud: {
      enabled: true,
      sensitivity: 0.7,
      machineLearning: true,
      realTimeAlerts: true,
    },
    // Notifications
    notifications: {
      email: true,
      push: true,
      sms: false,
      webhook: false,
    },
  });

  const handleSave = () => {
    console.log("Saving security settings:", settings);
    // Save settings logic
  };

  const handleReset = () => {
    // Reset to default settings
    setSettings({
      location: {
        enabled: true,
        accuracy: 10,
        radius: 50,
        spoofingDetection: true,
        timezone: "UTC",
      },
      device: {
        fingerprinting: true,
        maxDevices: 3,
        deviceSharingDetection: true,
        virtualMachineDetection: true,
      },
      photo: {
        required: false,
        quality: 0.6,
        faceDetection: false,
        manipulationDetection: true,
      },
      time: {
        gracePeriod: 5,
        timezoneValidation: true,
        timeManipulationDetection: true,
      },
      fraud: {
        enabled: true,
        sensitivity: 0.7,
        machineLearning: true,
        realTimeAlerts: true,
      },
      notifications: {
        email: true,
        push: true,
        sms: false,
        webhook: false,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Security Settings</span>
        </CardTitle>
        <CardDescription>
          Configure security parameters for attendance sessions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location Security */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <label className="text-base font-medium">Location Security</label>
            </div>
            <Switch
              checked={settings.location.enabled}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  location: { ...settings.location, enabled: checked },
                })
              }
            />
          </div>

          {settings.location.enabled && (
            <div className="space-y-4 pl-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="accuracy">Required Accuracy (meters)</label>
                  <Input
                    id="accuracy"
                    type="number"
                    value={settings.location.accuracy}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        location: {
                          ...settings.location,
                          accuracy: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="radius">Default Radius (meters)</label>
                  <Input
                    id="radius"
                    type="number"
                    value={settings.location.radius}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        location: {
                          ...settings.location,
                          radius: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="spoofingDetection">
                  Location Spoofing Detection
                </label>
                <Switch
                  id="spoofingDetection"
                  checked={settings.location.spoofingDetection}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      location: {
                        ...settings.location,
                        spoofingDetection: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="timezone">Default Timezone</label>
                <Select
                  value={settings.location.timezone}
                  onChange={(e: string | { target: { value: string } }) =>
                    setSettings({
                      ...settings,
                      location: {
                        ...settings.location,
                        timezone:
                          typeof e === "string" ? e : e?.target?.value || "UTC",
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">
                      Eastern Time
                    </SelectItem>
                    <SelectItem value="America/Chicago">
                      Central Time
                    </SelectItem>
                    <SelectItem value="America/Denver">
                      Mountain Time
                    </SelectItem>
                    <SelectItem value="America/Los_Angeles">
                      Pacific Time
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Device Security */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4" />
              <label className="text-base font-medium">Device Security</label>
            </div>
            <Switch
              checked={settings.device.fingerprinting}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  device: { ...settings.device, fingerprinting: checked },
                })
              }
            />
          </div>

          {settings.device.fingerprinting && (
            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <label htmlFor="maxDevices">Maximum Devices per User</label>
                <Input
                  id="maxDevices"
                  type="number"
                  value={settings.device.maxDevices}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      device: {
                        ...settings.device,
                        maxDevices: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="deviceSharingDetection">
                  Device Sharing Detection
                </label>
                <Switch
                  id="deviceSharingDetection"
                  checked={settings.device.deviceSharingDetection}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      device: {
                        ...settings.device,
                        deviceSharingDetection: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="virtualMachineDetection">
                  Virtual Machine Detection
                </label>
                <Switch
                  id="virtualMachineDetection"
                  checked={settings.device.virtualMachineDetection}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      device: {
                        ...settings.device,
                        virtualMachineDetection: checked,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Photo Security */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Camera className="h-4 w-4" />
              <label className="text-base font-medium">Photo Security</label>
            </div>
            <Switch
              checked={settings.photo.required}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  photo: { ...settings.photo, required: checked },
                })
              }
            />
          </div>

          {settings.photo.required && (
            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <label htmlFor="photoQuality">Minimum Photo Quality</label>
                <Slider
                  id="photoQuality"
                  value={[settings.photo.quality * 100]}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      photo: { ...settings.photo, quality: value[0] / 100 },
                    })
                  }
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  {Math.round(settings.photo.quality * 100)}%
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="faceDetection">Face Detection</label>
                <Switch
                  id="faceDetection"
                  checked={settings.photo.faceDetection}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      photo: { ...settings.photo, faceDetection: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="manipulationDetection">
                  Photo Manipulation Detection
                </label>
                <Switch
                  id="manipulationDetection"
                  checked={settings.photo.manipulationDetection}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      photo: {
                        ...settings.photo,
                        manipulationDetection: checked,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Time Security */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <label className="text-base font-medium">Time Security</label>
            </div>
            <Switch
              checked={settings.time.timezoneValidation}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  time: { ...settings.time, timezoneValidation: checked },
                })
              }
            />
          </div>

          {settings.time.timezoneValidation && (
            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <label htmlFor="gracePeriod">
                  Default Grace Period (minutes)
                </label>
                <Input
                  id="gracePeriod"
                  type="number"
                  value={settings.time.gracePeriod}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      time: {
                        ...settings.time,
                        gracePeriod: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="timeManipulationDetection">
                  Time Manipulation Detection
                </label>
                <Switch
                  id="timeManipulationDetection"
                  checked={settings.time.timeManipulationDetection}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      time: {
                        ...settings.time,
                        timeManipulationDetection: checked,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Fraud Detection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <label className="text-base font-medium">Fraud Detection</label>
            </div>
            <Switch
              checked={settings.fraud.enabled}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  fraud: { ...settings.fraud, enabled: checked },
                })
              }
            />
          </div>

          {settings.fraud.enabled && (
            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <label htmlFor="sensitivity">Detection Sensitivity</label>
                <Slider
                  id="sensitivity"
                  value={[settings.fraud.sensitivity * 100]}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      fraud: { ...settings.fraud, sensitivity: value[0] / 100 },
                    })
                  }
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  {Math.round(settings.fraud.sensitivity * 100)}% (Higher = More
                  Sensitive)
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="machineLearning">
                  Machine Learning Detection
                </label>
                <Switch
                  id="machineLearning"
                  checked={settings.fraud.machineLearning}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      fraud: { ...settings.fraud, machineLearning: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="realTimeAlerts">Real-time Alerts</label>
                <Switch
                  id="realTimeAlerts"
                  checked={settings.fraud.realTimeAlerts}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      fraud: { ...settings.fraud, realTimeAlerts: checked },
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <label className="text-base font-medium">
              Notification Channels
            </label>
          </div>

          <div className="space-y-3 pl-6">
            <div className="flex items-center justify-between">
              <label htmlFor="emailNotifications">Email Notifications</label>
              <Switch
                id="emailNotifications"
                checked={settings.notifications.email}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      email: checked,
                    },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="pushNotifications">Push Notifications</label>
              <Switch
                id="pushNotifications"
                checked={settings.notifications.push}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, push: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="smsNotifications">SMS Notifications</label>
              <Switch
                id="smsNotifications"
                checked={settings.notifications.sms}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, sms: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="webhookNotifications">
                Webhook Notifications
              </label>
              <Switch
                id="webhookNotifications"
                checked={settings.notifications.webhook}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      webhook: checked,
                    },
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
