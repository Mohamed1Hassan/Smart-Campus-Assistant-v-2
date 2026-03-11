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
  Users,
  MapPin,
  Clock,
  Shield,
  AlertTriangle,
  Search,
  Eye,
  User,
  Navigation,
  Camera,
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

interface StudentTrackingProps {
  students: StudentAttendance[];
  onStudentClick: (studentId: number) => void;
}

export function StudentTracking({
  students,
  onStudentClick,
}: StudentTrackingProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] =
    useState<StudentAttendance | null>(null);

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
        return "Check";
      case "LATE":
        return "Clock";
      case "ABSENT":
        return "X";
      case "EXCUSED":
        return "Info";
      default:
        return "HelpCircle";
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

  const handleStudentSelect = (student: StudentAttendance) => {
    setSelectedStudent(student);
    onStudentClick(student.id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Student Tracking</span>
        </CardTitle>
        <CardDescription>
          Real-time student location and attendance tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>

        {/* Students List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-2" />
                <p>No students found</p>
                <p className="text-sm">Try adjusting your search</p>
              </div>
            </div>
          ) : (
            filteredStudents.map((student) => (
              <div
                key={student.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedStudent?.id === student.id
                    ? "bg-blue-50 border-blue-200"
                    : ""
                }`}
                onClick={() => handleStudentSelect(student)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-lg">
                      {getStatusIcon(student.status)}
                    </div>
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {student.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(student.status)}>
                      {student.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{getTimeAgo(student.timestamp)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {student.location.latitude.toFixed(4)},{" "}
                      {student.location.longitude.toFixed(4)}
                    </span>
                  </div>
                </div>

                {student.fraudScore > 70 && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <div className="flex items-center space-x-2 text-red-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">High Risk</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Selected Student Details */}
        {selectedStudent && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Student Details</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Name</div>
                  <div className="font-medium">{selectedStudent.name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Email</div>
                  <div className="font-medium">{selectedStudent.email}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(selectedStudent.status)}>
                      {selectedStudent.status}
                    </Badge>
                    <span>{getTimeAgo(selectedStudent.timestamp)}</span>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Risk Score</div>
                  <div
                    className={`font-medium ${getFraudScoreColor(selectedStudent.fraudScore)}`}
                  >
                    {selectedStudent.fraudScore}/100
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Location</div>
                  <div className="font-medium">
                    {selectedStudent.location.latitude.toFixed(6)},{" "}
                    {selectedStudent.location.longitude.toFixed(6)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Accuracy: {selectedStudent.location.accuracy}m
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Device</div>
                  <div className="font-medium">
                    {selectedStudent.deviceFingerprint.substring(0, 12)}...
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Attempts: {selectedStudent.attempts}
                  </div>
                </div>
              </div>

              {selectedStudent.photoUrl && (
                <div className="flex items-center space-x-2 text-sm">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <span>Photo verification completed</span>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Navigation className="h-4 w-4 mr-2" />
                  View on Map
                </Button>
                <Button variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Security Details
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {students.filter((s) => s.status === "PRESENT").length}
            </div>
            <div className="text-sm text-muted-foreground">Present</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {students.filter((s) => s.status === "LATE").length}
            </div>
            <div className="text-sm text-muted-foreground">Late</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {students.filter((s) => s.fraudScore > 70).length}
            </div>
            <div className="text-sm text-muted-foreground">High Risk</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
