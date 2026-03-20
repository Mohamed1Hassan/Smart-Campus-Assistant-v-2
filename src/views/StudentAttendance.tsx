"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  useSearchParams as useNextSearchParams,
  useRouter,
  usePathname,
} from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  QrCode,
  MapPin,
  Smartphone,
  Camera,
  CheckCircle,
  XCircle,
  Shield,
  RefreshCw,
  Settings,
  History,
  HelpCircle,
  Clock,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { SuccessAnimation } from "@/components/common/SuccessAnimation";
import DashboardLayout from "@/components/common/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { SecuritySettingsModal } from "@/components/student/attendance/SecuritySettingsModal";
import type { AttendanceSecuritySettings } from "@/components/student/attendance/SecuritySettingsModal";
import { AttendanceHistoryModal } from "@/components/student/attendance/AttendanceHistoryModal";
import { HelpSupportModal } from "@/components/student/attendance/HelpSupportModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/common/ToastProvider";
import { apiClient } from "@/services/api";
import AttendanceChart from "@/components/student/attendance/AttendanceChart";
import { getDeviceFingerprint } from "@/utils/fingerprint";

interface SecurityVerification {
  step: number;
  totalSteps: number;
  currentStep: string;
  isCompleted: boolean;
  isRequired: boolean;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "SKIPPED";
  data?: Record<string, unknown>;
  error?: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  isVerified: boolean;
  distance?: number;
  isWithinRadius: boolean;
}

interface DeviceFingerprint {
  fingerprint: string;
  deviceInfo: string;
  isVerified: boolean;
  isNewDevice: boolean;
  lastUsed: Date;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

interface PhotoData {
  url: string;
  timestamp: Date;
  quality: number;
  hasFace: boolean;
  isVerified: boolean;
  metadata: Record<string, unknown>;
}

interface AttendanceRecord {
  id: string;
  sessionId: string;
  courseName: string;
  timestamp: Date;
  location: LocationData;
  device: DeviceFingerprint;
  photo?: PhotoData;
  securityScore: number;
  fraudWarnings: string[];
  status: "SUCCESS" | "FAILED" | "PENDING" | "REVIEW";
}

interface ApiDevice {
  fingerprint: string;
  isActive: boolean;
  lastUsed: string;
}

interface RawAttendanceRecord {
  id?: string;
  sessionId?: string;
  courseId?: string;
  qrCodeId?: string;
  courseName?: string;
  title?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  course?: { courseName: string };
  session?: { courseName: string };
  attendedAt?: string;
  createdAt?: string;
  timestamp?: string;
  markedAt?: string;
  status?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    name?: string;
    radius?: number;
  };
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  locationVerified?: boolean;
  distance?: number;
  deviceFingerprint?: string;
  fraudAlerts?: string[];
  fraudScore?: number;
  photoUrl?: string;
  photoQuality?: number;
  photoHasFace?: boolean;
  photoVerified?: boolean;
  photoMetadata?: Record<string, unknown>;
  deviceVerified?: boolean;
  deviceInfo?: string;
  device?: {
    fingerprint?: string;
    deviceInfo?: string;
    isNewDevice?: boolean;
  };
  riskLevel?: string;
  security?: {
    isLocationRequired?: boolean;
    isPhotoRequired?: boolean;
    isDeviceCheckRequired?: boolean;
    gracePeriod?: number;
    fraudDetectionEnabled?: boolean;
  };
}

export default function StudentAttendance() {
  const { user } = useAuth();
  const { error: toastError } = useToast();
  // State management

  const [verificationSteps, setVerificationSteps] = useState<
    SecurityVerification[]
  >([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [deviceFingerprint, setDeviceFingerprint] =
    useState<DeviceFingerprint | null>(null);
  const [photoData, setPhotoData] = useState<PhotoData | null>(null);

  const [securitySettings, setSecuritySettings] =
    useState<AttendanceSecuritySettings>({
      locationPermission: false,
      highAccuracy: true,
      deviceRegistration: false,
      deviceFingerprinting: true,
      allowDeviceChange: false,
      photoCapture: false,
      faceDetection: true,
      photoQuality: 85,
      privacyMode: false,
      dataEncryption: true,
      autoSync: true,
      notifications: true,
      emailNotifications: false,
      securityLevel: "MEDIUM",
    });
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Success Animation State
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState({
    title: "",
    subtitle: "",
  });
  const [connectionStatus, setConnectionStatus] = useState<
    "ONLINE" | "OFFLINE" | "POOR"
  >("ONLINE");

  // QR Scanner Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const searchParams = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Load active sessions for student
  const { data: currentSession, refetch: refetchSession } = useQuery({
    queryKey: ["student-active-session", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const sessionId = searchParams?.get("session");
        const response = await apiClient.get<RawAttendanceRecord[]>(
          "/api/attendance/sessions",
          {
            params: sessionId ? { sessionId } : { status: "ACTIVE" },
          },
        );

        if (response.success && response.data) {
          const activeSessions = response.data;
          if (activeSessions.length > 0) {
            const session = activeSessions[0];
            return {
              id: session.sessionId || session.id || "",
              courseId: session.courseId || "",
              courseName: session.courseName || "",
              title: session.title || "Attendance Session",
              startTime: new Date(session.startTime || new Date()),
              endTime: new Date(session.endTime || new Date()),
              location: session.location || {
                latitude: 0,
                longitude: 0,
                radius: 50,
                name: (session.location as { name?: string } | undefined)?.name || "",
              },
              isLocationRequired:
                session.security?.isLocationRequired !== false,
              isPhotoRequired: session.security?.isPhotoRequired === true,
              isDeviceCheckRequired:
                session.security?.isDeviceCheckRequired !== false,
              gracePeriod: session.security?.gracePeriod || 5,
              fraudDetectionEnabled:
                session.security?.fraudDetectionEnabled !== false,
              status: "ACTIVE",
            };
          }
        }
        return null;
      } catch (error: unknown) {
        // Use warn instead of error to avoid dev error overlays when the API is unavailable
        console.warn("Failed to load active sessions:", error);
        return null;
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchInterval: 60000, // Auto-refresh every minute
  });

  const { data: historyData, refetch: refetchHistory } = useQuery({
    queryKey: ["student-attendance-history", user?.id],
    queryFn: async () => {
      if (!user?.id) return { history: [], stats: null };

      const userId = typeof user.id === "string" ? parseInt(user.id) : user.id;

      const [recordsResponse, statsResponse] = await Promise.allSettled([
        apiClient.get<Record<string, unknown>[]>("/api/attendance/records", {
          params: { studentId: userId },
        }),
        apiClient.get<Record<string, unknown>>("/api/attendance/stats", {
          params: { userId: user.universityId || userId },
        }),
      ]);

      let history: AttendanceRecord[] = [];
      if (
        recordsResponse.status === "fulfilled" &&
        recordsResponse.value.success &&
        Array.isArray(recordsResponse.value.data)
      ) {
         
        history = recordsResponse.value.data.map(
          (record: RawAttendanceRecord) => ({
            id: record.id || `att-${record.sessionId}`,
            sessionId: record.sessionId || record.qrCodeId || "",
            courseName:
              record.courseName ||
              record.course?.courseName ||
              record.session?.courseName ||
              "Unknown Course",
            timestamp: new Date(
              (record.attendedAt ||
                record.createdAt ||
                record.timestamp ||
                record.markedAt) as string || new Date().toISOString(),
            ),
            location: {
              latitude: record.location?.latitude || record.latitude || 0,
              longitude: record.location?.longitude || record.longitude || 0,
              accuracy: record.location?.accuracy || record.accuracy || 0,
              timestamp: new Date(
                (record.attendedAt ||
                  record.createdAt ||
                  record.timestamp ||
                  record.markedAt) as string || new Date().toISOString(),
              ),
              isVerified: record.locationVerified !== false,
              distance: record.distance || 0,
              isWithinRadius: record.locationVerified !== false,
            },
            device: {
              fingerprint:
                record.deviceFingerprint ||
                record.device?.fingerprint ||
                "unknown",
              deviceInfo:
                record.deviceInfo ||
                record.device?.deviceInfo ||
                navigator.userAgent,
              isVerified: record.deviceVerified !== false,
              isNewDevice: record.device?.isNewDevice || false,
              lastUsed: new Date(
                (record.attendedAt ||
                  record.createdAt ||
                  record.timestamp ||
                  record.markedAt) as string || new Date().toISOString(),
              ),
              riskLevel: (record.riskLevel as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ||
                (record.fraudScore && record.fraudScore > 70
                  ? "HIGH"
                  : record.fraudScore && record.fraudScore > 40
                    ? "MEDIUM"
                    : "LOW"),
            },
            photo: record.photoUrl
              ? {
                  url: record.photoUrl,
                  timestamp: new Date(
                    (record.attendedAt ||
                      record.createdAt ||
                      record.timestamp ||
                      record.markedAt) as string || new Date().toISOString(),
                  ),
                  quality: record.photoQuality || 85,
                  hasFace: record.photoHasFace !== false,
                  isVerified: record.photoVerified !== false,
                  metadata: record.photoMetadata || {},
                }
              : undefined,
            securityScore: record.fraudScore ? 100 - record.fraudScore : 95,
            fraudWarnings: record.fraudAlerts || [],
            status:
              record.status === "PRESENT" || record.status === "LATE"
                ? "SUCCESS"
                : record.status === "ABSENT"
                  ? "FAILED"
                  : "PENDING",
          }),
        );
      }

      let stats: Record<string, unknown> | null = null;
      if (
        statsResponse.status === "fulfilled" &&
        statsResponse.value.success &&
        statsResponse.value.data
      ) {
        stats = statsResponse.value.data as Record<string, unknown>;
      } else {
        // Calculate fallback stats
        const totalClasses = history.length;
        const attendedClasses = history.filter(
          (r) => r.status === "SUCCESS",
        ).length;
        const missedClasses = history.filter(
          (r) => r.status === "FAILED",
        ).length;
        const lateClasses =
          recordsResponse.status === "fulfilled" &&
          recordsResponse.value.success &&
          Array.isArray(recordsResponse.value.data)
            ?  
              recordsResponse.value.data.filter(
                (r: RawAttendanceRecord) => r.status === "LATE",
              ).length
            : 0;

        const overallAttendance =
          totalClasses > 0
            ? Math.round((attendedClasses / totalClasses) * 100)
            : 0;

        stats = {
          attendancePercentage: overallAttendance,
          totalSessions: totalClasses,
          attendedSessions: attendedClasses,
          absentCount: missedClasses,
          lateCount: lateClasses,
        };
      }

      return { history, stats };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const attendanceHistory = historyData?.history || [];
  const attendanceStats = useMemo(() => {
    const stats = historyData?.stats;
    if (!stats)
      return {
        overallAttendance: 0 as number,
        totalClasses: 0 as number,
        attendedClasses: 0 as number,
        missedClasses: 0 as number,
        lateClasses: 0 as number,
      };

    return {
      overallAttendance: (stats.attendancePercentage ||
        stats.averageAttendance ||
        0) as number,
      totalClasses: (stats.totalSessions || 0) as number,
      attendedClasses: (stats.attendedSessions || 0) as number,
      missedClasses: (stats.absentCount || stats.absentSessions || 0) as number,
      lateClasses: (stats.lateCount || stats.lateSessions || 0) as number,
    };
  }, [historyData]);

  const updateVerificationStep = useCallback(
    (stepIndex: number, status: SecurityVerification["status"]) => {
      setVerificationSteps((prev) =>
        prev.map((step, index) =>
          index === stepIndex
            ? { ...step, status, isCompleted: status === "COMPLETED" }
            : step,
        ),
      );
      setCurrentStep(stepIndex + 1);
    },
    [],
  );

  const initializeVerificationSteps = useCallback(() => {
    const steps: SecurityVerification[] = [
      {
        step: 1,
        totalSteps: 5,
        currentStep: "QR_CODE_SCAN",
        isCompleted: false,
        isRequired: true,
        status: "PENDING",
      },
      {
        step: 2,
        totalSteps: 5,
        currentStep: "LOCATION_VERIFICATION",
        isCompleted: false,
        isRequired: true,
        status: "PENDING",
      },
      {
        step: 3,
        totalSteps: 5,
        currentStep: "DEVICE_VERIFICATION",
        isCompleted: false,
        isRequired: true,
        status: "PENDING",
      },
      {
        step: 4,
        totalSteps: 5,
        currentStep: "PHOTO_CAPTURE",
        isCompleted: false,
        isRequired: false,
        status: "PENDING",
      },
      {
        step: 5,
        totalSteps: 5,
        currentStep: "FINAL_CONFIRMATION",
        isCompleted: false,
        isRequired: true,
        status: "PENDING",
      },
    ];
    setVerificationSteps(steps);
  }, []);

  const updateConnectionStatus = useCallback(() => {
    if (navigator.onLine) {
      setConnectionStatus("ONLINE");
    } else {
      setConnectionStatus("OFFLINE");
    }
  }, []);

  const stopScanner = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsScanning(false);
  }, []);

  const tick = useCallback(() => {
    if (
      videoRef.current &&
      videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
    ) {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;

        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Dynamic import to avoid issues if jsQR isn't loaded yet
          import("jsqr")
            .then((jsQRModule) => {
              const jsQR = jsQRModule.default || jsQRModule;
              const code = jsQR(
                imageData.data,
                imageData.width,
                imageData.height,
                {
                  inversionAttempts: "dontInvert",
                },
              );

              if (code) {
                console.log("Found QR code", code.data);
                let scannedQRCode = code.data;
                let scannedSessionId = "";

                // Try to parse as JSON first (as generated by Professor view)
                try {
                  const parsed = JSON.parse(code.data);
                  if (parsed && typeof parsed === "object") {
                    scannedQRCode = parsed.qrCode || code.data;
                    scannedSessionId = parsed.sessionId || "";
                  }
                } catch (e) {
                  // Not a JSON string
                }

                // Validate scanned code against session
                if (
                  currentSession &&
                  (scannedQRCode === currentSession.id ||
                    scannedQRCode.includes(currentSession.id) ||
                    code.data.includes(currentSession.id) ||
                    scannedSessionId === currentSession.id)
                ) {
                  setScanResult(scannedQRCode);
                  updateVerificationStep(0, "COMPLETED");
                  stopScanner();
                  if (navigator.vibrate) navigator.vibrate(200);
                }
              } else {
                animationFrameRef.current = requestAnimationFrame(tick);
              }
            })
            .catch((err) => {
              console.error("Failed to load jsQR", err);
              animationFrameRef.current = requestAnimationFrame(tick);
            });
          return;
        }
      }
    }
    animationFrameRef.current = requestAnimationFrame(tick);
  }, [currentSession, stopScanner, updateVerificationStep]);

  const handleQRScan = useCallback(async () => {
    if (isScanning) return;

    let sessionToUse = currentSession;
    if (!sessionToUse) {
      await refetchSession();
      if (!currentSession) {
        toastError("No active session found to scan for.", {
          title: "Scan Error",
        });
        return;
      }
      sessionToUse = currentSession;
    }

    setIsScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();

        requestAnimationFrame(tick);
      }

      setPermissions((prev) => ({ ...prev, camera: "granted" }));
    } catch (error) {
      console.error("Camera access failed:", error);
      setIsScanning(false);

      if (
        error instanceof Error &&
        (error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError")
      ) {
        setPermissions((prev) => ({ ...prev, camera: "denied" }));
        toastError("Please allow camera access to scan QR codes.", {
          title: "Camera Access Required",
        });
      } else {
        toastError("Failed to access camera. Please try again.", {
          title: "Camera Error",
        });
      }
    }
  }, [isScanning, currentSession, refetchSession, tick, toastError]);

  const startLocationTracking = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(),
            isVerified: true,
            isWithinRadius: true,
          };
          setLocationData(location);
        },
        (error) => {
          console.warn("Location tracking failed:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
      );
    }
  }, []);

  const generateDeviceFingerprint =
    useCallback(async (): Promise<DeviceFingerprint> => {
      const fingerprint = await getDeviceFingerprint();
      const deviceInfo = `${navigator.userAgent} - ${navigator.platform}`;

      try {
        const devicesResponse = await apiClient.get<{ devices: ApiDevice[] }>(
          "/api/attendance/devices",
        );
        if (devicesResponse.success && devicesResponse.data?.devices) {
          const existingDevice = devicesResponse.data.devices.find(
            (d) => d.fingerprint === fingerprint,
          );
          if (existingDevice) {
            return {
              fingerprint,
              deviceInfo,
              isVerified: existingDevice.isActive,
              isNewDevice: false,
              lastUsed: new Date(existingDevice.lastUsed),
              riskLevel: "LOW",
            };
          }
        }

        const response = await apiClient.post<{
          isVerified?: boolean;
          isNewDevice?: boolean;
          lastUsed?: string;
          riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        }>("/api/attendance/devices", {
          deviceFingerprint: fingerprint,
          deviceInfo: { userAgent: deviceInfo },
          deviceName: navigator.platform,
        });

        if (response.success && response.data) {
          return {
            fingerprint,
            deviceInfo,
            isVerified: response.data.isVerified !== false,
            isNewDevice: response.data.isNewDevice || false,
            lastUsed: new Date(response.data.lastUsed || new Date()),
            riskLevel: response.data.riskLevel || "LOW",
          };
        }
      } catch (error) {
        console.warn(
          "Device registration failed, using local fingerprint:",
          error,
        );
      }

      return {
        fingerprint,
        deviceInfo,
        isVerified: false,
        isNewDevice: true,
        lastUsed: new Date(),
        riskLevel: "LOW",
      };
    }, []);

  const checkDeviceCapabilities = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissions((prev) => ({ ...prev, camera: "granted" }));
    } catch {
      setPermissions((prev) => ({ ...prev, camera: "denied" }));
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({
          name: "geolocation" as PermissionName,
        });
        setPermissions((prev) => ({ ...prev, location: result.state }));
        result.onchange = () => {
          setPermissions((prev) => ({ ...prev, location: result.state }));
        };
      } catch (error) {
        console.warn("Location permission query failed:", error);
      }
    }

    if (window.PublicKeyCredential) {
      setPermissions((prev) => ({
        ...prev,
        biometrics: "granted" as PermissionState,
      }));
    }

    const fingerprint = await generateDeviceFingerprint();
    setDeviceFingerprint(fingerprint);
  }, [generateDeviceFingerprint]);

  const isInitialized = React.useRef(false);

  const [permissions, setPermissions] = useState({
    camera: "prompt" as PermissionState,
    location: "prompt" as PermissionState,
  });

  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371e3;
      const phi1 = (lat1 * Math.PI) / 180;
      const phi2 = (lat2 * Math.PI) / 180;
      const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
      const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) *
          Math.cos(phi2) *
          Math.sin(deltaLambda / 2) *
          Math.sin(deltaLambda / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c;
    },
    [],
  );

  const calculateSecurityScore = useCallback((): number => {
    let score = 0;
    if (locationData?.isVerified) score += 25;
    if (deviceFingerprint?.isVerified) score += 25;
    if (photoData?.isVerified) score += 25;
    if (scanResult) score += 25;
    return score;
  }, [locationData, deviceFingerprint, photoData, scanResult]);

  const handleLocationVerification = useCallback(async () => {
    // Skip if not required
    if (currentSession && !currentSession.isLocationRequired) {
      updateVerificationStep(1, "COMPLETED");
      return;
    }

    if (locationData && currentSession) {
      try {
        const response = await apiClient.post<{
          isWithinRadius?: boolean;
          verified?: boolean;
          distance?: number;
          requiredRadius?: number;
        }>("/api/attendance/verify-location", {
          sessionId: currentSession.id,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
        });

        if (response.success && response.data) {
          const isWithinRadius =
            response.data.isWithinRadius || response.data.verified;
          const distance = response.data.distance || 0;

          setLocationData((prev) =>
            prev
              ? {
                  ...prev,
                  isWithinRadius: isWithinRadius || false,
                  distance,
                  isVerified: isWithinRadius || false,
                }
              : null,
          );

          if (isWithinRadius) {
            updateVerificationStep(1, "COMPLETED");
          } else {
            updateVerificationStep(1, "FAILED");
            alert(
              `Location verification failed.\nYou are ${Math.round(distance)}m away.\nAllowed: ${response.data.requiredRadius || 50}m (+50m buffer).\n\nYour Location: ${locationData.latitude.toFixed(5)}, ${locationData.longitude.toFixed(5)}\nSession Location: ${currentSession.location?.latitude?.toFixed(5) || "0"}, ${currentSession.location?.longitude?.toFixed(5) || "0"}`,
            );
          }
        } else {
          const distance = calculateDistance(
            locationData.latitude,
            locationData.longitude,
            currentSession.location?.latitude || 0,
            currentSession.location?.longitude || 0,
          );

          // Add 50m buffer for GPS drift/accuracy issues
          const buffer = 50;
          const isWithinRadius =
            distance <= (currentSession.location.radius || 50) + buffer;

          setLocationData((prev) =>
            prev
              ? {
                  ...prev,
                  isWithinRadius,
                  distance,
                  isVerified: isWithinRadius,
                }
              : null,
          );

          if (isWithinRadius) {
            updateVerificationStep(1, "COMPLETED");
          } else {
            updateVerificationStep(1, "FAILED");
            alert(
              `Location verification failed.\nYou are ${Math.round(distance)}m away.\nAllowed: ${currentSession.location?.radius || 50}m (+50m buffer).\n\nYour Location: ${locationData.latitude.toFixed(5)}, ${locationData.longitude.toFixed(5)}\nSession Location: ${currentSession.location?.latitude?.toFixed(5) || "0"}, ${currentSession.location?.longitude?.toFixed(5) || "0"}`,
            );
          }
        }
      } catch (error: unknown) {
        console.error("Location verification failed:", error);

        // Handle backend errors
        if (
          error &&
          typeof error === "object" &&
          "response" in error &&
          (error as { response?: { status?: number } }).response?.status === 409
        ) {
          // Already marked - treat as success for this step so user can proceed to see status
          updateVerificationStep(1, "COMPLETED");
          return;
        }

        // Show specific backend error if available
        const backendError =
          error instanceof Error ? error.message : "Unknown error";
        alert(`Location check error: ${backendError}`);
        updateVerificationStep(1, "FAILED");
      }
    } else {
      console.log("Missing location data or session");
      if (!locationData) {
        alert(
          "Location data not found. Please enable GPS and allow location access.",
        );
        // Try to fetch location again
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLocationData({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                isVerified: false,
                isWithinRadius: false,
                timestamp: new Date(),
              });
              // Retry verification after a short delay
              setTimeout(() => handleLocationVerification(), 500);
            },
            (error) => {
              // Only alert if it's not a temporary timeout or permission issue that we handle elsewhere
              console.warn(`GPS Error: ${error.message}`);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
          );
        }
      }
      updateVerificationStep(1, "FAILED");
    }
  }, [currentSession, locationData, updateVerificationStep, calculateDistance]);

  const handleDeviceVerification = useCallback(async () => {
    if (deviceFingerprint && currentSession) {
      try {
        const response = await apiClient.post<{
          isVerified?: boolean;
          verified?: boolean;
          riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        }>("/api/attendance/verify-device", {
          sessionId: currentSession.id,
          deviceFingerprint: deviceFingerprint.fingerprint,
          deviceInfo: deviceFingerprint.deviceInfo,
        });

        if (response.success && response.data) {
          const isVerified =
            response.data.isVerified || response.data.verified || false;

          setDeviceFingerprint((prev) =>
            prev
              ? {
                  ...prev,
                  isVerified,
                  riskLevel: response.data?.riskLevel || prev.riskLevel,
                }
              : null,
          );

          if (isVerified) {
            updateVerificationStep(2, "COMPLETED");
          } else {
            updateVerificationStep(2, "FAILED");
          }
        } else {
          setDeviceFingerprint((prev) =>
            prev ? { ...prev, isVerified: true } : null,
          );
          updateVerificationStep(2, "COMPLETED");
        }
      } catch (error: unknown) {
        console.error("Device verification failed:", error);

        if (
          error &&
          typeof error === "object" &&
          "response" in error &&
          (error as { response?: { status?: number } }).response?.status === 409
        ) {
          setDeviceFingerprint((prev) =>
            prev ? { ...prev, isVerified: true } : null,
          );
          updateVerificationStep(2, "COMPLETED");
          return;
        }

        setDeviceFingerprint((prev) =>
          prev ? { ...prev, isVerified: true } : null,
        );
        updateVerificationStep(2, "COMPLETED");
      }
    }
  }, [deviceFingerprint, currentSession, updateVerificationStep]);

  const handlePhotoCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const photoUrl = canvas.toDataURL("image/jpeg", 0.8);

        const photo: PhotoData = {
          url: photoUrl,
          timestamp: new Date(),
          quality: 80,
          hasFace: true,
          isVerified: false,
          metadata: {
            width: canvas.width,
            height: canvas.height,
            format: "JPEG",
          },
        };

        setPhotoData(photo);
        updateVerificationStep(3, "COMPLETED");
      }

      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.error("Photo capture failed:", error);
      toastError(
        error instanceof Error
          ? error.message
          : "Failed to capture photo for verification",
      );
      updateVerificationStep(3, "FAILED");
    }
  }, [updateVerificationStep, toastError]);

  const handleFinalConfirmation = useCallback(async () => {
    if (!currentSession || !scanResult || !locationData || !deviceFingerprint) {
      console.error("Missing required data for attendance submission");
      updateVerificationStep(4, "FAILED");
      return;
    }

    try {
      // Use BOTH result from scan AND currentSession to be safe
      // But scanned ID is source of truth for WHICH session we are marking
      let targetSessionId = currentSession.id;
      
      try {
        const parsed = JSON.parse(scanResult);
        if (parsed.sessionId) targetSessionId = parsed.sessionId;
      } catch (e) {
        // If it's just a string, it might be the session ID or the qrCode string
        // If it starts with 'attendance-', it's the qrCode string, but we need the sessionId.
        // If we don't have it, we'll send it as sessionId and let the server handle it 
        // OR we'll use the currentSession.id as a fallback.
        if (scanResult.includes("-") && (scanResult.length > 30)) {
           // Might be a UUID or the 'attendance-uuid-timestamp' string
           targetSessionId = scanResult.startsWith("attendance-") 
             ? scanResult.split("-")[1] 
             : scanResult;
        }
      }

      const attendanceData: {
        sessionId: string;
        qrCode: string;
        location: { latitude: number; longitude: number; accuracy: number };
        deviceFingerprint: string;
        deviceInfo: string;
        photo?: string;
      } = {
        sessionId: targetSessionId,
        qrCode: scanResult,
        location: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
        },
        deviceFingerprint: deviceFingerprint.fingerprint,
        deviceInfo: deviceFingerprint.deviceInfo,
      };

      if (photoData && currentSession.isPhotoRequired) {
        attendanceData.photo = photoData.url;
      }

      const response = await apiClient.post<{
        id?: string;
        attendedAt?: string;
        createdAt?: string;
        securityScore?: number;
        fraudWarnings?: string[];
        status?: string;
      }>("/api/attendance/scan", attendanceData);

      if (response.success && response.data) {
        setSuccessMessage({
          title: "Attendance Recorded!",
          subtitle: "You have successfully checked in for this session.",
        });
        setShowSuccess(true);
        updateVerificationStep(4, "COMPLETED");
        await refetchHistory().catch(() => {});
      } else {
        // 409 Conflict / Already Marked handling for non-thrown errors (ApiClient returns them)
        const responseAny = response as any;
        if (responseAny.code === "HTTP_409" || response.message?.includes("already marked")) {
          setSuccessMessage({
            title: "Attendance Already Marked!",
            subtitle: "You have already checked in for this session.",
          });
          setShowSuccess(true);
          updateVerificationStep(4, "COMPLETED");
          await refetchHistory().catch(() => {});
          return;
        }
        throw new Error(response.message || "Failed to mark attendance");
      }
    } catch (error: unknown) {
      console.error("Failed to submit attendance:", error);

      // Handle re-thrown or unexpected errors
      const errorMessage = error instanceof Error ? error.message : "Failed to mark attendance";
      
      if (errorMessage.includes("already marked")) {
        setSuccessMessage({
          title: "Attendance Already Marked!",
          subtitle: "You have already checked in for this session.",
        });
        setShowSuccess(true);
        updateVerificationStep(4, "COMPLETED");
        return;
      }

      updateVerificationStep(4, "FAILED");
      const validationDetails = (error as any).errors ? "\nDetails: " + JSON.stringify((error as any).errors, null, 2) : "";
      alert(`Error: ${errorMessage}.${validationDetails} \n\nPlease try again.`);
    }
  }, [
    currentSession,
    scanResult,
    locationData,
    deviceFingerprint,
    photoData,
    updateVerificationStep,
    calculateSecurityScore,
    refetchHistory,
    setShowSuccess,
  ]);

  const getStepIcon = (step: string) => {
    switch (step) {
      case "QR_CODE_SCAN":
        return <QrCode className="h-5 w-5" />;
      case "LOCATION_VERIFICATION":
        return <MapPin className="h-5 w-5" />;
      case "DEVICE_VERIFICATION":
        return <Smartphone className="h-5 w-5" />;
      case "PHOTO_CAPTURE":
        return <Camera className="h-5 w-5" />;
      case "FINAL_CONFIRMATION":
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  // Real-time status updates
  useEffect(() => {
    checkDeviceCapabilities();
    startLocationTracking();
    updateConnectionStatus();

    const interval = setInterval(() => {
      updateConnectionStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [checkDeviceCapabilities, startLocationTracking, updateConnectionStatus]);

  // Handle URL parameters for navigation
  useEffect(() => {
    const view = searchParams?.get("view");
    if (view === "history") {
      setShowHistory(true);
    } else {
      setShowHistory(false);
    }

    // Auto-start scanner if session is provided
    const sessionToStart = searchParams?.get("session");
    if (sessionToStart && !isScanning && !scanResult) {
      handleQRScan();
    }
  }, [searchParams, isScanning, scanResult, handleQRScan]);

  // Initialize verification steps
  useEffect(() => {
    if (!isInitialized.current) {
      initializeVerificationSteps();
      checkDeviceCapabilities();
      startLocationTracking();
      isInitialized.current = true;
    }
  }, [
    initializeVerificationSteps,
    checkDeviceCapabilities,
    startLocationTracking,
  ]);

  // Sync verification steps with session settings
  useEffect(() => {
    if (currentSession) {
      setVerificationSteps((prev) =>
        prev.map((step) => {
          switch (step.currentStep) {
            case "LOCATION_VERIFICATION":
              return { ...step, isRequired: currentSession.isLocationRequired };
            case "DEVICE_VERIFICATION":
              return {
                ...step,
                isRequired: currentSession.isDeviceCheckRequired,
              };
            case "PHOTO_CAPTURE":
              return { ...step, isRequired: currentSession.isPhotoRequired };
            default:
              return step;
          }
        }),
      );
    }
  }, [currentSession]);

  // Automatic Verification Flow
  useEffect(() => {
    if (verificationSteps.length === 0) return;

    const currentStepIndex = currentStep;
    const previousStepIndex = currentStepIndex - 1;

    // If we are at the first step (QR Scan), we wait for user interaction
    if (currentStepIndex === 0) return;

    // Check if previous step was completed successfully
    if (previousStepIndex >= 0) {
      const previousStep = verificationSteps.find(
        (s) => s.step === previousStepIndex + 1,
      );
      if (previousStep?.status !== "COMPLETED") return;
    }

    // Trigger current step handler
    const triggerCurrentStep = async () => {
      switch (currentStepIndex) {
        case 1: // Location Verification
          await handleLocationVerification();
          break;
        case 2: // Device Verification
          await handleDeviceVerification();
          break;
        case 3: // Photo Capture
          if (currentSession?.isPhotoRequired) {
            // If photo is required, we might want to wait for user or auto-trigger
            // For now, let's auto-trigger the mock/capture logic
            await handlePhotoCapture();
          } else {
            // Skip if not required
            updateVerificationStep(3, "COMPLETED");
          }
          break;
        case 4: // Final Confirmation
          await handleFinalConfirmation();
          break;
      }
    };

    triggerCurrentStep();
  }, [
    currentStep,
    verificationSteps,
    currentSession,
    handleLocationVerification,
    handleDeviceVerification,
    handlePhotoCapture,
    handleFinalConfirmation,
    updateVerificationStep,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return (
    <DashboardLayout
      userName={user ? `${user.firstName} ${user.lastName}` : "Student"}
      userType="student"
    >
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20"
            >
              <QrCode className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2"
              >
                Student Attendance
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 dark:text-gray-400 text-lg"
              >
                Secure attendance with multi-step verification
              </motion.p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Activity
                className={`h-4 w-4 ${connectionStatus === "ONLINE" ? "text-green-600" : "text-red-600"}`}
              />
              <span className="text-sm font-medium">{connectionStatus}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
        {[
          {
            label: "Overall Attendance",
            value: `${attendanceStats.overallAttendance}%`,
            icon: CheckCircle,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50/50 dark:bg-emerald-900/20",
            border: "border-emerald-100 dark:border-emerald-900/30",
          },
          {
            label: "Total Classes",
            value: attendanceStats.totalClasses,
            icon: Clock,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50/50 dark:bg-blue-900/20",
            border: "border-blue-100 dark:border-blue-900/30",
          },
          {
            label: "Missed Classes",
            value: attendanceStats.missedClasses,
            icon: XCircle,
            color: "text-red-600 dark:text-red-400",
            bg: "bg-red-50/50 dark:bg-red-900/20",
            border: "border-red-100 dark:border-red-900/30",
          },
          {
            label: "Late Classes",
            value: attendanceStats.lateClasses,
            icon: AlertCircle,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50/50 dark:bg-amber-900/20",
            border: "border-amber-100 dark:border-amber-900/30",
          },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`relative overflow-hidden rounded-2xl p-4 md:p-5 shadow-sm border ${stat.border} bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl`}
          >
            <div className="flex flex-col h-full justify-between relative z-10">
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {stat.label}
                </p>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {String(stat.value)}
                </h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Permission Advisor Banner */}
      {(permissions.camera === "denied" ||
        permissions.location === "denied") && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl p-6 shadow-sm overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <AlertTriangle className="w-32 h-32" />
          </div>
          <div className="flex flex-col md:flex-row gap-6 relative z-10">
            <div className="p-4 bg-amber-100 dark:bg-amber-800 rounded-2xl h-fit flex-shrink-0 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-amber-900 dark:text-amber-200 mb-2 flex flex-wrap gap-2 items-center">
                <span>إذن الوصول مطلوب</span>
                <span className="text-sm font-normal opacity-50 font-sans">
                  |
                </span>
                <span className="font-sans">Permission Required</span>
              </h3>
              <p className="text-base text-amber-800 dark:text-amber-300 mb-6 leading-relaxed">
                <span className="font-bold">يرجى ملاحظة:</span> نظام الحضور
                يتطلب الوصول للكاميرا (لمسح الكود) والموقع (للتأكد من وجودك في
                المحاضرة).
                <br />
                <span className="font-sans italic">
                  Attendance tracking requires access to both Camera and
                  Location.
                </span>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/60 dark:bg-black/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-800/50">
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200 mb-3 uppercase tracking-wider">
                    How to Fix (English)
                  </p>
                  <ol className="text-sm text-amber-800 dark:text-amber-400 list-decimal pl-4 space-y-2">
                    <li>Click the 🔒 icon in address bar</li>
                    <li>
                      Switch <span className="font-bold">Camera</span> &{" "}
                      <span className="font-bold">Location</span> to{" "}
                      <b>Allow</b>
                    </li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
                <div className="bg-white/60 dark:bg-black/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-800/50 text-right">
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200 mb-3 uppercase tracking-wider">
                    خطوات الحل (بالعربية)
                  </p>
                  <ol className="text-sm text-amber-800 dark:text-amber-400 list-decimal pr-4 space-y-2 dir-rtl text-right">
                    <li>اضغط على أيقونة القفل 🔒 بجوار رابط الصفحة</li>
                    <li>
                      قم بتفعيل خيار &quot;الكاميرا&quot; و &quot;الموقع&quot;
                    </li>
                    <li>أعد تحميل الصفحة</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Scanner & Verification */}
        <div className="lg:col-span-2 space-y-8">
          {currentSession ? (
            <>
              {/* QR Scanner Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden"
              >
                <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between bg-white/50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                      <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        QR Scanner
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        Verify attendance for {currentSession.courseName}
                      </p>
                    </div>
                  </div>
                  {isScanning && (
                    <span className="flex items-center gap-2 text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Scanning...
                    </span>
                  )}
                </div>

                <div className="p-6 sm:p-8">
                  <div className="relative max-w-xs sm:max-w-sm mx-auto aspect-square bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-700 ring-1 ring-gray-200 dark:ring-gray-800">
                    {isScanning ? (
                      <>
                        <video
                          ref={videoRef}
                          className="absolute inset-0 w-full h-full object-cover"
                          muted
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-56 h-56 sm:w-64 sm:h-64 border-2 border-white/30 rounded-2xl relative">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl"></div>
                            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-transparent animate-scan"></div>
                          </div>
                        </div>
                        <div className="absolute bottom-6 left-0 right-0 text-center px-4 pointer-events-none">
                          <p className="text-white/90 text-sm font-medium bg-black/50 backdrop-blur-sm py-2 px-4 rounded-full inline-block">
                            Align QR code within frame
                          </p>
                        </div>
                        <button
                          onClick={stopScanner}
                          className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
                        >
                          <XCircle className="w-6 h-6" />
                        </button>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-6 text-center bg-gray-50 dark:bg-gray-800/50">
                        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                          <QrCode className="w-10 h-10 opacity-50" />
                        </div>
                        <p className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
                          {permissions.camera === "denied"
                            ? "Camera access is blocked"
                            : "Camera is currently off"}
                        </p>
                        {permissions.camera === "denied" && (
                          <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl max-w-xs border border-red-100 dark:border-red-900/30">
                            <p className="font-bold mb-1">To enable camera:</p>
                            <ol className="list-decimal text-left pl-4 space-y-1">
                              <li>
                                Tap the{" "}
                                <span className="font-bold">lock icon 🔒</span>{" "}
                                in address bar
                              </li>
                              <li>
                                Set Camera to{" "}
                                <span className="font-bold">Allow</span>
                              </li>
                              <li>Refresh page</li>
                            </ol>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex justify-center">
                    <Button
                      onClick={handleQRScan}
                      disabled={isScanning}
                      className={`
                        px-8 py-6 rounded-2xl text-base sm:text-lg font-bold shadow-xl transition-all hover:scale-105 active:scale-95 w-full sm:w-auto
                        ${
                          permissions.camera === "denied"
                            ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20"
                            : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-500/25"
                        }
                      `}
                    >
                      {isScanning ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Scanning...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Camera className="w-5 h-5" />
                          {permissions.camera === "denied"
                            ? "Retry Access"
                            : "Start Scanner"}
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Verification Steps */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden"
              >
                <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                      <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        Verification
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        Security checks
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="space-y-6">
                    {verificationSteps.map((step, index) => (
                      <div key={index} className="relative flex gap-4">
                        {/* Connector Line */}
                        {index !== verificationSteps.length - 1 && (
                          <div
                            className={`absolute left-[19px] top-10 bottom-[-24px] w-0.5 ${
                              step.status === "COMPLETED"
                                ? "bg-emerald-200 dark:bg-emerald-900"
                                : "bg-gray-100 dark:bg-gray-700"
                            }`}
                          />
                        )}

                        {/* Status Icon */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 z-10 transition-all duration-300 shadow-sm ${
                            step.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 ring-4 ring-emerald-50 dark:ring-emerald-900/10"
                              : step.status === "IN_PROGRESS"
                                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 ring-4 ring-blue-50 dark:ring-blue-900/10"
                                : step.status === "FAILED"
                                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 ring-4 ring-red-50 dark:ring-red-900/10"
                                  : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                          }`}
                        >
                          {step.status === "COMPLETED" ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : step.status === "FAILED" ? (
                            <XCircle className="w-5 h-5" />
                          ) : (
                            getStepIcon(step.currentStep)
                          )}
                        </div>

                        <div className="flex-1 pt-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3
                              className={`font-bold text-sm sm:text-base ${
                                step.status === "COMPLETED"
                                  ? "text-emerald-700 dark:text-emerald-400"
                                  : step.status === "IN_PROGRESS"
                                    ? "text-blue-700 dark:text-blue-400"
                                    : "text-gray-900 dark:text-gray-100"
                              }`}
                            >
                              {step.currentStep.replace(/_/g, " ")}
                            </h3>
                            <Badge
                              variant={
                                step.status === "COMPLETED"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                step.status === "COMPLETED"
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                                  : ""
                              }
                            >
                              {step.status}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            {step.isRequired ? "Required" : "Optional"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 dark:border-gray-700/50 p-12 text-center"
              >
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  No Active Sessions
                </h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  There are no attendance sessions currently active for your
                  enrolled courses. Please check back later or view your
                  schedule.
                </p>
              </motion.div>

              {/* Attendance Progress Chart - Moved here when no active session */}
              <AttendanceChart
                records={attendanceHistory.map((record) => {
                  const isValidDate =
                    record.timestamp instanceof Date &&
                    !isNaN(record.timestamp.getTime());
                  return {
                    id: record.id,
                    course: record.courseName,
                    date: isValidDate
                      ? record.timestamp.toISOString()
                      : new Date().toISOString(),
                    status:
                      record.status === "SUCCESS"
                        ? "present"
                        : record.status === "FAILED"
                          ? "absent"
                          : "late",
                    type: "Lecture",
                    time: isValidDate
                      ? record.timestamp.toLocaleTimeString()
                      : "00:00",
                    instructor: "Unknown",
                  };
                })}
                overallAttendance={attendanceStats.overallAttendance}
              />
            </>
          )}
        </div>

        {/* Right Column - Status & Actions */}
        <div className="space-y-6 lg:space-y-8">
          {/* Current Status Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden"
          >
            <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Live Status
              </h2>
            </div>
            <div className="p-4 space-y-2">
              {[
                {
                  label: "Location",
                  value: locationData ? `${locationData.accuracy}m` : "N/A",
                  icon: MapPin,
                  color: "text-blue-500",
                  bg: "bg-blue-50 dark:bg-blue-900/20",
                },
                {
                  label: "Device",
                  value: deviceFingerprint ? "Verified" : "Pending",
                  icon: Smartphone,
                  color: "text-emerald-500",
                  bg: "bg-emerald-50 dark:bg-emerald-900/20",
                },
                {
                  label: "Photo",
                  value: photoData ? "Captured" : "Pending",
                  icon: Camera,
                  color: "text-purple-500",
                  bg: "bg-purple-50 dark:bg-purple-900/20",
                },
                {
                  label: "Score",
                  value: `${calculateSecurityScore()}%`,
                  icon: Shield,
                  color: "text-amber-500",
                  bg: "bg-amber-50 dark:bg-amber-900/20",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.bg}`}>
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden"
          >
            <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-600" />
                Quick Actions
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {[
                {
                  icon: Settings,
                  label: "Settings",
                  onClick: () => setShowSettings(true),
                },
                {
                  icon: History,
                  label: "History",
                  onClick: () => setShowHistory(true),
                },
                {
                  icon: HelpCircle,
                  label: "Help & Support",
                  onClick: () => setShowHelp(true),
                },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={action.onClick}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                      <action.icon className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-indigo-600" />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                      {action.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-400" />
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <SecuritySettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={securitySettings}
        onSave={(newSettings) => {
          setSecuritySettings(newSettings);
          setShowSettings(false);
        }}
      />

      <AttendanceHistoryModal
        isOpen={showHistory}
        onClose={() => {
          setShowHistory(false);
          // Clear query parameters using Next.js router
          if (pathname) router.replace(pathname);
        }}
        records={attendanceHistory}
      />

      <HelpSupportModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      <SuccessAnimation
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
        message={successMessage.title}
        subMessage={successMessage.subtitle}
      />
    </DashboardLayout>
  );
}
