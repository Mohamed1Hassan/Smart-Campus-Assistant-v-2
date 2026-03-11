"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Smartphone,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Wifi,
  Battery,
  Signal,
  AlertCircle,
  Settings,
  HelpCircle,
  Fingerprint,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

// Types
interface DeviceFingerprint {
  fingerprint: string;
  deviceInfo: string;
  browserInfo: string;
  hardwareInfo: string;
  networkInfo: string;
  screenInfo: string;
  timezoneInfo: string;
  languageInfo: string;
  isVerified: boolean;
  isNewDevice: boolean;
  lastUsed: Date;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  components: DeviceComponent[];
}

interface DeviceComponent {
  name: string;
  value: string;
  weight: number;
  isStable: boolean;
  lastChanged: Date;
}

interface DeviceValidation {
  isValid: boolean;
  score: number;
  warnings: string[];
  errors: string[];
  recommendations: string[];
  stabilityScore: number;
  uniquenessScore: number;
  riskScore: number;
}

interface DeviceRegistration {
  isRegistered: boolean;
  registrationDate: Date;
  deviceCount: number;
  maxDevices: number;
  allowedDevices: string[];
  blockedDevices: string[];
}

interface DeviceVerificationProps {
  onFingerprintUpdate: (fingerprint: DeviceFingerprint) => void;
  onValidationComplete: (validation: DeviceValidation) => void;
  onRegistrationChange: (registration: DeviceRegistration) => void;
  enableHardwareFingerprinting: boolean;
  enableBrowserFingerprinting: boolean;
  enableNetworkFingerprinting: boolean;
  enableCanvasFingerprinting: boolean;
  enableWebGLFingerprinting: boolean;
  enableAudioFingerprinting: boolean;
  enableFontFingerprinting: boolean;
  maxDevices: number;
  riskThreshold: number;
  stabilityThreshold: number;
}

export function DeviceVerification({
  onFingerprintUpdate,
  onValidationComplete,
  onRegistrationChange,
  enableHardwareFingerprinting,
  enableBrowserFingerprinting,
  enableNetworkFingerprinting,
  enableCanvasFingerprinting,
  enableWebGLFingerprinting,
  enableAudioFingerprinting,
  enableFontFingerprinting,
  maxDevices,
}: DeviceVerificationProps) {
  const [deviceFingerprint, setDeviceFingerprint] =
    useState<DeviceFingerprint | null>(null);
  const [deviceRegistration, setDeviceRegistration] =
    useState<DeviceRegistration>({
      isRegistered: false,
      registrationDate: new Date(),
      deviceCount: 0,
      maxDevices: maxDevices,
      allowedDevices: [],
      blockedDevices: [],
    });
  const [validation, setValidation] = useState<DeviceValidation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "ONLINE" | "OFFLINE" | "POOR"
  >("ONLINE");
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [signalStrength, setSignalStrength] = useState(4);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);

  const checkDeviceRegistration = useCallback(async () => {
    try {
      // Mock device registration check
      const isRegistered = Math.random() > 0.5;
      const deviceCount = Math.floor(Math.random() * 3);

      setDeviceRegistration((prev) => ({
        ...prev,
        isRegistered,
        deviceCount,
        registrationDate: isRegistered ? new Date() : prev.registrationDate,
      }));
    } catch (error) {
      console.error("Device registration check failed:", error);
    }
  }, []);

  const updateConnectionStatus = useCallback(() => {
    if (navigator.onLine) {
      setConnectionStatus("ONLINE");
    } else {
      setConnectionStatus("OFFLINE");
    }
  }, []);

  const updateBatteryLevel = useCallback(() => {
    interface NavigatorWithBattery extends Navigator {
      getBattery?: () => Promise<{ level: number }>;
    }
    if ("getBattery" in navigator) {
      (navigator as NavigatorWithBattery).getBattery?.().then((battery) => {
        if (battery) setBatteryLevel(Math.round(battery.level * 100));
      });
    }
  }, []);

  const updateSignalStrength = useCallback(() => {
    interface NavigatorWithConnection extends Navigator {
      connection?: { downlink: number };
    }
    if ("connection" in navigator) {
      const connection = (navigator as NavigatorWithConnection).connection;
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

  const getHardwareFingerprint = useCallback(async (): Promise<string> => {
    const gl = document.createElement("canvas").getContext("webgl");
    if (!gl) return "unknown";

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const vendor = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      : "unknown";
    const renderer = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : "unknown";

    return `${vendor}-${renderer}-${navigator.hardwareConcurrency || "unknown"}-${(navigator as { deviceMemory?: number }).deviceMemory || "unknown"}`;
  }, []);

  const getBrowserFingerprint = useCallback((): string => {
    const plugins = Array.from(navigator.plugins)
      .map((p) => p.name)
      .join(",");
    const mimeTypes = Array.from(navigator.mimeTypes)
      .map((m) => m.type)
      .join(",");
    return `${navigator.userAgent}-${plugins}-${mimeTypes}`;
  }, []);

  const getNetworkFingerprint = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch {
      return "unknown";
    }
  }, []);

  const getCanvasFingerprint = useCallback((): string => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "unknown";

    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("Hello, world!", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("Hello, world!", 4, 17);

    return canvas.toDataURL();
  }, []);

  const getWebGLFingerprint = useCallback((): string => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");
    if (!gl) return "unknown";

    const extensions = gl.getSupportedExtensions()?.join(",") || "";
    const params = [
      gl.MAX_TEXTURE_SIZE,
      gl.MAX_VIEWPORT_DIMS,
      gl.ALIASED_LINE_WIDTH_RANGE,
      gl.ALIASED_POINT_SIZE_RANGE,
    ]
      .map((p) => gl.getParameter(p as number))
      .join(",");

    return `${extensions}-${params}`;
  }, []);

  const getAudioFingerprint = useCallback(async (): Promise<string> => {
    try {
      interface WindowWithAudioContext extends Window {
        webkitAudioContext?: typeof AudioContext;
      }
      const audioContext = new (
        window.AudioContext ||
        (window as WindowWithAudioContext).webkitAudioContext!
      )();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);

      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(0);

      return new Promise((resolve) => {
        scriptProcessor.onaudioprocess = (event) => {
          const buffer = event.inputBuffer.getChannelData(0);
          const fingerprint = Array.from(buffer).slice(0, 30).join(",");
          oscillator.stop();
          audioContext.close();
          resolve(fingerprint);
        };
      });
    } catch {
      return "audio-not-supported";
    }
  }, []);

  const getFontFingerprint = useCallback((): string => {
    const fonts = [
      "Arial",
      "Helvetica",
      "Times New Roman",
      "Courier New",
      "Verdana",
      "Georgia",
      "Palatino",
      "Garamond",
      "Bookman",
      "Comic Sans MS",
      "Trebuchet MS",
      "Arial Black",
      "Impact",
    ];

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "canvas-not-supported";

    const availableFonts: string[] = [];

    fonts.forEach((font) => {
      ctx.font = `12px ${font}`;
      const metrics = ctx.measureText("test");
      if (metrics.width > 0) {
        availableFonts.push(font);
      }
    });

    return availableFonts.join(",");
  }, []);

  const generateHash = useCallback((input: string): string => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }, []);

  const calculateStabilityScore = useCallback(
    (fingerprint: DeviceFingerprint): number => {
      const stableComponents = fingerprint.components.filter(
        (comp) => comp.isStable,
      );
      return (stableComponents.length / fingerprint.components.length) * 100;
    },
    [],
  );

  const calculateUniquenessScore = useCallback((): number => {
    // Mock uniqueness calculation
    return Math.random() * 100;
  }, []);

  const calculateRiskScore = useCallback(
    (fingerprint: DeviceFingerprint): number => {
      switch (fingerprint.riskLevel) {
        case "LOW":
          return 20;
        case "MEDIUM":
          return 40;
        case "HIGH":
          return 70;
        case "CRITICAL":
          return 90;
        default:
          return 50;
      }
    },
    [],
  );

  const validateDevice = useCallback(
    (fingerprint: DeviceFingerprint) => {
      const warnings: string[] = [];
      const errors: string[] = [];
      const recommendations: string[] = [];
      let score = 100;

      // Check if device is registered
      if (!deviceRegistration.isRegistered) {
        warnings.push("Device is not registered");
        score -= 20;
      }

      // Check device count
      if (deviceRegistration.deviceCount >= deviceRegistration.maxDevices) {
        errors.push("Maximum number of devices reached");
        score -= 50;
      }

      // Check if device is blocked
      if (deviceRegistration.blockedDevices.includes(fingerprint.fingerprint)) {
        errors.push("Device is blocked");
        score -= 100;
      }

      // Check risk level
      if (
        fingerprint.riskLevel === "HIGH" ||
        fingerprint.riskLevel === "CRITICAL"
      ) {
        warnings.push(`High risk device detected: ${fingerprint.riskLevel}`);
        score -= 30;
      }

      // Check confidence level
      if (fingerprint.confidence < 80) {
        warnings.push("Low confidence in device fingerprint");
        score -= 15;
      }

      // Check connection status
      if (connectionStatus === "OFFLINE") {
        errors.push("No internet connection");
        score -= 30;
      }

      // Check battery level
      if (batteryLevel < 20) {
        warnings.push("Low battery level may affect device performance");
        score -= 10;
      }

      // Check signal strength
      if (signalStrength < 2) {
        warnings.push("Poor network signal may affect device verification");
        score -= 15;
      }

      // Generate recommendations
      if (!deviceRegistration.isRegistered) {
        recommendations.push("Register this device for better security");
      }
      if (
        fingerprint.riskLevel === "HIGH" ||
        fingerprint.riskLevel === "CRITICAL"
      ) {
        recommendations.push("Contact support if you believe this is an error");
      }
      if (fingerprint.confidence < 80) {
        recommendations.push("Try refreshing the page or restarting the app");
      }

      const validationObj: DeviceValidation = {
        isValid: errors.length === 0,
        score: Math.max(0, score),
        warnings,
        errors,
        recommendations,
        stabilityScore: calculateStabilityScore(fingerprint),
        uniquenessScore: calculateUniquenessScore(),
        riskScore: calculateRiskScore(fingerprint),
      };

      setValidation(validationObj);
      onValidationComplete(validationObj);
    },
    [
      deviceRegistration,
      connectionStatus,
      batteryLevel,
      signalStrength,
      onValidationComplete,
      calculateStabilityScore,
      calculateUniquenessScore,
      calculateRiskScore,
    ],
  );

  const generateDeviceFingerprint = useCallback(async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setRetryCount(0);

    try {
      const components: DeviceComponent[] = [];

      // Collect base information
      const screenInfo = `${window.screen.width}x${window.screen.height}-${window.screen.colorDepth}`;
      const timezoneInfo = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const languageInfo = navigator.language;

      components.push(
        {
          name: "Screen",
          value: screenInfo,
          weight: 1,
          isStable: true,
          lastChanged: new Date(),
        },
        {
          name: "Timezone",
          value: timezoneInfo,
          weight: 1,
          isStable: true,
          lastChanged: new Date(),
        },
        {
          name: "Language",
          value: languageInfo,
          weight: 1,
          isStable: true,
          lastChanged: new Date(),
        },
      );

      // Collect fingerprinting components based on settings
      const promises: Promise<void>[] = [];

      let hardwareInfo = "";
      if (enableHardwareFingerprinting) {
        promises.push(
          getHardwareFingerprint().then((info) => {
            hardwareInfo = info;
            components.push({
              name: "Hardware",
              value: info,
              weight: 3,
              isStable: true,
              lastChanged: new Date(),
            });
          }),
        );
      }

      let browserInfo = "";
      if (enableBrowserFingerprinting) {
        browserInfo = getBrowserFingerprint();
        components.push({
          name: "Browser",
          value: browserInfo,
          weight: 2,
          isStable: true,
          lastChanged: new Date(),
        });
      }

      let networkInfo = "";
      if (enableNetworkFingerprinting) {
        promises.push(
          getNetworkFingerprint().then((info) => {
            networkInfo = info;
            components.push({
              name: "Network",
              value: info,
              weight: 1,
              isStable: false,
              lastChanged: new Date(),
            });
          }),
        );
      }

      let canvasInfo = "";
      if (enableCanvasFingerprinting) {
        canvasInfo = getCanvasFingerprint();
        components.push({
          name: "Canvas",
          value: generateHash(canvasInfo),
          weight: 2,
          isStable: true,
          lastChanged: new Date(),
        });
      }

      if (enableWebGLFingerprinting) {
        const webglInfo = getWebGLFingerprint();
        components.push({
          name: "WebGL",
          value: generateHash(webglInfo),
          weight: 2,
          isStable: true,
          lastChanged: new Date(),
        });
      }

      if (enableAudioFingerprinting) {
        promises.push(
          getAudioFingerprint().then((info) => {
            components.push({
              name: "Audio",
              value: generateHash(info),
              weight: 2,
              isStable: true,
              lastChanged: new Date(),
            });
          }),
        );
      }

      if (enableFontFingerprinting) {
        const fontInfo = getFontFingerprint();
        components.push({
          name: "Fonts",
          value: generateHash(fontInfo),
          weight: 2,
          isStable: true,
          lastChanged: new Date(),
        });
      }

      await Promise.all(promises);

      // Combine all components into a final fingerprint
      const fingerprintData = components.map((c) => c.value).join("|");
      const finalFingerprint = generateHash(fingerprintData);

      const newFingerprint: DeviceFingerprint = {
        fingerprint: finalFingerprint,
        deviceInfo: navigator.userAgent,
        browserInfo,
        hardwareInfo,
        networkInfo,
        screenInfo,
        timezoneInfo,
        languageInfo,
        isVerified: false,
        isNewDevice: true,
        lastUsed: new Date(),
        riskLevel: "LOW",
        confidence: 90,
        components,
      };

      setDeviceFingerprint(newFingerprint);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to generate device fingerprint";
      setGenerationError(errorMessage);

      if (retryCount < maxRetries) {
        setRetryCount((prev) => prev + 1);
        setTimeout(generateDeviceFingerprint, 2000);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [
    enableHardwareFingerprinting,
    enableBrowserFingerprinting,
    enableNetworkFingerprinting,
    enableCanvasFingerprinting,
    enableWebGLFingerprinting,
    enableAudioFingerprinting,
    enableFontFingerprinting,
    getHardwareFingerprint,
    getBrowserFingerprint,
    getNetworkFingerprint,
    getCanvasFingerprint,
    getWebGLFingerprint,
    getAudioFingerprint,
    getFontFingerprint,
    generateHash,
    retryCount,
    maxRetries,
  ]);

  const registerDevice = async () => {
    try {
      if (deviceFingerprint) {
        // Mock device registration
        setDeviceRegistration((prev) => ({
          ...prev,
          isRegistered: true,
          deviceCount: prev.deviceCount + 1,
          registrationDate: new Date(),
          allowedDevices: [
            ...prev.allowedDevices,
            deviceFingerprint.fingerprint,
          ],
        }));
      }
    } catch (error) {
      console.error("Device registration failed:", error);
    }
  };

  const handleRetry = () => {
    setGenerationError(null);
    setRetryCount(0);
    generateDeviceFingerprint();
  };

  // Initialize device verification
  useEffect(() => {
    generateDeviceFingerprint();
    checkDeviceRegistration();
    const cleanup = startStatusMonitoring();

    // Register event listener
    window.addEventListener("online", updateConnectionStatus);
    window.addEventListener("offline", updateConnectionStatus);

    return () => {
      cleanup();
      window.removeEventListener("online", updateConnectionStatus);
      window.removeEventListener("offline", updateConnectionStatus);
    };
  }, [
    generateDeviceFingerprint,
    checkDeviceRegistration,
    startStatusMonitoring,
    updateConnectionStatus,
  ]);

  // Handle fingerprint updates
  useEffect(() => {
    if (deviceFingerprint) {
      onFingerprintUpdate(deviceFingerprint);
      validateDevice(deviceFingerprint);
    }
  }, [deviceFingerprint, onFingerprintUpdate, validateDevice]);

  // Handle registration changes
  useEffect(() => {
    onRegistrationChange(deviceRegistration);
  }, [deviceRegistration, onRegistrationChange]);

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case "LOW":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "MEDIUM":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "HIGH":
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case "CRITICAL":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Smartphone className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Device Verification</h2>
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
          <Fingerprint className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium">
            {deviceFingerprint ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Device Registration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Device Registration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Registration Status</div>
                <div className="text-sm text-muted-foreground">
                  {deviceRegistration.isRegistered
                    ? "Registered"
                    : "Not Registered"}
                </div>
              </div>
              <Badge
                className={
                  deviceRegistration.isRegistered
                    ? "bg-green-500"
                    : "bg-red-500"
                }
              >
                {deviceRegistration.isRegistered
                  ? "Registered"
                  : "Not Registered"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium">Device Count</div>
                <div className="text-sm text-muted-foreground">
                  {deviceRegistration.deviceCount} /{" "}
                  {deviceRegistration.maxDevices}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Registration Date</div>
                <div className="text-sm text-muted-foreground">
                  {deviceRegistration.registrationDate.toLocaleDateString()}
                </div>
              </div>
            </div>

            {!deviceRegistration.isRegistered && (
              <Button
                onClick={registerDevice}
                disabled={!deviceFingerprint}
                className="w-full"
              >
                Register Device
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Device Fingerprint */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Fingerprint className="h-5 w-5" />
            <span>Device Fingerprint</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Generation Controls */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={generateDeviceFingerprint}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-4 w-4 mr-2" />
                    Generate Fingerprint
                  </>
                )}
              </Button>

              {generationError && (
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  disabled={isGenerating}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              )}
            </div>

            {/* Fingerprint Data */}
            {deviceFingerprint && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">Fingerprint</div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {deviceFingerprint.fingerprint}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Risk Level</div>
                    <div className="flex items-center space-x-2">
                      {getRiskIcon(deviceFingerprint.riskLevel)}
                      <Badge
                        className={getRiskBadge(deviceFingerprint.riskLevel)}
                      >
                        {deviceFingerprint.riskLevel}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Confidence</div>
                    <div className="text-sm text-muted-foreground">
                      {deviceFingerprint.confidence}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Last Used</div>
                    <div className="text-sm text-muted-foreground">
                      {deviceFingerprint.lastUsed.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Device Components */}
                <div>
                  <div className="text-sm font-medium mb-2">
                    Fingerprint Components
                  </div>
                  <div className="space-y-2">
                    {deviceFingerprint.components.map((component, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span className="text-sm font-medium">
                            {component.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{component.weight}</Badge>
                          <Badge
                            className={
                              component.isStable
                                ? "bg-green-500"
                                : "bg-yellow-500"
                            }
                          >
                            {component.isStable ? "Stable" : "Variable"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Generation Error */}
            {generationError && (
              <div className="text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                {generationError}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <span>Device Validation</span>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium">Stability Score</div>
                  <div className="text-sm text-muted-foreground">
                    {validation.stabilityScore}%
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Uniqueness Score</div>
                  <div className="text-sm text-muted-foreground">
                    {validation.uniquenessScore}%
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Risk Score</div>
                  <div className="text-sm text-muted-foreground">
                    {validation.riskScore}%
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

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Device Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Hardware Fingerprinting
                  </span>
                  <Switch
                    checked={enableHardwareFingerprinting}
                    onCheckedChange={() => {
                      // Handle hardware fingerprinting setting change
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Browser Fingerprinting
                  </span>
                  <Switch
                    checked={enableBrowserFingerprinting}
                    onCheckedChange={() => {
                      // Handle browser fingerprinting setting change
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Canvas Fingerprinting
                  </span>
                  <Switch
                    checked={enableCanvasFingerprinting}
                    onCheckedChange={() => {
                      // Handle canvas fingerprinting setting change
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
              <CardTitle>Device Help</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium">
                    What is Device Fingerprinting?
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Device fingerprinting creates a unique identifier for your
                    device using hardware and software characteristics.
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">Why is it needed?</div>
                  <div className="text-sm text-muted-foreground">
                    It helps prevent fraud and ensures attendance is taken from
                    the correct device.
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">Privacy</div>
                  <div className="text-sm text-muted-foreground">
                    Your device fingerprint is encrypted and only used for
                    security purposes.
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
