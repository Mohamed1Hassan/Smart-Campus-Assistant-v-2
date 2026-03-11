"use client";
import React, { useState, useEffect } from "react";
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
  Users,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Download,
  User,
  Smartphone,
  Wifi,
  Fingerprint,
  Activity,
  AlertCircle,
} from "lucide-react";

// Types
interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
  courseId: number;
  courseName: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "PENDING";
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };
  deviceFingerprint: {
    fingerprint: string;
    deviceInfo: string;
    isVerified: boolean;
    lastUsed: Date;
  };
  attendanceHistory: {
    totalSessions: number;
    presentSessions: number;
    lateSessions: number;
    absentSessions: number;
    fraudAttempts: number;
  };
  behaviorScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  lastActivity: Date;
  isOnline: boolean;
  connectionQuality: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  photoUrl?: string;
  ipAddress: string;
  userAgent: string;
}

interface MonitoringSession {
  id: string;
  courseId: number;
  courseName: string;
  startTime: Date;
  endTime: Date;
  location: {
    latitude: number;
    longitude: number;
    radius: number;
    name: string;
  };
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  lateStudents: number;
  fraudAlerts: number;
  status: "ACTIVE" | "SCHEDULED" | "ENDED" | "CANCELLED";
}

interface LocationViolation {
  id: string;
  studentId: string;
  studentName: string;
  violationType: "OUT_OF_RANGE" | "SPOOFED_LOCATION" | "INVALID_COORDINATES";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  expectedLocation: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  distance: number;
  isResolved: boolean;
}

interface DeviceViolation {
  id: string;
  studentId: string;
  studentName: string;
  violationType: "DEVICE_CHANGE" | "DEVICE_SHARING" | "INVALID_FINGERPRINT";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  timestamp: Date;
  deviceInfo: string;
  previousDevice: string;
  isResolved: boolean;
}

interface StudentMonitoringProps {
  sessionId?: string;
  onStudentSelect?: (student: Student) => void;
  onViolationSelect?: (violation: LocationViolation | DeviceViolation) => void;
  onExportData?: (type: string, filters: Record<string, unknown>) => void;
}

export function StudentMonitoring({
  sessionId,
  onStudentSelect,
  onViolationSelect,
  onExportData,
}: StudentMonitoringProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [monitoringSession, setMonitoringSession] =
    useState<MonitoringSession | null>(null);
  const [locationViolations, setLocationViolations] = useState<
    LocationViolation[]
  >([]);
  const [deviceViolations, setDeviceViolations] = useState<DeviceViolation[]>(
    [],
  );
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load data on component mount
  useEffect(() => {
    loadMonitoringData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, filterStatus, filterRisk, searchQuery]);

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadMonitoringData();
      setLastUpdate(new Date());
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, filterStatus, filterRisk, searchQuery]);

  const loadMonitoringData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadStudents(),
        loadMonitoringSession(),
        loadLocationViolations(),
        loadDeviceViolations(),
      ]);
    } catch (error) {
      console.error("Failed to load monitoring data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      // Mock data - replace with actual API call
      const mockStudents: Student[] = [
        {
          id: "student-1",
          name: "John Doe",
          email: "john.doe@university.edu",
          studentId: "STU001",
          courseId: 101,
          courseName: "Computer Science 101",
          status: "PRESENT",
          location: {
            latitude: 40.7128,
            longitude: -74.006,
            accuracy: 5,
            timestamp: new Date(),
          },
          deviceFingerprint: {
            fingerprint: "fp-123456789",
            deviceInfo: "Chrome 120.0.0.0 on Windows 10",
            isVerified: true,
            lastUsed: new Date(),
          },
          attendanceHistory: {
            totalSessions: 25,
            presentSessions: 23,
            lateSessions: 2,
            absentSessions: 0,
            fraudAttempts: 0,
          },
          behaviorScore: 95,
          riskLevel: "LOW",
          lastActivity: new Date(),
          isOnline: true,
          connectionQuality: "EXCELLENT",
          photoUrl: "/api/placeholder/40/40",
          ipAddress: "192.168.1.100",
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        {
          id: "student-2",
          name: "Jane Smith",
          email: "jane.smith@university.edu",
          studentId: "STU002",
          courseId: 101,
          courseName: "Computer Science 101",
          status: "LATE",
          location: {
            latitude: 40.713,
            longitude: -74.0058,
            accuracy: 8,
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
          },
          deviceFingerprint: {
            fingerprint: "fp-987654321",
            deviceInfo: "Safari 17.0 on macOS 14",
            isVerified: true,
            lastUsed: new Date(),
          },
          attendanceHistory: {
            totalSessions: 25,
            presentSessions: 20,
            lateSessions: 4,
            absentSessions: 1,
            fraudAttempts: 1,
          },
          behaviorScore: 78,
          riskLevel: "MEDIUM",
          lastActivity: new Date(Date.now() - 2 * 60 * 1000),
          isOnline: true,
          connectionQuality: "GOOD",
          photoUrl: "/api/placeholder/40/40",
          ipAddress: "192.168.1.101",
          userAgent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
        },
        {
          id: "student-3",
          name: "Bob Johnson",
          email: "bob.johnson@university.edu",
          studentId: "STU003",
          courseId: 101,
          courseName: "Computer Science 101",
          status: "ABSENT",
          location: {
            latitude: 0,
            longitude: 0,
            accuracy: 0,
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
          },
          deviceFingerprint: {
            fingerprint: "fp-456789123",
            deviceInfo: "Firefox 120.0 on Ubuntu 22.04",
            isVerified: false,
            lastUsed: new Date(Date.now() - 30 * 60 * 1000),
          },
          attendanceHistory: {
            totalSessions: 25,
            presentSessions: 15,
            lateSessions: 3,
            absentSessions: 7,
            fraudAttempts: 3,
          },
          behaviorScore: 45,
          riskLevel: "HIGH",
          lastActivity: new Date(Date.now() - 30 * 60 * 1000),
          isOnline: false,
          connectionQuality: "POOR",
          photoUrl: "/api/placeholder/40/40",
          ipAddress: "192.168.1.102",
          userAgent:
            "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0",
        },
      ];
      setStudents(mockStudents);
    } catch (error) {
      console.error("Failed to load students:", error);
    }
  };

  const loadMonitoringSession = async () => {
    try {
      // Mock data - replace with actual API call
      const mockSession: MonitoringSession = {
        id: "session-1",
        courseId: 101,
        courseName: "Computer Science 101",
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 1 * 60 * 60 * 1000),
        location: {
          latitude: 40.7128,
          longitude: -74.006,
          radius: 50,
          name: "Main Campus - Room 101",
        },
        totalStudents: 45,
        presentStudents: 38,
        absentStudents: 5,
        lateStudents: 2,
        fraudAlerts: 3,
        status: "ACTIVE",
      };
      setMonitoringSession(mockSession);
    } catch (error) {
      console.error("Failed to load monitoring session:", error);
    }
  };

  const loadLocationViolations = async () => {
    try {
      // Mock data - replace with actual API call
      const mockViolations: LocationViolation[] = [
        {
          id: "violation-1",
          studentId: "student-3",
          studentName: "Bob Johnson",
          violationType: "OUT_OF_RANGE",
          severity: "HIGH",
          description: "Student is outside the allowed radius",
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          location: {
            latitude: 40.72,
            longitude: -74.0,
            accuracy: 10,
          },
          expectedLocation: {
            latitude: 40.7128,
            longitude: -74.006,
            radius: 50,
          },
          distance: 1200,
          isResolved: false,
        },
      ];
      setLocationViolations(mockViolations);
    } catch (error) {
      console.error("Failed to load location violations:", error);
    }
  };

  const loadDeviceViolations = async () => {
    try {
      // Mock data - replace with actual API call
      const mockViolations: DeviceViolation[] = [
        {
          id: "device-violation-1",
          studentId: "student-2",
          studentName: "Jane Smith",
          violationType: "DEVICE_CHANGE",
          severity: "MEDIUM",
          description: "Device fingerprint changed from previous session",
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          deviceInfo: "Safari 17.0 on macOS 14",
          previousDevice: "Chrome 120.0.0.0 on Windows 10",
          isResolved: false,
        },
      ];
      setDeviceViolations(mockViolations);
    } catch (error) {
      console.error("Failed to load device violations:", error);
    }
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    onStudentSelect?.(student);
  };

  const handleViolationSelect = (
    violation: LocationViolation | DeviceViolation,
  ) => {
    onViolationSelect?.(violation);
  };

  const handleExportData = (type: string) => {
    const filters = {
      sessionId,
      filterStatus,
      filterRisk,
      searchQuery,
    };
    onExportData?.(type, filters);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "LATE":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "ABSENT":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "PENDING":
        return <Activity className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "text-green-600";
      case "LATE":
        return "text-yellow-600";
      case "ABSENT":
        return "text-red-600";
      case "PENDING":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "LOW":
        return "text-green-600";
      case "MEDIUM":
        return "text-yellow-600";
      case "HIGH":
        return "text-orange-600";
      case "CRITICAL":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case "LOW":
        return "bg-green-500";
      case "MEDIUM":
        return "bg-yellow-500";
      case "HIGH":
        return "bg-orange-500";
      case "CRITICAL":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getConnectionQualityColor = (quality: string) => {
    switch (quality) {
      case "EXCELLENT":
        return "text-green-600";
      case "GOOD":
        return "text-blue-600";
      case "FAIR":
        return "text-yellow-600";
      case "POOR":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getViolationIcon = (type: string) => {
    switch (type) {
      case "OUT_OF_RANGE":
        return <MapPin className="h-4 w-4 text-red-600" />;
      case "SPOOFED_LOCATION":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "INVALID_COORDINATES":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "DEVICE_CHANGE":
        return <Smartphone className="h-4 w-4 text-yellow-600" />;
      case "DEVICE_SHARING":
        return <Users className="h-4 w-4 text-orange-600" />;
      case "INVALID_FINGERPRINT":
        return <Fingerprint className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesStatus =
      filterStatus === "all" || student.status === filterStatus;
    const matchesRisk =
      filterRisk === "all" || student.riskLevel === filterRisk;
    const matchesSearch =
      searchQuery === "" ||
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesRisk && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading student monitoring...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Student Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time student tracking and behavior analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live</span>
          </Badge>
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button variant="outline" onClick={loadMonitoringData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Session Overview */}
      {monitoringSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Session Overview</span>
            </CardTitle>
            <CardDescription>
              {monitoringSession.courseName} - {monitoringSession.location.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {monitoringSession.totalStudents}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Students
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {monitoringSession.presentStudents}
                </div>
                <div className="text-sm text-muted-foreground">Present</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {monitoringSession.lateStudents}
                </div>
                <div className="text-sm text-muted-foreground">Late</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {monitoringSession.fraudAlerts}
                </div>
                <div className="text-sm text-muted-foreground">
                  Fraud Alerts
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-md w-full"
            />
          </div>
        </div>
        <Select
          value={filterStatus}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setFilterStatus(e.target.value)
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PRESENT">Present</SelectItem>
            <SelectItem value="LATE">Late</SelectItem>
            <SelectItem value="ABSENT">Absent</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filterRisk}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setFilterRisk(e.target.value)
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => handleExportData("students")}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Students List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Students ({filteredStudents.length})</span>
            </CardTitle>
            <CardDescription>
              Real-time student status and monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedStudent?.id === student.id
                      ? "border-blue-500 bg-blue-50"
                      : "hover:border-gray-300"
                  }`}
                  onClick={() => handleStudentSelect(student)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {student.studentId}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getRiskBadge(student.riskLevel)}>
                        {student.riskLevel}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(student.status)}
                        <span
                          className={`text-sm ${getStatusColor(student.status)}`}
                        >
                          {student.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">
                        Behavior Score
                      </div>
                      <div
                        className={`font-medium ${getRiskColor(student.riskLevel)}`}
                      >
                        {student.behaviorScore}/100
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Connection</div>
                      <div
                        className={`font-medium ${getConnectionQualityColor(student.connectionQuality)}`}
                      >
                        {student.connectionQuality}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Last Activity</div>
                      <div className="font-medium">
                        {student.lastActivity.toLocaleTimeString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Online</div>
                      <div className="font-medium">
                        {student.isOnline ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected Student Details */}
        {selectedStudent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Student Details</span>
              </CardTitle>
              <CardDescription>
                {selectedStudent.name} - {selectedStudent.studentId}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Status and Risk */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedStudent.status)}
                    <span
                      className={`font-medium ${getStatusColor(selectedStudent.status)}`}
                    >
                      {selectedStudent.status}
                    </span>
                  </div>
                  <Badge className={getRiskBadge(selectedStudent.riskLevel)}>
                    {selectedStudent.riskLevel} Risk
                  </Badge>
                </div>

                {/* Location Information */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Location</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Lat: {selectedStudent.location.latitude.toFixed(6)}, Lng:{" "}
                    {selectedStudent.location.longitude.toFixed(6)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Accuracy: {selectedStudent.location.accuracy}m
                  </div>
                </div>

                {/* Device Information */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Device</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedStudent.deviceFingerprint.deviceInfo}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Verified:{" "}
                    {selectedStudent.deviceFingerprint.isVerified
                      ? "Yes"
                      : "No"}
                  </div>
                </div>

                {/* Attendance History */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Attendance History</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Present</div>
                      <div className="font-medium">
                        {selectedStudent.attendanceHistory.presentSessions}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Late</div>
                      <div className="font-medium">
                        {selectedStudent.attendanceHistory.lateSessions}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Absent</div>
                      <div className="font-medium">
                        {selectedStudent.attendanceHistory.absentSessions}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">
                        Fraud Attempts
                      </div>
                      <div className="font-medium">
                        {selectedStudent.attendanceHistory.fraudAttempts}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connection Quality */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Wifi className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Connection Quality</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Quality: {selectedStudent.connectionQuality}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    IP: {selectedStudent.ipAddress}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Violations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Violations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Location Violations</span>
            </CardTitle>
            <CardDescription>
              Location-based security violations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {locationViolations.map((violation) => (
                <div
                  key={violation.id}
                  className="border rounded-lg p-4 cursor-pointer hover:border-gray-300"
                  onClick={() => handleViolationSelect(violation)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getViolationIcon(violation.violationType)}
                      <span className="font-medium">
                        {violation.studentName}
                      </span>
                    </div>
                    <Badge className={getRiskBadge(violation.severity)}>
                      {violation.severity}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {violation.description}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Distance: {violation.distance}m |{" "}
                    {violation.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Violations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Device Violations</span>
            </CardTitle>
            <CardDescription>Device-based security violations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deviceViolations.map((violation) => (
                <div
                  key={violation.id}
                  className="border rounded-lg p-4 cursor-pointer hover:border-gray-300"
                  onClick={() => handleViolationSelect(violation)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getViolationIcon(violation.violationType)}
                      <span className="font-medium">
                        {violation.studentName}
                      </span>
                    </div>
                    <Badge className={getRiskBadge(violation.severity)}>
                      {violation.severity}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {violation.description}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {violation.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
