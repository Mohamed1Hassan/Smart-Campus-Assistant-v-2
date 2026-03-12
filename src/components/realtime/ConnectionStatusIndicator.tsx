"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Signal,
  SignalZero,
  SignalLow,
  SignalMedium,
  SignalHigh,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";

interface ConnectionStatus {
  status: "connected" | "disconnected" | "reconnecting" | "error";
  latency: number;
  lastConnected: Date;
  lastDisconnected: Date;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  connectionQuality: "excellent" | "good" | "fair" | "poor" | "unknown";
  serverStatus: "online" | "offline" | "maintenance";
  features: {
    realTime: boolean;
    notifications: boolean;
    fileUpload: boolean;
    audio: boolean;
    video: boolean;
  };
}

interface ConnectionStatusIndicatorProps {
  showDetails?: boolean;
  showSettings?: boolean;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
}

export const ConnectionStatusIndicator: React.FC<
  ConnectionStatusIndicatorProps
> = ({
  showDetails = false,
  maxReconnectAttempts = 5,
}) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: "disconnected",
    latency: 0,
    lastConnected: new Date(),
    lastDisconnected: new Date(),
    reconnectAttempts: 0,
    maxReconnectAttempts,
    connectionQuality: "unknown",
    serverStatus: "offline",
    features: {
      realTime: true,
      notifications: true,
      fileUpload: false,
      audio: false,
      video: false,
    },
  });
  const [isExpanded, setIsExpanded] = useState(showDetails);
  const [connectionHistory, setConnectionHistory] = useState<
    Array<{
      timestamp: Date;
      status: string;
      latency?: number;
      error?: string;
    }>
  >([]);

  const addConnectionHistory = (
    status: string,
    latency?: number,
    error?: string,
  ) => {
    setConnectionHistory((prev) => [
      {
        timestamp: new Date(),
        status,
        latency,
        error,
      },
      ...prev.slice(0, 49),
    ]);
  };

  const calculateConnectionQuality = (
    latency: number,
  ): "excellent" | "good" | "fair" | "poor" | "unknown" => {
    if (latency === 0) return "excellent";
    if (latency < 50) return "excellent";
    if (latency < 100) return "good";
    if (latency < 200) return "fair";
    if (latency < 500) return "poor";
    return "unknown";
  };

  useEffect(() => {
    const channel = supabase
      .channel('system-status')
      .on(
        'broadcast',
        { event: 'system-status:health_check' },
        (payload: { payload: { latency: number; serverStatus: string } }) => {
          setConnectionStatus((prev) => ({
            ...prev,
            latency: payload.payload.latency || 0,
            serverStatus: (payload.payload.serverStatus as ConnectionStatus["serverStatus"]) || "online",
            connectionQuality: calculateConnectionQuality(payload.payload.latency || 0),
          }));
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus((prev) => ({
            ...prev,
            status: "connected",
            lastConnected: new Date(),
            reconnectAttempts: 0,
            connectionQuality: "excellent",
          }));
          addConnectionHistory("connected");
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnectionStatus((prev) => ({
            ...prev,
            status: "disconnected",
            lastDisconnected: new Date(),
          }));
          addConnectionHistory("disconnected");
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case "connected":
        return <Wifi className="h-4 w-4 text-green-500" />;
      case "disconnected":
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case "reconnecting":
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus.status) {
      case "connected":
        return "bg-green-100 text-green-800 border-green-200";
      case "disconnected":
        return "bg-red-100 text-red-800 border-red-200";
      case "reconnecting":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getConnectionQualityIcon = () => {
    switch (connectionStatus.connectionQuality) {
      case "excellent":
        return <SignalHigh className="h-4 w-4 text-green-500" />;
      case "good":
        return <SignalMedium className="h-4 w-4 text-yellow-500" />;
      case "fair":
        return <SignalLow className="h-4 w-4 text-orange-500" />;
      case "poor":
        return <SignalZero className="h-4 w-4 text-red-500" />;
      default:
        return <Signal className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConnectionQualityColor = () => {
    switch (connectionStatus.connectionQuality) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-yellow-100 text-yellow-800";
      case "fair":
        return "bg-orange-100 text-orange-800";
      case "poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getServerStatusColor = () => {
    switch (connectionStatus.serverStatus) {
      case "online":
        return "bg-green-100 text-green-800";
      case "offline":
        return "bg-red-100 text-red-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleReconnect = () => {
    window.location.reload(); // Simple reconnect for Supabase
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Connection Status
            </CardTitle>
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <Badge className={getStatusColor()}>
                {connectionStatus.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {connectionStatus.latency}ms
              </div>
              <div className="text-sm text-gray-600">Latency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {connectionStatus.reconnectAttempts}
              </div>
              <div className="text-sm text-gray-600">Reconnects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {connectionHistory.length}
              </div>
              <div className="text-sm text-gray-600">Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl">{getConnectionQualityIcon()}</div>
              <div className="text-sm text-gray-600">Quality</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Connection Quality</span>
              <Badge className={getConnectionQualityColor()}>
                {connectionStatus.connectionQuality.toUpperCase()}
              </Badge>
            </div>
            <Progress
              value={
                connectionStatus.connectionQuality === "excellent"
                  ? 100
                  : connectionStatus.connectionQuality === "good"
                    ? 75
                    : connectionStatus.connectionQuality === "fair"
                      ? 50
                      : connectionStatus.connectionQuality === "poor"
                        ? 25
                        : 0
              }
              className="h-2"
            />
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Server Status</span>
              <Badge className={getServerStatusColor()}>
                {connectionStatus.serverStatus.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {Object.entries(connectionStatus.features).map(
              ([feature, enabled]) => (
                <div key={feature} className="flex items-center space-x-2">
                  {enabled ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm text-gray-600 capitalize">
                    {feature.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </div>
              ),
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReconnect}
              disabled={connectionStatus.status === "connected"}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reconnect
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Hide" : "Show"} Details
            </Button>
          </div>

          {connectionStatus.status === "error" && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Connection error detected. Please try reconnecting manually.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

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
                  Connection Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Last Connected
                      </label>
                      <p className="text-sm text-gray-900">
                        {connectionStatus.lastConnected.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Last Disconnected
                      </label>
                      <p className="text-sm text-gray-900">
                        {connectionStatus.lastDisconnected.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2">
                      Connection History
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {connectionHistory.length === 0 ? (
                        <div className="text-center text-gray-500 py-4">
                          No connection history
                        </div>
                      ) : (
                        connectionHistory.slice(0, 20).map((entry, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div className="flex items-center space-x-2">
                              {entry.status === "connected" ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : entry.status === "disconnected" ? (
                                <XCircle className="h-4 w-4 text-red-500" />
                              ) : entry.status === "reconnecting" ? (
                                <RefreshCw className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-sm font-medium">
                                {entry.status}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {entry.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConnectionStatusIndicator;
