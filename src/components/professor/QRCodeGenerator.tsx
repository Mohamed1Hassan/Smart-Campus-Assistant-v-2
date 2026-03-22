/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  QrCode,
  Download,
  Printer,
  Share2,
  RefreshCw,
  Clock,
  MapPin,
  Shield,
  Users,
  AlertTriangle,
  Camera,
  Smartphone,
  Copy,
  ExternalLink,
  Info,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

// Types
interface QRCodeGeneratorProps {
  onRefresh?: () => Promise<void>;
  session: {
    id: string;
    courseName?: string;
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: {
      latitude: number;
      longitude: number;
      radius: number;
      name: string;
    };
    security?: {
      isLocationRequired: boolean;
      isPhotoRequired: boolean;
      isDeviceCheckRequired: boolean;
      fraudDetectionEnabled: boolean;
      gracePeriod: number;
      maxAttempts: number;
      riskThreshold: number;
    };
    status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "PAUSED" | "ENDED" | "CANCELLED";
    totalStudents?: number;
    presentStudents?: number;
    absentStudents?: number;
    lateStudents?: number;
    fraudAlerts?: number;
    qrCode?: string;
    course?: any;
    attendanceRecords?: any[];
    securitySettings?: any;
    createdAt: Date;
    updatedAt: Date;
  };
  onExport?: (format: "image" | "pdf" | "link") => void;
  onShare?: (method: "link" | "email" | "sms") => void;
  className?: string;
}

interface QRCodeData {
  sessionId: string;
  courseName: string;
  title: string;
  startTime: string;
  endTime: string;
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
  status: string;
  qrCode: string;
  timestamp: number;
}

export function QRCodeGenerator({
  session,
  onExport,
  onShare,
  onRefresh,
  className = "",
}: QRCodeGeneratorProps) {
  const [qrCodeData, setQrCodeData] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showExpandDialog, setShowExpandDialog] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [attendanceRate, setAttendanceRate] = useState<number>(0);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  // Generate QR code data
  const generateQRData = (): QRCodeData => {
    return {
      sessionId: session.id,
      courseName: session.courseName || "N/A",
      title: session.title,
      startTime: new Date(session.startTime).toISOString(),
      endTime: new Date(session.endTime).toISOString(),
      location: session.location || {
        latitude: 0,
        longitude: 0,
        radius: 0,
        name: "N/A",
      },
      security: session.security || (session as any).securitySettings || {
        isLocationRequired: (session as any).securitySettings?.isLocationRequired || false,
        isPhotoRequired: (session as any).securitySettings?.isPhotoRequired || false,
        isDeviceCheckRequired: (session as any).securitySettings?.isDeviceCheckRequired || false,
        fraudDetectionEnabled: false,
        gracePeriod: 0,
        maxAttempts: 0,
        riskThreshold: 0,
      },
      status: session.status,
      qrCode: session.qrCode || `QR-${session.id}`,
      timestamp: Date.now(),
    };
  };

  // Generate QR code using canvas
  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      // Import qrcode library dynamically
      const QRCode = await import("qrcode");

      const qrData = generateQRData();
      const qrString = JSON.stringify(qrData);

      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "M",
      });

      setQrCodeData(qrCodeDataURL);
    } catch (error) {
      console.error("Error generating QR code:", error);
      // Fallback: create a simple QR code representation
      setQrCodeData(
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSIjRkZGRkZGIi8+Cjx0ZXh0IHg9IjEyOCIgeT0iMTI4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiMwMDAwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk5vIFFSIGNvZGUgYXZhaWxhYmxlPC90ZXh0Pgo8L3N2Zz4K",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Update time remaining
  const updateTimeRemaining = () => {
    const now = new Date();
    const end = new Date(session.endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeRemaining("Session Ended");
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) {
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s remaining`);
    } else if (minutes > 0) {
      setTimeRemaining(`${minutes}m ${seconds}s remaining`);
    } else {
      setTimeRemaining(`${seconds}s remaining`);
    }
  };

  // Update attendance rate
  const updateAttendanceRate = () => {
    const records = (session as any).attendanceRecords || [];
    const present = records.length > 0 ? records.filter((r: any) => r.status === "PRESENT").length : (session.presentStudents || 0);
    const total = session.course?._count?.enrollments || (session.course as any)?.enrollments?.length || session.totalStudents || 2;
    
    if (total > 0) {
      setAttendanceRate((present / total) * 100);
    } else {
      setAttendanceRate(0);
    }
  };

  // Generate QR code on component mount and when session changes
  useEffect(() => {
    generateQRCode();
    updateTimeRemaining();
    updateAttendanceRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  // Auto-refresh QR code visual Every 5 seconds
  useEffect(() => {
    if (session.status === "ACTIVE") {
      const interval = setInterval(() => {
        generateQRCode();
      }, 5000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.status, session.id]);

  // Handle REAL rotation every 30 seconds via onRefresh
  useEffect(() => {
    if (session.status === "ACTIVE" && onRefresh) {
      const interval = setInterval(() => {
        onRefresh();
      }, 30000); // Rotate in DB every 30 seconds
      return () => clearInterval(interval);
    }
  }, [session.status, session.id, onRefresh]);

  // Update time remaining every second
  useEffect(() => {
    const interval = setInterval(() => {
      updateTimeRemaining();
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.endTime]);

  // Update attendance rate when session changes
  useEffect(() => {
    updateAttendanceRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.presentStudents, session.totalStudents]);

  // Export QR code as image
  const handleExportImage = async () => {
    try {
      if (qrCodeRef.current) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);

          const link = document.createElement("a");
          link.download = `qr-code-${session.id}.png`;
          link.href = canvas.toDataURL();
          link.click();
        };

        img.src = qrCodeData;
      }
    } catch (error) {
      console.error("Error exporting QR code:", error);
    }
  };

  // Print QR code
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${session.title}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px;
              }
              .qr-code { 
                max-width: 300px; 
                margin: 20px auto; 
              }
              .session-info { 
                margin: 20px 0; 
              }
              .security-info { 
                margin: 20px 0; 
                text-align: left; 
                max-width: 400px; 
                margin: 20px auto; 
              }
            </style>
          </head>
          <body>
            <h1>${session.title}</h1>
            <div class="session-info">
              <p><strong>Course:</strong> ${session.courseName}</p>
              <p><strong>Location:</strong> ${session.location?.name || "N/A"}</p>
              <p><strong>Time:</strong> ${new Date(session.startTime).toLocaleString()} - ${new Date(session.endTime).toLocaleString()}</p>
            </div>
            <div class="qr-code">
              <img src="${qrCodeData}" alt="QR Code" />
            </div>
            <div class="security-info">
              <h3>Security Settings:</h3>
              <ul>
                <li>Location Required: ${session.security?.isLocationRequired ? "Yes" : "No"}</li>
                <li>Photo Required: ${session.security?.isPhotoRequired ? "Yes" : "No"}</li>
                <li>Device Check Required: ${session.security?.isDeviceCheckRequired ? "Yes" : "No"}</li>
                <li>Fraud Detection: ${session.security?.fraudDetectionEnabled ? "Enabled" : "Disabled"}</li>
              </ul>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Share session link
  const handleShareLink = async () => {
    const sessionUrl = `${window.location.origin}/dashboard/student/attendance?session=${session.id}`;
    try {
      await navigator.clipboard.writeText(sessionUrl);
      // Show success message
    } catch (error) {
      console.error("Error copying link:", error);
    }
  };

  // Get status color
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

  // Get status text
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-6 ${className}`}
    >
      {/* QR Code Display */}
      <div className="bg-white/80 dark:bg-cardDark/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                  <QrCode className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                QR Code Generator
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-11">
                Share this QR code with students for attendance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={generateQRCode}
                disabled={isGenerating}
                className="rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportDialog(true)}
                className="rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareDialog(true)}
                className="rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* QR Code */}
          <div className="flex justify-center">
            <div
              className="relative group cursor-pointer"
              onClick={() => setShowExpandDialog(true)}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div
                ref={qrCodeRef}
                className="relative w-72 h-72 bg-white rounded-xl flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-[1.02]"
              >
                {qrCodeData ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrCodeData}
                    alt="QR Code"
                    className="w-64 h-64 object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <QrCode className="h-16 w-16 mb-2 opacity-50" />
                    <p className="text-sm font-medium">Generating QR Code...</p>
                  </div>
                )}

                {/* Dynamic Indicator */}
                <div className="absolute bottom-2 right-2">
                  <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm border border-gray-100">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                      Live
                    </span>
                  </div>
                </div>
              </div>
              {isGenerating && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-600">
                      Generating...
                    </span>
                  </div>
                </div>
              )}

              {/* Hover overlay hint */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                  Click to expand
                </div>
              </div>
            </div>
          </div>

          {/* Expand Dialog */}
          <Dialog open={showExpandDialog} onOpenChange={setShowExpandDialog}>
            <DialogContent className="sm:max-w-3xl flex flex-col items-center justify-center p-10">
              <DialogHeader className="sr-only">
                <DialogTitle>Enlarged QR Code</DialogTitle>
                <DialogDescription>
                  Scan this QR code to mark attendance
                </DialogDescription>
              </DialogHeader>
              <div
                className="bg-white p-4 rounded-2xl shadow-2xl cursor-pointer"
                onClick={() => setShowExpandDialog(false)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCodeData}
                  alt="Enlarged QR Code"
                  className="w-[500px] h-[500px] object-contain"
                />
              </div>
              <div className="mt-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {session.title}
                </h2>
                <p className="text-lg text-gray-500 dark:text-gray-400">
                  {session.courseName}
                </p>
              </div>
            </DialogContent>
          </Dialog>

          {/* Session Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 bg-gray-50/50 dark:bg-gray-800/20 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-500" />
                  Session Details
                </h4>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}
                >
                  {getStatusText(session.status)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-gray-500">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Course
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {session.courseName}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-gray-500">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Title
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {session.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-gray-500">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Location
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {session.location?.name || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Time Remaining
                    </p>
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 font-mono">
                      {timeRemaining}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-gray-50/50 dark:bg-gray-800/20 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Attendance Status
              </h4>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Present
                    </p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {(session as any).attendanceRecords?.length || session.presentStudents || 0}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Total
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {session.course?._count?.enrollments || (session.course as any)?.enrollments?.length || session.totalStudents || 2}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      Attendance Rate
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {attendanceRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${attendanceRate}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
              Security Features Active
            </h4>
            <div className="flex flex-wrap gap-2">
              {(session.security?.isLocationRequired || (session as any).securitySettings?.isLocationRequired) && (
                <div className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-xs font-medium border border-green-200 dark:border-green-800 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Location Verified
                </div>
              )}
              {(session.security?.isPhotoRequired || (session as any).securitySettings?.isPhotoRequired) && (
                <div className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium border border-purple-200 dark:border-purple-800 flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5" />
                  Photo Required
                </div>
              )}
              {(session.security?.isDeviceCheckRequired || (session as any).securitySettings?.isDeviceCheckRequired) && (
                <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5" />
                  Device Check
                </div>
              )}
              {session.security?.fraudDetectionEnabled && (
                <div className="px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg text-xs font-medium border border-orange-200 dark:border-orange-800 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  AI Fraud Detection
                </div>
              )}
            </div>
          </div>

          {/* Fraud Alerts */}
          {(session.fraudAlerts || 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3"
            >
              <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h5 className="font-semibold text-red-900 dark:text-red-200">
                  Security Alert
                </h5>
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>{session.fraudAlerts} suspicious activities</strong>{" "}
                  detected in this session. Check reports for details.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export QR Code</DialogTitle>
            <DialogDescription>
              Choose how you want to export the QR code
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                onClick={handleExportImage}
                className="flex items-center justify-start gap-3 h-12 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Download className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">
                    Download Image
                  </div>
                  <div className="text-xs text-gray-500">Save as PNG file</div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex items-center justify-start gap-3 h-12 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                  <Printer className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">
                    Print QR Code
                  </div>
                  <div className="text-xs text-gray-500">
                    Send directly to printer
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onExport?.("pdf");
                  setShowExportDialog(false);
                }}
                className="flex items-center justify-start gap-3 h-12 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">
                    Export as PDF
                  </div>
                  <div className="text-xs text-gray-500">
                    Generate PDF document
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Session</DialogTitle>
            <DialogDescription>
              Share this session with students
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Session Link
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={`${window.location.origin}/student-attendance?session=${session.id}`}
                    readOnly
                    className="w-full pl-3 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleShareLink}
                  className="rounded-xl px-3"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  onShare?.("link");
                  setShowShareDialog(false);
                }}
                className="flex flex-col items-center gap-2 h-auto py-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-indigo-600 dark:text-indigo-400">
                  <ExternalLink className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">Copy Link</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onShare?.("email");
                  setShowShareDialog(false);
                }}
                className="flex flex-col items-center gap-2 h-auto py-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400">
                  <Share2 className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">Email</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onShare?.("sms");
                  setShowShareDialog(false);
                }}
                className="flex flex-col items-center gap-2 h-auto py-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-full text-green-600 dark:text-green-400">
                  <Smartphone className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">SMS</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export default QRCodeGenerator;
