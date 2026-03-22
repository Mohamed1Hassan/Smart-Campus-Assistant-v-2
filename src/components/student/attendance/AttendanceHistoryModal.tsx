/* eslint-disable @typescript-eslint/no-unused-vars */
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
  ChevronRight,
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
        return "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-sm";
      case "FAILED":
        return "bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800 shadow-sm";
      case "PENDING":
        return "bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shadow-sm";
      case "REVIEW":
        return "bg-orange-100/80 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800 shadow-sm";
      default:
        return "bg-gray-100/80 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400 border border-gray-200 dark:border-gray-700 shadow-sm";
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case "LOW":
        return "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-sm";
      case "MEDIUM":
        return "bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shadow-sm";
      case "HIGH":
        return "bg-orange-100/80 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800 shadow-sm";
      case "CRITICAL":
        return "bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800 shadow-sm";
      default:
        return "bg-gray-100/80 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400 border border-gray-200 dark:border-gray-700 shadow-sm";
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/20 dark:border-gray-700/50 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800/50 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/10 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-900/30">
              <History className="h-6 w-6 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400">
              Attendance History
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full w-10 h-10 p-0 flex items-center justify-center hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-800/30 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search attendance records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl w-full focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
            <div className="flex flex-row items-center gap-3 w-full sm:w-auto">
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
                <SelectItem value="Computer Science 101">CS 101</SelectItem>
                <SelectItem value="Mathematics 201">Math 201</SelectItem>
                <SelectItem value="Physics 301">Physics 301</SelectItem>
              </Select>
              <Button variant="outline" onClick={handleExportData} className="rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 shadow-sm">
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0 bg-gray-50/30 dark:bg-transparent">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Records List */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center justify-between">
                <span>Records History</span>
                <span className="text-sm font-medium px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                  {filteredRecords.length}
                </span>
              </h3>
              <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar pb-6">
                {filteredRecords.map((record) => (
                  <div
                    key={record.id}
                    className={`group cursor-pointer transition-all duration-300 p-4 sm:p-5 rounded-2xl border ${
                      selectedRecord?.id === record.id
                        ? "border-blue-400 dark:border-blue-500/50 bg-blue-50/50 dark:bg-blue-900/20 shadow-md transform scale-[1.02]"
                        : "border-transparent hover:border-gray-200 dark:hover:border-gray-700 bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg hover:-translate-y-1"
                    }`}
                    onClick={() => setSelectedRecord(record)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-xl shadow-sm ${selectedRecord?.id === record.id ? 'bg-blue-100 dark:bg-blue-800/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                          {getStatusIcon(record.status)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {record.courseName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {record.timestamp.toLocaleString(undefined, {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`font-bold rounded-lg border-transparent px-2.5 py-0.5 ${getStatusBadge(record.status)}`}>
                        {record.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-4 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-900/30">
                      <div className="flex items-center space-x-4 sm:space-x-6 text-sm font-medium">
                        <div className="flex items-center space-x-1.5 text-gray-600 dark:text-gray-300">
                          <Shield className="h-4 w-4 text-blue-500" />
                          <span>{record.securityScore}%</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-gray-600 dark:text-gray-300">
                          <MapPin className="h-4 w-4 text-green-500" />
                          <span>{record.location?.accuracy || 0}m</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-gray-600 dark:text-gray-300">
                          <Smartphone className="h-4 w-4 text-purple-500" />
                          <span>{record.device?.riskLevel || "Unknown"}</span>
                        </div>
                      </div>
                      <ChevronRight className={`h-5 w-5 transition-colors ${selectedRecord?.id === record.id ? "text-blue-500" : "text-gray-300 dark:text-gray-600 group-hover:text-blue-400"}`} />
                    </div>
                  </div>
                ))}
                {filteredRecords.length === 0 && (
                  <div className="text-center p-8 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">No records found matching your criteria.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Record Details */}
            <div className="lg:pl-6 lg:border-l border-gray-200 dark:border-gray-800 flex flex-col h-full">
              {selectedRecord ? (
                <div className="space-y-6 pb-6 pr-2 overflow-y-auto custom-scrollbar">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">Record Details</h3>
                    <Badge variant="outline" className={`font-bold rounded-lg border-transparent px-3 py-1 text-sm ${getStatusBadge(selectedRecord.status)}`}>
                      {selectedRecord.status}
                    </Badge>
                  </div>

                  {/* Basic Info */}
                  <div className="bg-white/60 dark:bg-gray-800/60 p-5 rounded-2xl border border-white/40 dark:border-gray-700 shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                        <History className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white">Basic Information</h4>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                        <p className="text-xs text-gray-500 font-medium mb-1">Course Name</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{selectedRecord.courseName}</p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                        <p className="text-xs text-gray-500 font-medium mb-1">Timestamp</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{selectedRecord.timestamp.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl sm:col-span-2 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">Security Score</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{selectedRecord.securityScore}%</p>
                        </div>
                        <div className="w-24">
                          <Progress
                            value={selectedRecord.securityScore || 0}
                            className="h-2.5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Multiple Context Infos (Location & Device) */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Location Info */}
                    <div className="bg-white/60 dark:bg-gray-800/60 p-5 rounded-2xl border border-white/40 dark:border-gray-700 shadow-sm backdrop-blur-md">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white">Location</h4>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                          <span className="text-gray-500">Verified</span>
                          <span className={`font-bold ${selectedRecord.location?.isVerified ? "text-green-600" : "text-red-500"}`}>{selectedRecord.location?.isVerified ? "Yes" : "No"}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                          <span className="text-gray-500">Distance</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-200">{selectedRecord.location?.distance ? `${selectedRecord.location.distance}m` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-gray-500">Coordinates</span>
                          <span className="font-mono text-xs text-gray-900 dark:text-gray-300">
                            {selectedRecord.location?.latitude?.toFixed(4)}, {selectedRecord.location?.longitude?.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Device Info */}
                    <div className="bg-white/60 dark:bg-gray-800/60 p-5 rounded-2xl border border-white/40 dark:border-gray-700 shadow-sm backdrop-blur-md">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white">Device</h4>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                          <span className="text-gray-500">Verified</span>
                          <span className={`font-bold ${selectedRecord.device?.isVerified ? "text-green-600" : "text-red-500"}`}>{selectedRecord.device?.isVerified ? "Yes" : "No"}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                          <span className="text-gray-500">Risk Level</span>
                          <Badge variant="outline" className={`border-transparent px-2 py-0 min-h-0 text-[10px] ${getRiskBadge(selectedRecord.device?.riskLevel || "UNKNOWN")}`}>
                            {selectedRecord.device?.riskLevel || "UNKNOWN"}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-gray-500">New Device</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-200">{selectedRecord.device?.isNewDevice ? "Yes" : "No"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Photo Info */}
                  {selectedRecord.photo && (
                    <div className="bg-white/60 dark:bg-gray-800/60 p-5 rounded-2xl border border-white/40 dark:border-gray-700 shadow-sm backdrop-blur-md">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                          <Camera className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white">Photo Verification</h4>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                           <span className="text-sm text-gray-500">Face Detected</span>
                           <span className={`font-bold text-sm ${selectedRecord.photo.hasFace ? "text-green-600" : "text-red-500"}`}>{selectedRecord.photo.hasFace ? "Yes" : "No"}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                           <span className="text-sm text-gray-500">Quality</span>
                           <span className="font-bold text-sm text-gray-900 dark:text-gray-200">{selectedRecord.photo.quality}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fraud Warnings */}
                  {selectedRecord.fraudWarnings && selectedRecord.fraudWarnings.length > 0 && (
                    <div className="bg-orange-50/80 dark:bg-orange-900/20 p-5 rounded-2xl border border-orange-200 dark:border-orange-800 shadow-sm backdrop-blur-md">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-lg">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-orange-900 dark:text-orange-200">Alerts & Warnings</h4>
                      </div>
                      <div className="space-y-2">
                        {selectedRecord.fraudWarnings.map((warning, index) => (
                          <div
                            key={index}
                            className="text-sm font-medium text-orange-800 dark:text-orange-300 bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-orange-100 dark:border-orange-800/50"
                          >
                            • {warning}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-50">
                  <Eye className="w-16 h-16 text-gray-400 mb-4" strokeWidth={1} />
                  <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-2">No Record Selected</h3>
                  <p className="text-sm text-gray-400">Select a record from the list to view its complete verification details.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/40 flex-shrink-0">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800/50 px-3 py-1.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
            Showing <span className="text-gray-900 dark:text-white font-bold">{filteredRecords.length}</span> of {records.length} records
          </div>
          <Button onClick={onClose} className="w-full sm:w-auto rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 font-bold">Close Window</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
