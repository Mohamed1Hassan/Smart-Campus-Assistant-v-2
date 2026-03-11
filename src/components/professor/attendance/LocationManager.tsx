"use client";
import React, { useState, useEffect, useCallback } from "react";
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

import { Switch } from "../../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Alert, AlertDescription } from "../../ui/alert";
import {
  MapPin,
  Navigation,
  Search,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  RefreshCw,
  Eye,
  Shield,
  Clock,
  Compass,
  Target,
  CheckCircle,
} from "lucide-react";

// Types
interface Location {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radius: number;
  accuracy: number;
  isActive: boolean;
  isDefault: boolean;
  geofencing: {
    enabled: boolean;
    strictMode: boolean;
    allowOutside: boolean;
    maxDistance: number;
  };
  timeRestrictions: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    days: string[];
  };
  security: {
    requireVerification: boolean;
    maxAttempts: number;
    cooldownPeriod: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface LocationStats {
  totalSessions: number;
  activeSessions: number;
  totalStudents: number;
  averageAccuracy: number;
  violations: number;
  lastUsed: Date;
}

interface LocationManagerProps {
  onLocationCreate?: (location: Partial<Location>) => void;
  onLocationUpdate?: (locationId: string, updates: Partial<Location>) => void;
  onLocationDelete?: (locationId: string) => void;
  onLocationSelect?: (locationId: string) => void;
}

export function LocationManager({
  onLocationCreate,
  onLocationUpdate,
  onLocationDelete,
}: LocationManagerProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationStats, setLocationStats] = useState<LocationStats | null>(
    null,
  );

  // Helper functions moved up to fix hoisting
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const loadLocationStats = useCallback(async () => {
    try {
      // Mock data - replace with actual API call
      // Using Date.now() inside useCallback is fine as it's only evaluated when the function is called.
      const mockStats: LocationStats = {
        totalSessions: 45,
        activeSessions: 3,
        totalStudents: 1200,
        averageAccuracy: 4.2,
        violations: 8,
        lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
      };
      setLocationStats(mockStats);
    } catch (error) {
      console.error("Failed to load location stats:", error);
    }
  }, []); // Empty dependency array means this function is memoized once

  const loadLocations = useCallback(async () => {
    try {
      // Mock data - replace with actual API call
      const mockLocations: Location[] = [
        {
          id: "loc-1",
          name: "Main Campus - Room 101",
          description: "Main lecture hall with capacity for 100 students",
          latitude: 40.7128,
          longitude: -74.006,
          radius: 50,
          accuracy: 5,
          isActive: true,
          isDefault: true,
          geofencing: {
            enabled: true,
            strictMode: true,
            allowOutside: false,
            maxDistance: 50,
          },
          timeRestrictions: {
            enabled: true,
            startTime: "08:00",
            endTime: "18:00",
            days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          },
          security: {
            requireVerification: true,
            maxAttempts: 3,
            cooldownPeriod: 5,
          },
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: "loc-2",
          name: "Library - Study Room A",
          description: "Quiet study area for small groups",
          latitude: 40.713,
          longitude: -74.0058,
          radius: 30,
          accuracy: 8,
          isActive: true,
          isDefault: false,
          geofencing: {
            enabled: true,
            strictMode: false,
            allowOutside: true,
            maxDistance: 100,
          },
          timeRestrictions: {
            enabled: false,
            startTime: "09:00",
            endTime: "17:00",
            days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          },
          security: {
            requireVerification: false,
            maxAttempts: 5,
            cooldownPeriod: 2,
          },
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: "loc-3",
          name: "Computer Lab - Room 205",
          description: "Computer science lab with 30 workstations",
          latitude: 40.7125,
          longitude: -74.0062,
          radius: 25,
          accuracy: 3,
          isActive: false,
          isDefault: false,
          geofencing: {
            enabled: true,
            strictMode: true,
            allowOutside: false,
            maxDistance: 25,
          },
          timeRestrictions: {
            enabled: true,
            startTime: "09:00",
            endTime: "17:00",
            days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          },
          security: {
            requireVerification: true,
            maxAttempts: 2,
            cooldownPeriod: 10,
          },
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      ];
      setLocations(mockLocations);
    } catch (error) {
      console.error("Failed to load locations:", error);
    }
  }, []);

  const [newLocation, setNewLocation] = useState<Partial<Location>>(() => ({
    name: "",
    description: "",
    latitude: 0,
    longitude: 0,
    radius: 50,
    accuracy: 10,
    isActive: true,
    isDefault: false,
    geofencing: {
      enabled: true,
      strictMode: false,
      allowOutside: false,
      maxDistance: 100,
    },
    timeRestrictions: {
      enabled: false,
      startTime: "09:00",
      endTime: "17:00",
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    security: {
      requireVerification: true,
      maxAttempts: 3,
      cooldownPeriod: 5,
    },
  }));

  useEffect(() => {
    loadLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        },
      );
    }
  }, []);

  const handleCreateLocation = () => {
    setIsCreating(true);
    setNewLocation({
      name: "",
      description: "",
      latitude: currentLocation?.latitude || 0,
      longitude: currentLocation?.longitude || 0,
      radius: 50,
      accuracy: 10,
      isActive: true,
      isDefault: false,
      geofencing: {
        enabled: true,
        strictMode: false,
        allowOutside: false,
        maxDistance: 100,
      },
      timeRestrictions: {
        enabled: false,
        startTime: "09:00",
        endTime: "17:00",
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      },
      security: {
        requireVerification: true,
        maxAttempts: 3,
        cooldownPeriod: 5,
      },
    });
  };

  const handleSaveLocation = async () => {
    try {
      if (isCreating) {
        const location: Location = {
          id: `loc-${Date.now()}`,
          ...newLocation,
          name: newLocation.name || "",
          description: newLocation.description || "",
          latitude: newLocation.latitude || 0,
          longitude: newLocation.longitude || 0,
          radius: newLocation.radius || 50,
          accuracy: newLocation.accuracy || 10,
          isActive: newLocation.isActive || true,
          isDefault: newLocation.isDefault || false,
          geofencing: newLocation.geofencing || {
            enabled: true,
            strictMode: false,
            allowOutside: false,
            maxDistance: 100,
          },
          timeRestrictions: newLocation.timeRestrictions || {
            enabled: false,
            startTime: "09:00",
            endTime: "17:00",
            days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          },
          security: newLocation.security || {
            requireVerification: true,
            maxAttempts: 3,
            cooldownPeriod: 5,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Location;

        setLocations([...locations, location]);
        onLocationCreate?.(location);
      } else if (isEditing && selectedLocation) {
        const updatedLocation = { ...selectedLocation, ...newLocation };
        setLocations(
          locations.map((l) =>
            l.id === selectedLocation.id ? updatedLocation : l,
          ),
        );
        onLocationUpdate?.(selectedLocation.id, newLocation);
      }

      setIsCreating(false);
      setIsEditing(false);
      setNewLocation({
        name: "",
        description: "",
        latitude: 0,
        longitude: 0,
        radius: 50,
        accuracy: 10,
        isActive: true,
        isDefault: false,
        geofencing: {
          enabled: true,
          strictMode: false,
          allowOutside: false,
          maxDistance: 100,
        },
        timeRestrictions: {
          enabled: false,
          startTime: "09:00",
          endTime: "17:00",
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        },
        security: {
          requireVerification: true,
          maxAttempts: 3,
          cooldownPeriod: 5,
        },
      });
    } catch (error) {
      console.error("Failed to save location:", error);
    }
  };

  const handleCancelEdit = () => {
    setIsCreating(false);
    setIsEditing(false);
    setNewLocation({
      name: "",
      description: "",
      latitude: 0,
      longitude: 0,
      radius: 50,
      accuracy: 10,
      isActive: true,
      isDefault: false,
      geofencing: {
        enabled: true,
        strictMode: false,
        allowOutside: false,
        maxDistance: 100,
      },
      timeRestrictions: {
        enabled: false,
        startTime: "09:00",
        endTime: "17:00",
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      },
      security: {
        requireVerification: true,
        maxAttempts: 3,
        cooldownPeriod: 5,
      },
    });
  };

  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location);
    setIsEditing(true);
    setNewLocation(location);
  };

  const handleDeleteLocation = (locationId: string) => {
    if (confirm("Are you sure you want to delete this location?")) {
      setLocations(locations.filter((l) => l.id !== locationId));
      onLocationDelete?.(locationId);
    }
  };

  const handleViewLocation = (location: Location) => {
    setSelectedLocation(location);
    setIsViewing(true);
    loadLocationStats();
  };

  const handleUseCurrentLocation = () => {
    if (currentLocation) {
      setNewLocation({
        ...newLocation,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
    }
  };

  const filteredLocations = locations.filter((location) => {
    const matchesSearch =
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterActive === "all" ||
      (filterActive === "active" && location.isActive) ||
      (filterActive === "inactive" && !location.isActive);
    return matchesSearch && matchesFilter;
  });

  const activeLocations = locations.filter((loc) => loc.isActive);
  const defaultLocation = locations.find((loc) => loc.isDefault);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Location Manager</h2>
          <p className="text-muted-foreground">
            Manage attendance locations with geofencing and security settings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleCreateLocation}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Location</span>
          </Button>
          <Button variant="outline" onClick={loadLocations}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Current Location Info */}
      {currentLocation && (
        <Alert className="border-blue-200 bg-blue-50">
          <Navigation className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Current Location:</strong>{" "}
            {currentLocation.latitude.toFixed(6)},{" "}
            {currentLocation.longitude.toFixed(6)}
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Location Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {locations.length}
          </div>
          <div className="text-sm text-muted-foreground">Total Locations</div>
        </div>
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {activeLocations.length}
          </div>
          <div className="text-sm text-muted-foreground">Active Locations</div>
        </div>
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {locations.reduce((sum, loc) => sum + loc.radius, 0)}
          </div>
          <div className="text-sm text-muted-foreground">
            Total Coverage (m)
          </div>
        </div>
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {defaultLocation ? "1" : "0"}
          </div>
          <div className="text-sm text-muted-foreground">Default Location</div>
        </div>
      </div>

      {/* Create/Edit Location Dialog */}
      <Dialog open={isCreating || isEditing} onOpenChange={handleCancelEdit}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? "Create New Location" : "Edit Location"}
            </DialogTitle>
            <DialogDescription>
              Configure location settings with geofencing and security options
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="locationName">Location Name</label>
                  <Input
                    id="locationName"
                    value={newLocation.name || ""}
                    onChange={(e) =>
                      setNewLocation({ ...newLocation, name: e.target.value })
                    }
                    placeholder="Enter location name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="radius">Radius (meters)</label>
                  <Input
                    id="radius"
                    type="number"
                    value={newLocation.radius || 50}
                    onChange={(e) =>
                      setNewLocation({
                        ...newLocation,
                        radius: parseInt(e.target.value),
                      })
                    }
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description">Description</label>
                <Input
                  id="description"
                  value={newLocation.description || ""}
                  onChange={(e) =>
                    setNewLocation({
                      ...newLocation,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter location description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="latitude">Latitude</label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={newLocation.latitude || 0}
                    onChange={(e) =>
                      setNewLocation({
                        ...newLocation,
                        latitude: parseFloat(e.target.value),
                      })
                    }
                    placeholder="40.7128"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="longitude">Longitude</label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={newLocation.longitude || 0}
                    onChange={(e) =>
                      setNewLocation({
                        ...newLocation,
                        longitude: parseFloat(e.target.value),
                      })
                    }
                    placeholder="-74.0060"
                  />
                </div>
              </div>

              {currentLocation && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUseCurrentLocation}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Use Current Location
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Distance:{" "}
                    {newLocation.latitude && newLocation.longitude
                      ? Math.round(
                          calculateDistance(
                            currentLocation.latitude,
                            currentLocation.longitude,
                            newLocation.latitude,
                            newLocation.longitude,
                          ),
                        )
                      : 0}
                    m
                  </span>
                </div>
              )}
            </div>

            {/* Geofencing Settings */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Geofencing Settings</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <label htmlFor="geofencingEnabled">Enable Geofencing</label>
                  </div>
                  <Switch
                    id="geofencingEnabled"
                    checked={newLocation.geofencing?.enabled || false}
                    onCheckedChange={(checked) =>
                      setNewLocation({
                        ...newLocation,
                        geofencing: {
                          ...newLocation.geofencing!,
                          enabled: checked,
                        },
                      })
                    }
                  />
                </div>

                {newLocation.geofencing?.enabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <label htmlFor="strictMode">Strict Mode</label>
                      </div>
                      <Switch
                        id="strictMode"
                        checked={newLocation.geofencing?.strictMode || false}
                        onCheckedChange={(checked) =>
                          setNewLocation({
                            ...newLocation,
                            geofencing: {
                              ...newLocation.geofencing!,
                              strictMode: checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4" />
                        <label htmlFor="allowOutside">
                          Allow Outside Radius
                        </label>
                      </div>
                      <Switch
                        id="allowOutside"
                        checked={newLocation.geofencing?.allowOutside || false}
                        onCheckedChange={(checked) =>
                          setNewLocation({
                            ...newLocation,
                            geofencing: {
                              ...newLocation.geofencing!,
                              allowOutside: checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="maxDistance">Max Distance (meters)</label>
                      <Input
                        id="maxDistance"
                        type="number"
                        value={newLocation.geofencing?.maxDistance || 100}
                        onChange={(e) =>
                          setNewLocation({
                            ...newLocation,
                            geofencing: {
                              ...newLocation.geofencing!,
                              maxDistance: parseInt(e.target.value),
                            },
                          })
                        }
                        placeholder="100"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Time Restrictions */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Time Restrictions</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <label htmlFor="timeRestrictionsEnabled">
                      Enable Time Restrictions
                    </label>
                  </div>
                  <Switch
                    id="timeRestrictionsEnabled"
                    checked={newLocation.timeRestrictions?.enabled || false}
                    onCheckedChange={(checked) =>
                      setNewLocation({
                        ...newLocation,
                        timeRestrictions: {
                          ...newLocation.timeRestrictions!,
                          enabled: checked,
                        },
                      })
                    }
                  />
                </div>

                {newLocation.timeRestrictions?.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="startTime">Start Time</label>
                      <Input
                        id="startTime"
                        type="time"
                        value={
                          newLocation.timeRestrictions?.startTime || "09:00"
                        }
                        onChange={(e) =>
                          setNewLocation({
                            ...newLocation,
                            timeRestrictions: {
                              ...newLocation.timeRestrictions!,
                              startTime: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="endTime">End Time</label>
                      <Input
                        id="endTime"
                        type="time"
                        value={newLocation.timeRestrictions?.endTime || "17:00"}
                        onChange={(e) =>
                          setNewLocation({
                            ...newLocation,
                            timeRestrictions: {
                              ...newLocation.timeRestrictions!,
                              endTime: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Security Settings */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Security Settings</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <label htmlFor="requireVerification">
                      Require Verification
                    </label>
                  </div>
                  <Switch
                    id="requireVerification"
                    checked={newLocation.security?.requireVerification || false}
                    onCheckedChange={(checked) =>
                      setNewLocation({
                        ...newLocation,
                        security: {
                          ...newLocation.security!,
                          requireVerification: checked,
                        },
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="maxAttempts">Max Attempts</label>
                    <Input
                      id="maxAttempts"
                      type="number"
                      value={newLocation.security?.maxAttempts || 3}
                      onChange={(e) =>
                        setNewLocation({
                          ...newLocation,
                          security: {
                            ...newLocation.security!,
                            maxAttempts: parseInt(e.target.value),
                          },
                        })
                      }
                      placeholder="3"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="cooldownPeriod">
                      Cooldown Period (minutes)
                    </label>
                    <Input
                      id="cooldownPeriod"
                      type="number"
                      value={newLocation.security?.cooldownPeriod || 5}
                      onChange={(e) =>
                        setNewLocation({
                          ...newLocation,
                          security: {
                            ...newLocation.security!,
                            cooldownPeriod: parseInt(e.target.value),
                          },
                        })
                      }
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Status Settings */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Status Settings</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <label htmlFor="isActive">Active</label>
                  </div>
                  <Switch
                    id="isActive"
                    checked={newLocation.isActive || false}
                    onCheckedChange={(checked) =>
                      setNewLocation({ ...newLocation, isActive: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <label htmlFor="isDefault">Default Location</label>
                  </div>
                  <Switch
                    id="isDefault"
                    checked={newLocation.isDefault || false}
                    onCheckedChange={(checked) =>
                      setNewLocation({ ...newLocation, isDefault: checked })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2">
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveLocation}>
                <Save className="h-4 w-4 mr-2" />
                {isCreating ? "Create Location" : "Update Location"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Locations List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredLocations.map((location) => (
          <Card key={location.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant={location.isActive ? "default" : "secondary"}>
                    {location.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {location.isDefault && (
                    <Badge variant="outline" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewLocation(location)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditLocation(location)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteLocation(location.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-lg">{location.name}</CardTitle>
              {location.description && (
                <CardDescription>{location.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Location Info */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {location.latitude.toFixed(6)},{" "}
                    {location.longitude.toFixed(6)}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>Radius: {location.radius}m</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Compass className="h-4 w-4 text-muted-foreground" />
                  <span>Accuracy: {location.accuracy}m</span>
                </div>
              </div>

              {/* Geofencing Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Geofencing</span>
                  <Badge
                    variant={
                      location.geofencing.enabled ? "default" : "secondary"
                    }
                  >
                    {location.geofencing.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                {location.geofencing.enabled && (
                  <div className="text-xs text-muted-foreground">
                    {location.geofencing.strictMode
                      ? "Strict Mode"
                      : "Flexible Mode"}{" "}
                    鈥? Max Distance: {location.geofencing.maxDistance}m
                  </div>
                )}
              </div>

              {/* Security Features */}
              <div className="flex flex-wrap gap-1">
                {location.geofencing.enabled && (
                  <Badge variant="outline" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    Geofencing
                  </Badge>
                )}
                {location.timeRestrictions.enabled && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Time Restricted
                  </Badge>
                )}
                {location.security.requireVerification && (
                  <Badge variant="outline" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Verification
                  </Badge>
                )}
              </div>

              {/* Distance from current location */}
              {currentLocation && (
                <div className="text-xs text-muted-foreground">
                  Distance:{" "}
                  {Math.round(
                    calculateDistance(
                      currentLocation.latitude,
                      currentLocation.longitude,
                      location.latitude,
                      location.longitude,
                    ),
                  )}
                  m from current location
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Location Details Dialog */}
      <Dialog open={isViewing} onOpenChange={setIsViewing}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Location Details</DialogTitle>
            <DialogDescription>
              Detailed information for {selectedLocation?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedLocation && (
            <div className="space-y-6">
              {/* Location Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Location Name</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedLocation.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Status</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedLocation.isActive ? "Active" : "Inactive"}
                    {selectedLocation.isDefault && " (Default)"}
                  </div>
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Latitude</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedLocation.latitude.toFixed(6)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Longitude</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedLocation.longitude.toFixed(6)}
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Radius</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedLocation.radius}m
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Accuracy</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedLocation.accuracy}m
                  </div>
                </div>
              </div>

              {/* Statistics */}
              {locationStats && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium">Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {locationStats.totalSessions}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Sessions
                      </div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {locationStats.activeSessions}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Active Sessions
                      </div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {locationStats.totalStudents}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Students
                      </div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {locationStats.violations}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Violations
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsViewing(false)}>
                  Close
                </Button>
                <Button onClick={() => handleEditLocation(selectedLocation)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Location
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
