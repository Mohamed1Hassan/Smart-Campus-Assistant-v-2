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
import { Badge } from "../../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Shield,
  Flag,
  Eye,
} from "lucide-react";

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

interface FraudHandlingProps {
  alerts: FraudAlert[];
  onAction: (alertId: string, action: string) => void;
}

export function FraudHandling({ alerts, onAction }: FraudHandlingProps) {
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [sortBy, setSortBy] = useState("timestamp");

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
        return "bg-gray-500";
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
        return "bg-gray-400";
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
        return "Devices";
      case "SUSPICIOUS_PATTERN":
        return "Pattern";
      case "QR_SHARING":
        return "QR";
      default:
        return "Other";
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

  const handleAlertAction = (alertId: string, action: string) => {
    onAction(alertId, action);
  };

  const handleAlertSelect = (alertId: string) => {
    setSelectedAlert(selectedAlert === alertId ? null : alertId);
  };

  // Filter and sort alerts
  const filteredAlerts = alerts.filter((alert) => {
    const statusMatch = filterStatus === "all" || alert.status === filterStatus;
    const severityMatch =
      filterSeverity === "all" || alert.severity === filterSeverity;
    return statusMatch && severityMatch;
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

  const pendingAlerts = alerts.filter((alert) => alert.status === "PENDING");
  const criticalAlerts = alerts.filter(
    (alert) => alert.severity === "CRITICAL",
  );
  const resolvedAlerts = alerts.filter((alert) => alert.status === "RESOLVED");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Fraud Alert Handling</span>
        </CardTitle>
        <CardDescription>
          Manage and resolve fraud alerts and security threats
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {pendingAlerts.length}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {criticalAlerts.length}
            </div>
            <div className="text-sm text-muted-foreground">Critical</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {resolvedAlerts.length}
            </div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center space-x-4">
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="INVESTIGATING">Investigating</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="DISMISSED">Dismissed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="timestamp">Time</SelectItem>
              <SelectItem value="severity">Severity</SelectItem>
              <SelectItem value="riskScore">Risk Score</SelectItem>
              <SelectItem value="studentName">Student Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                <p>No alerts found</p>
                <p className="text-sm">Try adjusting your filters</p>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAlertSelect(alert.id)}
                    >
                      {selectedAlert === alert.id ? "Hide" : "Show"}
                    </Button>
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
                    <User className="h-4 w-4 text-muted-foreground" />
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

                {selectedAlert === alert.id && (
                  <div className="p-3 bg-gray-50 rounded-lg space-y-3">
                    <div>
                      <div className="text-sm font-medium mb-2">
                        Suggested Actions:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {alert.actions.map((action, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleAlertAction(alert.id, "investigate")
                        }
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAlertAction(alert.id, "flag")}
                      >
                        <Flag className="h-4 w-4 mr-2" />
                        Flag
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Bulk Actions */}
        {filteredAlerts.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-muted-foreground">
              {filteredAlerts.length} alert
              {filteredAlerts.length !== 1 ? "s" : ""} selected
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolve All
              </Button>
              <Button variant="outline" size="sm">
                <XCircle className="h-4 w-4 mr-2" />
                Dismiss All
              </Button>
              <Button variant="outline" size="sm">
                <Flag className="h-4 w-4 mr-2" />
                Flag All
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
