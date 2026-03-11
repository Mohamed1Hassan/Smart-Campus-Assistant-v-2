"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/common/DashboardLayout";
import {
  AttendanceOverview,
  ActiveSessions,
  FraudAlerts,
  SecurityMetrics,
  QuickActions,
} from "@/components/dashboard/attendance";
import {
  SessionManagement,
  SecuritySettings,
  LocationManager,
} from "@/components/dashboard/sessions";
import {
  RealTimeMonitoring,
  StudentTracking,
  DeviceVerification,
} from "@/components/dashboard/monitoring";
import {
  AnalyticsDashboard,
  AttendanceReports,
  FraudReports,
  SecurityAnalytics,
} from "@/components/dashboard/analytics";
import {
  SecurityManagement,
  FraudHandling,
  RiskAssessment,
  IncidentManagement,
} from "@/components/dashboard/security";
import {
  Shield,
  Users,
  Clock,
  AlertTriangle,
  TrendingUp,
  Settings,
  Download,
  Plus,
  RefreshCw,
} from "lucide-react";
import { StatsSkeleton } from "@/components/common/LoadingSkeleton";

// Types
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

interface FraudAlert {
  id: string;
  studentId: number;
  studentName: string;
  type:
    | "LOCATION_SPOOFING"
    | "TIME_MANIPULATION"
    | "DEVICE_SHARING"
    | "MULTIPLE_DEVICES"
    | "SUSPICIOUS_PATTERN"
    | "QR_SHARING";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  timestamp: Date;
  riskScore: number;
  status: "PENDING" | "INVESTIGATING" | "RESOLVED" | "DISMISSED";
  actions: string[];
}

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

/**
 * Professor Attendance Dashboard
 * Comprehensive dashboard for managing attendance, monitoring security, and analyzing data
 */
export default function ProfessorAttendanceDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [securityMetrics, setSecurityMetrics] =
    useState<SecurityMetrics | null>(null);
  const [realTimeData, setRealTimeData] = useState<StudentAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchSessions = useCallback(async () => {
    // Mock data - replace with actual API call
    const mockSessions: AttendanceSession[] = [
      {
        id: "session-1",
        courseId: 101,
        courseName: "Computer Science 101",
        title: "Lecture: Data Structures",
        description: "Introduction to data structures and algorithms",
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        endTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
        location: {
          latitude: 40.7128,
          longitude: -74.006,
          radius: 50,
          name: "Main Campus - Room 101",
        },
        security: {
          isLocationRequired: true,
          isPhotoRequired: false,
          isDeviceCheckRequired: true,
          fraudDetectionEnabled: true,
          gracePeriod: 5,
        },
        status: "ACTIVE",
        totalStudents: 45,
        presentStudents: 38,
        absentStudents: 5,
        lateStudents: 2,
        fraudAlerts: 3,
      },
      {
        id: "session-2",
        courseId: 102,
        courseName: "Mathematics 201",
        title: "Tutorial: Calculus",
        description: "Calculus problem solving session",
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
        location: {
          latitude: 40.7128,
          longitude: -74.006,
          radius: 30,
          name: "Main Campus - Room 205",
        },
        security: {
          isLocationRequired: true,
          isPhotoRequired: true,
          isDeviceCheckRequired: true,
          fraudDetectionEnabled: true,
          gracePeriod: 10,
        },
        status: "SCHEDULED",
        totalStudents: 30,
        presentStudents: 0,
        absentStudents: 0,
        lateStudents: 0,
        fraudAlerts: 0,
      },
    ];
    setSessions(mockSessions);
  }, []);

  const fetchFraudAlerts = useCallback(async () => {
    // Mock data - replace with actual API call
    const mockAlerts: FraudAlert[] = [
      {
        id: "alert-1",
        studentId: 12345,
        studentName: "John Doe",
        type: "LOCATION_SPOOFING",
        severity: "HIGH",
        description:
          "Student location appears to be spoofed - impossible location jump detected",
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        riskScore: 85,
        status: "PENDING",
        actions: [
          "Review location history",
          "Contact student",
          "Flag for investigation",
        ],
      },
      {
        id: "alert-2",
        studentId: 12346,
        studentName: "Jane Smith",
        type: "DEVICE_SHARING",
        severity: "MEDIUM",
        description:
          "Multiple devices detected for same student within short time frame",
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        riskScore: 65,
        status: "INVESTIGATING",
        actions: [
          "Verify device ownership",
          "Check device history",
          "Send warning",
        ],
      },
      {
        id: "alert-3",
        studentId: 12347,
        studentName: "Bob Johnson",
        type: "SUSPICIOUS_PATTERN",
        severity: "CRITICAL",
        description:
          "Unusual attendance pattern detected - multiple rapid attempts",
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        riskScore: 95,
        status: "PENDING",
        actions: [
          "Immediate investigation",
          "Suspend attendance",
          "Contact security",
        ],
      },
    ];
    setFraudAlerts(mockAlerts);
  }, []);

  const fetchSecurityMetrics = useCallback(async () => {
    // Mock data - replace with actual API call
    const mockMetrics: SecurityMetrics = {
      totalAttempts: 1250,
      successfulAttempts: 1180,
      failedAttempts: 70,
      fraudDetected: 15,
      averageFraudScore: 35,
      deviceChanges: 8,
      locationViolations: 12,
      timeViolations: 5,
      photoFailures: 3,
      riskLevel: "MEDIUM",
    };
    setSecurityMetrics(mockMetrics);
  }, []);

  const fetchRealTimeData = useCallback(async () => {
    // Mock data - replace with actual API call
    const mockData: StudentAttendance[] = [
      {
        id: 12345,
        name: "John Doe",
        email: "john.doe@university.edu",
        status: "PRESENT",
        timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        location: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 5,
        },
        deviceFingerprint: "device-123",
        fraudScore: 15,
        attempts: 1,
      },
      {
        id: 12346,
        name: "Jane Smith",
        email: "jane.smith@university.edu",
        status: "LATE",
        timestamp: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
        location: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 8,
        },
        deviceFingerprint: "device-456",
        fraudScore: 25,
        attempts: 1,
      },
      {
        id: 12347,
        name: "Bob Johnson",
        email: "bob.johnson@university.edu",
        status: "PRESENT",
        timestamp: new Date(Date.now() - 30 * 1000), // 30 seconds ago
        location: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 3,
        },
        deviceFingerprint: "device-789",
        fraudScore: 5,
        attempts: 1,
      },
    ];
    setRealTimeData(mockData);
  }, []);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load sessions, fraud alerts, security metrics, and real-time data
      await Promise.all([
        fetchSessions(),
        fetchFraudAlerts(),
        fetchSecurityMetrics(),
        fetchRealTimeData(),
      ]);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    fetchSessions,
    fetchFraudAlerts,
    fetchSecurityMetrics,
    fetchRealTimeData,
  ]);

  // Initial data load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleCreateSession = useCallback(() => {
    // Navigate to session creation
    console.log("Create new session");
  }, []);

  const handleEditSession = useCallback((sessionId: string) => {
    // Navigate to session editing
    console.log("Edit session:", sessionId);
  }, []);

  const handleDeleteSession = useCallback((sessionId: string) => {
    // Delete session
    console.log("Delete session:", sessionId);
  }, []);

  const handleFraudAlertAction = useCallback(
    (alertId: string, action: string) => {
      // Handle fraud alert action
      console.log("Fraud alert action:", alertId, action);
    },
    [],
  );

  const handleExportData = useCallback((type: string) => {
    // Export data
    console.log("Export data:", type);
  }, []);

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRealTimeData();
      setLastUpdate(new Date());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [fetchRealTimeData]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <StatsSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-cardDark rounded-lg border border-gray-200 dark:border-gray-700 p-6 h-96" />
            <div className="bg-white dark:bg-cardDark rounded-lg border border-gray-200 dark:border-gray-700 p-6 h-96" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Attendance Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage attendance sessions, monitor security, and analyze student
              data
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
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Sessions
                  </p>
                  <p className="text-2xl font-bold">
                    {sessions.filter((s) => s.status === "ACTIVE").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Fraud Alerts
                  </p>
                  <p className="text-2xl font-bold">
                    {fraudAlerts.filter((a) => a.status === "PENDING").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Security Level
                  </p>
                  <p className="text-2xl font-bold capitalize">
                    {securityMetrics?.riskLevel || "Unknown"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Success Rate
                  </p>
                  <p className="text-2xl font-bold">
                    {securityMetrics
                      ? Math.round(
                          (securityMetrics.successfulAttempts /
                            securityMetrics.totalAttempts) *
                            100,
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs
          defaultValue="overview"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Attendance Overview</span>
                  </CardTitle>
                  <CardDescription>
                    Current session attendance statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AttendanceOverview sessions={sessions} />
                </CardContent>
              </Card>

              {/* Active Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Active Sessions</span>
                  </CardTitle>
                  <CardDescription>
                    Currently running attendance sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ActiveSessions
                    sessions={sessions.filter((s) => s.status === "ACTIVE")}
                    onEdit={handleEditSession}
                    onDelete={handleDeleteSession}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fraud Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Fraud Alerts</span>
                  </CardTitle>
                  <CardDescription>
                    Recent security alerts and fraud attempts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FraudAlerts
                    alerts={fraudAlerts}
                    onAction={handleFraudAlertAction}
                  />
                </CardContent>
              </Card>

              {/* Security Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Security Metrics</span>
                  </CardTitle>
                  <CardDescription>
                    System security and fraud detection statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SecurityMetrics metrics={securityMetrics} />
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Quick Actions</span>
                </CardTitle>
                <CardDescription>Common actions and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <QuickActions
                  onCreateSession={handleCreateSession}
                  onExportData={handleExportData}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Session Management</h2>
                <p className="text-muted-foreground">
                  Create and manage attendance sessions with advanced security
                  settings
                </p>
              </div>
              <Button
                onClick={handleCreateSession}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Session</span>
              </Button>
            </div>

            <SessionManagement
              sessions={sessions}
              onCreateSession={handleCreateSession}
              onEditSession={handleEditSession}
              onDeleteSession={handleDeleteSession}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SecuritySettings />
              <LocationManager />
            </div>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Real-time Monitoring</h2>
                <p className="text-muted-foreground">
                  Live attendance tracking and security monitoring
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge
                  variant="outline"
                  className="flex items-center space-x-1"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Live</span>
                </Badge>
                <Button variant="outline" size="sm" onClick={fetchRealTimeData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <RealTimeMonitoring
              data={realTimeData}
              sessions={sessions.filter((s) => s.status === "ACTIVE")}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StudentTracking
                students={realTimeData}
                onStudentClick={(studentId) =>
                  console.log("Student clicked:", studentId)
                }
              />
              <DeviceVerification
                students={realTimeData}
                onDeviceClick={(deviceId) =>
                  console.log("Device clicked:", deviceId)
                }
              />
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Analytics & FileTexting</h2>
                <p className="text-muted-foreground">
                  Attendance statistics, fraud FileTexts, and security analytics
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handleExportData("analytics")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportData("FileTexts")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  FileTexts
                </Button>
              </div>
            </div>

            <AnalyticsDashboard
              sessions={sessions}
              fraudAlerts={fraudAlerts}
              securityMetrics={securityMetrics}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AttendanceReports sessions={sessions} />
              <FraudReports alerts={fraudAlerts} />
            </div>

            <SecurityAnalytics metrics={securityMetrics} />
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Security Management</h2>
                <p className="text-muted-foreground">
                  Fraud alert handling, security policies, and incident
                  management
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handleExportData("security")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <SecurityManagement
              alerts={fraudAlerts}
              metrics={securityMetrics}
              onAlertAction={handleFraudAlertAction}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FraudHandling
                alerts={fraudAlerts}
                onAction={handleFraudAlertAction}
              />
              <RiskAssessment metrics={securityMetrics} sessions={sessions} />
            </div>

            <IncidentManagement
              alerts={fraudAlerts}
              onAction={handleFraudAlertAction}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
