"use client";
import React, { useState, useEffect } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Battery,
  CheckCircle,
  HelpCircle,
  Info,
  RefreshCw,
  Settings,
  Shield,
  Signal,
  Target,
  Wifi,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

// Types
interface SecurityStatus {
  overall: "SECURE" | "WARNING" | "DANGER" | "CRITICAL";
  score: number;
  lastUpdate: Date;
  components: SecurityComponent[];
  alerts: SecurityAlert[];
  recommendations: SecurityRecommendation[];
  metrics: SecurityMetrics;
}

interface SecurityComponent {
  name: string;
  status: "SECURE" | "WARNING" | "DANGER" | "CRITICAL";
  score: number;
  lastCheck: Date;
  details: string;
  icon: string;
  isRequired: boolean;
  isEnabled: boolean;
}

interface SecurityAlert {
  id: string;
  type: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  title: string;
  message: string;
  timestamp: Date;
  isResolved: boolean;
  actionRequired: boolean;
  actions: SecurityAction[];
}

interface SecurityAction {
  id: string;
  title: string;
  description: string;
  type: "BUTTON" | "LINK" | "TOGGLE";
  action: () => void;
  isEnabled: boolean;
}

interface SecurityRecommendation {
  id: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category: string;
  isImplemented: boolean;
  impact: string;
}

interface SecurityMetrics {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  averageScore: number;
  trend: "UP" | "DOWN" | "STABLE";
  lastWeekScore: number;
  lastMonthScore: number;
}

interface SecurityStatusProps {
  onStatusUpdate: (status: SecurityStatus) => void;
  onAlertAction: (alertId: string, actionId: string) => void;
  onRecommendationAction: (recommendationId: string) => void;
  enableRealTimeUpdates: boolean;
  updateInterval: number;
  enableNotifications: boolean;
  enableAlerts: boolean;
  enableRecommendations: boolean;
  securityLevel: "LOW" | "MEDIUM" | "HIGH" | "MAXIMUM";
}

export function SecurityStatus({
  onStatusUpdate,
  onAlertAction,
  onRecommendationAction,
  enableRealTimeUpdates,
  updateInterval,
  enableNotifications,
  enableAlerts,
  enableRecommendations,
  securityLevel,
}: SecurityStatusProps) {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<
    "ONLINE" | "OFFLINE" | "POOR"
  >("ONLINE");
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [signalStrength, setSignalStrength] = useState(4);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Initialize security status
  useEffect(() => {
    loadSecurityStatus();
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

  // Handle status updates
  useEffect(() => {
    if (securityStatus) {
      onStatusUpdate(securityStatus);
    }
  }, [securityStatus, onStatusUpdate]);

  const loadSecurityStatus = async () => {
    setIsLoading(true);
    try {
      // Mock security status data
      const status: SecurityStatus = {
        overall: "SECURE",
        score: 85,
        lastUpdate: new Date(),
        components: [
          {
            name: "QR Code Verification",
            status: "SECURE",
            score: 95,
            lastCheck: new Date(),
            details: "QR code scanned successfully",
            icon: "QrCode",
            isRequired: true,
            isEnabled: true,
          },
          {
            name: "Location Verification",
            status: "WARNING",
            score: 75,
            lastCheck: new Date(),
            details: "Location accuracy is below optimal",
            icon: "MapPin",
            isRequired: true,
            isEnabled: true,
          },
          {
            name: "Device Verification",
            status: "SECURE",
            score: 90,
            lastCheck: new Date(),
            details: "Device fingerprint verified",
            icon: "Smartphone",
            isRequired: true,
            isEnabled: true,
          },
          {
            name: "Photo Verification",
            status: "SECURE",
            score: 88,
            lastCheck: new Date(),
            details: "Photo captured and verified",
            icon: "Camera",
            isRequired: false,
            isEnabled: true,
          },
          {
            name: "Network Security",
            status: "WARNING",
            score: 70,
            lastCheck: new Date(),
            details: "Network signal is weak",
            icon: "Wifi",
            isRequired: true,
            isEnabled: true,
          },
          {
            name: "Battery Level",
            status: "WARNING",
            score: 60,
            lastCheck: new Date(),
            details: "Battery level is low",
            icon: "Battery",
            isRequired: false,
            isEnabled: true,
          },
        ],
        alerts: [
          {
            id: "alert-1",
            type: "WARNING",
            title: "Location Accuracy",
            message: "Your location accuracy is below the recommended level",
            timestamp: new Date(),
            isResolved: false,
            actionRequired: true,
            actions: [
              {
                id: "action-1",
                title: "Improve Location",
                description: "Move to an area with better GPS signal",
                type: "BUTTON",
                action: () => console.log("Improve location"),
                isEnabled: true,
              },
            ],
          },
          {
            id: "alert-2",
            type: "INFO",
            title: "Battery Level",
            message: "Your battery level is low, consider charging your device",
            timestamp: new Date(),
            isResolved: false,
            actionRequired: false,
            actions: [],
          },
        ],
        recommendations: [
          {
            id: "rec-1",
            title: "Enable High Accuracy Mode",
            description:
              "Enable high accuracy location mode for better GPS precision",
            priority: "MEDIUM",
            category: "Location",
            isImplemented: false,
            impact: "Improves location accuracy by 20%",
          },
          {
            id: "rec-2",
            title: "Update Device Registration",
            description: "Update your device registration for better security",
            priority: "HIGH",
            category: "Device",
            isImplemented: false,
            impact: "Reduces security risks by 15%",
          },
        ],
        metrics: {
          totalChecks: 25,
          passedChecks: 20,
          failedChecks: 2,
          warningChecks: 3,
          averageScore: 85,
          trend: "UP",
          lastWeekScore: 80,
          lastMonthScore: 75,
        },
      };

      setSecurityStatus(status);
    } catch (error) {
      console.error("Failed to load security status:", error);
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
      loadSecurityStatus();
    }, updateInterval);

    return () => clearInterval(interval);
  };

  const updateConnectionStatus = () => {
    if (typeof navigator !== "undefined" && navigator.onLine) {
      setConnectionStatus("ONLINE");
    } else {
      setConnectionStatus("OFFLINE");
    }
  };

  const updateBatteryLevel = () => {
    if (typeof navigator !== "undefined" && "getBattery" in navigator) {
      const nav = navigator as Navigator & {
        getBattery?: () => Promise<{ level: number }>;
      };
      nav.getBattery?.().then((battery: { level: number }) => {
        setBatteryLevel(Math.round(battery.level * 100));
      });
    }
  };

  const updateSignalStrength = () => {
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

  const handleRecommendationAction = (recommendationId: string) => {
    onRecommendationAction(recommendationId);

    // Update recommendation status
    if (securityStatus) {
      const updatedRecommendations = securityStatus.recommendations.map(
        (rec) =>
          rec.id === recommendationId ? { ...rec, isImplemented: true } : rec,
      );

      setSecurityStatus((prev) =>
        prev
          ? {
              ...prev,
              recommendations: updatedRecommendations,
            }
          : null,
      );
    }
  };

  const handleAlertAction = (alertId: string, actionId: string) => {
    onAlertAction(alertId, actionId);

    // Update alert status if needed locally
    if (securityStatus) {
      const updatedAlerts = securityStatus.alerts.map((alert) => {
        if (alert.id === alertId) {
          return { ...alert, isResolved: true };
        }
        return alert;
      });
      setSecurityStatus((prev) =>
        prev ? { ...prev, alerts: updatedAlerts } : null,
      );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SECURE":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "DANGER":
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case "CRITICAL":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SECURE":
        return "bg-green-500 text-white";
      case "WARNING":
        return "bg-yellow-500 text-white";
      case "DANGER":
        return "bg-orange-500 text-white";
      case "CRITICAL":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "INFO":
        return <Info className="h-4 w-4 text-blue-600" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "ERROR":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "CRITICAL":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case "INFO":
        return "bg-blue-500 text-white";
      case "WARNING":
        return "bg-yellow-500 text-white";
      case "ERROR":
        return "bg-red-500 text-white";
      case "CRITICAL":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "bg-green-500 text-white";
      case "MEDIUM":
        return "bg-yellow-500 text-white";
      case "HIGH":
        return "bg-orange-500 text-white";
      case "CRITICAL":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading security status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Security Status</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
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
          <span className="text-sm font-medium">{securityLevel}</span>
        </div>
      </div>

      {/* Overall Status */}
      {securityStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {getStatusIcon(securityStatus.overall)}
              <span>Overall Security Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Security Score</div>
                  <div className="text-sm text-muted-foreground">
                    Last updated: {securityStatus.lastUpdate.toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={securityStatus.score} className="w-20 h-2" />
                  <span className="text-sm font-medium">
                    {securityStatus.score}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium">Total Checks</div>
                  <div className="text-sm text-muted-foreground">
                    {securityStatus.metrics.totalChecks}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Passed</div>
                  <div className="text-sm text-muted-foreground">
                    {securityStatus.metrics.passedChecks}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Failed</div>
                  <div className="text-sm text-muted-foreground">
                    {securityStatus.metrics.failedChecks}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Components */}
      {securityStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Security Components</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityStatus.components.map((component, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:border-gray-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Shield className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{component.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {component.details}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusBadge(component.status)}>
                      {component.status}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(component.status)}
                      <span className="text-sm font-medium">
                        {component.score}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Alerts */}
      {securityStatus && enableAlerts && securityStatus.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Security Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityStatus.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:border-gray-300"
                >
                  <div className="flex items-center space-x-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {alert.message}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={getAlertBadge(alert.type)}>
                        {alert.type}
                      </Badge>
                      {alert.actionRequired && !alert.isResolved && (
                        <Badge variant="outline">Action Required</Badge>
                      )}
                    </div>
                    {alert.actionRequired && !alert.isResolved && (
                      <div className="flex space-x-2">
                        {alert.actions.map((action) => (
                          <Button
                            key={action.id}
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAlertAction(alert.id, action.id);
                            }}
                            disabled={!action.isEnabled}
                          >
                            {action.title}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Recommendations */}
      {securityStatus &&
        enableRecommendations &&
        securityStatus.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Security Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityStatus.recommendations.map((recommendation) => (
                  <div
                    key={recommendation.id}
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:border-gray-300"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Target className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {recommendation.title}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {recommendation.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        className={getPriorityBadge(recommendation.priority)}
                      >
                        {recommendation.priority}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRecommendationAction(recommendation.id);
                        }}
                        disabled={recommendation.isImplemented}
                      >
                        {recommendation.isImplemented
                          ? "Implemented"
                          : "Implement"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Security Settings</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Real-time Updates</span>
                  <Switch
                    checked={enableRealTimeUpdates}
                    onCheckedChange={() => {
                      /* Handle change in parent using props if needed */
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Notifications</span>
                  <Switch
                    checked={enableNotifications}
                    onCheckedChange={() => {
                      /* Handle change */
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Alerts</span>
                  <Switch
                    checked={enableAlerts}
                    onCheckedChange={() => {
                      /* Handle change */
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
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
                <div>
                  <div className="text-sm font-medium">
                    What is Security Status?
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Security Status monitors all security components and
                    provides real-time feedback on your attendance security.
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">
                    How to Improve Security
                  </div>
                  <div className="text-sm text-muted-foreground font-sans">
                    • Follow security recommendations
                    <br />
                    • Keep your device updated
                    <br />
                    • Use secure networks
                    <br />• Enable all security features
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">Troubleshooting</div>
                  <div className="text-sm text-muted-foreground font-sans">
                    • Check your internet connection
                    <br />
                    • Ensure all permissions are granted
                    <br />
                    • Restart the app if needed
                    <br />• Contact support for persistent issues
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
