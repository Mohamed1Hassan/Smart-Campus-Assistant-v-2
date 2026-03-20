"use client";
import React, { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Share2,
} from "lucide-react";
import DashboardLayout from "../components/common/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { useAttendanceSessions } from "../hooks/useAttendanceSessions";
import { QRCodeGenerator } from "../components/professor/QRCodeGenerator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

import { StudentList } from "../components/professor/StudentList";

export function ProfessorAttendanceSessionDetails() {
  // ... (rest of the component)
  const { sessions, loadSessionById, setSelectedSession, selectedSession, generateQRCode: rotateQRCode } = useAttendanceSessions();
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  useEffect(() => {
    if (id) {
      loadSessionById(id);
      
      // Add auto-refresh every 10 seconds for real-time attendance
      const interval = setInterval(() => {
        loadSessionById(id);
      }, 10000);
      
      return () => {
        clearInterval(interval);
        setSelectedSession(null);
      };
    }
  }, [id, loadSessionById, setSelectedSession]);

  // Use selectedSession if it's the one we're looking for, otherwise find in sessions
  const session = useMemo(() => {
    if (selectedSession && String(selectedSession.id) === id) {
      return selectedSession;
    }
    if (sessions.length > 0 && id) {
      return sessions.find((s) => String(s.id) === id) || null;
    }
    return null;
  }, [sessions, selectedSession, id]);

  if (!session) {
    return (
      <DashboardLayout userType="professor">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate stats from attendanceRecords
  const attendanceRecords = (session as any).attendanceRecords || [];
  const presentCount = attendanceRecords.filter((r: any) => r.status === "PRESENT").length;
  const lateCount = attendanceRecords.filter((r: any) => r.status === "LATE").length;
  // Total count is the number of enrollments if available
  const totalCount = session.course?._count?.enrollments || session.course?.enrollments?.length || session.totalStudents || 2;
  const absentCount = Math.max(0, totalCount - presentCount);
  const attendanceRate =
    totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

  return (
    <DashboardLayout userType="professor">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() =>
              router.push("/dashboard/professor/attendance/sessions")
            }
            className="rounded-full w-10 h-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {session.title}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">
                {session.course?.courseCode || "N/A"}
              </span>
              {session.course?.courseName || session.courseName} •{" "}
              {new Date(session.startTime).toLocaleDateString()}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge
              className={
                session.status === "ACTIVE"
                  ? "bg-green-500"
                  : session.status === "SCHEDULED"
                    ? "bg-blue-500"
                    : "bg-gray-500"
              }
            >
              {session.status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Present</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {presentCount}
                  </div>
                  <Progress value={attendanceRate} className="h-1 mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Absent</span>
                    <XCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {absentCount}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Late</span>
                    <Clock className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {lateCount}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="students">Student List</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Session Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Session Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        <div>
                          <p className="text-sm text-gray-500">Time</p>
                          <p className="font-medium">
                            {new Date(session.startTime).toLocaleTimeString()} -{" "}
                            {new Date(session.endTime).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <MapPin className="w-5 h-5 text-indigo-500" />
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium">
                            {session.location?.name || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* QR Code */}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <QRCodeGenerator 
                  session={session as any} 
                  onRefresh={() => rotateQRCode(session.id).then(() => {})}
                />
              </TabsContent>

              <TabsContent value="students">
                <Card>
                  <CardHeader>
                    <CardTitle>Student List</CardTitle>
                    <CardDescription>
                      Students who have marked their attendance for this
                      session.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StudentList
                      sessionId={
                        ((session as unknown as Record<string, unknown>)
                          .sessionId as string) || String(session.id)
                      }
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Security Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-500" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <span className="text-sm">Location Check</span>
                  <Badge
                    variant={
                      session.securitySettings?.isLocationRequired || (session as any).security?.isLocationRequired
                        ? "default"
                        : "secondary"
                    }
                    className="rounded-full"
                  >
                    {session.securitySettings?.isLocationRequired || (session as any).security?.isLocationRequired
                      ? "Active"
                      : "Disabled"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <span className="text-sm">Photo Verification</span>
                  <Badge
                    variant={
                      session.securitySettings?.isPhotoRequired || (session as any).security?.isPhotoRequired
                        ? "default"
                        : "secondary"
                    }
                    className="rounded-full"
                  >
                    {session.securitySettings?.isPhotoRequired || (session as any).security?.isPhotoRequired
                      ? "Active"
                      : "Disabled"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <span className="text-sm">Device Check</span>
                  <Badge
                    variant={
                      session.securitySettings?.isDeviceCheckRequired || (session as any).security?.isDeviceCheckRequired
                        ? "default"
                        : "secondary"
                    }
                    className="rounded-full"
                  >
                    {session.securitySettings?.isDeviceCheckRequired || (session as any).security?.isDeviceCheckRequired
                      ? "Active"
                      : "Disabled"}
                  </Badge>
                </div>

                {session.fraudAlerts && session.fraudAlerts > 0 && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {session.fraudAlerts} Fraud Alerts
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Session
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
