"use client";
import React, { useState } from "react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Users,
  MapPin,
  Clock,
  Shield,
  AlertTriangle,
  RefreshCw,
  Search,
  Eye,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
} from "lucide-react";

interface StudentAttendance {
  id: number;
  name: string;
  email: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  deviceFingerprint: string;
  fraudScore: number;
  photoUrl?: string;
  attempts: number;
}

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

interface RealTimeMonitoringProps {
  data: StudentAttendance[];
  sessions: AttendanceSession[];
}

export function RealTimeMonitoring({
  data,
  sessions,
}: RealTimeMonitoringProps) {
  const [selectedSession, setSelectedSession] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("timestamp");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredData = React.useMemo(() => {
    let filtered = [...data];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((student) => student.status === statusFilter);
    }

    // Sort data
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "timestamp":
          return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        case "name":
          return a.name.localeCompare(b.name);
        case "status":
          return a.status.localeCompare(b.status);
        case "fraudScore":
          return b.fraudScore - a.fraudScore;
        default:
          return 0;
      }
    });

    return filtered;
  }, [data, statusFilter, searchTerm, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-500";
      case "LATE":
        return "bg-yellow-500";
      case "ABSENT":
        return "bg-red-500";
      case "EXCUSED":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "LATE":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "ABSENT":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "EXCUSED":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getFraudScoreColor = (score: number) => {
    if (score >= 80) return "text-red-600";
    if (score >= 60) return "text-orange-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor(diff / 1000);

    if (minutes > 0) return `${minutes}m ago`;
    if (seconds > 0) return `${seconds}s ago`;
    return "Just now";
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleStudentClick = (studentId: number) => {
    console.log("Student clicked:", studentId);
  };

  const handleViewDetails = (studentId: number) => {
    console.log("View details for student:", studentId);
  };

  const presentStudents = data.filter((s) => s.status === "PRESENT").length;
  const lateStudents = data.filter((s) => s.status === "LATE").length;
  const absentStudents = data.filter((s) => s.status === "ABSENT").length;
  const fraudAlerts = data.filter((s) => s.fraudScore > 70).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Real-time Monitoring</h3>
          <p className="text-sm text-muted-foreground">
            Live attendance tracking and security monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live</span>
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {presentStudents}
                </div>
                <div className="text-sm text-muted-foreground">Present</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {lateStudents}
                </div>
                <div className="text-sm text-muted-foreground">Late</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {absentStudents}
                </div>
                <div className="text-sm text-muted-foreground">Absent</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {fraudAlerts}
                </div>
                <div className="text-sm text-muted-foreground">
                  Fraud Alerts
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        <Select
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select session" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sessions</SelectItem>
            {sessions.map((session) => (
              <SelectItem key={session.id} value={session.id}>
                {session.courseName} - {session.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="PRESENT">Present</SelectItem>
            <SelectItem value="LATE">Late</SelectItem>
            <SelectItem value="ABSENT">Absent</SelectItem>
            <SelectItem value="EXCUSED">Excused</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="timestamp">Time</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="fraudScore">Risk Score</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Students List */}
      <div className="space-y-3">
        {filteredData.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2" />
              <p>No students found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          </div>
        ) : (
          filteredData.map((student) => (
            <Card
              key={student.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(student.status)}
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {student.email}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(student.status)}>
                      {student.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStudentClick(student.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {getTimeAgo(student.timestamp)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last seen
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {student.location.latitude.toFixed(4)},{" "}
                        {student.location.longitude.toFixed(4)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Accuracy: {student.location.accuracy}m
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {student.deviceFingerprint.substring(0, 8)}...
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Device ID
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div
                        className={`font-medium ${getFraudScoreColor(student.fraudScore)}`}
                      >
                        {student.fraudScore}/100
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Risk Score
                      </div>
                    </div>
                  </div>
                </div>

                {student.fraudScore > 70 && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                    <div className="flex items-center space-x-2 text-red-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        High Risk Detected
                      </span>
                    </div>
                    <div className="text-xs text-red-700 mt-1">
                      This student has a high fraud risk score. Review their
                      attendance attempt.
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>Attempts: {student.attempts}</span>
                    {student.photoUrl && (
                      <span className="flex items-center space-x-1">
                        <span>馃摲</span>
                        <span>Photo verified</span>
                      </span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(student.id)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
