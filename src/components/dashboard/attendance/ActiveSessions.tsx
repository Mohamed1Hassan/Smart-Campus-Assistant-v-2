"use client";
import React from "react";

import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Progress } from "../../ui/progress";
import {
  Clock,
  MapPin,
  Shield,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  Settings,
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

interface ActiveSessionsProps {
  sessions: AttendanceSession[];
  onEdit: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
}

export function ActiveSessions({
  sessions,
  onEdit,
  onDelete,
}: ActiveSessionsProps) {
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

  const getTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const getAttendanceProgress = (session: AttendanceSession) => {
    return (session.presentStudents / session.totalStudents) * 100;
  };

  const getSecurityLevel = (session: AttendanceSession) => {
    let level = 0;
    if (session.security.isLocationRequired) level++;
    if (session.security.isPhotoRequired) level++;
    if (session.security.isDeviceCheckRequired) level++;
    if (session.security.fraudDetectionEnabled) level++;

    if (level >= 3) return { level: "High", color: "text-green-600" };
    if (level >= 2) return { level: "Medium", color: "text-yellow-600" };
    return { level: "Low", color: "text-red-600" };
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground mb-4">
          <Clock className="h-12 w-12 mx-auto mb-2" />
          <p>No active sessions</p>
          <p className="text-sm">Create a new session to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const securityLevel = getSecurityLevel(session);
        const attendanceProgress = getAttendanceProgress(session);
        const timeRemaining = getTimeRemaining(session.endTime);

        return (
          <div key={session.id} className="border rounded-lg p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(session.status)}>
                  {getStatusText(session.status)}
                </Badge>
                <span className="font-medium">{session.courseName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(session.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(session.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Session Info */}
            <div>
              <h4 className="font-medium">{session.title}</h4>
              {session.description && (
                <p className="text-sm text-muted-foreground">
                  {session.description}
                </p>
              )}
            </div>

            {/* Attendance Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {session.presentStudents}
                </div>
                <div className="text-xs text-muted-foreground">Present</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">
                  {session.absentStudents}
                </div>
                <div className="text-xs text-muted-foreground">Absent</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">
                  {session.lateStudents}
                </div>
                <div className="text-xs text-muted-foreground">Late</div>
              </div>
            </div>

            {/* Attendance Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Attendance Progress</span>
                <span className="text-sm text-muted-foreground">
                  {session.presentStudents}/{session.totalStudents} (
                  {attendanceProgress.toFixed(1)}%)
                </span>
              </div>
              <Progress value={attendanceProgress} className="h-2" />
            </div>

            {/* Session Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{timeRemaining}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(session.startTime).toLocaleTimeString()} -{" "}
                    {new Date(session.endTime).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{session.location.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Radius: {session.location.radius}m
                  </div>
                </div>
              </div>
            </div>

            {/* Security Features */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Security Level</span>
                <span className={`text-sm font-medium ${securityLevel.color}`}>
                  {securityLevel.level}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
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
                <Badge variant="outline" className="text-xs">
                  Grace: {session.security.gracePeriod}m
                </Badge>
              </div>
            </div>

            {/* Fraud Alerts */}
            {session.fraudAlerts > 0 && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {session.fraudAlerts} fraud alerts detected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Session ID: {session.id}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
