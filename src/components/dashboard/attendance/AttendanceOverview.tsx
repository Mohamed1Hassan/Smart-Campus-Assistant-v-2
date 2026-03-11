import React from "react";
import { Progress } from "../../ui/progress";
import { Badge } from "../../ui/badge";
import { Users, Clock, MapPin, Shield, AlertTriangle } from "lucide-react";

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

interface AttendanceOverviewProps {
  sessions: AttendanceSession[];
}

export function AttendanceOverview({ sessions }: AttendanceOverviewProps) {
  const activeSessions = sessions.filter((s) => s.status === "ACTIVE");
  const totalStudents = activeSessions.reduce(
    (sum, session) => sum + session.totalStudents,
    0,
  );
  const presentStudents = activeSessions.reduce(
    (sum, session) => sum + session.presentStudents,
    0,
  );
  const absentStudents = activeSessions.reduce(
    (sum, session) => sum + session.absentStudents,
    0,
  );
  const lateStudents = activeSessions.reduce(
    (sum, session) => sum + session.lateStudents,
    0,
  );
  const totalFraudAlerts = activeSessions.reduce(
    (sum, session) => sum + session.fraudAlerts,
    0,
  );

  const attendanceRate =
    totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 0;
  const onTimeRate =
    totalStudents > 0
      ? ((presentStudents - lateStudents) / totalStudents) * 100
      : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500";
      case "SCHEDULED":
        return "bg-blue-500";
      case "ENDED":
        return "bg-gray-500";
      case "CANCELLED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Active";
      case "SCHEDULED":
        return "Scheduled";
      case "ENDED":
        return "Ended";
      case "CANCELLED":
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="space-y-4">
      {/* Overall Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {presentStudents}
          </div>
          <div className="text-sm text-muted-foreground">Present</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {absentStudents}
          </div>
          <div className="text-sm text-muted-foreground">Absent</div>
        </div>
      </div>

      {/* Attendance Rate */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Attendance Rate</span>
          <span className="text-sm text-muted-foreground">
            {attendanceRate.toFixed(1)}%
          </span>
        </div>
        <Progress value={attendanceRate} className="h-2" />
      </div>

      {/* On-time Rate */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">On-time Rate</span>
          <span className="text-sm text-muted-foreground">
            {onTimeRate.toFixed(1)}%
          </span>
        </div>
        <Progress value={onTimeRate} className="h-2" />
      </div>

      {/* Active Sessions */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Active Sessions</h4>
        {activeSessions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No active sessions
          </div>
        ) : (
          activeSessions.map((session) => (
            <div key={session.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(session.status)}>
                    {getStatusText(session.status)}
                  </Badge>
                  <span className="font-medium">{session.courseName}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {session.presentStudents}/{session.totalStudents}
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                {session.title}
              </div>

              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{session.totalStudents} students</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{session.location.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {new Date(session.startTime).toLocaleTimeString()} -{" "}
                    {new Date(session.endTime).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {session.fraudAlerts > 0 && (
                <div className="flex items-center space-x-1 text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="text-xs">
                    {session.fraudAlerts} fraud alerts
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-2">
                {session.security.isLocationRequired && (
                  <Badge variant="outline" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    Location
                  </Badge>
                )}
                {session.security.isPhotoRequired && (
                  <Badge variant="outline" className="text-xs">
                    馃摲 Photo
                  </Badge>
                )}
                {session.security.isDeviceCheckRequired && (
                  <Badge variant="outline" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Device
                  </Badge>
                )}
                {session.security.fraudDetectionEnabled && (
                  <Badge variant="outline" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Fraud Detection
                  </Badge>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Security Summary */}
      {totalFraudAlerts > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {totalFraudAlerts} fraud alerts across all sessions
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
