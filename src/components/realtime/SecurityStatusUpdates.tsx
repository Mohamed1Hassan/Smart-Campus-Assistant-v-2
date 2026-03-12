"use client";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Smartphone,
  Camera,
  Wifi,
  Activity,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

interface SecurityStatus {
  id: string;
  type: "LOCATION" | "DEVICE" | "PHOTO" | "NETWORK" | "SESSION";
  status: "SECURE" | "WARNING" | "DANGER" | "UNKNOWN";
  message: string;
  timestamp: Date;
  details?: Record<string, unknown>;
  actionRequired?: boolean;
}

interface SocketSecurityData {
  id?: string;
  type?: SecurityStatus["type"];
  status?: SecurityStatus["status"];
  message?: string;
  timestamp?: number | string;
  details?: Record<string, unknown>;
  actionRequired?: boolean;
  isSecure?: boolean;
}

interface SocketFraudData {
  description?: string;
}

interface SecurityMetrics {
  overallScore: number;
  locationSecurity: number;
  deviceSecurity: number;
  photoSecurity: number;
  networkSecurity: number;
  sessionSecurity: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  lastUpdated: Date;
}

interface SecurityStatusUpdatesProps {
  sessionId?: string;
  isProfessor?: boolean;
  showDetails?: boolean;
}

export const SecurityStatusUpdates: React.FC<SecurityStatusUpdatesProps> = ({
  sessionId,
  showDetails = false,
}) => {
  const [securityStatuses, setSecurityStatuses] = useState<SecurityStatus[]>(
    [],
  );
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    overallScore: 0,
    locationSecurity: 0,
    deviceSecurity: 0,
    photoSecurity: 0,
    networkSecurity: 0,
    sessionSecurity: 0,
    riskLevel: "LOW",
    lastUpdated: new Date(),
  });
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "reconnecting"
  >("disconnected");
  const [isExpanded, setIsExpanded] = useState(showDetails);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const updateMetrics = React.useCallback(() => {
    const now = new Date();
    const recentStatuses = securityStatuses.filter(
      (status) => now.getTime() - status.timestamp.getTime() < 300000, // Last 5 minutes
    );

    const locationStatuses = recentStatuses.filter(
      (s) => s.type === "LOCATION",
    );
    const deviceStatuses = recentStatuses.filter((s) => s.type === "DEVICE");
    const photoStatuses = recentStatuses.filter((s) => s.type === "PHOTO");
    const networkStatuses = recentStatuses.filter((s) => s.type === "NETWORK");
    const sessionStatuses = recentStatuses.filter((s) => s.type === "SESSION");

    const calculateScore = (statuses: SecurityStatus[]) => {
      if (statuses.length === 0) return 100;

      const warningCount = statuses.filter(
        (s) => s.status === "WARNING",
      ).length;
      const dangerCount = statuses.filter((s) => s.status === "DANGER").length;

      return Math.max(0, 100 - warningCount * 20 - dangerCount * 40);
    };

    const locationSecurity = calculateScore(locationStatuses);
    const deviceSecurity = calculateScore(deviceStatuses);
    const photoSecurity = calculateScore(photoStatuses);
    const networkSecurity = calculateScore(networkStatuses);
    const sessionSecurity = calculateScore(sessionStatuses);

    const overallScore = Math.round(
      (locationSecurity +
        deviceSecurity +
        photoSecurity +
        networkSecurity +
        sessionSecurity) /
        5,
    );

    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    if (overallScore < 30) riskLevel = "CRITICAL";
    else if (overallScore < 50) riskLevel = "HIGH";
    else if (overallScore < 70) riskLevel = "MEDIUM";

    setMetrics({
      overallScore,
      locationSecurity,
      deviceSecurity,
      photoSecurity,
      networkSecurity,
      sessionSecurity,
      riskLevel,
      lastUpdated: now,
    });
  }, [securityStatuses]);

  useEffect(() => {
    // Initialize Supabase Realtime connection
    const channel = supabase
      .channel(`session:${sessionId}:security`)
      .on(
        'broadcast',
        { event: 'security:status_update' },
        (payload: { payload: SocketSecurityData }) => {
          const data = payload.payload;
          const status: SecurityStatus = {
            id: data.id || `status-${Date.now()}`,
            type: data.type || "SESSION",
            status: data.status || "UNKNOWN",
            message: data.message || "Security status updated",
            timestamp: new Date(data.timestamp || Date.now()),
            details: data.details,
            actionRequired: data.actionRequired || false,
          };
          setSecurityStatuses((prev) => [status, ...prev.slice(0, 49)]);
          updateMetrics();
        }
      )
      .on(
        'broadcast',
        { event: 'security:location_update' },
        (payload: { payload: SocketSecurityData }) => {
          const data = payload.payload;
          const status: SecurityStatus = {
            id: `location-${Date.now()}`,
            type: "LOCATION",
            status: data.isSecure ? "SECURE" : "WARNING",
            message: data.message || "Location security updated",
            timestamp: new Date(),
            details: data.details,
            actionRequired: !data.isSecure,
          };
          setSecurityStatuses((prev) => [status, ...prev.slice(0, 49)]);
          updateMetrics();
        }
      )
      .on(
        'broadcast',
        { event: 'security:device_update' },
        (payload: { payload: SocketSecurityData }) => {
          const data = payload.payload;
          const status: SecurityStatus = {
            id: `device-${Date.now()}`,
            type: "DEVICE",
            status: data.isSecure ? "SECURE" : "WARNING",
            message: data.message || "Device security updated",
            timestamp: new Date(),
            details: data.details,
            actionRequired: !data.isSecure,
          };
          setSecurityStatuses((prev) => [status, ...prev.slice(0, 49)]);
          updateMetrics();
        }
      )
      .on(
        'broadcast',
        { event: 'security:fraud_alert' },
        (payload: { payload: SocketFraudData }) => {
          const data = payload.payload;
          const status: SecurityStatus = {
            id: `fraud-${Date.now()}`,
            type: "SESSION",
            status: "DANGER",
            message: `Fraud alert: ${data.description}`,
            timestamp: new Date(),
            details: data as unknown as Record<string, unknown>,
            actionRequired: true,
          };
          setSecurityStatuses((prev) => [status, ...prev.slice(0, 49)]);
          updateMetrics();
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus("connected");
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnectionStatus("disconnected");
        }
      });

    return () => {
      channel.unsubscribe();
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [sessionId, updateMetrics]);
; // Added updateMetrics to dependencies

  useEffect(() => {
    // Auto-refresh metrics
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        updateMetrics();
      }, 30000); // Every 30 seconds
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, updateMetrics]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SECURE":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "DANGER":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SECURE":
        return "bg-green-100 text-green-800 border-green-200";
      case "WARNING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "DANGER":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "LOCATION":
        return <MapPin className="h-4 w-4 text-blue-500" />;
      case "DEVICE":
        return <Smartphone className="h-4 w-4 text-purple-500" />;
      case "PHOTO":
        return <Camera className="h-4 w-4 text-pink-500" />;
      case "NETWORK":
        return <Wifi className="h-4 w-4 text-indigo-500" />;
      case "SESSION":
        return <Shield className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "LOW":
        return "bg-green-100 text-green-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-green-500";
      case "disconnected":
        return "bg-red-500";
      case "reconnecting":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-4">
      {/* Security Metrics Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Security Status
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`}
              />
              <span className="text-sm text-gray-600 capitalize">
                {connectionStatus}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="ml-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Overall Security Score */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                Overall Security Score
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold">
                  {metrics.overallScore}
                </span>
                <Badge className={getRiskLevelColor(metrics.riskLevel)}>
                  {metrics.riskLevel}
                </Badge>
              </div>
            </div>
            <Progress value={metrics.overallScore} className="h-3" />
          </div>

          {/* Individual Security Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Location</span>
                <span className="text-sm text-gray-600">
                  {metrics.locationSecurity}%
                </span>
              </div>
              <Progress value={metrics.locationSecurity} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Device</span>
                <span className="text-sm text-gray-600">
                  {metrics.deviceSecurity}%
                </span>
              </div>
              <Progress value={metrics.deviceSecurity} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Camera className="h-4 w-4 text-pink-500" />
                <span className="text-sm font-medium">Photo</span>
                <span className="text-sm text-gray-600">
                  {metrics.photoSecurity}%
                </span>
              </div>
              <Progress value={metrics.photoSecurity} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Wifi className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium">Network</span>
                <span className="text-sm text-gray-600">
                  {metrics.networkSecurity}%
                </span>
              </div>
              <Progress value={metrics.networkSecurity} className="h-2" />
            </div>
          </div>

          {/* Action Required Alerts */}
          {securityStatuses.some((status) => status.actionRequired) && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {
                  securityStatuses.filter((status) => status.actionRequired)
                    .length
                }{" "}
                security action(s) required
              </AlertDescription>
            </Alert>
          )}

          {/* Toggle Details */}
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
            {isExpanded ? "Hide" : "Show"} Status Updates (
            {securityStatuses.length})
          </Button>
        </CardContent>
      </Card>

      {/* Status Updates */}
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
                  Recent Status Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {securityStatuses.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      No status updates
                    </div>
                  ) : (
                    securityStatuses.slice(0, 20).map((status, index) => (
                      <motion.div
                        key={status.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`p-3 rounded-lg border-l-4 ${
                          status.status === "SECURE"
                            ? "border-green-500 bg-green-50"
                            : status.status === "WARNING"
                              ? "border-yellow-500 bg-yellow-50"
                              : status.status === "DANGER"
                                ? "border-red-500 bg-red-50"
                                : "border-gray-500 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {getTypeIcon(status.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              {getStatusIcon(status.status)}
                              <Badge className={getStatusColor(status.status)}>
                                {status.status}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {status.type}
                              </Badge>
                              {status.actionRequired && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Action Required
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {status.message}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(status.timestamp).toLocaleString()}
                            </p>
                            {status.details && (
                              <details className="mt-2">
                                <summary className="text-xs text-gray-600 cursor-pointer">
                                  View Details
                                </summary>
                                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                                  {JSON.stringify(status.details, null, 2)}
                                </pre>
                              </details>
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
    </div>
  );
};

export default SecurityStatusUpdates;
