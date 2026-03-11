"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Wifi,
  Battery,
  Signal,
  Settings,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

// Types
interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
  source: "GPS" | "NETWORK" | "PASSIVE";
  isVerified: boolean;
  isWithinRadius: boolean;
  distance?: number;
  timezone: string;
  address?: string;
  city?: string;
  country?: string;
}

interface GeofenceData {
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  name: string;
  type: "CIRCLE" | "POLYGON" | "RECTANGLE";
  isActive: boolean;
  tolerance: number;
}

interface LocationValidation {
  isValid: boolean;
  score: number;
  warnings: string[];
  errors: string[];
  recommendations: string[];
  distance: number;
  isWithinRadius: boolean;
  accuracyScore: number;
  timeScore: number;
  sourceScore: number;
}

interface LocationPermission {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  canAskAgain: boolean;
  level: "NONE" | "COARSE" | "FINE";
}

interface LocationVerificationProps {
  onLocationUpdate: (location: LocationData) => void;
  onValidationComplete: (validation: LocationValidation) => void;
  onPermissionChange: (permission: LocationPermission) => void;
  geofence: GeofenceData;
  requiredAccuracy: number;
  maxDistance: number;
  enableHighAccuracy: boolean;
  timeout: number;
  enableGeofencing: boolean;
  enableAddressLookup: boolean;
  enableTimezoneDetection: boolean;
}

export function LocationVerification({
  onLocationUpdate,
  onValidationComplete,
  onPermissionChange,
  geofence,
  requiredAccuracy,
  enableHighAccuracy,
  timeout,
  enableGeofencing,
  enableAddressLookup,
}: LocationVerificationProps) {
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationPermission, setLocationPermission] =
    useState<LocationPermission>({
      granted: false,
      denied: false,
      prompt: true,
      canAskAgain: true,
      level: "NONE",
    });
  const [isTracking, setIsTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [validation, setValidation] = useState<LocationValidation | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "ONLINE" | "OFFLINE" | "POOR"
  >("ONLINE");
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [signalStrength, setSignalStrength] = useState(4);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);

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

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const radLat1 = (lat1 * Math.PI) / 180;
    const radLat2 = (lat2 * Math.PI) / 180;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(radLat1) *
        Math.cos(radLat2) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const lookupAddress = async (latitude: number, longitude: number) => {
    try {
      // Mock address lookup - replace with actual geocoding service
      const response = await fetch(
        `https://api.example.com/geocode?lat=${latitude}&lng=${longitude}`,
      );
      const data = await response.json();

      return {
        address: data.address,
        city: data.city,
        country: data.country,
      };
    } catch (error) {
      console.error("Address lookup failed:", error);
      return {};
    }
  };

  const validateLocation = useCallback(
    (location: LocationData) => {
      const warnings: string[] = [];
      const errors: string[] = [];
      const recommendations: string[] = [];
      let score = 100;

      // Check accuracy
      if (location.accuracy > requiredAccuracy) {
        warnings.push(
          `Location accuracy is ${location.accuracy}m, required is ${requiredAccuracy}m`,
        );
        score -= 20;
      }

      // Check distance
      if (enableGeofencing && location.distance) {
        if (location.distance > geofence.radius) {
          errors.push(
            `You are ${Math.round(location.distance)}m away from the allowed area`,
          );
          score -= 50;
        } else if (location.distance > geofence.radius * 0.8) {
          warnings.push(
            `You are close to the boundary (${Math.round(location.distance)}m away)`,
          );
          score -= 10;
        }
      }

      // Check connection status
      if (connectionStatus === "OFFLINE") {
        errors.push("No internet connection");
        score -= 30;
      }

      // Check battery level
      if (batteryLevel < 20) {
        warnings.push("Low battery level may affect GPS accuracy");
        score -= 10;
      }

      // Check signal strength
      if (signalStrength < 2) {
        warnings.push("Poor network signal may affect location accuracy");
        score -= 15;
      }

      // Generate recommendations
      if (location.accuracy > requiredAccuracy) {
        recommendations.push("Move to an area with better GPS signal");
      }
      if (
        enableGeofencing &&
        location.distance &&
        location.distance > geofence.radius
      ) {
        recommendations.push("Move closer to the designated area");
      }
      if (batteryLevel < 20) {
        recommendations.push("Charge your device for better GPS performance");
      }

      const validation: LocationValidation = {
        isValid: errors.length === 0,
        score: Math.max(0, score),
        warnings,
        errors,
        recommendations,
        distance: location.distance || 0,
        isWithinRadius: location.isWithinRadius,
        accuracyScore: Math.max(
          0,
          100 - (location.accuracy / requiredAccuracy) * 100,
        ),
        timeScore: 100, // Could be based on time since last update
        sourceScore: location.source === "GPS" ? 100 : 80,
      };

      setValidation(validation);
      onValidationComplete(validation);
    },
    [
      requiredAccuracy,
      enableGeofencing,
      geofence,
      connectionStatus,
      batteryLevel,
      signalStrength,
      onValidationComplete,
    ],
  );

  const handleLocationSuccess = useCallback(
    (position: GeolocationPosition) => {
      const location: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
        timestamp: new Date(),
        source: "GPS",
        isVerified: true,
        isWithinRadius: false,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      // Calculate distance to geofence center
      if (enableGeofencing) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          geofence.center.latitude,
          geofence.center.longitude,
        );

        location.distance = distance;
        location.isWithinRadius = distance <= geofence.radius;
      }

      // Address lookup
      if (enableAddressLookup) {
        lookupAddress(location.latitude, location.longitude)
          .then((address) => {
            setLocationData((prev) => (prev ? { ...prev, ...address } : null));
          })
          .catch((error) => {
            console.error("Address lookup failed:", error);
          });
      }

      setLocationData(location);
      setLastUpdate(new Date());
      setTrackingError(null);
      setRetryCount(0);
    },
    [enableGeofencing, geofence, enableAddressLookup],
  );

  // Forward declaration of startLocationTracking to avoid hoisting issues in handleLocationError
  // Using a ref to hold the function since it's defined via useCallback later
  const startTrackingRef = React.useRef<() => void>(() => {});

  const handleLocationError = useCallback(
    (error: GeolocationPositionError) => {
      console.error("Location tracking error:", error);

      let errorMessage = "Location tracking failed";
      let canRetry = true;

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location permission denied";
          canRetry = false;
          setLocationPermission((prev) => ({
            ...prev,
            denied: true,
            granted: false,
          }));
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information unavailable";
          break;
        case error.TIMEOUT:
          errorMessage = "Location request timed out";
          break;
      }

      setTrackingError(errorMessage);
      setIsTracking(false);

      if (canRetry && retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          startTrackingRef.current();
        }, 2000);
      }
    },
    [retryCount, maxRetries],
  );

  const stopLocationTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  }, [watchId]);

  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setTrackingError("Geolocation is not supported by your browser");
      return;
    }

    setIsTracking(true);
    const id = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        enableHighAccuracy: enableHighAccuracy,
        timeout: timeout,
        maximumAge: 0,
      },
    );

    setWatchId(id);
  }, [handleLocationSuccess, handleLocationError, enableHighAccuracy, timeout]);

  // Assign the ref so handleLocationError can call it
  useEffect(() => {
    startTrackingRef.current = startLocationTracking;
  }, [startLocationTracking]);

  const requestLocationPermission = async () => {
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: enableHighAccuracy,
            timeout: timeout,
            maximumAge: 30000,
          });
        },
      );

      handleLocationSuccess(position);
      setLocationPermission({
        granted: true,
        denied: false,
        prompt: false,
        canAskAgain: true,
        level: "FINE",
      });
      onPermissionChange({
        granted: true,
        denied: false,
        prompt: false,
        canAskAgain: true,
        level: "FINE",
      });
    } catch (error) {
      handleLocationError(error as GeolocationPositionError);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    setTrackingError(null);
    startLocationTracking();
  };

  useEffect(() => {
    const cleanup = startStatusMonitoring();
    return () => {
      cleanup();
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [startStatusMonitoring, watchId]);

  useEffect(() => {
    if (locationData) {
      onLocationUpdate(locationData);
      validateLocation(locationData);
    }
  }, [locationData, onLocationUpdate, validateLocation]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPin className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Location Verification</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center space-x-2">
          <Wifi
            className={`h-4 w-4 ${connectionStatus === "ONLINE" ? "text-green-600" : connectionStatus === "POOR" ? "text-yellow-600" : "text-red-600"}`}
          />
          <span className="text-sm font-medium">{connectionStatus}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Battery
            className={`h-4 w-4 ${batteryLevel > 20 ? "text-green-600" : "text-red-600"}`}
          />
          <span className="text-sm font-medium">{batteryLevel}%</span>
        </div>
        <div className="flex items-center space-x-2">
          <Signal
            className={`h-4 w-4 ${signalStrength > 2 ? "text-green-600" : "text-yellow-600"}`}
          />
          <span className="text-sm font-medium">{signalStrength}/4</span>
        </div>
        <div className="flex items-center space-x-2">
          <Shield
            className={`h-4 w-4 ${locationPermission.granted ? "text-green-600" : "text-red-600"}`}
          />
          <span className="text-sm font-medium">
            {locationPermission.granted ? "Protected" : "No Permission"}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tracking Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Live Tracking</span>
                <Switch
                  checked={isTracking}
                  onCheckedChange={(checked) =>
                    checked ? startLocationTracking() : stopLocationTracking()
                  }
                  disabled={!locationPermission.granted}
                />
              </div>

              {trackingError && (
                <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold">Tracking Error</p>
                    <p>{trackingError}</p>
                    <Button
                      variant="ghost"
                      className="p-0 h-auto text-red-600 font-bold"
                      onClick={handleRetry}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              )}

              {locationData && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Latitude</span>
                    <span className="font-mono">
                      {locationData.latitude.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Longitude</span>
                    <span className="font-mono">
                      {locationData.longitude.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Accuracy</span>
                    <span
                      className={`${locationData.accuracy <= requiredAccuracy ? "text-green-600" : "text-red-600"}`}
                    >
                      ±{locationData.accuracy.toFixed(1)}m
                    </span>
                  </div>
                  {lastUpdate && (
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Last Update</span>
                      <span>{lastUpdate.toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              )}

              {!locationPermission.granted && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={requestLocationPermission}
                >
                  Enable Location
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Geofence Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-full ${validation?.isWithinRadius ? "bg-green-100" : "bg-red-100"}`}
                >
                  {validation?.isWithinRadius ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{geofence.name}</p>
                  <p className="text-xs text-gray-500">
                    Radius: {geofence.radius}m
                  </p>
                </div>
              </div>

              {locationData && (
                <div className="space-y-2">
                  <div className="text-sm font-medium mb-1">
                    Distance to Center
                  </div>
                  <Progress
                    value={Math.min(
                      100,
                      ((locationData.distance || 0) / (geofence.radius * 2)) *
                        100,
                    )}
                    className={
                      validation?.isWithinRadius ? "bg-green-100" : "bg-red-100"
                    }
                  />
                  <div className="flex justify-between text-xs">
                    <span>{Math.round(locationData.distance || 0)}m</span>
                    <span>Target: {geofence.radius}m</span>
                  </div>
                </div>
              )}

              {validation && validation.warnings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-yellow-600 uppercase">
                    Warnings
                  </p>
                  {validation.warnings.map((w, i) => (
                    <div
                      key={i}
                      className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-100"
                    >
                      {w}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Summary */}
      {validation && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase mb-1">
                  Total Score
                </p>
                <p
                  className={`text-2xl font-bold ${validation.score >= 80 ? "text-green-600" : validation.score >= 50 ? "text-yellow-600" : "text-red-600"}`}
                >
                  {validation.score}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase mb-1">Accuracy</p>
                <p className="text-xl font-semibold">
                  {Math.round(validation.accuracyScore)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase mb-1">Source</p>
                <p className="text-xl font-semibold">
                  {Math.round(validation.sourceScore)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase mb-1">
                  Final Status
                </p>
                <Badge variant={validation.isValid ? "default" : "destructive"}>
                  {validation.isValid ? "VERIFIED" : "FAILED"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
