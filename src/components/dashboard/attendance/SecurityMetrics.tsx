import React from "react";

import { Progress } from "../../ui/progress";
import { Badge } from "../../ui/badge";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Users,
  MapPin,
  Clock,
  Camera,
  Smartphone,
} from "lucide-react";

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
}

interface SecurityMetricsProps {
  metrics: SecurityMetrics | null;
}

export function SecurityMetrics({ metrics }: SecurityMetricsProps) {
  if (!metrics) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-2" />
          <p>No security metrics available</p>
        </div>
      </div>
    );
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "LOW":
        return "text-green-600 bg-green-50";
      case "MEDIUM":
        return "text-yellow-600 bg-yellow-50";
      case "HIGH":
        return "text-orange-600 bg-orange-50";
      case "CRITICAL":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
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
        return <Shield className="h-4 w-4" />;
    }
  };

  const successRate =
    metrics.totalAttempts > 0
      ? (metrics.successfulAttempts / metrics.totalAttempts) * 100
      : 0;
  const fraudRate =
    metrics.totalAttempts > 0
      ? (metrics.fraudDetected / metrics.totalAttempts) * 100
      : 0;

  const getTrendIcon = (value: number, threshold: number) => {
    if (value > threshold)
      return <TrendingUp className="h-4 w-4 text-red-600" />;
    if (value < threshold * 0.5)
      return <TrendingDown className="h-4 w-4 text-green-600" />;
    return <TrendingUp className="h-4 w-4 text-yellow-600" />;
  };

  const getFraudScoreColor = (score: number) => {
    if (score >= 80) return "text-red-600";
    if (score >= 60) return "text-orange-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="space-y-4">
      {/* Risk Level */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getRiskLevelIcon(metrics.riskLevel)}
          <span className="font-medium">Security Risk Level</span>
        </div>
        <Badge className={getRiskLevelColor(metrics.riskLevel)}>
          {metrics.riskLevel}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {successRate.toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">Success Rate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {fraudRate.toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">Fraud Rate</div>
        </div>
      </div>

      {/* Success Rate Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Success Rate</span>
          <span className="text-sm text-muted-foreground">
            {successRate.toFixed(1)}%
          </span>
        </div>
        <Progress value={successRate} className="h-2" />
      </div>

      {/* Fraud Rate Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Fraud Rate</span>
          <span className="text-sm text-muted-foreground">
            {fraudRate.toFixed(1)}%
          </span>
        </div>
        <Progress value={fraudRate} className="h-2" />
      </div>

      {/* Detailed Metrics */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Security Metrics</h4>

        {/* Total Attempts */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Total Attempts</span>
          </div>
          <span className="text-sm font-medium">
            {metrics.totalAttempts.toLocaleString()}
          </span>
        </div>

        {/* Successful Attempts */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm">Successful</span>
          </div>
          <span className="text-sm font-medium text-green-600">
            {metrics.successfulAttempts.toLocaleString()}
          </span>
        </div>

        {/* Failed Attempts */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm">Failed</span>
          </div>
          <span className="text-sm font-medium text-red-600">
            {metrics.failedAttempts.toLocaleString()}
          </span>
        </div>

        {/* Fraud Detected */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm">Fraud Detected</span>
          </div>
          <span className="text-sm font-medium text-orange-600">
            {metrics.fraudDetected.toLocaleString()}
          </span>
        </div>

        {/* Average Fraud Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Avg Fraud Score</span>
          </div>
          <span
            className={`text-sm font-medium ${getFraudScoreColor(metrics.averageFraudScore)}`}
          >
            {metrics.averageFraudScore.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Violation Types */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Violation Types</h4>

        {/* Device Changes */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Device Changes</span>
            {getTrendIcon(metrics.deviceChanges, 5)}
          </div>
          <span className="text-sm font-medium">{metrics.deviceChanges}</span>
        </div>

        {/* Location Violations */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Location Violations</span>
            {getTrendIcon(metrics.locationViolations, 10)}
          </div>
          <span className="text-sm font-medium">
            {metrics.locationViolations}
          </span>
        </div>

        {/* Time Violations */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Time Violations</span>
            {getTrendIcon(metrics.timeViolations, 5)}
          </div>
          <span className="text-sm font-medium">{metrics.timeViolations}</span>
        </div>

        {/* Photo Failures */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Photo Failures</span>
            {getTrendIcon(metrics.photoFailures, 3)}
          </div>
          <span className="text-sm font-medium">{metrics.photoFailures}</span>
        </div>
      </div>

      {/* Security Recommendations */}
      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            Security Recommendations
          </span>
        </div>
        <div className="text-xs text-blue-700 space-y-1">
          {metrics.riskLevel === "CRITICAL" && (
            <p>锟?Immediate action required - review all security settings</p>
          )}
          {metrics.riskLevel === "HIGH" && (
            <p>锟?Consider tightening security measures</p>
          )}
          {fraudRate > 5 && (
            <p>锟?High fraud rate detected - review fraud detection settings</p>
          )}
          {metrics.deviceChanges > 10 && (
            <p>
              锟?Multiple device changes detected - consider device verification
            </p>
          )}
          {metrics.locationViolations > 15 && (
            <p>锟?High location violations - review geofencing settings</p>
          )}
          {successRate < 80 && (
            <p>锟?Low success rate - review attendance requirements</p>
          )}
        </div>
      </div>
    </div>
  );
}
