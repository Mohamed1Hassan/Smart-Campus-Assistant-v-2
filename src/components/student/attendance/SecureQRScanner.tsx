"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Shield,
  Wifi,
  Battery,
  Signal,
  AlertCircle,
  Info,
  Settings,
  HelpCircle,
  QrCode,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// Types
interface QRScanResult {
  sessionId: string;
  courseId: number;
  courseName: string;
  timestamp: Date;
  isValid: boolean;
  securityLevel: "LOW" | "MEDIUM" | "HIGH" | "MAXIMUM";
  expirationTime: Date;
  location: {
    latitude: number;
    longitude: number;
    radius: number;
    name: string;
  };
  requirements: {
    locationRequired: boolean;
    photoRequired: boolean;
    deviceCheckRequired: boolean;
    fraudDetectionEnabled: boolean;
  };
}

interface ScanError {
  code: string;
  message: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  retryable: boolean;
  suggestions: string[];
}

interface SecurityValidation {
  isValid: boolean;
  score: number;
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

interface SecureQRScannerProps {
  onScanSuccess: (result: QRScanResult) => void;
  onScanError: (error: ScanError) => void;
  onSecurityValidation: (validation: SecurityValidation) => void;
  isScanning: boolean;
  onScanningChange: (scanning: boolean) => void;
  securityLevel: "LOW" | "MEDIUM" | "HIGH" | "MAXIMUM";
  enableRetry: boolean;
  maxRetries: number;
  timeout: number;
}

export function SecureQRScanner({
  onScanSuccess,
  onScanError,
  onSecurityValidation,
  isScanning,
  onScanningChange,
  securityLevel,
  enableRetry,
  maxRetries,
  timeout,
}: SecureQRScannerProps) {
  const [scanResult, setScanResult] = useState<QRScanResult | null>(null);
  const [scanError, setScanError] = useState<ScanError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStartTime, setScanStartTime] = useState<Date | null>(null);
  const [securityValidation, setSecurityValidation] =
    useState<SecurityValidation | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(
    null,
  );
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [scanQuality, setScanQuality] = useState<"LOW" | "MEDIUM" | "HIGH">(
    "HIGH",
  );
  const [scanMode, setScanMode] = useState<"AUTO" | "MANUAL" | "CONTINUOUS">(
    "AUTO",
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "ONLINE" | "OFFLINE" | "POOR"
  >("ONLINE");
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [signalStrength, setSignalStrength] = useState(4);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera and permissions
  useEffect(() => {
    initializeCamera();
    checkDeviceCapabilities();
    startStatusMonitoring();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Handle scanning state changes
  useEffect(() => {
    if (isScanning) {
      startScanning();
    } else {
      stopScanning();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning]);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setCameraStream(stream);
      setCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Camera initialization failed:", error);
      setCameraPermission(false);
      handleScanError({
        code: "CAMERA_PERMISSION_DENIED",
        message: "Camera permission denied. Please enable camera access.",
        severity: "HIGH",
        retryable: true,
        suggestions: [
          "Check camera permissions in browser settings",
          "Ensure camera is not being used by another application",
          "Try refreshing the page and granting permissions again",
        ],
      });
    }
  };

  const checkDeviceCapabilities = async () => {
    try {
      // Check for camera access
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput",
      );

      if (videoDevices.length === 0) {
        throw new Error("No camera devices found");
      }

      // Check for location access
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => console.log("Location access granted"),
          () => console.log("Location access denied"),
        );
      }

      // Check for network connectivity
      if (navigator.onLine) {
        setConnectionStatus("ONLINE");
      } else {
        setConnectionStatus("OFFLINE");
      }

      // Check battery level
      if ("getBattery" in navigator) {
        (
          navigator as Navigator & {
            getBattery?: () => Promise<{ level: number }>;
          }
        ).getBattery!().then((battery: { level: number }) => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      }

      // Check signal strength
      if ("connection" in navigator) {
        const connection = (
          navigator as Navigator & { connection?: { downlink: number } }
        ).connection;
        if (connection) {
          const strength = Math.round((connection.downlink / 10) * 4);
          setSignalStrength(Math.min(4, Math.max(1, strength)));
        }
      }
    } catch (error) {
      console.error("Device capability check failed:", error);
    }
  };

  const startStatusMonitoring = () => {
    const interval = setInterval(() => {
      updateConnectionStatus();
      updateBatteryLevel();
      updateSignalStrength();
    }, 5000);

    return () => clearInterval(interval);
  };

  const updateConnectionStatus = () => {
    if (navigator.onLine) {
      setConnectionStatus("ONLINE");
    } else {
      setConnectionStatus("OFFLINE");
    }
  };

  const updateBatteryLevel = () => {
    if ("getBattery" in navigator) {
      (
        navigator as Navigator & {
          getBattery?: () => Promise<{ level: number }>;
        }
      ).getBattery!().then((battery: { level: number }) => {
        setBatteryLevel(Math.round(battery.level * 100));
      });
    }
  };

  const updateSignalStrength = () => {
    if ("connection" in navigator) {
      const connection = (
        navigator as Navigator & { connection?: { downlink: number } }
      ).connection;
      if (connection) {
        const strength = Math.round((connection.downlink / 10) * 4);
        setSignalStrength(Math.min(4, Math.max(1, strength)));
      }
    }
  };

  const startScanning = () => {
    if (!cameraPermission || !cameraStream) {
      handleScanError({
        code: "CAMERA_NOT_AVAILABLE",
        message: "Camera is not available",
        severity: "HIGH",
        retryable: true,
        suggestions: ["Check camera permissions", "Restart the application"],
      });
      return;
    }

    setScanStartTime(new Date());
    setScanProgress(0);
    setScanError(null);
    setRetryCount(0);

    // Start scanning process
    if (scanMode === "CONTINUOUS") {
      startContinuousScanning();
    } else {
      startSingleScan();
    }
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setScanProgress(0);
  };

  const startContinuousScanning = () => {
    scanIntervalRef.current = setInterval(() => {
      attemptQRScan();
    }, 1000);
  };

  const startSingleScan = () => {
    attemptQRScan();
  };

  const attemptQRScan = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for QR code detection
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Mock QR code detection (replace with actual QR library)
    const mockQRResult = detectQRCode(imageData);

    if (mockQRResult) {
      handleQRScanSuccess(mockQRResult);
    } else {
      updateScanProgress();
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const detectQRCode = (_imageData: ImageData): string | null => {
    // Mock QR code detection
    // In a real implementation, use a QR code detection library like jsQR
    const random = Math.random();
    if (random > 0.95) {
      // 5% chance of successful scan
      return "session-123-course-101";
    }
    return null;
  };

  const handleQRScanSuccess = (qrData: string) => {
    stopScanning();

    // Parse QR code data
    const [sessionId, courseId] = qrData.split("-");

    // Mock session data
    const result: QRScanResult = {
      sessionId: sessionId,
      courseId: parseInt(courseId),
      courseName: "Computer Science 101",
      timestamp: new Date(),
      isValid: true,
      securityLevel: securityLevel,
      expirationTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      location: {
        latitude: 40.7128,
        longitude: -74.006,
        radius: 50,
        name: "Main Campus - Room 101",
      },
      requirements: {
        locationRequired: true,
        photoRequired: false,
        deviceCheckRequired: true,
        fraudDetectionEnabled: true,
      },
    };

    setScanResult(result);

    // Validate security
    const validation = validateSecurity(result);
    setSecurityValidation(validation);

    onScanSuccess(result);
    onSecurityValidation(validation);
  };

  const validateSecurity = (result: QRScanResult): SecurityValidation => {
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check expiration
    if (result.expirationTime < new Date()) {
      errors.push("QR code has expired");
      score -= 50;
    }

    // Check security level
    if (result.securityLevel === "LOW") {
      warnings.push("Low security level detected");
      score -= 20;
    }

    // Check connection status
    if (connectionStatus === "OFFLINE") {
      errors.push("No internet connection");
      score -= 30;
    }

    // Check battery level
    if (batteryLevel < 20) {
      warnings.push("Low battery level");
      score -= 10;
    }

    // Check signal strength
    if (signalStrength < 2) {
      warnings.push("Poor network signal");
      score -= 15;
    }

    // Generate recommendations
    if (score < 70) {
      recommendations.push("Consider improving your connection");
    }
    if (batteryLevel < 20) {
      recommendations.push("Charge your device");
    }
    if (signalStrength < 2) {
      recommendations.push("Move to an area with better signal");
    }

    return {
      isValid: errors.length === 0,
      score: Math.max(0, score),
      warnings,
      errors,
      recommendations,
    };
  };

  const handleScanError = (error: ScanError) => {
    setScanError(error);
    setScanProgress(0);

    onScanError(error);

    if (enableRetry && retryCount < maxRetries) {
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        startScanning();
      }, 2000);
    }
  };

  const updateScanProgress = () => {
    if (scanStartTime) {
      const elapsed = Date.now() - scanStartTime.getTime();
      const progress = Math.min(100, (elapsed / timeout) * 100);
      setScanProgress(progress);

      if (progress >= 100) {
        handleScanError({
          code: "SCAN_TIMEOUT",
          message: "QR code scan timed out",
          severity: "MEDIUM",
          retryable: true,
          suggestions: [
            "Ensure QR code is clearly visible",
            "Try moving closer to the QR code",
            "Check lighting conditions",
          ],
        });
      }
    }
  };

  const handleRetry = () => {
    setScanError(null);
    setRetryCount(0);
    startScanning();
  };

  const handleCancel = () => {
    stopScanning();
    onScanningChange(false);
  };

  const getErrorIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "HIGH":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case "MEDIUM":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "LOW":
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getErrorBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-500";
      case "HIGH":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-yellow-500";
      case "LOW":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <QrCode className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Secure QR Scanner</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowHelp(true)}>
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center space-x-2">
          <Wifi
            className={`h-4 w-4 ${connectionStatus === "ONLINE" ? "text-green-600" : "text-red-600"}`}
          />
          <span className="text-sm font-medium">{connectionStatus}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Battery className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">{batteryLevel}%</span>
        </div>
        <div className="flex items-center space-x-2">
          <Signal className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">{signalStrength}/4</span>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium">{securityLevel}</span>
        </div>
      </div>

      {/* Scanner Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>QR Code Scanner</span>
          </CardTitle>
          <CardDescription>
            Point your camera at the QR code to scan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Camera Feed */}
            <div className="relative">
              <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Scan Overlay */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-blue-500 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
                  </div>
                </div>
              )}
            </div>

            {/* Scan Progress */}
            {isScanning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Scanning...</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(scanProgress)}%
                  </span>
                </div>
                <Progress value={scanProgress} className="h-2" />
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => onScanningChange(!isScanning)}
                disabled={!cameraPermission}
                className="flex-1"
              >
                {isScanning ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Stop Scanning
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Start Scanning
                  </>
                )}
              </Button>

              {scanError && enableRetry && retryCount < maxRetries && (
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  disabled={isScanning}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scan Result */}
      {scanResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Scan Successful</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Session ID</div>
                  <div className="text-sm text-muted-foreground">
                    {scanResult.sessionId}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Course</div>
                  <div className="text-sm text-muted-foreground">
                    {scanResult.courseName}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Security Level</div>
                  <Badge className="bg-blue-500">
                    {scanResult.securityLevel}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium">Expires</div>
                  <div className="text-sm text-muted-foreground">
                    {scanResult.expirationTime.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Validation */}
      {securityValidation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <span>Security Validation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Security Score</span>
                <div className="flex items-center space-x-2">
                  <Progress
                    value={securityValidation.score}
                    className="w-20 h-2"
                  />
                  <span className="text-sm font-medium">
                    {securityValidation.score}%
                  </span>
                </div>
              </div>

              {securityValidation.warnings.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-yellow-600 mb-2">
                    Warnings
                  </div>
                  <div className="space-y-1">
                    {securityValidation.warnings.map((warning, index) => (
                      <div
                        key={index}
                        className="text-sm text-yellow-600 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded"
                      >
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {securityValidation.errors.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-red-600 mb-2">
                    Errors
                  </div>
                  <div className="space-y-1">
                    {securityValidation.errors.map((error, index) => (
                      <div
                        key={index}
                        className="text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-2 rounded"
                      >
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {securityValidation.recommendations.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-blue-600 mb-2">
                    Recommendations
                  </div>
                  <div className="space-y-1">
                    {securityValidation.recommendations.map(
                      (recommendation, index) => (
                        <div
                          key={index}
                          className="text-sm text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded"
                        >
                          {recommendation}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan Error */}
      {scanError && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {getErrorIcon(scanError.severity)}
              <span>Scan Error</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Error Code</span>
                <Badge className={getErrorBadge(scanError.severity)}>
                  {scanError.severity}
                </Badge>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Message</div>
                <div className="text-sm text-muted-foreground">
                  {scanError.message}
                </div>
              </div>

              {scanError.suggestions.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Suggestions</div>
                  <div className="space-y-1">
                    {scanError.suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="text-sm text-muted-foreground"
                      >
                        �?{suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {scanError.retryable && (
                <div className="flex items-center space-x-2">
                  <Button onClick={handleRetry} disabled={isScanning}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Scan
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Scanner Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Scan Quality</label>
                  <Select
                    value={scanQuality}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setScanQuality(
                        e.target.value as "LOW" | "MEDIUM" | "HIGH",
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Scan Mode</label>
                  <Select
                    value={scanMode}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setScanMode(
                        e.target.value as "AUTO" | "MANUAL" | "CONTINUOUS",
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUTO">Auto</SelectItem>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                      <SelectItem value="CONTINUOUS">Continuous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Enable Retry</span>
                  <Switch
                    checked={enableRetry}
                    onCheckedChange={() => {
                      // Handle retry setting change
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Scanner Help</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium">How to Scan</div>
                  <div className="text-sm text-muted-foreground">
                    1. Point your camera at the QR code
                    <br />
                    2. Ensure good lighting
                    <br />
                    3. Keep the QR code steady
                    <br />
                    4. Wait for the scan to complete
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">Troubleshooting</div>
                  <div className="text-sm text-muted-foreground">
                    �?Check camera permissions
                    <br />
                    �?Ensure good lighting
                    <br />
                    �?Try moving closer to the QR code
                    <br />
                    �?Restart the app if needed
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
