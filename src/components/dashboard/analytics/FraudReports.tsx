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
} from "../../ui/select"; // Added closing brace and 'from' clause
import {
  AlertTriangle,
  Download,
  Shield,
  TrendingUp,
  TrendingDown,
  Clock,
  User,
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

interface FraudFileTextsProps {
  alerts: FraudAlert[];
}

export function FraudReports({ alerts }: FraudFileTextsProps) {
  const [FileTextType, setFileTextType] = useState("summary");
  const [timeRange, setTimeRange] = useState("7d");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter] = useState("all");

  const getTimeRangeData = () => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "1d":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate: now };
  };

  const { startDate, endDate } = getTimeRangeData();

  // Filter alerts by time range
  let filteredAlerts = alerts.filter((alert) => {
    const alertDate = new Date(alert.timestamp);
    return alertDate >= startDate && alertDate <= endDate;
  });

  // Apply additional filters
  if (severityFilter !== "all") {
    filteredAlerts = filteredAlerts.filter(
      (alert) => alert.severity === severityFilter,
    );
  }

  if (typeFilter !== "all") {
    filteredAlerts = filteredAlerts.filter(
      (alert) => alert.type === typeFilter,
    );
  }

  // Calculate summary statistics
  const totalAlerts = filteredAlerts.length;
  const pendingAlerts = filteredAlerts.filter(
    (alert) => alert.status === "PENDING",
  ).length;
  const resolvedAlerts = filteredAlerts.filter(
    (alert) => alert.status === "RESOLVED",
  ).length;

  // Calculate fraud by type
  const fraudByType = filteredAlerts.reduce(
    (acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Calculate fraud by severity
  const fraudBySeverity = filteredAlerts.reduce(
    (acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Calculate fraud by status
  const fraudByStatus = filteredAlerts.reduce(
    (acc, alert) => {
      acc[alert.status] = (acc[alert.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Calculate average risk score
  const averageRiskScore =
    filteredAlerts.length > 0
      ? filteredAlerts.reduce((sum, alert) => sum + alert.riskScore, 0) /
        filteredAlerts.length
      : 0;

  // Calculate trends (mock data)
  const previousPeriod = {
    totalAlerts: Math.round(totalAlerts * 0.8),
    pendingAlerts: Math.round(pendingAlerts * 0.9),
    resolvedAlerts: Math.round(resolvedAlerts * 0.7),
  };

  const alertTrend = totalAlerts > previousPeriod.totalAlerts ? "up" : "down";
  const resolutionTrend =
    resolvedAlerts > previousPeriod.resolvedAlerts ? "up" : "down";

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

  const getTypeIcon = (type: string) => {
    switch (type) {
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

  const handleExportFileText = () => {
    console.log("Exporting fraud FileText:", {
      FileTextType,
      timeRange,
      severityFilter,
      typeFilter,
    });
  };

  const handleGenerateFileText = () => {
    console.log("Generating fraud FileText:", {
      FileTextType,
      timeRange,
      severityFilter,
      typeFilter,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Fraud FileTexts</span>
        </CardTitle>
        <CardDescription>
          Comprehensive fraud detection and security analysis FileTexts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* FileText Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">FileText Type</label>
            <Select
              value={FileTextType}
              onChange={(e) => setFileTextType(e.target.value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary FileText</SelectItem>
                <SelectItem value="detailed">Detailed FileText</SelectItem>
                <SelectItem value="trends">Trend Analysis</SelectItem>
                <SelectItem value="export">Export Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Time Range</label>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Severity</label>
            <Select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Actions</label>
            <div className="flex space-x-2">
              <Button onClick={handleGenerateFileText} size="sm">
                Generate
              </Button>
              <Button
                onClick={handleExportFileText}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Summary Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {totalAlerts}
              </div>
              <div className="text-sm text-muted-foreground">Total Alerts</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {pendingAlerts}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {resolvedAlerts}
              </div>
              <div className="text-sm text-muted-foreground">Resolved</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {averageRiskScore.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">
                Avg Risk Score
              </div>
            </div>
          </div>
        </div>

        {/* Fraud by Type */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Fraud by Type</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(fraudByType).map(([type, count]) => (
              <div key={type} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getTypeIcon(type)}</span>
                    <span className="text-sm font-medium">
                      {getTypeDescription(type)}
                    </span>
                  </div>
                  <div className="text-sm font-medium">{count}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {((count / totalAlerts) * 100).toFixed(1)}% of total alerts
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fraud by Severity */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Fraud by Severity</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(fraudBySeverity).map(([severity, count]) => (
              <div key={severity} className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground">
                  {getSeverityText(severity)}
                </div>
                <Badge className={getSeverityColor(severity)}>
                  {getSeverityText(severity)}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Fraud by Status */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Fraud by Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(fraudByStatus).map(([status, count]) => (
              <div key={status} className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground">
                  {getStatusText(status)}
                </div>
                <Badge className={getStatusColor(status)}>
                  {getStatusText(status)}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Trends */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Trends</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Alert Trend</span>
                <div className="flex items-center space-x-1">
                  {alertTrend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  )}
                  <span
                    className={`text-sm ${alertTrend === "up" ? "text-red-600" : "text-green-600"}`}
                  >
                    {alertTrend === "up" ? "+" : "-"}
                    {Math.abs(totalAlerts - previousPeriod.totalAlerts)}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Compared to previous period
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Resolution Trend</span>
                <div className="flex items-center space-x-1">
                  {resolutionTrend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm ${resolutionTrend === "up" ? "text-green-600" : "text-red-600"}`}
                  >
                    {resolutionTrend === "up" ? "+" : "-"}
                    {Math.abs(resolvedAlerts - previousPeriod.resolvedAlerts)}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Compared to previous period
              </div>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Recent Alerts</h4>
          <div className="space-y-2">
            {filteredAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
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
                    <Badge className={getStatusColor(alert.status)}>
                      {getStatusText(alert.status)}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>Risk: {alert.riskScore}/100</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>ID: {alert.studentId}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <span>{alert.actions.length} actions</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Recommendations */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Security Recommendations</h4>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="space-y-2 text-sm">
              {totalAlerts > 10 && (
                <p>
                  閿?High number of fraud alerts detected - consider tightening
                  security measures
                </p>
              )}
              {pendingAlerts > 5 && (
                <p>
                  閿?Multiple pending alerts - review and resolve outstanding
                  issues
                </p>
              )}
              {averageRiskScore > 70 && (
                <p>
                  閿?High average risk score - implement additional fraud
                  detection measures
                </p>
              )}
              {fraudByType["LOCATION_SPOOFING"] > 3 && (
                <p>
                  閿?Multiple location spoofing attempts - review geofencing
                  settings
                </p>
              )}
              {fraudByType["DEVICE_SHARING"] > 3 && (
                <p>
                  閿?Device sharing detected - consider device verification
                  requirements
                </p>
              )}
              {fraudByType["TIME_MANIPULATION"] > 2 && (
                <p>
                  閿?Time manipulation attempts - review time validation
                  settings
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
