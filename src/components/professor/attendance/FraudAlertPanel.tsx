"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Alert, AlertDescription } from "../../ui/alert";
import { Progress } from "../../ui/progress";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Shield,
  Flag,
  Eye,
  Search,
  Download,
  RefreshCw,
  MapPin,
  Smartphone,
  ClockIcon,
} from "lucide-react";

// Types
interface FraudAlert {
  id: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
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
  evidence: {
    location: {
      latitude: number;
      longitude: number;
      accuracy: number;
      timestamp: Date;
    };
    device: {
      fingerprint: string;
      userAgent: string;
      platform: string;
    };
    time: {
      clientTime: Date;
      serverTime: Date;
      timezone: string;
    };
    photo?: {
      url: string;
      metadata: Record<string, unknown>;
      timestamp: Date;
    };
  };
  investigation: {
    assignedTo?: string;
    notes: string[];
    status: "OPEN" | "IN_PROGRESS" | "CLOSED";
    resolution?: string;
    resolvedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface AlertStats {
  totalAlerts: number;
  pendingAlerts: number;
  investigatingAlerts: number;
  resolvedAlerts: number;
  dismissedAlerts: number;
  criticalAlerts: number;
  averageRiskScore: number;
  resolutionRate: number;
}

interface FraudAlertPanelProps {
  onAlertAction?: (alertId: string, action: string) => void;
  onAlertResolve?: (alertId: string, resolution: string) => void;
  onExportAlerts?: (filters: Record<string, unknown>) => void;
}

export function FraudAlertPanel({
  onAlertAction,
  onAlertResolve,
  onExportAlerts,
}: FraudAlertPanelProps) {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [isViewing, setIsViewing] = useState(false);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("timestamp");
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [investigationNotes, setInvestigationNotes] = useState("");
  const [resolution, setResolution] = useState("");

  // Load alerts on component mount
  useEffect(() => {
    loadAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadAlerts();
      setLastUpdate(new Date());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockAlerts: FraudAlert[] = [
        {
          id: "alert-1",
          studentId: 12345,
          studentName: "John Doe",
          studentEmail: "john.doe@university.edu",
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
          evidence: {
            location: {
              latitude: 40.7128,
              longitude: -74.006,
              accuracy: 5,
              timestamp: new Date(Date.now() - 30 * 60 * 1000),
            },
            device: {
              fingerprint: "device-123",
              userAgent:
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              platform: "Windows",
            },
            time: {
              clientTime: new Date(Date.now() - 30 * 60 * 1000),
              serverTime: new Date(Date.now() - 30 * 60 * 1000),
              timezone: "America/New_York",
            },
          },
          investigation: {
            notes: [],
            status: "OPEN",
          },
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: "alert-2",
          studentId: 12346,
          studentName: "Jane Smith",
          studentEmail: "jane.smith@university.edu",
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
          evidence: {
            location: {
              latitude: 40.713,
              longitude: -74.0058,
              accuracy: 8,
              timestamp: new Date(Date.now() - 15 * 60 * 1000),
            },
            device: {
              fingerprint: "device-456",
              userAgent:
                "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
              platform: "iOS",
            },
            time: {
              clientTime: new Date(Date.now() - 15 * 60 * 1000),
              serverTime: new Date(Date.now() - 15 * 60 * 1000),
              timezone: "America/New_York",
            },
          },
          investigation: {
            assignedTo: "Security Team",
            notes: ["Initial investigation started", "Device history reviewed"],
            status: "IN_PROGRESS",
          },
          createdAt: new Date(Date.now() - 15 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: "alert-3",
          studentId: 12347,
          studentName: "Bob Johnson",
          studentEmail: "bob.johnson@university.edu",
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
          evidence: {
            location: {
              latitude: 40.7125,
              longitude: -74.0062,
              accuracy: 3,
              timestamp: new Date(Date.now() - 5 * 60 * 1000),
            },
            device: {
              fingerprint: "device-789",
              userAgent:
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
              platform: "macOS",
            },
            time: {
              clientTime: new Date(Date.now() - 5 * 60 * 1000),
              serverTime: new Date(Date.now() - 5 * 60 * 1000),
              timezone: "America/New_York",
            },
          },
          investigation: {
            notes: [],
            status: "OPEN",
          },
          createdAt: new Date(Date.now() - 5 * 60 * 1000),
          updatedAt: new Date(),
        },
      ];
      setAlerts(mockAlerts);
      calculateStats(mockAlerts);
    } catch (error) {
      console.error("Failed to load alerts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (alerts: FraudAlert[]) => {
    const totalAlerts = alerts.length;
    const pendingAlerts = alerts.filter((a) => a.status === "PENDING").length;
    const investigatingAlerts = alerts.filter(
      (a) => a.status === "INVESTIGATING",
    ).length;
    const resolvedAlerts = alerts.filter((a) => a.status === "RESOLVED").length;
    const dismissedAlerts = alerts.filter(
      (a) => a.status === "DISMISSED",
    ).length;
    const criticalAlerts = alerts.filter(
      (a) => a.severity === "CRITICAL",
    ).length;
    const averageRiskScore =
      alerts.reduce((sum, a) => sum + a.riskScore, 0) / alerts.length;
    const resolutionRate =
      totalAlerts > 0
        ? ((resolvedAlerts + dismissedAlerts) / totalAlerts) * 100
        : 0;

    setStats({
      totalAlerts,
      pendingAlerts,
      investigatingAlerts,
      resolvedAlerts,
      dismissedAlerts,
      criticalAlerts,
      averageRiskScore,
      resolutionRate,
    });
  };

  const handleAlertAction = (alertId: string, action: string) => {
    onAlertAction?.(alertId, action);
    // Update local state
    setAlerts(
      alerts.map((alert) =>
        alert.id === alertId
          ? {
              ...alert,
              status: action.toUpperCase() as FraudAlert["status"],
              updatedAt: new Date(),
            }
          : alert,
      ),
    );
  };

  /*
  const handleAlertAssign = (alertId: string, assignee: string) => {
    onAlertAssign?.(alertId, assignee);
    // Update local state
    setAlerts(alerts.map(alert =>
      alert.id === alertId
        ? {
          ...alert,
          investigation: { ...alert.investigation, assignedTo: assignee, status: 'IN_PROGRESS' },
          status: 'INVESTIGATING' as FraudAlert['status'],
          updatedAt: new Date()
        }
        : alert
    ));
  };
  */

  const handleAlertResolve = (alertId: string, resolution: string) => {
    onAlertResolve?.(alertId, resolution);
    // Update local state
    setAlerts(
      alerts.map((alert) =>
        alert.id === alertId
          ? {
              ...alert,
              status: "RESOLVED" as FraudAlert["status"],
              investigation: {
                ...alert.investigation,
                resolution,
                resolvedAt: new Date(),
                status: "CLOSED",
              },
              updatedAt: new Date(),
            }
          : alert,
      ),
    );
  };

  const handleViewAlert = (alert: FraudAlert) => {
    setSelectedAlert(alert);
    setIsViewing(true);
  };

  const handleInvestigateAlert = (alert: FraudAlert) => {
    setSelectedAlert(alert);
    setIsInvestigating(true);
  };

  const handleAddInvestigationNote = () => {
    if (selectedAlert && investigationNotes.trim()) {
      setAlerts(
        alerts.map((alert) =>
          alert.id === selectedAlert.id
            ? {
                ...alert,
                investigation: {
                  ...alert.investigation,
                  notes: [...alert.investigation.notes, investigationNotes],
                  status: "IN_PROGRESS",
                },
                updatedAt: new Date(),
              }
            : alert,
        ),
      );
      setInvestigationNotes("");
    }
  };

  const handleResolveAlert = () => {
    if (selectedAlert && resolution.trim()) {
      handleAlertResolve(selectedAlert.id, resolution);
      setResolution("");
      setIsInvestigating(false);
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
        return "QR";
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

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-red-600";
    if (score >= 60) return "text-orange-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  // Filter and sort alerts
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity =
      filterSeverity === "all" || alert.severity === filterSeverity;
    const matchesStatus =
      filterStatus === "all" || alert.status === filterStatus;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  // Sort alerts
  filteredAlerts.sort((a, b) => {
    switch (sortBy) {
      case "timestamp":
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      case "severity":
        const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      case "riskScore":
        return b.riskScore - a.riskScore;
      case "studentName":
        return a.studentName.localeCompare(b.studentName);
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading fraud alerts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fraud Alert Panel</h2>
          <p className="text-muted-foreground">
            Real-time fraud detection and investigation management
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
          <Button variant="outline" onClick={loadAlerts}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Alert Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalAlerts}
            </div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pendingAlerts}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {stats.investigatingAlerts}
            </div>
            <div className="text-sm text-muted-foreground">Investigating</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats.resolvedAlerts}
            </div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {stats.dismissedAlerts}
            </div>
            <div className="text-sm text-muted-foreground">Dismissed</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {stats.criticalAlerts}
            </div>
            <div className="text-sm text-muted-foreground">Critical</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {stats.averageRiskScore.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Risk</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {stats.resolutionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Resolution</div>
          </div>
        </div>
      )}

      {/* Critical Alerts */}
      {alerts.filter((a) => a.severity === "CRITICAL" && a.status === "PENDING")
        .length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>CRITICAL ALERTS:</strong>{" "}
            {
              alerts.filter(
                (a) => a.severity === "CRITICAL" && a.status === "PENDING",
              ).length
            }{" "}
            critical alerts require immediate attention
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="INVESTIGATING">Investigating</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="DISMISSED">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="timestamp">Time</SelectItem>
            <SelectItem value="severity">Severity</SelectItem>
            <SelectItem value="riskScore">Risk Score</SelectItem>
            <SelectItem value="studentName">Student</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() =>
            onExportAlerts?.({
              searchTerm,
              filterSeverity,
              filterStatus,
              sortBy,
            })
          }
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-2 text-green-600" />
              <p>No fraud alerts found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <Card key={alert.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getTypeIcon(alert.type)}</span>
                    <div>
                      <div className="font-medium">{alert.studentName}</div>
                      <div className="text-sm text-muted-foreground">
                        {getTypeDescription(alert.type)} 锟?{alert.studentEmail}
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewAlert(alert)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInvestigateAlert(alert)}
                    >
                      <Flag className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground mb-3">
                  {alert.description}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{getTimeAgo(alert.timestamp)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>ID: {alert.studentId}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className={getRiskColor(alert.riskScore)}>
                      Risk: {alert.riskScore}/100
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <span>{alert.actions.length} actions</span>
                  </div>
                </div>

                {/* Evidence Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {alert.evidence.location.latitude.toFixed(4)},{" "}
                      {alert.evidence.location.longitude.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span>{alert.evidence.device.platform}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{alert.evidence.time.timezone}</span>
                  </div>
                </div>

                {/* Investigation Status */}
                {alert.investigation.assignedTo && (
                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                    <div className="text-sm text-blue-800">
                      <strong>Assigned to:</strong>{" "}
                      {alert.investigation.assignedTo}
                    </div>
                    <div className="text-xs text-blue-700">
                      Status: {alert.investigation.status.replace("_", " ")}
                    </div>
                  </div>
                )}

                {/* Actions */}
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
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Alert Details Dialog */}
      <Dialog open={isViewing} onOpenChange={setIsViewing}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
            <DialogDescription>
              Detailed information for {selectedAlert?.studentName}
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-6">
              {/* Alert Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Student</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedAlert.studentName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedAlert.studentEmail}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Alert Type</div>
                  <div className="text-sm text-muted-foreground">
                    {getTypeDescription(selectedAlert.type)}
                  </div>
                </div>
              </div>

              {/* Severity and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Severity</div>
                  <Badge className={getSeverityColor(selectedAlert.severity)}>
                    {getSeverityText(selectedAlert.severity)}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium">Status</div>
                  <Badge className={getStatusColor(selectedAlert.status)}>
                    {getStatusText(selectedAlert.status)}
                  </Badge>
                </div>
              </div>

              {/* Risk Score */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Risk Score</div>
                <div className="flex items-center space-x-2">
                  <Progress
                    value={selectedAlert.riskScore}
                    className="flex-1"
                  />
                  <span
                    className={`text-sm font-medium ${getRiskColor(selectedAlert.riskScore)}`}
                  >
                    {selectedAlert.riskScore}/100
                  </span>
                </div>
              </div>

              {/* Evidence */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Evidence</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm font-medium mb-2">Location</div>
                    <div className="text-sm text-muted-foreground">
                      <div>
                        Lat:{" "}
                        {selectedAlert.evidence.location.latitude.toFixed(6)}
                      </div>
                      <div>
                        Lng:{" "}
                        {selectedAlert.evidence.location.longitude.toFixed(6)}
                      </div>
                      <div>
                        Accuracy: {selectedAlert.evidence.location.accuracy}m
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm font-medium mb-2">Device</div>
                    <div className="text-sm text-muted-foreground">
                      <div>
                        Platform: {selectedAlert.evidence.device.platform}
                      </div>
                      <div>
                        Fingerprint:{" "}
                        {selectedAlert.evidence.device.fingerprint.substring(
                          0,
                          12,
                        )}
                        ...
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Investigation */}
              {selectedAlert.investigation.notes.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium">Investigation Notes</h4>
                  <div className="space-y-2">
                    {selectedAlert.investigation.notes.map((note, index) => (
                      <div
                        key={index}
                        className="p-2 bg-gray-50 rounded text-sm"
                      >
                        {note}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsViewing(false)}>
                  Close
                </Button>
                <Button onClick={() => handleInvestigateAlert(selectedAlert)}>
                  <Flag className="h-4 w-4 mr-2" />
                  Investigate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Investigation Dialog */}
      <Dialog open={isInvestigating} onOpenChange={setIsInvestigating}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Investigate Alert</DialogTitle>
            <DialogDescription>
              Add investigation notes and resolve the alert
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="investigationNotes">Investigation Notes</label>
                <Textarea
                  id="investigationNotes"
                  value={investigationNotes}
                  onChange={(e) => setInvestigationNotes(e.target.value)}
                  placeholder="Add investigation notes..."
                  rows={3}
                />
                <Button onClick={handleAddInvestigationNote} size="sm">
                  Add Note
                </Button>
              </div>

              <div className="space-y-2">
                <label htmlFor="resolution">Resolution</label>
                <Textarea
                  id="resolution"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe how this alert was resolved..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsInvestigating(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleResolveAlert}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Resolve Alert
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
