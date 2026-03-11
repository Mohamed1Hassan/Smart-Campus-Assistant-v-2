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
import { Input } from "../../ui/input";

import { Textarea } from "../../ui/textarea";
import { Switch } from "../../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Shield,
  Camera,
  Smartphone,
  AlertTriangle,
  Users,
  Calendar,
  Save,
  X,
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

interface SessionManagementProps {
  sessions: AttendanceSession[];

  onEditSession: (sessionId: string) => void;
  onCreateSession?: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export function SessionManagement({
  sessions,
  onEditSession,
  onDeleteSession,
}: SessionManagementProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newSession, setNewSession] = useState({
    courseId: "",
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: {
      name: "",
      latitude: "",
      longitude: "",
      radius: "50",
    },
    security: {
      isLocationRequired: true,
      isPhotoRequired: false,
      isDeviceCheckRequired: true,
      fraudDetectionEnabled: true,
      gracePeriod: 5,
    },
  });

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

  const handleCreateSession = () => {
    setIsCreating(true);
    setNewSession({
      courseId: "",
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      location: {
        name: "",
        latitude: "",
        longitude: "",
        radius: "50",
      },
      security: {
        isLocationRequired: true,
        isPhotoRequired: false,
        isDeviceCheckRequired: true,
        fraudDetectionEnabled: true,
        gracePeriod: 5,
      },
    });
  };

  const handleSaveSession = () => {
    // Save session logic
    console.log("Saving session:", newSession);
    setIsCreating(false);
    setNewSession({
      courseId: "",
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      location: {
        name: "",
        latitude: "",
        longitude: "",
        radius: "50",
      },
      security: {
        isLocationRequired: true,
        isPhotoRequired: false,
        isDeviceCheckRequired: true,
        fraudDetectionEnabled: true,
        gracePeriod: 5,
      },
    });
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewSession({
      courseId: "",
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      location: {
        name: "",
        latitude: "",
        longitude: "",
        radius: "50",
      },
      security: {
        isLocationRequired: true,
        isPhotoRequired: false,
        isDeviceCheckRequired: true,
        fraudDetectionEnabled: true,
        gracePeriod: 5,
      },
    });
  };

  const handleEditSession = (sessionId: string) => {
    onEditSession(sessionId);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (confirm("Are you sure you want to delete this session?")) {
      onDeleteSession(sessionId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Session Management</h3>
          <p className="text-sm text-muted-foreground">
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

      {/* Create Session Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Create New Session</span>
            </CardTitle>
            <CardDescription>
              Configure a new attendance session with security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="courseId">Course</label>
                <Select
                  value={newSession.courseId}
                  onChange={(e: string | { target: { value: string } }) =>
                    setNewSession({
                      ...newSession,
                      courseId:
                        typeof e === "string" ? e : e?.target?.value || "",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="101">
                      CS 101 - Computer Science
                    </SelectItem>
                    <SelectItem value="102">MATH 201 - Mathematics</SelectItem>
                    <SelectItem value="103">PHYS 301 - Physics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="title">Session Title</label>
                <Input
                  id="title"
                  value={newSession.title}
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
                value={newSession.description}
                onChange={(e) =>
                  setNewSession({ ...newSession, description: e.target.value })
                }
                placeholder="Enter session description"
                rows={3}
              />
            </div>

            {/* Time Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="startTime">Start Time</label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={newSession.startTime}
                  onChange={(e) =>
                    setNewSession({ ...newSession, startTime: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="endTime">End Time</label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={newSession.endTime}
                  onChange={(e) =>
                    setNewSession({ ...newSession, endTime: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Location Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Location Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="locationName">Location Name</label>
                  <Input
                    id="locationName"
                    value={newSession.location.name}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        location: {
                          ...newSession.location,
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
                    value={newSession.location.radius}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        location: {
                          ...newSession.location,
                          radius: e.target.value,
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
                    value={newSession.location.latitude}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        location: {
                          ...newSession.location,
                          latitude: e.target.value,
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
                    value={newSession.location.longitude}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        location: {
                          ...newSession.location,
                          longitude: e.target.value,
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
              <h4 className="text-sm font-medium">Security Settings</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <label htmlFor="locationRequired">Location Required</label>
                  </div>
                  <Switch
                    id="locationRequired"
                    checked={newSession.security.isLocationRequired}
                    onCheckedChange={(checked) =>
                      setNewSession({
                        ...newSession,
                        security: {
                          ...newSession.security,
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
                    checked={newSession.security.isPhotoRequired}
                    onCheckedChange={(checked) =>
                      setNewSession({
                        ...newSession,
                        security: {
                          ...newSession.security,
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
                    checked={newSession.security.isDeviceCheckRequired}
                    onCheckedChange={(checked) =>
                      setNewSession({
                        ...newSession,
                        security: {
                          ...newSession.security,
                          isDeviceCheckRequired: checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4" />
                    <label htmlFor="fraudDetectionEnabled">
                      Fraud Detection Enabled
                    </label>
                  </div>
                  <Switch
                    id="fraudDetectionEnabled"
                    checked={newSession.security.fraudDetectionEnabled}
                    onCheckedChange={(checked) =>
                      setNewSession({
                        ...newSession,
                        security: {
                          ...newSession.security,
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
                    value={newSession.security.gracePeriod}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        security: {
                          ...newSession.security,
                          gracePeriod: parseInt(e.target.value),
                        },
                      })
                    }
                    placeholder="5"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2">
              <Button variant="outline" onClick={handleCancelCreate}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveSession}>
                <Save className="h-4 w-4 mr-2" />
                Create Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.map((session) => (
          <Card key={session.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
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
                    onClick={() => handleEditSession(session.id)}
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

              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">{session.title}</h4>
                  {session.description && (
                    <p className="text-sm text-muted-foreground">
                      {session.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {new Date(session.startTime).toLocaleDateString()}
                      </div>
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
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {session.presentStudents}/{session.totalStudents}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Present
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{session.fraudAlerts}</div>
                      <div className="text-xs text-muted-foreground">
                        Alerts
                      </div>
                    </div>
                  </div>
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
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Fraud Detection
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    Grace: {session.security.gracePeriod}m
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
