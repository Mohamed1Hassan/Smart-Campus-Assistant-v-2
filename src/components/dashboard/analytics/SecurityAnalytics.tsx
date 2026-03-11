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
import { Progress } from "../../ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Shield,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Smartphone,
  Camera,
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

interface SecurityAnalyticsProps {
  metrics: SecurityMetrics | null;
}

export function SecurityAnalytics({ metrics }: SecurityAnalyticsProps) {
  const [timeRange, setTimeRange] = useState("7d");
  const [FileTextType, setFileTextType] = useState("overview");

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-2" />
            <p>No security metrics available</p>
          </div>
        </CardContent>
      </Card>
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
  const failureRate =
    metrics.totalAttempts > 0
      ? (metrics.failedAttempts / metrics.totalAttempts) * 100
      : 0;

  // Calculate trends (mock data)
  const previousPeriod = {
    totalAttempts: Math.round(metrics.totalAttempts * 0.9),
    successfulAttempts: Math.round(metrics.successfulAttempts * 0.95),
    failedAttempts: Math.round(metrics.failedAttempts * 1.1),
    fraudDetected: Math.round(metrics.fraudDetected * 0.8),
    averageFraudScore: Math.round(metrics.averageFraudScore * 0.9),
  };

  const successTrend =
    metrics.successfulAttempts > previousPeriod.successfulAttempts
      ? "up"
      : "down";
  const fraudTrend =
    metrics.fraudDetected > previousPeriod.fraudDetected ? "up" : "down";

  const handleExportFileText = () => {
    console.log("Exporting security analytics FileText:", {
      FileTextType,
      timeRange,
    });
  };

  const handleGenerateFileText = () => {
    console.log("Generating security analytics FileText:", {
      FileTextType,
      timeRange,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Security Analytics</span>
        </CardTitle>
        <CardDescription>
          Comprehensive security metrics and threat analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* FileText Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="detailed">Detailed Analysis</SelectItem>
                <SelectItem value="threats">Threat Analysis</SelectItem>
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

        {/* Risk Level */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Security Risk Level</h4>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              {getRiskLevelIcon(metrics.riskLevel)}
              <div>
                <div className="font-medium">Current Risk Level</div>
                <div className="text-sm text-muted-foreground">
                  Based on recent security metrics
                </div>
              </div>
            </div>
            <Badge className={getRiskLevelColor(metrics.riskLevel)}>
              {metrics.riskLevel}
            </Badge>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Key Security Metrics</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.totalAttempts.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Attempts
              </div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {successRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {fraudRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Fraud Rate</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {metrics.averageFraudScore.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">
                Avg Risk Score
              </div>
            </div>
          </div>
        </div>

        {/* Success Rate Progress */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Success Rate Analysis</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Success Rate</span>
              <span className="text-sm text-muted-foreground">
                {successRate.toFixed(1)}%
              </span>
            </div>
            <Progress value={successRate} className="h-2" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Fraud Detection Rate</span>
              <span className="text-sm text-muted-foreground">
                {fraudRate.toFixed(1)}%
              </span>
            </div>
            <Progress value={fraudRate} className="h-2" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Failure Rate</span>
              <span className="text-sm text-muted-foreground">
                {failureRate.toFixed(1)}%
              </span>
            </div>
            <Progress value={failureRate} className="h-2" />
          </div>
        </div>

        {/* Violation Types */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Security Violations</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Device Changes</span>
                </div>
                <div className="text-sm font-medium">
                  {metrics.deviceChanges}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Unauthorized device changes detected
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Location Violations</span>
              </div>
              <div className="text-sm font-medium">
                {metrics.locationViolations}
              </div>
              <div className="text-xs text-muted-foreground">
                Location-based security violations
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Time Violations</span>
              </div>
              <div className="text-sm font-medium">
                {metrics.timeViolations}
              </div>
              <div className="text-xs text-muted-foreground">
                Time-based security violations
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Photo Failures</span>
              </div>
              <div className="text-sm font-medium">{metrics.photoFailures}</div>
              <div className="text-xs text-muted-foreground">
                Photo verification failures
              </div>
            </div>
          </div>
        </div>

        {/* Trends */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Security Trends</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Success Rate Trend</span>
                <div className="flex items-center space-x-1">
                  {successTrend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm ${successTrend === "up" ? "text-green-600" : "text-red-600"}`}
                  >
                    {successTrend === "up" ? "+" : "-"}
                    {Math.abs(
                      metrics.successfulAttempts -
                        previousPeriod.successfulAttempts,
                    )}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Compared to previous period
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Fraud Detection Trend
                </span>
                <div className="flex items-center space-x-1">
                  {fraudTrend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  )}
                  <span
                    className={`text-sm ${fraudTrend === "up" ? "text-red-600" : "text-green-600"}`}
                  >
                    {fraudTrend === "up" ? "+" : "-"}
                    {Math.abs(
                      metrics.fraudDetected - previousPeriod.fraudDetected,
                    )}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Compared to previous period
              </div>
            </div>
          </div>
        </div>

        {/* Security Recommendations */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Security Recommendations</h4>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="space-y-2 text-sm">
              {metrics.riskLevel === "CRITICAL" && (
                <p>
                  锟?<strong>CRITICAL:</strong> Immediate action required -
                  review all security settings
                </p>
              )}
              {metrics.riskLevel === "HIGH" && (
                <p>
                  锟?<strong>HIGH:</strong> Consider tightening security
                  measures
                </p>
              )}
              {metrics.riskLevel === "MEDIUM" && (
                <p>
                  锟?<strong>MEDIUM:</strong> Monitor security metrics closely
                </p>
              )}
              {fraudRate > 5 && (
                <p>
                  锟?High fraud rate detected - review fraud detection settings
                </p>
              )}
              {metrics.deviceChanges > 10 && (
                <p>
                  锟?Multiple device changes detected - consider device
                  verification
                </p>
              )}
              {metrics.locationViolations > 15 && (
                <p>锟?High location violations - review geofencing settings</p>
              )}
              {metrics.timeViolations > 5 && (
                <p>
                  锟?Time violations detected - review time validation settings
                </p>
              )}
              {metrics.photoFailures > 3 && (
                <p>
                  锟?Photo verification failures - review photo requirements
                </p>
              )}
              {successRate < 80 && (
                <p>锟?Low success rate - review attendance requirements</p>
              )}
              {metrics.averageFraudScore > 70 && (
                <p>
                  锟?High average fraud score - implement additional security
                  measures
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Security Score */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Security Score</h4>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Overall Security Score
              </span>
              <span className="text-sm font-medium">
                {Math.round(
                  100 -
                    (metrics.averageFraudScore +
                      fraudRate * 10 +
                      failureRate * 5),
                )}
                /100
              </span>
            </div>
            <Progress
              value={Math.round(
                100 -
                  (metrics.averageFraudScore +
                    fraudRate * 10 +
                    failureRate * 5),
              )}
              className="h-2"
            />
            <div className="text-xs text-muted-foreground mt-2">
              Based on fraud score, fraud rate, and failure rate
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
