/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Shield,
  MapPin,
  Smartphone,
  Camera,
  User,
  Activity,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface FraudAlert {
  id: string;
  type:
    | "LOCATION_FRAUD"
    | "DEVICE_FRAUD"
    | "PHOTO_FRAUD"
    | "BEHAVIOR_FRAUD"
    | "NETWORK_FRAUD";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  sessionId: string;
  studentId?: string;
  studentName?: string;
  description: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  userId?: string;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

interface SocketFraudData {
  id?: string;
  type?: FraudAlert["type"];
  severity?: FraudAlert["severity"];
  sessionId: string;
  studentId?: string;
  studentName?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  timestamp?: number | string;
}

interface RealTimeFraudAlertsProps {
  sessionId?: string;
  isProfessor?: boolean;
  showResolved?: boolean;
}

export const RealTimeFraudAlerts: React.FC<RealTimeFraudAlertsProps> = ({
  sessionId,
  isProfessor = false,
  showResolved = false,
}) => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    severity: "ALL",
    type: "ALL",
    status: "UNRESOLVED",
  });

  const stats = useMemo(() => {
    return {
      total: alerts.length,
      unresolved: alerts.filter((alert) => !alert.isResolved).length,
      critical: alerts.filter((alert) => alert.severity === "CRITICAL").length,
      high: alerts.filter((alert) => alert.severity === "HIGH").length,
      medium: alerts.filter((alert) => alert.severity === "MEDIUM").length,
      low: alerts.filter((alert) => alert.severity === "LOW").length,
    };
  }, [alerts]);

  useEffect(() => {
    // Initialize Supabase Realtime connection
    const channel = supabase
      .channel(`session:${sessionId}:fraud`)
      .on(
        'broadcast',
        { event: 'attendance:fraud_detected' },
        (payload: any) => {
          const data = payload?.payload;
          if (!data) return;
          const alert: FraudAlert = {
            id: data.id || `fraud-${Date.now()}`,
            type: data.type || "BEHAVIOR_FRAUD",
            severity: (data.severity as FraudAlert["severity"]) || "HIGH",
            sessionId: data.sessionId,
            studentId: data.studentId,
            studentName: data.studentName,
            description: data.description || "Fraud detected",
            metadata: data.metadata || {},
            timestamp: new Date(data.timestamp || Date.now()),
            isRead: false,
            isStarred: false,
            isArchived: false,
            isResolved: false,
          };
          setAlerts((prev) => [alert, ...prev]);
        }
      )
      .on(
        'broadcast',
        { event: 'security:fraud_alert' },
        (payload: any) => {
          const data = payload?.payload;
          if (!data) return;
          const alert: FraudAlert = {
            id: data.id || `alert-${Date.now()}`,
            type: data.type || "BEHAVIOR_FRAUD",
            severity: (data.severity as FraudAlert["severity"]) || "MEDIUM",
            sessionId: data.sessionId,
            studentId: data.studentId,
            studentName: data.studentName,
            description: data.description || "Fraud alert",
            metadata: data.metadata || {},
            timestamp: new Date(data.timestamp || Date.now()),
            isRead: false,
            isStarred: false,
            isArchived: false,
            isResolved: false,
          };
          setAlerts((prev) => [alert, ...prev]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId]);

  // Filter alerts memoized
  const filteredAlerts = useMemo(() => {
    let filtered = alerts;

    if (filters.severity !== "ALL") {
      filtered = filtered.filter(
        (alert) => alert.severity === filters.severity,
      );
    }

    if (filters.type !== "ALL") {
      filtered = filtered.filter((alert) => alert.type === filters.type);
    }

    if (!showResolved) {
      filtered = filtered.filter((alert) => !alert.isResolved);
    } else if (filters.status === "RESOLVED") {
      filtered = filtered.filter((alert) => alert.isResolved);
    } else if (filters.status === "UNRESOLVED") {
      filtered = filtered.filter((alert) => !alert.isResolved);
    }

    return filtered;
  }, [alerts, filters, showResolved]);

  // showResolved prop is already used in the filteredAlerts useMemo
  // No need to synchronously sync it with filters.status in an effect.

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "LOCATION_FRAUD":
        return <MapPin className="h-4 w-4 text-red-500" />;
      case "DEVICE_FRAUD":
        return <Smartphone className="h-4 w-4 text-orange-500" />;
      case "PHOTO_FRAUD":
        return <Camera className="h-4 w-4 text-yellow-500" />;
      case "BEHAVIOR_FRAUD":
        return <User className="h-4 w-4 text-purple-500" />;
      case "NETWORK_FRAUD":
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeTag = (type: string) => {
    switch (type) {
      case "LOCATION_FRAUD":
        return "Location Fraud";
      case "DEVICE_FRAUD":
        return "Device Fraud";
      case "PHOTO_FRAUD":
        return "Photo Fraud";
      case "BEHAVIOR_FRAUD":
        return "Behavior Fraud";
      case "NETWORK_FRAUD":
        return "Network Fraud";
      default:
        return "Unknown";
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(
        "/api/attendance/fraud-alerts/" + alertId + "/resolve",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({
            resolution: "Resolved by professor",
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        setAlerts((prev) =>
          prev.map((alert) =>
            alert.id === alertId
              ? {
                  ...alert,
                  isResolved: true,
                  resolvedAt: new Date(),
                  resolvedBy: data.data.resolvedBy,
                }
              : alert,
          ),
        );
      } else {
        console.error("Failed to resolve alert:", await response.text());
      }
    } catch (error) {
      console.error("Failed to resolve alert:", error);
    }
  };

  const handleViewDetails = (alert: FraudAlert) => {
    setSelectedAlert(alert);
  };

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Fraud Alerts
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {stats.unresolved} Unresolved
              </Badge>
              {stats.critical > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.critical} Critical
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.critical}
              </div>
              <div className="text-sm text-gray-600">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.high}
              </div>
              <div className="text-sm text-gray-600">High</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.medium}
              </div>
              <div className="text-sm text-gray-600">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.low}
              </div>
              <div className="text-sm text-gray-600">Low</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <select
              value={filters.severity}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, severity: e.target.value }))
              }
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={filters.type}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, type: e.target.value }))
              }
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="ALL">All Types</option>
              <option value="LOCATION_FRAUD">Location</option>
              <option value="DEVICE_FRAUD">Device</option>
              <option value="PHOTO_FRAUD">Photo</option>
              <option value="BEHAVIOR_FRAUD">Behavior</option>
              <option value="NETWORK_FRAUD">Network</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="UNRESOLVED">Unresolved</option>
              <option value="RESOLVED">Resolved</option>
              <option value="ALL">All</option>
            </select>
          </div>

          {/* Toggle Expanded View */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full"
          >
            {isExpanded ? (
              <EyeOff className="h-4 w-4 mr-2" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            {isExpanded ? "Hide" : "Show"} Alerts ({filteredAlerts.length})
          </Button>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Alert Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredAlerts.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      No alerts found
                    </div>
                  ) : (
                    filteredAlerts.map((alert, index) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`p-4 rounded-lg border-l-4 ${
                          alert.severity === "CRITICAL"
                            ? "border-red-500 bg-red-50"
                            : alert.severity === "HIGH"
                              ? "border-orange-500 bg-orange-50"
                              : alert.severity === "MEDIUM"
                                ? "border-yellow-500 bg-yellow-50"
                                : "border-blue-500 bg-blue-50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            {getTypeIcon(alert.type)}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge
                                  className={getSeverityColor(alert.severity)}
                                >
                                  {alert.severity}
                                </Badge>
                                <Badge variant="outline">
                                  {getTypeTag(alert.type)}
                                </Badge>
                                {alert.isResolved && (
                                  <Badge variant="secondary">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Resolved
                                  </Badge>
                                )}
                              </div>
                              <p className="font-medium text-gray-900 mb-1">
                                {alert.description}
                              </p>
                              <p className="text-sm text-gray-600 mb-2">
                                {alert.studentName &&
                                  `Student: ${alert.studentName}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(alert.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(alert)}
                            >
                              View
                            </Button>
                            {!alert.isResolved && isProfessor && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolveAlert(alert.id)}
                              >
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Alert Details</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAlert(null)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Description
                </label>
                <p className="text-gray-900">{selectedAlert.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Severity
                  </label>
                  <Badge className={getSeverityColor(selectedAlert.severity)}>
                    {selectedAlert.severity}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <Badge variant="outline">
                    {getTypeTag(selectedAlert.type)}
                  </Badge>
                </div>
              </div>

              {selectedAlert.studentName && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Student
                  </label>
                  <p className="text-gray-900">{selectedAlert.studentName}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Timestamp
                </label>
                <p className="text-gray-900">
                  {new Date(selectedAlert.timestamp).toLocaleString()}
                </p>
              </div>

              {selectedAlert.metadata &&
                Object.keys(selectedAlert.metadata).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Metadata
                    </label>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(selectedAlert.metadata, null, 2)}
                    </pre>
                  </div>
                )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default RealTimeFraudAlerts;
