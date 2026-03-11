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
import {
  Smartphone,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  SmartphoneIcon,
  Laptop,
  Tablet,
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

interface DeviceVerificationProps {
  students: StudentAttendance[];
  onDeviceClick: (deviceId: string) => void;
}

export function DeviceVerification({
  students,
  onDeviceClick,
}: DeviceVerificationProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [deviceFilter, setDeviceFilter] = useState<string>("all");

  // Group students by device fingerprint
  const deviceGroups = students.reduce(
    (groups, student) => {
      const fingerprint = student.deviceFingerprint;
      if (!groups[fingerprint]) {
        groups[fingerprint] = [];
      }
      groups[fingerprint].push(student);
      return groups;
    },
    {} as Record<string, StudentAttendance[]>,
  );

  const filteredDevices = Object.entries(deviceGroups).filter(
    ([, students]) => {
      const matchesSearch = students.some(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email.toLowerCase().includes(searchTerm.toLowerCase()),
      );

      let matchesFilter = true;
      if (deviceFilter === "suspicious") {
        matchesFilter = students.some((student) => student.fraudScore > 70);
      } else if (deviceFilter === "verified") {
        matchesFilter = students.every((student) => student.fraudScore < 30);
      }

      return matchesSearch && matchesFilter;
    },
  );

  const getDeviceIcon = (fingerprint: string) => {
    // Simple heuristic based on fingerprint
    const hash = fingerprint.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    const deviceType = Math.abs(hash) % 3;
    switch (deviceType) {
      case 0:
        return <Smartphone className="h-4 w-4" />;
      case 1:
        return <Laptop className="h-4 w-4" />;
      case 2:
        return <Tablet className="h-4 w-4" />;
      default:
        return <SmartphoneIcon className="h-4 w-4" />;
    }
  };

  const getDeviceStatus = (students: StudentAttendance[]) => {
    const fraudScores = students.map((s) => s.fraudScore);
    const avgFraudScore =
      fraudScores.reduce((a, b) => a + b, 0) / fraudScores.length;

    if (avgFraudScore > 80)
      return { status: "CRITICAL", color: "bg-red-500", icon: XCircle };
    if (avgFraudScore > 60)
      return { status: "HIGH", color: "bg-orange-500", icon: AlertTriangle };
    if (avgFraudScore > 40)
      return { status: "MEDIUM", color: "bg-yellow-500", icon: AlertTriangle };
    return { status: "LOW", color: "bg-green-500", icon: CheckCircle };
  };

  const getDeviceType = (fingerprint: string) => {
    // Simple heuristic based on fingerprint
    const hash = fingerprint.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    const deviceType = Math.abs(hash) % 3;
    switch (deviceType) {
      case 0:
        return "Mobile";
      case 1:
        return "Desktop";
      case 2:
        return "Tablet";
      default:
        return "Unknown";
    }
  };

  const handleDeviceSelect = (fingerprint: string) => {
    setSelectedDevice(fingerprint);
    onDeviceClick(fingerprint);
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

  const totalDevices = Object.keys(deviceGroups).length;
  const suspiciousDevices = filteredDevices.filter(([, students]) =>
    students.some((student) => student.fraudScore > 70),
  ).length;
  const verifiedDevices = filteredDevices.filter(([, students]) =>
    students.every((student) => student.fraudScore < 30),
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Smartphone className="h-5 w-5" />
          <span>Device Verification</span>
        </CardTitle>
        <CardDescription>
          Monitor device fingerprints and detect suspicious activity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search devices or students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={deviceFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setDeviceFilter("all")}
          >
            All ({totalDevices})
          </Button>
          <Button
            variant={deviceFilter === "suspicious" ? "default" : "outline"}
            size="sm"
            onClick={() => setDeviceFilter("suspicious")}
          >
            Suspicious ({suspiciousDevices})
          </Button>
          <Button
            variant={deviceFilter === "verified" ? "default" : "outline"}
            size="sm"
            onClick={() => setDeviceFilter("verified")}
          >
            Verified ({verifiedDevices})
          </Button>
        </div>

        {/* Devices List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredDevices.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                <Smartphone className="h-12 w-12 mx-auto mb-2" />
                <p>No devices found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            </div>
          ) : (
            filteredDevices.map(([fingerprint, students]) => {
              const deviceStatus = getDeviceStatus(students);
              const deviceType = getDeviceType(fingerprint);
              const isSelected = selectedDevice === fingerprint;

              return (
                <div
                  key={fingerprint}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    isSelected ? "bg-blue-50 border-blue-200" : ""
                  }`}
                  onClick={() => handleDeviceSelect(fingerprint)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg">
                        {getDeviceIcon(fingerprint)}
                      </div>
                      <div>
                        <div className="font-medium">
                          {fingerprint.substring(0, 12)}...
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {deviceType} 锟?{students.length} user
                          {students.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={deviceStatus.color}>
                        {deviceStatus.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Avg Risk:{" "}
                        {Math.round(
                          students.reduce((sum, s) => sum + s.fraudScore, 0) /
                            students.length,
                        )}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-muted-foreground">Last seen:</div>
                      <span>{getTimeAgo(students[0].timestamp)}</span>
                    </div>
                  </div>

                  {students.length > 1 && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center space-x-2 text-yellow-800">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Multiple Users
                        </span>
                      </div>
                      <div className="text-xs text-yellow-700 mt-1">
                        This device is being used by {students.length} different
                        users
                      </div>
                    </div>
                  )}

                  {deviceStatus.status === "CRITICAL" && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <div className="flex items-center space-x-2 text-red-800">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Critical Risk
                        </span>
                      </div>
                      <div className="text-xs text-red-700 mt-1">
                        This device has been flagged for suspicious activity
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Selected Device Details */}
        {selectedDevice && deviceGroups[selectedDevice] && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Device Details</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Device ID</div>
                  <div className="font-medium font-mono">{selectedDevice}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Device Type</div>
                  <div className="font-medium">
                    {getDeviceType(selectedDevice)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Users</div>
                  <div className="font-medium">
                    {deviceGroups[selectedDevice].length}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Average Risk</div>
                  <div className="font-medium">
                    {Math.round(
                      deviceGroups[selectedDevice].reduce(
                        (sum, s) => sum + s.fraudScore,
                        0,
                      ) / deviceGroups[selectedDevice].length,
                    )}
                    /100
                  </div>
                </div>
              </div>

              <div>
                <div className="text-muted-foreground mb-2">
                  Associated Users
                </div>
                <div className="space-y-1">
                  {deviceGroups[selectedDevice].map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {student.email}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getDeviceStatus([student]).color}>
                          {getDeviceStatus([student]).status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {getTimeAgo(student.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Security Details
                </Button>
                <Button variant="outline" size="sm">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Flag Device
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {totalDevices}
            </div>
            <div className="text-sm text-muted-foreground">Total Devices</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {suspiciousDevices}
            </div>
            <div className="text-sm text-muted-foreground">Suspicious</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {verifiedDevices}
            </div>
            <div className="text-sm text-muted-foreground">Verified</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
