"use client";
import React from "react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Alert, AlertDescription } from "../../ui/alert";
import {
  AlertTriangle,
  Clock,
  Shield,
  Eye,
  CheckCircle,
  XCircle,
  MoreHorizontal,
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

interface FraudAlertsProps {
  alerts: FraudAlert[];
  onAction: (alertId: string, action: string) => void;
}

export function FraudAlerts({ alerts, onAction }: FraudAlertsProps) {
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
        return "Normal";
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
      case "MEDIUM":
        return "AlertCircle";
      default:
        return "Info";
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

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 80) return "text-red-600";
    if (riskScore >= 60) return "text-orange-600";
    if (riskScore >= 40) return "text-yellow-600";
    return "text-green-600";
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

  const handleAction = (alertId: string, action: string) => {
    onAction(alertId, action);
  };

  const pendingAlerts = alerts.filter((alert) => alert.status === "PENDING");
  const criticalAlerts = alerts.filter(
    (alert) => alert.severity === "CRITICAL",
  );

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground mb-4">
          <Shield className="h-12 w-12 mx-auto mb-2 text-green-600" />
          <p>No fraud alerts</p>
          <p className="text-sm">All attendance attempts are secure</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {pendingAlerts.length}
          </div>
          <div className="text-sm text-muted-foreground">Pending</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {criticalAlerts.length}
          </div>
          <div className="text-sm text-muted-foreground">Critical</div>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{criticalAlerts.length} critical alerts</strong> require
            immediate attention
          </AlertDescription>
        </Alert>
      )}

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.slice(0, 5).map((alert) => (
          <div key={alert.id} className="border rounded-lg p-3 space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
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
                <Badge
                  variant="outline"
                  className={getStatusColor(alert.status)}
                >
                  {getStatusText(alert.status)}
                </Badge>
              </div>
            </div>

            {/* Description */}
            <div className="text-sm text-muted-foreground">
              {alert.description}
            </div>

            {/* Risk Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Risk Score:</span>
                <span
                  className={`text-sm font-bold ${getRiskColor(alert.riskScore)}`}
                >
                  {alert.riskScore}/100
                </span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{getTimeAgo(alert.timestamp)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(alert.id, "investigate")}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Investigate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(alert.id, "resolve")}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Resolve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(alert.id, "dismiss")}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Dismiss
                </Button>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* Suggested Actions */}
            {alert.actions.length > 0 && (
              <div className="bg-gray-50 p-2 rounded text-xs">
                <div className="font-medium mb-1">Suggested Actions:</div>
                <div className="flex flex-wrap gap-1">
                  {alert.actions.map((action, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {action}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* View All Button */}
      {alerts.length > 5 && (
        <div className="text-center">
          <Button variant="outline" size="sm">
            View All {alerts.length} Alerts
          </Button>
        </div>
      )}
    </div>
  );
}
