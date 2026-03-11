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
  FileText,
  Download,
  Send,
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

interface IncidentManagementProps {
  alerts: FraudAlert[];
  onAction: (alertId: string, action: string) => void;
}

export function IncidentManagement({
  alerts,
  onAction,
}: IncidentManagementProps) {
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
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
        return "bg-gray-500";
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

  const handleIncidentAction = (alertId: string, action: string) => {
    onAction(alertId, action);
  };

  const handleIncidentSelect = (alertId: string) => {
    setSelectedIncident(selectedIncident === alertId ? null : alertId);
  };

  // Filter and sort incidents
  const filteredIncidents = alerts.filter((alert) => {
    const statusMatch = filterStatus === "all" || alert.status === filterStatus;
    const severityMatch =
      filterSeverity === "all" || alert.severity === filterSeverity;
    return statusMatch && severityMatch;
  });

  // Sort incidents
  filteredIncidents.sort((a, b) => {
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

  const pendingIncidents = alerts.filter((alert) => alert.status === "PENDING");
  const criticalIncidents = alerts.filter(
    (alert) => alert.severity === "CRITICAL",
  );
  const resolvedIncidents = alerts.filter(
    (alert) => alert.status === "RESOLVED",
  );
  const investigatingIncidents = alerts.filter(
    (alert) => alert.status === "INVESTIGATING",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Incident Management</span>
        </CardTitle>
        <CardDescription>
          Track and manage security incidents and fraud alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Incident Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {pendingIncidents.length}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {criticalIncidents.length}
            </div>
            <div className="text-sm text-muted-foreground">Critical</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {investigatingIncidents.length}
            </div>
            <div className="text-sm text-muted-foreground">Investigating</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {resolvedIncidents.length}
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

        {/* Incidents List */}
        <div className="space-y-3">
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                <p>No incidents found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            </div>
          ) : (
            filteredIncidents.map((alert) => (
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
                      onClick={() => handleIncidentSelect(alert.id)}
                    >
                      {selectedIncident === alert.id ? "Hide" : "Show"}
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

                {selectedIncident === alert.id && (
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
                          handleIncidentAction(alert.id, "investigate")
                        }
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Investigate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleIncidentAction(alert.id, "resolve")
                        }
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Resolve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleIncidentAction(alert.id, "dismiss")
                        }
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Dismiss
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleIncidentAction(alert.id, "flag")}
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

        {/* Incident Actions */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-muted-foreground">
            {filteredIncidents.length} incident
            {filteredIncidents.length !== 1 ? "s" : ""} selected
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Generate FileText
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Send className="h-4 w-4 mr-2" />
              Notify
            </Button>
          </div>
        </div>

        {/* Incident Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((resolvedIncidents.length / alerts.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Resolution Rate
              </div>
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(
                  (investigatingIncidents.length / alerts.length) * 100,
                )}
                %
              </div>
              <div className="text-sm text-muted-foreground">
                Investigation Rate
              </div>
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {Math.round((criticalIncidents.length / alerts.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Critical Rate</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
