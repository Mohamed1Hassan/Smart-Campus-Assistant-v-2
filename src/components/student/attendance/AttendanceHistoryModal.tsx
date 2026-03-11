"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  History,
  MapPin,
  Smartphone,
  Camera,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Download,
  Search,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectItem } from "@/components/ui/select";

interface AttendanceRecord {
  id: string;
  sessionId: string;
  courseName: string;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
    isVerified: boolean;
    distance?: number;
    isWithinRadius: boolean;
  };
  device: {
    fingerprint: string;
    deviceInfo: string;
    isVerified: boolean;
    isNewDevice: boolean;
    lastUsed: Date;
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  };
  photo?: {
    url: string;
    timestamp: Date;
    quality: number;
    hasFace: boolean;
    isVerified: boolean;
    metadata?: Record<string, unknown>;
  };
  securityScore: number;
  fraudWarnings: string[];
  status: "SUCCESS" | "FAILED" | "PENDING" | "REVIEW";
}

interface AttendanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AttendanceRecord[];
}

export function AttendanceHistoryModal({
  isOpen,
  onClose,
  records,
}: AttendanceHistoryModalProps) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCourse, setFilterCourse] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(
    null,
  );

  const filteredRecords = records.filter((record) => {
    const matchesStatus =
      filterStatus === "all" || record.status === filterStatus;
    const matchesCourse =
      filterCourse === "all" || record.courseName === filterCourse;
    const matchesSearch =
      searchQuery === "" ||
      record.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.sessionId.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesCourse && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "REVIEW":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-500";
      case "FAILED":
        return "bg-red-500";
      case "PENDING":
        return "bg-yellow-500";
      case "REVIEW":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
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

  const handleExportData = () => {
    // Export attendance history data
    const data = filteredRecords.map((record) => ({
      id: record.id,
      courseName: record.courseName,
      timestamp: record.timestamp.toISOString(),
      status: record.status,
      securityScore: record.securityScore,
      location: record.location,
      device: record.device,
      fraudWarnings: record.fraudWarnings,
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance-history.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Attendance History</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search attendance records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-md w-full"
                />
              </div>
            </div>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="SUCCESS">Success</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="REVIEW">Review</SelectItem>
            </Select>
            <Select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
            >
              <SelectItem value="all">All Courses</SelectItem>
              <SelectItem value="Computer Science 101">
                Computer Science 101
              </SelectItem>
              <SelectItem value="Mathematics 201">Mathematics 201</SelectItem>
              <SelectItem value="Physics 301">Physics 301</SelectItem>
            </Select>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Records List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Attendance Records ({filteredRecords.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredRecords.map((record) => (
                  <Card
                    key={record.id}
                    className={`cursor-pointer transition-colors ${
                      selectedRecord?.id === record.id
                        ? "border-blue-500 bg-blue-50"
                        : "hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedRecord(record)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(record.status)}
                          <span className="font-medium">
                            {record.courseName}
                          </span>
                        </div>
                        <Badge className={getStatusBadge(record.status)}>
                          {record.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {record.timestamp.toLocaleString()}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <Shield className="h-3 w-3 text-blue-600" />
                            <span>{record.securityScore || 0}%</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-green-600" />
                            <span>{record.location?.accuracy || 0}m</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Smartphone className="h-3 w-3 text-purple-600" />
                            <span>{record.device?.riskLevel || "Unknown"}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Record Details */}
            {selectedRecord && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Record Details</h3>

                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Course</span>
                        <span className="text-sm">
                          {selectedRecord.courseName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Timestamp</span>
                        <span className="text-sm">
                          {selectedRecord.timestamp.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status</span>
                        <Badge
                          className={getStatusBadge(selectedRecord.status)}
                        >
                          {selectedRecord.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Security Score
                        </span>
                        <div className="flex items-center space-x-2">
                          <Progress
                            value={selectedRecord.securityScore || 0}
                            className="w-20 h-2"
                          />
                          <span className="text-sm">
                            {selectedRecord.securityScore || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Location Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Location</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Latitude</span>
                        <span className="text-sm">
                          {selectedRecord.location?.latitude?.toFixed(6) ||
                            "0.000000"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Longitude</span>
                        <span className="text-sm">
                          {selectedRecord.location?.longitude?.toFixed(6) ||
                            "0.000000"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Accuracy</span>
                        <span className="text-sm">
                          {selectedRecord.location?.accuracy || 0}m
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Verified</span>
                        <Badge
                          className={
                            selectedRecord.location?.isVerified
                              ? "bg-green-500"
                              : "bg-red-500"
                          }
                        >
                          {selectedRecord.location?.isVerified ? "Yes" : "No"}
                        </Badge>
                      </div>
                      {selectedRecord.location?.distance && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Distance</span>
                          <span className="text-sm">
                            {selectedRecord.location.distance}m
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Device Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center space-x-2">
                      <Smartphone className="h-4 w-4" />
                      <span>Device</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Fingerprint</span>
                        <span className="text-sm font-mono">
                          {selectedRecord.device?.fingerprint || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Device Info</span>
                        <span className="text-sm">
                          {selectedRecord.device?.deviceInfo || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Verified</span>
                        <Badge
                          className={
                            selectedRecord.device?.isVerified
                              ? "bg-green-500"
                              : "bg-red-500"
                          }
                        >
                          {selectedRecord.device?.isVerified ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Risk Level</span>
                        <Badge
                          className={getRiskBadge(
                            selectedRecord.device?.riskLevel || "UNKNOWN",
                          )}
                        >
                          {selectedRecord.device?.riskLevel || "UNKNOWN"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">New Device</span>
                        <Badge
                          className={
                            selectedRecord.device?.isNewDevice
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }
                        >
                          {selectedRecord.device?.isNewDevice ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Photo Info */}
                {selectedRecord.photo && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center space-x-2">
                        <Camera className="h-4 w-4" />
                        <span>Photo</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Quality</span>
                          <span className="text-sm">
                            {selectedRecord.photo.quality}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Face Detected
                          </span>
                          <Badge
                            className={
                              selectedRecord.photo.hasFace
                                ? "bg-green-500"
                                : "bg-red-500"
                            }
                          >
                            {selectedRecord.photo.hasFace ? "Yes" : "No"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Verified</span>
                          <Badge
                            className={
                              selectedRecord.photo.isVerified
                                ? "bg-green-500"
                                : "bg-red-500"
                            }
                          >
                            {selectedRecord.photo.isVerified ? "Yes" : "No"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Timestamp</span>
                          <span className="text-sm">
                            {selectedRecord.photo.timestamp.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Fraud Warnings */}
                {selectedRecord.fraudWarnings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span>Fraud Warnings</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedRecord.fraudWarnings.map((warning, index) => (
                          <div
                            key={index}
                            className="text-sm text-orange-600 bg-orange-50 p-2 rounded"
                          >
                            {warning}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {filteredRecords.length} of {records.length} records
          </div>
          <Button onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
