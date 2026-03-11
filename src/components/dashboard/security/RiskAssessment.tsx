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
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  MapPin,
  Clock,
  Smartphone,
  Camera,
  BarChart3,
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

interface RiskAssessmentProps {
  sessions?: unknown[];
  metrics: SecurityMetrics | null;
}

export function RiskAssessment({ metrics }: RiskAssessmentProps) {
  const [timeRange, setTimeRange] = useState("7d");
  const [assessmentType, setAssessmentType] = useState("overall");

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

  const getRiskScore = (value: number, max: number) => {
    return Math.min((value / max) * 100, 100);
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-red-600";
    if (score >= 60) return "text-orange-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const getRiskTrend = (current: number, previous: number) => {
    if (current > previous)
      return { trend: "up", color: "text-red-600", icon: TrendingUp };
    if (current < previous)
      return { trend: "down", color: "text-green-600", icon: TrendingDown };
    return { trend: "stable", color: "text-gray-600", icon: BarChart3 };
  };

  // Calculate risk scores
  const fraudRiskScore = getRiskScore(
    metrics.fraudDetected,
    metrics.totalAttempts,
  );
  const deviceRiskScore = getRiskScore(metrics.deviceChanges, 10);
  const locationRiskScore = getRiskScore(metrics.locationViolations, 15);
  const timeRiskScore = getRiskScore(metrics.timeViolations, 5);
  const photoRiskScore = getRiskScore(metrics.photoFailures, 3);

  // Calculate overall risk score
  const overallRiskScore =
    (fraudRiskScore +
      deviceRiskScore +
      locationRiskScore +
      timeRiskScore +
      photoRiskScore) /
    5;

  // Mock previous period data for trends
  const previousPeriod = {
    fraudDetected: Math.round(metrics.fraudDetected * 0.8),
    deviceChanges: Math.round(metrics.deviceChanges * 0.9),
    locationViolations: Math.round(metrics.locationViolations * 1.1),
    timeViolations: Math.round(metrics.timeViolations * 0.8),
    photoFailures: Math.round(metrics.photoFailures * 1.2),
  };

  const fraudTrend = getRiskTrend(
    metrics.fraudDetected,
    previousPeriod.fraudDetected,
  );
  const deviceTrend = getRiskTrend(
    metrics.deviceChanges,
    previousPeriod.deviceChanges,
  );
  const locationTrend = getRiskTrend(
    metrics.locationViolations,
    previousPeriod.locationViolations,
  );
  const timeTrend = getRiskTrend(
    metrics.timeViolations,
    previousPeriod.timeViolations,
  );
  const photoTrend = getRiskTrend(
    metrics.photoFailures,
    previousPeriod.photoFailures,
  );

  const getRiskLevel = (score: number) => {
    if (score >= 80) return "CRITICAL";
    if (score >= 60) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
  };

  const currentRiskLevel = getRiskLevel(overallRiskScore);

  const getRiskRecommendations = () => {
    const recommendations = [];

    if (fraudRiskScore > 70) {
      recommendations.push(
        "High fraud rate detected - review fraud detection settings",
      );
    }
    if (deviceRiskScore > 60) {
      recommendations.push(
        "Multiple device changes - consider device verification requirements",
      );
    }
    if (locationRiskScore > 60) {
      recommendations.push(
        "High location violations - review geofencing settings",
      );
    }
    if (timeRiskScore > 60) {
      recommendations.push(
        "Time violations detected - review time validation settings",
      );
    }
    if (photoRiskScore > 60) {
      recommendations.push(
        "Photo verification failures - review photo requirements",
      );
    }
    if (overallRiskScore > 70) {
      recommendations.push(
        "Overall high risk - implement additional security measures",
      );
    }

    return recommendations;
  };

  const recommendations = getRiskRecommendations();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Risk Assessment</span>
        </CardTitle>
        <CardDescription>
          Comprehensive security risk analysis and threat assessment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assessment Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="text-sm font-medium">Assessment Type</label>
            <Select
              value={assessmentType}
              onChange={(e) => setAssessmentType(e.target.value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overall">Overall Risk</SelectItem>
                <SelectItem value="fraud">Fraud Risk</SelectItem>
                <SelectItem value="device">Device Risk</SelectItem>
                <SelectItem value="location">Location Risk</SelectItem>
                <SelectItem value="time">Time Risk</SelectItem>
                <SelectItem value="photo">Photo Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overall Risk Level */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Overall Risk Level</h4>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              {getRiskLevelIcon(currentRiskLevel)}
              <div>
                <div className="font-medium">Current Risk Level</div>
                <div className="text-sm text-muted-foreground">
                  Based on comprehensive security analysis
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge className={getRiskLevelColor(currentRiskLevel)}>
                {currentRiskLevel}
              </Badge>
              <div className="text-sm font-medium mt-1">
                {overallRiskScore.toFixed(1)}/100
              </div>
            </div>
          </div>
        </div>

        {/* Risk Breakdown */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Risk Breakdown</h4>
          <div className="space-y-4">
            {/* Fraud Risk */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Fraud Risk</span>
                  <div className="flex items-center space-x-1">
                    <fraudTrend.icon
                      className={`h-4 w-4 ${fraudTrend.color}`}
                    />
                    <span className={`text-xs ${fraudTrend.color}`}>
                      {fraudTrend.trend}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-sm font-medium ${getRiskColor(fraudRiskScore)}`}
                >
                  {fraudRiskScore.toFixed(1)}/100
                </span>
              </div>
              <Progress value={fraudRiskScore} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {metrics.fraudDetected} fraud attempts out of{" "}
                {metrics.totalAttempts} total attempts
              </div>
            </div>

            {/* Device Risk */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Device Risk</span>
                  <div className="flex items-center space-x-1">
                    <deviceTrend.icon
                      className={`h-4 w-4 ${deviceTrend.color}`}
                    />
                    <span className={`text-xs ${deviceTrend.color}`}>
                      {deviceTrend.trend}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-sm font-medium ${getRiskColor(deviceRiskScore)}`}
                >
                  {deviceRiskScore.toFixed(1)}/100
                </span>
              </div>
              <Progress value={deviceRiskScore} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {metrics.deviceChanges} device changes detected
              </div>
            </div>

            {/* Location Risk */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Location Risk</span>
                  <div className="flex items-center space-x-1">
                    <locationTrend.icon
                      className={`h-4 w-4 ${locationTrend.color}`}
                    />
                    <span className={`text-xs ${locationTrend.color}`}>
                      {locationTrend.trend}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-sm font-medium ${getRiskColor(locationRiskScore)}`}
                >
                  {locationRiskScore.toFixed(1)}/100
                </span>
              </div>
              <Progress value={locationRiskScore} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {metrics.locationViolations} location violations detected
              </div>
            </div>

            {/* Time Risk */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Time Risk</span>
                  <div className="flex items-center space-x-1">
                    <timeTrend.icon className={`h-4 w-4 ${timeTrend.color}`} />
                    <span className={`text-xs ${timeTrend.color}`}>
                      {timeTrend.trend}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-sm font-medium ${getRiskColor(timeRiskScore)}`}
                >
                  {timeRiskScore.toFixed(1)}/100
                </span>
              </div>
              <Progress value={timeRiskScore} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {metrics.timeViolations} time violations detected
              </div>
            </div>

            {/* Photo Risk */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Photo Risk</span>
                  <div className="flex items-center space-x-1">
                    <photoTrend.icon
                      className={`h-4 w-4 ${photoTrend.color}`}
                    />
                    <span className={`text-xs ${photoTrend.color}`}>
                      {photoTrend.trend}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-sm font-medium ${getRiskColor(photoRiskScore)}`}
                >
                  {photoRiskScore.toFixed(1)}/100
                </span>
              </div>
              <Progress value={photoRiskScore} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {metrics.photoFailures} photo verification failures
              </div>
            </div>
          </div>
        </div>

        {/* Risk Trends */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Risk Trends</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Risk Trend</span>
                <div className="flex items-center space-x-1">
                  {overallRiskScore > 50 ? (
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  )}
                  <span
                    className={`text-sm ${overallRiskScore > 50 ? "text-red-600" : "text-green-600"}`}
                  >
                    {overallRiskScore > 50 ? "Increasing" : "Decreasing"}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Risk level is {overallRiskScore > 50 ? "above" : "below"}{" "}
                threshold
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Security Score</span>
                <div className="text-sm font-medium">
                  {Math.round(100 - overallRiskScore)}/100
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Based on risk assessment
              </div>
            </div>
          </div>
        </div>

        {/* Risk Recommendations */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Risk Recommendations</h4>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="space-y-2 text-sm">
              {recommendations.length === 0 ? (
                <p className="text-green-700">
                  锟?All security metrics are within acceptable ranges
                </p>
              ) : (
                recommendations.map((recommendation, index) => (
                  <p key={index} className="text-blue-700">
                    锟?{recommendation}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Risk Actions */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Risk Mitigation Actions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start">
              <Shield className="h-4 w-4 mr-2" />
              Review Security Settings
            </Button>
            <Button variant="outline" className="justify-start">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Update Fraud Detection
            </Button>
            <Button variant="outline" className="justify-start">
              <Smartphone className="h-4 w-4 mr-2" />
              Device Verification
            </Button>
            <Button variant="outline" className="justify-start">
              <MapPin className="h-4 w-4 mr-2" />
              Location Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
