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
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  MapPin,
  Shield,
} from "lucide-react";

interface AttendanceSession {
  id: string;
  courseId: number;
  courseName: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location: {
    latitude: number;
    longitude: number;
    radius: number;
    name: string;
  };
  security: {
    isLocationRequired: boolean;
    isPhotoRequired: boolean;
    isDeviceCheckRequired: boolean;
    fraudDetectionEnabled: boolean;
    gracePeriod: number;
  };
  status: "ACTIVE" | "SCHEDULED" | "ENDED" | "CANCELLED";
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  lateStudents: number;
  fraudAlerts: number;
}

interface AttendanceFileTextsProps {
  sessions: AttendanceSession[];
}

export function AttendanceReports({ sessions }: AttendanceFileTextsProps) {
  const [FileTextType, setFileTextType] = useState("summary");
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedSessions] = useState<string[]>([]);

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

  // Filter sessions by time range
  const filteredSessions = sessions.filter((session) => {
    const sessionDate = new Date(session.startTime);
    return sessionDate >= startDate && sessionDate <= endDate;
  });

  // Calculate summary statistics
  const totalSessions = filteredSessions.length;
  const totalStudents = filteredSessions.reduce(
    (sum, session) => sum + session.totalStudents,
    0,
  );
  const totalPresent = filteredSessions.reduce(
    (sum, session) => sum + session.presentStudents,
    0,
  );
  const totalAbsent = filteredSessions.reduce(
    (sum, session) => sum + session.absentStudents,
    0,
  );
  const totalLate = filteredSessions.reduce(
    (sum, session) => sum + session.lateStudents,
    0,
  );
  const totalFraudAlerts = filteredSessions.reduce(
    (sum, session) => sum + session.fraudAlerts,
    0,
  );

  const attendanceRate =
    totalStudents > 0 ? (totalPresent / totalStudents) * 100 : 0;

  // Calculate trends (mock data)
  const previousPeriod = {
    totalStudents: Math.round(totalStudents * 0.9),
    totalPresent: Math.round(totalPresent * 0.95),
    totalAbsent: Math.round(totalAbsent * 1.1),
    totalLate: Math.round(totalLate * 0.8),
    totalFraudAlerts: Math.round(totalFraudAlerts * 1.2),
  };

  const attendanceTrend =
    totalPresent > previousPeriod.totalPresent ? "up" : "down";
  const fraudTrend =
    totalFraudAlerts > previousPeriod.totalFraudAlerts ? "up" : "down";

  const handleExportFileText = () => {
    console.log("Exporting FileText:", {
      FileTextType,
      timeRange,
      selectedSessions,
    });
  };

  const handleGenerateFileText = () => {
    console.log("Generating FileText:", {
      FileTextType,
      timeRange,
      selectedSessions,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Attendance FileTexts</span>
        </CardTitle>
        <CardDescription>
          Generate comprehensive attendance FileTexts and analytics
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
                <SelectItem value="summary">Summary FileText</SelectItem>
                <SelectItem value="detailed">Detailed FileText</SelectItem>
                <SelectItem value="security">Security FileText</SelectItem>
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
                <SelectItem value="custom">Custom Range</SelectItem>
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
              <div className="text-2xl font-bold text-blue-600">
                {totalSessions}
              </div>
              <div className="text-sm text-muted-foreground">Sessions</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {totalStudents}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Students
              </div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {attendanceRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Attendance Rate
              </div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {totalFraudAlerts}
              </div>
              <div className="text-sm text-muted-foreground">Fraud Alerts</div>
            </div>
          </div>
        </div>

        {/* Attendance Breakdown */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Attendance Breakdown</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Present</span>
                </div>
                <div className="text-sm font-medium">{totalPresent}</div>
              </div>
              <div className="text-xs text-muted-foreground">
                {attendanceRate.toFixed(1)}% of total students
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">Late</span>
                </div>
                <div className="text-sm font-medium">{totalLate}</div>
              </div>
              <div className="text-xs text-muted-foreground">
                {((totalLate / totalStudents) * 100).toFixed(1)}% of total
                students
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">Absent</span>
                </div>
                <div className="text-sm font-medium">{totalAbsent}</div>
              </div>
              <div className="text-xs text-muted-foreground">
                {((totalAbsent / totalStudents) * 100).toFixed(1)}% of total
                students
              </div>
            </div>
          </div>
        </div>

        {/* Trends */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Trends</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Attendance Trend</span>
                <div className="flex items-center space-x-1">
                  {attendanceTrend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm ${attendanceTrend === "up" ? "text-green-600" : "text-red-600"}`}
                  >
                    {attendanceTrend === "up" ? "+" : "-"}
                    {Math.abs(totalPresent - previousPeriod.totalPresent)}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Compared to previous period
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Fraud Trend</span>
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
                      totalFraudAlerts - previousPeriod.totalFraudAlerts,
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

        {/* Session Details */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Session Details</h4>
          <div className="space-y-2">
            {filteredSessions.map((session) => (
              <div key={session.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">
                      {session.courseName} - {session.title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(session.startTime).toLocaleDateString()} at{" "}
                      {new Date(session.startTime).toLocaleTimeString()}
                    </div>
                  </div>
                  <Badge
                    variant={
                      session.status === "ACTIVE" ? "default" : "secondary"
                    }
                  >
                    {session.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {session.presentStudents}/{session.totalStudents} present
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{session.lateStudents} late</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{session.location.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>{session.fraudAlerts} alerts</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Features Used */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Security Features</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {
                  filteredSessions.filter((s) => s.security.isLocationRequired)
                    .length
                }
              </div>
              <div className="text-sm text-muted-foreground">
                Location Required
              </div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {
                  filteredSessions.filter((s) => s.security.isPhotoRequired)
                    .length
                }
              </div>
              <div className="text-sm text-muted-foreground">
                Photo Required
              </div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {
                  filteredSessions.filter(
                    (s) => s.security.isDeviceCheckRequired,
                  ).length
                }
              </div>
              <div className="text-sm text-muted-foreground">Device Check</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {
                  filteredSessions.filter(
                    (s) => s.security.fraudDetectionEnabled,
                  ).length
                }
              </div>
              <div className="text-sm text-muted-foreground">
                Fraud Detection
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
