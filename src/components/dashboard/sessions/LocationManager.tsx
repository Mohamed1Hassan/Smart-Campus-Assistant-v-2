"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";

import { Badge } from "../../ui/badge";
import {
  MapPin,
  Search,
  Plus,
  Edit,
  Trash2,
  Navigation,
  Map,
  Save,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function LocationManager() {
  const [locations, setLocations] = useState<Location[]>([
    {
      id: "loc-1",
      name: "Main Campus - Room 101",
      latitude: 40.7128,
      longitude: -74.006,
      radius: 50,
      description: "Main lecture hall",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "loc-2",
      name: "Library - Study Room A",
      latitude: 40.713,
      longitude: -74.0058,
      radius: 30,
      description: "Quiet study area",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "loc-3",
      name: "Computer Lab - Room 205",
      latitude: 40.7125,
      longitude: -74.0062,
      radius: 25,
      description: "Computer science lab",
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  const [isCreating, setIsCreating] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [newLocation, setNewLocation] = useState({
    name: "",
    latitude: "",
    longitude: "",
    radius: "50",
    description: "",
  });
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    // Get current location
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

  const filteredLocations = React.useMemo(
    () =>
      locations.filter(
        (location) =>
          location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          location.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()),
      ),
    [locations, searchTerm],
  );

  const handleCreateLocation = () => {
    setIsCreating(true);
    setNewLocation({
      name: "",
      latitude: "",
      longitude: "",
      radius: "50",
      description: "",
    });
  };

  const handleSaveLocation = () => {
    if (!newLocation.name || !newLocation.latitude || !newLocation.longitude) {
      alert("Please fill in all required fields");
      return;
    }

    const location: Location = {
      id: `loc-${Date.now()}`,
      name: newLocation.name,
      latitude: parseFloat(newLocation.latitude),
      longitude: parseFloat(newLocation.longitude),
      radius: parseInt(newLocation.radius),
      description: newLocation.description,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setLocations([...locations, location]);
    setIsCreating(false);
    setNewLocation({
      name: "",
      latitude: "",
      longitude: "",
      radius: "50",
      description: "",
    });
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewLocation({
      name: "",
      latitude: "",
      longitude: "",
      radius: "50",
      description: "",
    });
  };

  const handleEditLocation = (locationId: string) => {
    console.log("Edit location:", locationId);
  };

  const handleDeleteLocation = (locationId: string) => {
    if (confirm("Are you sure you want to delete this location?")) {
      setLocations(locations.filter((loc) => loc.id !== locationId));
    }
  };

  const handleToggleLocation = (locationId: string) => {
    setLocations(
      locations.map((loc) =>
        loc.id === locationId ? { ...loc, isActive: !loc.isActive } : loc,
      ),
    );
  };

  const handleUseCurrentLocation = () => {
    if (currentLocation) {
      setNewLocation({
        ...newLocation,
        latitude: currentLocation.latitude.toString(),
        longitude: currentLocation.longitude.toString(),
      });
    }
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Location Manager</span>
        </CardTitle>
        <CardDescription>
          Manage attendance locations and geofencing settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
          <Button
            onClick={handleCreateLocation}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Location</span>
          </Button>
        </div>

        {/* Current Location Info */}
        {currentLocation && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-800">
              <Navigation className="h-4 w-4" />
              <span className="text-sm font-medium">Current Location</span>
            </div>
            <div className="text-xs text-blue-700 mt-1">
              Lat: {currentLocation.latitude.toFixed(6)}, Lng:{" "}
              {currentLocation.longitude.toFixed(6)}
            </div>
          </div>
        )}

        {/* Create Location Form */}
        {isCreating && (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Create New Location</h4>
              <Button variant="ghost" size="sm" onClick={handleCancelCreate}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="locationName">Location Name *</label>
                <Input
                  id="locationName"
                  value={newLocation.name}
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
                  value={newLocation.radius}
                  onChange={(e) =>
                    setNewLocation({ ...newLocation, radius: e.target.value })
                  }
                  placeholder="50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="latitude">Latitude *</label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={newLocation.latitude}
                  onChange={(e) =>
                    setNewLocation({ ...newLocation, latitude: e.target.value })
                  }
                  placeholder="40.7128"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="longitude">Longitude *</label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={newLocation.longitude}
                  onChange={(e) =>
                    setNewLocation({
                      ...newLocation,
                      longitude: e.target.value,
                    })
                  }
                  placeholder="-74.0060"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description">Description</label>
              <Input
                id="description"
                value={newLocation.description}
                onChange={(e) =>
                  setNewLocation({
                    ...newLocation,
                    description: e.target.value,
                  })
                }
                placeholder="Enter location description"
              />
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
                <span className="text-xs text-muted-foreground">
                  Distance:{" "}
                  {newLocation.latitude && newLocation.longitude
                    ? Math.round(
                        calculateDistance(
                          currentLocation.latitude,
                          currentLocation.longitude,
                          parseFloat(newLocation.latitude) || 0,
                          parseFloat(newLocation.longitude) || 0,
                        ),
                      )
                    : 0}
                  m
                </span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2">
              <Button variant="outline" onClick={handleCancelCreate}>
                Cancel
              </Button>
              <Button onClick={handleSaveLocation}>
                <Save className="h-4 w-4 mr-2" />
                Save Location
              </Button>
            </div>
          </div>
        )}

        {/* Locations List */}
        <div className="space-y-3">
          {filteredLocations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-2" />
                <p>No locations found</p>
                <p className="text-sm">
                  Create your first location to get started
                </p>
              </div>
            </div>
          ) : (
            filteredLocations.map((location) => (
              <div
                key={location.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={location.isActive ? "default" : "secondary"}
                    >
                      {location.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <span className="font-medium">{location.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleLocation(location.id)}
                    >
                      {location.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditLocation(location.id)}
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {location.latitude.toFixed(6)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Latitude
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {location.longitude.toFixed(6)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Longitude
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Map className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{location.radius}m</div>
                      <div className="text-xs text-muted-foreground">
                        Radius
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Navigation className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {currentLocation
                          ? Math.round(
                              calculateDistance(
                                currentLocation.latitude,
                                currentLocation.longitude,
                                location.latitude,
                                location.longitude,
                              ),
                            )
                          : "N/A"}
                        m
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Distance
                      </div>
                    </div>
                  </div>
                </div>

                {location.description && (
                  <div className="text-sm text-muted-foreground">
                    {location.description}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Created: {location.createdAt.toLocaleDateString()}
                  </span>
                  <span>
                    Updated: {location.updatedAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Location Statistics */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {locations.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Locations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {locations.filter((loc) => loc.isActive).length}
            </div>
            <div className="text-sm text-muted-foreground">
              Active Locations
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {locations.reduce((sum, loc) => sum + loc.radius, 0)}
            </div>
            <div className="text-sm text-muted-foreground">
              Total Coverage (m)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
