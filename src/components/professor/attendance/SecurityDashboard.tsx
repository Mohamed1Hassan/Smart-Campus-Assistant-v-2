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
import { Alert, AlertDescription } from "../../ui/alert";
import { Progress } from "../../ui/progress";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Download,
  BarChart3,
  RefreshCw,
  Clock,
  Users,
  Eye,
  MapPin,
  Smartphone,
  Camera,
} from "lucide-react";

// Types
interface SecurityMetrics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  fraudDetected: number;
  averageFraudScore: number;
  deviceChanges: number;
  locationViolations: number;
  timeViolations: number;
  photoFailures: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  lastUpdated: Date;
}

interface FraudAlert {
  id: string;
  studentId: number;
  studentName: string;
  type:
    | "LOCATION_SPOOFING"
    | "TIME_MANIPULATION"
    | "DEVICE_SHARING"
    | "MULTIPLE_DEVICES"
    | "SUSPICIOUS_PATTERN"
    | "QR_SHARING";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  timestamp: Date;
  riskScore: number;
  status: "PENDING" | "INVESTIGATING" | "RESOLVED" | "DISMISSED";
  actions: string[];
}

interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  riskThreshold: number;
  locationAccuracy: number;
  deviceVerification: boolean;
  photoVerification: boolean;
  timeValidation: boolean;
  fraudDetection: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SecurityDashboardProps {
  onAlertAction?: (alertId: string, action: string) => void;
  onExportData?: (type: string) => void;
}

export function SecurityDashboard({
  onAlertAction,
  onExportData,
}: SecurityDashboardProps) {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [timeRange] = useState("7d");
  const [alertFilter, setAlertFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load data on component mount
  useEffect(() => {
    loadSecurityData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadSecurityData();
      setLastUpdate(new Date());
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const loadSecurityData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadSecurityMetrics(),
        loadFraudAlerts(),
        loadSecurityPolicies(),
      ]);
    } catch (error) {
      console.error("Failed to load security data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSecurityMetrics = async () => {
    try {
      // Mock data - replace with actual API call
      const mockMetrics: SecurityMetrics = {
        totalAttempts: 1250,
        successfulAttempts: 1180,
        failedAttempts: 70,
        fraudDetected: 15,
        averageFraudScore: 35,
        deviceChanges: 8,
        locationViolations: 12,
        timeViolations: 5,
        photoFailures: 3,
        riskLevel: "MEDIUM",
        lastUpdated: new Date(),
      };
      setMetrics(mockMetrics);
    } catch (error) {
      console.error("Failed to load security metrics:", error);
    }
  };

  const loadFraudAlerts = async () => {
    try {
      // Mock data - replace with actual API call
      const mockAlerts: FraudAlert[] = [
        {
          id: "alert-1",
          studentId: 12345,
          studentName: "John Doe",
          type: "LOCATION_SPOOFING",
          severity: "HIGH",
          description:
            "Student location appears to be spoofed - impossible location jump detected",
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          riskScore: 85,
          status: "PENDING",
          actions: [
            "Review location history",
            "Contact student",
            "Flag for investigation",
          ],
        },
        {
          id: "alert-2",
          studentId: 12346,
          studentName: "Jane Smith",
          type: "DEVICE_SHARING",
          severity: "MEDIUM",
          description:
            "Multiple devices detected for same student within short time frame",
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          riskScore: 65,
          status: "INVESTIGATING",
          actions: [
            "Verify device ownership",
            "Check device history",
            "Send warning",
          ],
        },
        {
          id: "alert-3",
          studentId: 12347,
          studentName: "Bob Johnson",
          type: "SUSPICIOUS_PATTERN",
          severity: "CRITICAL",
          description:
            "Unusual attendance pattern detected - multiple rapid attempts",
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          riskScore: 95,
          status: "PENDING",
          actions: [
            "Immediate investigation",
            "Suspend attendance",
            "Contact security",
          ],
        },
      ];
      setAlerts(mockAlerts);
    } catch (error) {
      console.error("Failed to load fraud alerts:", error);
    }
  };

  const loadSecurityPolicies = async () => {
    try {
      // Mock data - replace with actual API call
      const mockPolicies: SecurityPolicy[] = [
        {
          id: "policy-1",
          name: "Standard Security Policy",
          description:
            "Default security settings for regular attendance sessions",
          isActive: true,
          riskThreshold: 70,
          locationAccuracy: 10,
          deviceVerification: true,
          photoVerification: false,
          timeValidation: true,
          fraudDetection: true,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: "policy-2",
          name: "High Security Policy",
          description: "Enhanced security for sensitive sessions",
          isActive: true,
          riskThreshold: 50,
          locationAccuracy: 5,
          deviceVerification: true,
          photoVerification: true,
          timeValidation: true,
          fraudDetection: true,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      ];
      setPolicies(mockPolicies);
    } catch (error) {
      console.error("Failed to load security policies:", error);
    }
  };

  const handleAlertAction = (alertId: string, action: string) => {
    onAlertAction?.(alertId, action);
    // Update local state
    setAlerts(
      alerts.map((alert) =>
        alert.id === alertId
          ? { ...alert, status: action.toUpperCase() as FraudAlert["status"] }
          : alert,
      ),
    );
  };

  const handleExportData = (type: string) => {
    onExportData?.(type);
  };

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case "LOW":
        return <CheckCircle className="h-4 w-4" />;
      case "MEDIUM":
        return <AlertTriangle className="h-4 w-4" />;
      case "HIGH":
        return <AlertTriangle className="h-4 w-4" />;
      case "CRITICAL":
        return <XCircle className="h-4 w-4" />;
      default:
        return "Unknown";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-500";
      case "HIGH":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-yellow-500";
      case "LOW":
        return "bg-blue-500";
      default:
        return "Unknown";
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "Critical";
      case "HIGH":
        return "High";
      case "MEDIUM":
        return "Medium";
      case "LOW":
        return "Low";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500";
      case "INVESTIGATING":
        return "bg-blue-500";
      case "RESOLVED":
        return "bg-green-500";
      case "DISMISSED":
        return "bg-gray-500";
      default:
        return "Unknown";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Pending";
      case "INVESTIGATING":
        return "Investigating";
      case "RESOLVED":
        return "Resolved";
      case "DISMISSED":
        return "Dismissed";
      default:
        return "Unknown";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "LOCATION_SPOOFING":
        return "Location";
      case "TIME_MANIPULATION":
        return "Time";
      case "DEVICE_SHARING":
        return "Device";
      case "MULTIPLE_DEVICES":
        return "Multiple";
      case "SUSPICIOUS_PATTERN":
        return "Alert";
      case "QR_SHARING":
        return "馃摳";
      default:
        return "Unknown";
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case "LOCATION_SPOOFING":
        return "Location Spoofing";
      case "TIME_MANIPULATION":
        return "Time Manipulation";
      case "DEVICE_SHARING":
        return "Device Sharing";
      case "MULTIPLE_DEVICES":
        return "Multiple Devices";
      case "SUSPICIOUS_PATTERN":
        return "Suspicious Pattern";
      case "QR_SHARING":
        return "QR Code Sharing";
      default:
        return "Unknown";
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (alertFilter === "all") return true;
    if (alertFilter === "pending") return alert.status === "PENDING";
    if (alertFilter === "critical") return alert.severity === "CRITICAL";
    return alert.status === alertFilter.toUpperCase();
  });

  const pendingAlerts = alerts.filter((alert) => alert.status === "PENDING");
  const criticalAlerts = alerts.filter(
    (alert) => alert.severity === "CRITICAL",
  );
  const resolvedAlerts = alerts.filter((alert) => alert.status === "RESOLVED");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading security dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time security monitoring and fraud detection
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live</span>
          </Badge>
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button variant="outline" onClick={loadSecurityData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Security Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {metrics.totalAttempts.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Attempts
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {(
                      (metrics.successfulAttempts / metrics.totalAttempts) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Success Rate
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {metrics.fraudDetected}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Fraud Detected
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                {getRiskLevelIcon(metrics.riskLevel)}
                <div>
                  <div className="text-2xl font-bold capitalize">
                    {metrics.riskLevel}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Risk Level
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Risk Level Alert */}
      {metrics && metrics.riskLevel === "CRITICAL" && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>CRITICAL SECURITY ALERT:</strong> Immediate action required.
            Review all security settings and investigate recent fraud attempts.
          </AlertDescription>
        </Alert>
      )}

      {/* Security Metrics */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Security Metrics</span>
            </CardTitle>
            <CardDescription>
              Detailed security performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Success Rate</span>
                  <span className="text-sm text-muted-foreground">
                    {(
                      (metrics.successfulAttempts / metrics.totalAttempts) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    (metrics.successfulAttempts / metrics.totalAttempts) * 100
                  }
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fraud Rate</span>
                  <span className="text-sm text-muted-foreground">
                    {(
                      (metrics.fraudDetected / metrics.totalAttempts) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <Progress
                  value={(metrics.fraudDetected / metrics.totalAttempts) * 100}
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Device Changes</span>
                  <span className="text-sm text-muted-foreground">
                    {metrics.deviceChanges}
                  </span>
                </div>
                <Progress
                  value={Math.min((metrics.deviceChanges / 20) * 100, 100)}
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Location Violations
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {metrics.locationViolations}
                  </span>
                </div>
                <Progress
                  value={Math.min((metrics.locationViolations / 30) * 100, 100)}
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fraud Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Fraud Alerts</span>
          </CardTitle>
          <CardDescription>
            Recent security alerts and fraud attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Select
                value={alertFilter}
                onChange={(e) => setAlertFilter(e.target.value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter alerts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Alerts</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportData("alerts")}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-2 text-green-600" />
                  <p>No fraud alerts</p>
                  <p className="text-sm">All attendance attempts are secure</p>
                </div>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div key={alert.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getTypeIcon(alert.type)}</span>
                      <div>
                        <div className="font-medium">{alert.studentName}</div>
                        <div className="text-sm text-muted-foreground">
                          {getTypeDescription(alert.type)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {getSeverityText(alert.severity)}
                      </Badge>
                      <Badge className={getStatusColor(alert.status)}>
                        {getStatusText(alert.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {alert.description}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{getTimeAgo(alert.timestamp)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>ID: {alert.studentId}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span>Risk: {alert.riskScore}/100</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <span>{alert.actions.length} actions</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAlertAction(alert.id, "investigate")}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Investigate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAlertAction(alert.id, "resolve")}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAlertAction(alert.id, "dismiss")}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Security Policies</span>
          </CardTitle>
          <CardDescription>
            Manage security policies and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {policies.map((policy) => (
              <div key={policy.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium">{policy.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {policy.description}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={policy.isActive ? "default" : "secondary"}>
                      {policy.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>Risk: {policy.riskThreshold}%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>Accuracy: {policy.locationAccuracy}m</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Device: {policy.deviceVerification ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Photo: {policy.photoVerification ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {pendingAlerts.length}
          </div>
          <div className="text-sm text-muted-foreground">Pending Alerts</div>
        </div>
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {criticalAlerts.length}
          </div>
          <div className="text-sm text-muted-foreground">Critical Alerts</div>
        </div>
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {resolvedAlerts.length}
          </div>
          <div className="text-sm text-muted-foreground">Resolved</div>
        </div>
      </div>
    </div>
  );
}
