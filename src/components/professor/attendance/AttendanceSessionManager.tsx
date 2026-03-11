"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Switch } from "../../ui/switch";
import { Slider } from "../../ui/slider";
import { Select, SelectItem } from "../../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Alert, AlertDescription } from "../../ui/alert";
import { Progress } from "../../ui/progress";
import {
  Clock,
  MapPin,
  Users,
  Shield,
  AlertTriangle,
  Play,
  Pause,
  Square,
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  RefreshCw,
  Camera,
  Smartphone,
  Eye,
} from "lucide-react";

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
    maxAttempts: number;
    riskThreshold: number;
  };
  status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "PAUSED" | "ENDED" | "CANCELLED";
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  lateStudents: number;
  fraudAlerts: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionStats {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  averageResponseTime: number;
  fraudDetected: number;
  deviceChanges: number;
  locationViolations: number;
}

interface AttendanceSessionManagerProps {
  onSessionCreate?: (session: Partial<AttendanceSession>) => void;
  onSessionUpdate?: (
    sessionId: string,
    updates: Partial<AttendanceSession>,
  ) => void;
  onSessionDelete?: (sessionId: string) => void;
  onSessionStart?: (sessionId: string) => void;
  onSessionPause?: (sessionId: string) => void;
  onSessionSquare?: (sessionId: string) => void;
  onEmergencySquare?: (sessionId: string) => void;
}

export function AttendanceSessionManager({
  onSessionCreate,
  onSessionUpdate,
  onSessionDelete,
  onSessionStart,
  onSessionPause,
  onSessionSquare,
  onEmergencySquare,
}: AttendanceSessionManagerProps) {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSession, setSelectedSession] =
    useState<AttendanceSession | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMonitoringDialog, setShowMonitoringDialog] = useState(false);

  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);

  // Stabilize fetchers
  const loadSessions = useCallback(async () => {
    try {
      // Mock data - replace with actual API call
      const mockSessions: AttendanceSession[] = [
        {
          id: "session-1",
          courseId: 101,
          courseName: "Computer Science 101",
          title: "Data Structures Lecture",
          description: "Introduction to data structures and algorithms",
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 1 * 60 * 60 * 1000),
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
            maxAttempts: 3,
            riskThreshold: 70,
          },
          status: "ACTIVE",
          totalStudents: 45,
          presentStudents: 38,
          absentStudents: 5,
          lateStudents: 2,
          fraudAlerts: 3,
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: "session-2",
          courseId: 102,
          courseName: "Mathematics 201",
          title: "Calculus Tutorial",
          description: "Calculus problem solving session",
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
          location: {
            latitude: 40.713,
            longitude: -74.0058,
            radius: 30,
            name: "Main Campus - Room 205",
          },
          security: {
            isLocationRequired: true,
            isPhotoRequired: true,
            isDeviceCheckRequired: true,
            fraudDetectionEnabled: true,
            gracePeriod: 10,
            maxAttempts: 2,
            riskThreshold: 60,
          },
          status: "SCHEDULED",
          totalStudents: 30,
          presentStudents: 0,
          absentStudents: 0,
          lateStudents: 0,
          fraudAlerts: 0,
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      ];
      setSessions(mockSessions);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loadSessionStats = useCallback(async (sessionId: string) => {
    try {
      // Mock data - replace with actual API call
      const mockStats: SessionStats = {
        totalAttempts: 125,
        successfulAttempts: 118,
        failedAttempts: 7,
        averageResponseTime: 2.3,
        fraudDetected: 3,
        deviceChanges: 2,
        locationViolations: 1,
      };
      setSessionStats(mockStats);
    } catch (error) {
      console.error("Failed to load session stats:", error);
    }
  }, []);

  const [newSession, setNewSession] = useState<Partial<AttendanceSession>>(
    () => ({
      courseId: 0,
      title: "",
      description: "",
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      location: {
        latitude: 0,
        longitude: 0,
        radius: 50,
        name: "",
      },
      security: {
        isLocationRequired: true,
        isPhotoRequired: false,
        isDeviceCheckRequired: true,
        fraudDetectionEnabled: true,
        gracePeriod: 5,
        maxAttempts: 3,
        riskThreshold: 70,
      },
    }),
  );

  // Load sessions on component mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSessions();
  }, [loadSessions]);

  // Real-time updates for active sessions
  useEffect(() => {
    if (!selectedSession || selectedSession.status !== "ACTIVE") return;

    const interval = setInterval(() => {
      loadSessionStats(selectedSession.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedSession, loadSessionStats]);

  const handleCreateSession = () => {
    // Close other dialogs first
    setShowMonitoringDialog(false);
    // Open create/edit dialog
    setIsCreating(true);
    setShowCreateDialog(true);
    setNewSession({
      courseId: 0,
      title: "",
      description: "",
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      location: {
        latitude: 0,
        longitude: 0,
        radius: 50,
        name: "",
      },
      security: {
        isLocationRequired: true,
        isPhotoRequired: false,
        isDeviceCheckRequired: true,
        fraudDetectionEnabled: true,
        gracePeriod: 5,
        maxAttempts: 3,
        riskThreshold: 70,
      },
    });
  };

  const handleSaveSession = async () => {
    try {
      if (isCreating) {
        const session: AttendanceSession = {
          id: `session-${Date.now()}`,
          ...newSession,
          courseId: newSession.courseId || 0,
          title: newSession.title || "",
          startTime: newSession.startTime || new Date(),
          endTime: newSession.endTime || new Date(),
          location: newSession.location || {
            latitude: 0,
            longitude: 0,
            radius: 50,
            name: "",
          },
          security: newSession.security || {
            isLocationRequired: true,
            isPhotoRequired: false,
            isDeviceCheckRequired: true,
            fraudDetectionEnabled: true,
            gracePeriod: 5,
            maxAttempts: 3,
            riskThreshold: 70,
          },
          status: "DRAFT",
          totalStudents: 0,
          presentStudents: 0,
          absentStudents: 0,
          lateStudents: 0,
          fraudAlerts: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as AttendanceSession;

        setSessions([...sessions, session]);
        onSessionCreate?.(session);
      } else if (isEditing && selectedSession) {
        const updatedSession = { ...selectedSession, ...newSession };
        setSessions(
          sessions.map((s) =>
            s.id === selectedSession.id ? updatedSession : s,
          ),
        );
        onSessionUpdate?.(selectedSession.id, newSession);
      }

      setIsCreating(false);
      setIsEditing(false);
      setShowCreateDialog(false);
      setNewSession({
        courseId: 0,
        title: "",
        description: "",
        startTime: new Date(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        location: {
          latitude: 0,
          longitude: 0,
          radius: 50,
          name: "",
        },
        security: {
          isLocationRequired: true,
          isPhotoRequired: false,
          isDeviceCheckRequired: true,
          fraudDetectionEnabled: true,
          gracePeriod: 5,
          maxAttempts: 3,
          riskThreshold: 70,
        },
      });
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  };

  const handleCancelEdit = () => {
    setIsCreating(false);
    setIsEditing(false);
    setShowCreateDialog(false);
    setNewSession({
      courseId: 0,
      title: "",
      description: "",
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      location: {
        latitude: 0,
        longitude: 0,
        radius: 50,
        name: "",
      },
      security: {
        isLocationRequired: true,
        isPhotoRequired: false,
        isDeviceCheckRequired: true,
        fraudDetectionEnabled: true,
        gracePeriod: 5,
        maxAttempts: 3,
        riskThreshold: 70,
      },
    });
  };

  const handleEditSession = (session: AttendanceSession) => {
    setSelectedSession(session);
    // Close other dialogs first
    setShowMonitoringDialog(false);
    // Open create/edit dialog
    setIsEditing(true);
    setShowCreateDialog(true);
    setNewSession(session);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (confirm("Are you sure you want to delete this session?")) {
      setSessions(sessions.filter((s) => s.id !== sessionId));
      onSessionDelete?.(sessionId);
    }
  };

  const handleStartSession = (sessionId: string) => {
    setSessions(
      sessions.map((s) =>
        s.id === sessionId ? { ...s, status: "ACTIVE" as const } : s,
      ),
    );
    onSessionStart?.(sessionId);
  };

  const handlePauseSession = (sessionId: string) => {
    setSessions(
      sessions.map((s) =>
        s.id === sessionId ? { ...s, status: "PAUSED" as const } : s,
      ),
    );
    onSessionPause?.(sessionId);
  };

  const handleSquareSession = (sessionId: string) => {
    setSessions(
      sessions.map((s) =>
        s.id === sessionId ? { ...s, status: "ENDED" as const } : s,
      ),
    );
    onSessionSquare?.(sessionId);
  };

  const handleEmergencySquare = (sessionId: string) => {
    if (
      confirm(
        "Are you sure you want to emergency Square this session? This action cannot be undone.",
      )
    ) {
      setSessions(
        sessions.map((s) =>
          s.id === sessionId ? { ...s, status: "CANCELLED" as const } : s,
        ),
      );
      onEmergencySquare?.(sessionId);
    }
  };

  const handleMonitorSession = (session: AttendanceSession) => {
    setSelectedSession(session);
    // Close other dialogs first
    setShowCreateDialog(false);
    setIsCreating(false);
    setIsEditing(false);
    // Open monitor dialog
    setShowMonitoringDialog(true);
    if (session.status === "ACTIVE") {
      loadSessionStats(session.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500";
      case "SCHEDULED":
        return "bg-blue-500";
      case "PAUSED":
        return "bg-yellow-500";
      case "ENDED":
        return "bg-gray-500";
      case "CANCELLED":
        return "bg-red-500";
      case "DRAFT":
        return "bg-gray-400";
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
      case "PAUSED":
        return "Paused";
      case "ENDED":
        return "Ended";
      case "CANCELLED":
        return "Cancelled";
      case "DRAFT":
        return "Draft";
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Attendance Session Manager</h2>
          <p className="text-muted-foreground">
            Manage attendance sessions with advanced security and monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleCreateSession}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Session</span>
          </Button>
          <Button variant="outline" onClick={loadSessions}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Create/Edit Session Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            handleCancelEdit();
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? "Create New Session" : "Edit Session"}
            </DialogTitle>
            <DialogDescription>
              Configure attendance session with security settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="courseId">Course</label>
                  <Select
                    value={newSession.courseId?.toString() || ""}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setNewSession({
                        ...newSession,
                        courseId: parseInt(e.target.value),
                      })
                    }
                  >
                    {/* Native select options */}
                    <SelectItem value="">Select course</SelectItem>
                    <SelectItem value="101">
                      CS 101 - Computer Science
                    </SelectItem>
                    <SelectItem value="102">MATH 201 - Mathematics</SelectItem>
                    <SelectItem value="103">PHYS 301 - Physics</SelectItem>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="title">Session Title</label>
                  <Input
                    id="title"
                    value={newSession.title || ""}
                    onChange={(e) =>
                      setNewSession({ ...newSession, title: e.target.value })
                    }
                    placeholder="Enter session title"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description">Description</label>
                <Textarea
                  id="description"
                  value={newSession.description || ""}
                  onChange={(e) =>
                    setNewSession({
                      ...newSession,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter session description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="startTime">Start Time</label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={
                      newSession.startTime
                        ? newSession.startTime.toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        startTime: new Date(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="endTime">End Time</label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={
                      newSession.endTime
                        ? newSession.endTime.toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        endTime: new Date(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Location Settings */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Location Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="locationName">Location Name</label>
                  <Input
                    id="locationName"
                    value={newSession.location?.name || ""}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        location: {
                          ...newSession.location!,
                          name: e.target.value,
                        },
                      })
                    }
                    placeholder="Enter location name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="radius">Radius (meters)</label>
                  <Input
                    id="radius"
                    type="number"
                    value={newSession.location?.radius || 50}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        location: {
                          ...newSession.location!,
                          radius: parseInt(e.target.value),
                        },
                      })
                    }
                    placeholder="50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="latitude">Latitude</label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={newSession.location?.latitude || 0}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        location: {
                          ...newSession.location!,
                          latitude: parseFloat(e.target.value),
                        },
                      })
                    }
                    placeholder="40.7128"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="longitude">Longitude</label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={newSession.location?.longitude || 0}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        location: {
                          ...newSession.location!,
                          longitude: parseFloat(e.target.value),
                        },
                      })
                    }
                    placeholder="-74.0060"
                  />
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Security Settings</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <label htmlFor="locationRequired">Location Required</label>
                  </div>
                  <Switch
                    id="locationRequired"
                    checked={newSession.security?.isLocationRequired || false}
                    onCheckedChange={(checked) =>
                      setNewSession({
                        ...newSession,
                        security: {
                          ...newSession.security!,
                          isLocationRequired: checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Camera className="h-4 w-4" />
                    <label htmlFor="photoRequired">Photo Required</label>
                  </div>
                  <Switch
                    id="photoRequired"
                    checked={newSession.security?.isPhotoRequired || false}
                    onCheckedChange={(checked) =>
                      setNewSession({
                        ...newSession,
                        security: {
                          ...newSession.security!,
                          isPhotoRequired: checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4" />
                    <label htmlFor="deviceCheckRequired">
                      Device Check Required
                    </label>
                  </div>
                  <Switch
                    id="deviceCheckRequired"
                    checked={
                      newSession.security?.isDeviceCheckRequired || false
                    }
                    onCheckedChange={(checked) =>
                      setNewSession({
                        ...newSession,
                        security: {
                          ...newSession.security!,
                          isDeviceCheckRequired: checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <label htmlFor="fraudDetectionEnabled">
                      Fraud Detection Enabled
                    </label>
                  </div>
                  <Switch
                    id="fraudDetectionEnabled"
                    checked={
                      newSession.security?.fraudDetectionEnabled || false
                    }
                    onCheckedChange={(checked) =>
                      setNewSession({
                        ...newSession,
                        security: {
                          ...newSession.security!,
                          fraudDetectionEnabled: checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="gracePeriod">Grace Period (minutes)</label>
                  <Input
                    id="gracePeriod"
                    type="number"
                    value={newSession.security?.gracePeriod || 5}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        security: {
                          ...newSession.security!,
                          gracePeriod: parseInt(e.target.value),
                        },
                      })
                    }
                    placeholder="5"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="maxAttempts">Max Attempts</label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    value={newSession.security?.maxAttempts || 3}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        security: {
                          ...newSession.security!,
                          maxAttempts: parseInt(e.target.value),
                        },
                      })
                    }
                    placeholder="3"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="riskThreshold">Risk Threshold</label>
                  <Slider
                    id="riskThreshold"
                    value={[newSession.security?.riskThreshold || 70]}
                    onValueChange={(value) =>
                      setNewSession({
                        ...newSession,
                        security: {
                          ...newSession.security!,
                          riskThreshold: value[0],
                        },
                      })
                    }
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground">
                    {newSession.security?.riskThreshold || 70}% (Higher = More
                    Sensitive)
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2">
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveSession}>
                <Save className="h-4 w-4 mr-2" />
                {isCreating ? "Create Session" : "Update Session"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sessions List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <Card key={session.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(session.status)}>
                    {getStatusText(session.status)}
                  </Badge>
                  <span className="font-medium">{session.courseName}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditSession(session)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSession(session.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-lg">{session.title}</CardTitle>
              {session.description && (
                <CardDescription>{session.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Session Info */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(session.startTime).toLocaleString()} -{" "}
                    {new Date(session.endTime).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{session.location.name}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{session.totalStudents} students</span>
                </div>
              </div>

              {/* Attendance Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Attendance</span>
                  <span className="text-sm text-muted-foreground">
                    {session.presentStudents}/{session.totalStudents} (
                    {getAttendanceProgress(session).toFixed(1)}%)
                  </span>
                </div>
                <Progress
                  value={getAttendanceProgress(session)}
                  className="h-2"
                />
              </div>

              {/* Security Features */}
              <div className="flex flex-wrap gap-1">
                {session.security.isLocationRequired && (
                  <Badge variant="outline" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    Location
                  </Badge>
                )}
                {session.security.isPhotoRequired && (
                  <Badge variant="outline" className="text-xs">
                    <Camera className="h-3 w-3 mr-1" />
                    Photo
                  </Badge>
                )}
                {session.security.isDeviceCheckRequired && (
                  <Badge variant="outline" className="text-xs">
                    <Smartphone className="h-3 w-3 mr-1" />
                    Device
                  </Badge>
                )}
                {session.security.fraudDetectionEnabled && (
                  <Badge variant="outline" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Fraud Detection
                  </Badge>
                )}
              </div>

              {/* Fraud Alerts */}
              {session.fraudAlerts > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>{session.fraudAlerts} fraud alerts</strong> detected
                  </AlertDescription>
                </Alert>
              )}

              {/* Session Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center space-x-2">
                  {session.status === "DRAFT" && (
                    <Button
                      size="sm"
                      onClick={() => handleStartSession(session.id)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                  )}
                  {session.status === "ACTIVE" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePauseSession(session.id)}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSquareSession(session.id)}
                      >
                        <Square className="h-4 w-4 mr-1" />
                        Square
                      </Button>
                    </>
                  )}
                  {session.status === "PAUSED" && (
                    <Button
                      size="sm"
                      onClick={() => handleStartSession(session.id)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMonitorSession(session)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {session.status === "ACTIVE" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleEmergencySquare(session.id)}
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Session Monitoring Dialog */}
      <Dialog
        open={showMonitoringDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowMonitoringDialog(false);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session Monitoring</DialogTitle>
            <DialogDescription>
              Real-time monitoring for {selectedSession?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-6">
              {/* Session Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(selectedSession.status)}>
                    {getStatusText(selectedSession.status)}
                  </Badge>
                  <span className="font-medium">
                    {selectedSession.courseName}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {getTimeRemaining(selectedSession.endTime)}
                </div>
              </div>

              {/* Real-time Stats */}
              {sessionStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {sessionStats.totalAttempts}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Attempts
                    </div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {sessionStats.successfulAttempts}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Successful
                    </div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {sessionStats.fraudDetected}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Fraud Detected
                    </div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {sessionStats.averageResponseTime}s
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Avg Response
                    </div>
                  </div>
                </div>
              )}

              {/* Security Alerts */}
              {selectedSession.fraudAlerts > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>
                      {selectedSession.fraudAlerts} security alerts
                    </strong>{" "}
                    require attention
                  </AlertDescription>
                </Alert>
              )}

              {/* Session Controls */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Session ID: {selectedSession.id}
                </div>
                <div className="flex items-center space-x-2">
                  {selectedSession.status === "ACTIVE" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePauseSession(selectedSession.id)}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSquareSession(selectedSession.id)}
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Square
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          handleEmergencySquare(selectedSession.id)
                        }
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Emergency Square
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
