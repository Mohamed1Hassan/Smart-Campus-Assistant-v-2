"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Upload,
  Image as ImageIcon,
  Settings,
  HelpCircle,
  Wifi,
  Battery,
  Signal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Types
interface PhotoData {
  url: string;
  timestamp: Date;
  quality: number;
  hasFace: boolean;
  isVerified: boolean;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
    compression: number;
    timestamp: Date;
    isEdited: boolean;
    hasFilters: boolean;
    isScreenshot: boolean;
    gps?: {
      latitude: number;
      longitude: number;
    };
  };
}

interface PhotoValidation {
  isValid: boolean;
  score: number;
  warnings: string[];
  errors: string[];
  recommendations: string[];
  qualityScore: number;
  faceScore: number;
  metadataScore: number;
  securityScore: number;
}

interface PhotoCaptureProps {
  onPhotoCapture: (photo: PhotoData) => void;
  onValidationComplete: (validation: PhotoValidation) => void;
  onStorageUpdate: (storage: { used: number; total: number }) => void;
  minQuality: number;
  maxSize: number;
  allowedFormats: string[];
  enableFaceDetection: boolean;
  enableMetadataVerification: boolean;
  enableScreenshotDetection: boolean;
  enableGPSVerification: boolean;
}

export function PhotoCapture({
  onPhotoCapture,
  onValidationComplete,
  onStorageUpdate,
  minQuality,
  maxSize,
  allowedFormats,
  enableFaceDetection,
  enableMetadataVerification,
  enableScreenshotDetection,
  enableGPSVerification,
}: PhotoCaptureProps) {
  const [cameraPermission, setCameraPermission] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<PhotoData | null>(null);
  const [validation, setValidation] = useState<PhotoValidation | null>(null);
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    total: 100 * 1024 * 1024,
    available: 0,
    photos: 0,
  });
  const [connectionStatus, setConnectionStatus] = useState<
    "ONLINE" | "OFFLINE"
  >("ONLINE");
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [signalStrength, setSignalStrength] = useState(4);
  const [showHelp, setShowHelp] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateConnectionStatus = useCallback(() => {
    if (navigator.onLine) {
      setConnectionStatus("ONLINE");
    } else {
      setConnectionStatus("OFFLINE");
    }
  }, []);

  const updateBatteryLevel = useCallback(() => {
    if ("getBattery" in navigator) {
      (navigator as unknown as { getBattery: () => Promise<{ level: number }> })
        .getBattery()
        .then((battery) => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
    }
  }, []);

  const updateSignalStrength = useCallback(() => {
    if ("connection" in navigator) {
      const connection = (
        navigator as unknown as { connection?: { downlink: number } }
      ).connection;
      if (connection) {
        const strength = Math.round((connection.downlink / 10) * 4);
        setSignalStrength(Math.min(4, Math.max(1, strength)));
      }
    }
  }, []);

  const startStatusMonitoring = useCallback(() => {
    const interval = setInterval(() => {
      updateConnectionStatus();
      updateBatteryLevel();
      updateSignalStrength();
    }, 5000);

    return () => clearInterval(interval);
  }, [updateConnectionStatus, updateBatteryLevel, updateSignalStrength]);

  const initializeCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Camera initialization failed:", error);
      setCameraPermission(false);
      setCaptureError("Camera permission denied. Please enable camera access.");
    }
  }, []);

  const checkStorageInfo = useCallback(async () => {
    try {
      if ("storage" in navigator && "estimate" in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const available = estimate.quota || 0;

        setStorageInfo((prev) => ({
          ...prev,
          used,
          available,
          total: available,
        }));
      }
    } catch (error) {
      console.error("Storage info check failed:", error);
    }
  }, []);

  const calculateSecurityScore = useCallback(
    (photo: PhotoData): number => {
      let score = 100;

      if (photo.metadata.isEdited) score -= 30;
      if (photo.metadata.isScreenshot) score -= 50;
      if (photo.metadata.hasFilters) score -= 20;
      if (!photo.hasFace && enableFaceDetection) score -= 25;
      if (!photo.metadata.gps && enableGPSVerification) score -= 15;

      return Math.max(0, score);
    },
    [enableFaceDetection, enableGPSVerification],
  );

  const validatePhoto = useCallback(
    (photo: PhotoData) => {
      const warnings: string[] = [];
      const errors: string[] = [];
      const recommendations: string[] = [];
      let score = 100;

      // Check quality
      if (photo.quality < minQuality) {
        warnings.push(
          `Photo quality is ${photo.quality}%, minimum required is ${minQuality}%`,
        );
        score -= 20;
      }

      // Check size
      if (photo.metadata.size > maxSize) {
        errors.push(
          `Photo size is ${(photo.metadata.size / 1024 / 1024).toFixed(2)}MB, maximum allowed is ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
        );
        score -= 30;
      }

      // Check format
      if (!allowedFormats.includes(photo.metadata.format)) {
        errors.push(`Photo format ${photo.metadata.format} is not allowed`);
        score -= 40;
      }

      // Check face detection
      if (enableFaceDetection && !photo.hasFace) {
        warnings.push("No face detected in photo");
        score -= 15;
      }

      // Check metadata
      if (enableMetadataVerification && photo.metadata.isEdited) {
        warnings.push("Photo appears to be edited");
        score -= 25;
      }

      // Check screenshot detection
      if (enableScreenshotDetection && photo.metadata.isScreenshot) {
        errors.push("Screenshot detected - please take a new photo");
        score -= 50;
      }

      // Check GPS verification
      if (enableGPSVerification && !photo.metadata.gps) {
        warnings.push("GPS data not available");
        score -= 10;
      }

      // Check connection status
      if (connectionStatus === "OFFLINE") {
        errors.push("No internet connection");
        score -= 30;
      }

      // Check battery level
      if (batteryLevel < 20) {
        warnings.push("Low battery level may affect photo quality");
        score -= 10;
      }

      // Check signal strength
      if (signalStrength < 2) {
        warnings.push("Poor network signal may affect photo upload");
        score -= 15;
      }

      // Generate recommendations
      if (photo.quality < minQuality) {
        recommendations.push("Try taking the photo in better lighting");
      }
      if (photo.metadata.size > maxSize) {
        recommendations.push("Enable compression to reduce file size");
      }
      if (enableFaceDetection && !photo.hasFace) {
        recommendations.push("Ensure your face is visible in the photo");
      }
      if (enableScreenshotDetection && photo.metadata.isScreenshot) {
        recommendations.push("Take a new photo instead of using a screenshot");
      }

      const validation: PhotoValidation = {
        isValid: errors.length === 0,
        score: Math.max(0, score),
        warnings,
        errors,
        recommendations,
        qualityScore: photo.quality,
        faceScore: photo.hasFace ? 100 : 0,
        metadataScore: enableMetadataVerification ? 100 : 0,
        securityScore: calculateSecurityScore(photo),
      };

      setValidation(validation);
      onValidationComplete(validation);
    },
    [
      minQuality,
      maxSize,
      onValidationComplete,
      allowedFormats,
      calculateSecurityScore,
      enableFaceDetection,
      enableGPSVerification,
      enableMetadataVerification,
      enableScreenshotDetection,
      batteryLevel,
      connectionStatus,
      signalStrength,
    ],
  );

  const processPhoto = async (url: string, file: File): Promise<PhotoData> => {
    // Mock processing logic
    return {
      url,
      timestamp: new Date(),
      quality: 90,
      hasFace: true,
      isVerified: true,
      metadata: {
        width: 1280,
        height: 720,
        format: file.type,
        size: file.size,
        compression: 1,
        timestamp: new Date(),
        isEdited: false,
        hasFilters: false,
        isScreenshot: false,
      },
    };
  };

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    setCaptureError(null);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const url = canvas.toDataURL("image/jpeg", 0.9);

        // Mock photo data
        const photo: PhotoData = {
          url,
          timestamp: new Date(),
          quality: 90,
          hasFace: true,
          isVerified: false,
          metadata: {
            width: canvas.width,
            height: canvas.height,
            format: "image/jpeg",
            size: 0, // Should calculate from data URL
            compression: 0.9,
            timestamp: new Date(),
            isEdited: false,
            hasFilters: false,
            isScreenshot: false,
          },
        };

        setPhotoData(photo);
      }
    } catch (error) {
      console.error("Photo capture failed:", error);
      setCaptureError("Failed to capture photo. Please try again.");
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const url = e.target?.result as string;
      const photo = await processPhoto(url, file);
      setPhotoData(photo);
    };
    reader.readAsDataURL(file);
  };

  const handleRetry = () => {
    setCaptureError(null);
    capturePhoto();
  };

  const getQualityIcon = (quality: number) => {
    if (quality >= 80)
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (quality >= 60)
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 80) return "text-green-600";
    if (quality >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  // Initialize camera and permissions
  useEffect(() => {
    initializeCamera();
    checkStorageInfo();
    const cleanup = startStatusMonitoring();
    return cleanup;
  }, [initializeCamera, checkStorageInfo, startStatusMonitoring]);

  // Handle photo data updates
  useEffect(() => {
    if (photoData) {
      onPhotoCapture(photoData);
      validatePhoto(photoData);
    }
  }, [photoData, onPhotoCapture, validatePhoto]);

  // Handle storage info updates
  useEffect(() => {
    onStorageUpdate(storageInfo);
  }, [storageInfo, onStorageUpdate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Camera className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Photo Capture</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" disabled>
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
          <ImageIcon className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium">
            {storageInfo.photos} photos
          </span>
        </div>
      </div>

      {/* Camera Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>Camera</span>
          </CardTitle>
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

              {/* Capture Overlay */}
              {isCapturing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="flex items-center space-x-2 text-white">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Capturing...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={capturePhoto}
                disabled={!cameraPermission || isCapturing}
                className="flex-1"
              >
                {isCapturing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Capturing...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Capture Photo
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCapturing}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>

              {captureError && (
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  disabled={isCapturing}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Photo Preview */}
      {photoData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ImageIcon className="h-5 w-5" />
              <span>Captured Photo</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoData.url}
                  alt="Captured photo"
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium">Quality</div>
                      <div className="flex items-center space-x-2">
                        {getQualityIcon(photoData.quality)}
                        <span
                          className={`text-sm ${getQualityColor(photoData.quality)}`}
                        >
                          {photoData.quality}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Size</div>
                      <div className="text-sm text-muted-foreground">
                        {(photoData.metadata.size / 1024 / 1024).toFixed(2)}MB
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Format</div>
                      <div className="text-sm text-muted-foreground">
                        {photoData.metadata.format}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Dimensions</div>
                      <div className="text-sm text-muted-foreground">
                        {photoData.metadata.width}x{photoData.metadata.height}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <span>Photo Validation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Validation Score</span>
                <div className="flex items-center space-x-2">
                  <Progress value={validation.score} className="w-20 h-2" />
                  <span className="text-sm font-medium">
                    {validation.score}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm font-medium">Quality Score</div>
                  <div className="text-sm text-muted-foreground">
                    {validation.qualityScore}%
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Face Score</div>
                  <div className="text-sm text-muted-foreground">
                    {validation.faceScore}%
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Metadata Score</div>
                  <div className="text-sm text-muted-foreground">
                    {validation.metadataScore}%
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Security Score</div>
                  <div className="text-sm text-muted-foreground">
                    {validation.securityScore}%
                  </div>
                </div>
              </div>

              {validation.warnings.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-yellow-600 mb-2">
                    Warnings
                  </div>
                  <div className="space-y-1">
                    {validation.warnings.map((warning, index) => (
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

              {validation.errors.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-red-600 mb-2">
                    Errors
                  </div>
                  <div className="space-y-1">
                    {validation.errors.map((error, index) => (
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

              {validation.recommendations.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-blue-600 mb-2">
                    Recommendations
                  </div>
                  <div className="space-y-1">
                    {validation.recommendations.map((recommendation, index) => (
                      <div
                        key={index}
                        className="text-sm text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded"
                      >
                        {recommendation}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Capture Error */}
      {captureError && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>Capture Error</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-3 rounded">
              {captureError}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Photo Help</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium">
                    How to Take a Good Photo
                  </div>
                  <div className="text-sm text-muted-foreground">
                    1. Ensure good lighting
                    <br />
                    2. Keep your face visible
                    <br />
                    3. Hold the camera steady
                    <br />
                    4. Avoid screenshots or edited photos
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">Troubleshooting</div>
                  <div className="text-sm text-muted-foreground">
                    - Check camera permissions
                    <br />
                    - Ensure good lighting
                    <br />
                    - Try taking the photo again
                    <br />- Contact support if issues persist
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
