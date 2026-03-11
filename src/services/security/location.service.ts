import {
  LocationData,
  LocationValidationResult,
  GeofenceConfig,
} from "./types";

/**
 * Location Service
 * Handles GPS validation, geofencing, and location spoofing detection
 */
export class LocationService {
  private readonly EARTH_RADIUS = 6371000; // Earth's radius in meters
  private readonly MIN_ACCURACY = 10; // Minimum required accuracy in meters
  private readonly MAX_ACCURACY = 100; // Maximum allowed accuracy in meters
  private readonly SPOOFING_THRESHOLD = 0.8; // Confidence threshold for spoofing detection

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return this.EARTH_RADIUS * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Validate GPS coordinates
   */
  private validateCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    );
  }

  /**
   * Detect potential location spoofing
   */
  private detectSpoofing(
    currentLocation: LocationData,
    previousLocations: LocationData[],
  ): { isSpoofed: boolean; confidence: number; reasons: string[] } {
    const reasons: string[] = [];
    let confidence = 0;

    // Check for impossible movement speed
    if (previousLocations.length > 0) {
      const lastLocation = previousLocations[previousLocations.length - 1];
      const timeDiff =
        (currentLocation.timestamp - lastLocation.timestamp) / 1000; // seconds
      const distance = this.calculateDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        currentLocation.latitude,
        currentLocation.longitude,
      );

      const speed = distance / timeDiff; // m/s
      const maxPossibleSpeed = 100; // m/s (360 km/h)

      if (speed > maxPossibleSpeed && timeDiff > 0) {
        reasons.push(`Impossible movement speed: ${speed.toFixed(2)} m/s`);
        confidence += 0.3;
      }
    }

    // Check for suspicious accuracy patterns
    if (currentLocation.accuracy < 1) {
      reasons.push("Suspiciously high accuracy (< 1m)");
      confidence += 0.2;
    }

    // Check for repeated identical coordinates
    const identicalLocations = previousLocations.filter(
      (loc) =>
        Math.abs(loc.latitude - currentLocation.latitude) < 0.000001 &&
        Math.abs(loc.longitude - currentLocation.longitude) < 0.000001,
    );

    if (identicalLocations.length > 2) {
      reasons.push("Repeated identical coordinates");
      confidence += 0.3;
    }

    // Check for unrealistic altitude changes
    if (
      currentLocation.altitude !== undefined &&
      previousLocations.length > 0
    ) {
      const lastAltitude =
        previousLocations[previousLocations.length - 1].altitude;
      if (lastAltitude !== undefined) {
        const altitudeChange = Math.abs(
          currentLocation.altitude - lastAltitude,
        );
        if (altitudeChange > 1000) {
          // 1km altitude change
          reasons.push(`Unrealistic altitude change: ${altitudeChange}m`);
          confidence += 0.2;
        }
      }
    }

    return {
      isSpoofed: confidence >= this.SPOOFING_THRESHOLD,
      confidence,
      reasons,
    };
  }

  /**
   * Validate location data
   */
  public validateLocation(
    location: LocationData,
    geofence: GeofenceConfig,
    previousLocations: LocationData[] = [],
  ): LocationValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Validate coordinates
    if (!this.validateCoordinates(location.latitude, location.longitude)) {
      errors.push("Invalid GPS coordinates");
      return {
        isValid: false,
        distance: 0,
        isWithinRadius: false,
        accuracy: 0,
        confidence: 0,
        warnings,
        errors,
      };
    }

    // Check accuracy
    if (location.accuracy > this.MAX_ACCURACY) {
      errors.push(
        `Location accuracy too low: ${location.accuracy}m (max: ${this.MAX_ACCURACY}m)`,
      );
    } else if (location.accuracy < this.MIN_ACCURACY) {
      warnings.push(`Suspiciously high accuracy: ${location.accuracy}m`);
    }

    // Calculate distance from geofence center
    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      geofence.center.latitude,
      geofence.center.longitude,
    );

    const isWithinRadius = distance <= geofence.radius;

    if (!isWithinRadius) {
      errors.push(
        `Location outside geofence: ${distance.toFixed(2)}m from center (radius: ${geofence.radius}m)`,
      );
    }

    // Detect location spoofing
    const spoofingDetection = this.detectSpoofing(location, previousLocations);
    if (spoofingDetection.isSpoofed) {
      errors.push(
        `Potential location spoofing detected: ${spoofingDetection.reasons.join(", ")}`,
      );
    }

    // Calculate confidence score
    let confidence = 1.0;
    confidence -= Math.min(location.accuracy / this.MAX_ACCURACY, 0.5);
    confidence -= Math.min(distance / geofence.radius, 0.3);
    confidence -= spoofingDetection.confidence * 0.5;
    confidence = Math.max(0, Math.min(1, confidence));

    return {
      isValid: errors.length === 0,
      distance,
      isWithinRadius,
      accuracy: location.accuracy,
      confidence,
      warnings,
      errors,
    };
  }

  /**
   * Check if location is within geofence
   */
  public isWithinGeofence(
    location: LocationData,
    geofence: GeofenceConfig,
  ): boolean {
    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      geofence.center.latitude,
      geofence.center.longitude,
    );

    return distance <= geofence.radius;
  }

  /**
   * Get timezone from coordinates
   */
  public getTimezoneFromCoordinates(
    latitude: number,
    longitude: number,
  ): string {
    // Simplified timezone detection based on longitude
    // In a real implementation, you would use a proper timezone database
    const timezoneOffset = Math.round(longitude / 15);
    const sign = timezoneOffset >= 0 ? "+" : "-";
    const hours = Math.abs(timezoneOffset);
    return `UTC${sign}${hours.toString().padStart(2, "0")}:00`;
  }

  /**
   * Validate location accuracy over time
   */
  public validateLocationHistory(locations: LocationData[]): {
    isValid: boolean;
    averageAccuracy: number;
    consistencyScore: number;
    warnings: string[];
    errors: string[];
  } {
    if (locations.length === 0) {
      return {
        isValid: false,
        averageAccuracy: 0,
        consistencyScore: 0,
        warnings: [],
        errors: ["No location data provided"],
      };
    }

    const warnings: string[] = [];
    const errors: string[] = [];

    // Calculate average accuracy
    const averageAccuracy =
      locations.reduce((sum, loc) => sum + loc.accuracy, 0) / locations.length;

    // Check consistency
    let consistentLocations = 0;
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      const distance = this.calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude,
      );

      const timeDiff = (curr.timestamp - prev.timestamp) / 1000; // seconds
      const speed = distance / timeDiff;

      // Check for reasonable movement speed (max 50 m/s = 180 km/h)
      if (speed <= 50) {
        consistentLocations++;
      }
    }

    const consistencyScore = consistentLocations / (locations.length - 1);

    if (consistencyScore < 0.7) {
      warnings.push(
        `Low location consistency: ${(consistencyScore * 100).toFixed(1)}%`,
      );
    }

    if (averageAccuracy > this.MAX_ACCURACY) {
      errors.push(`Average accuracy too low: ${averageAccuracy.toFixed(2)}m`);
    }

    return {
      isValid: errors.length === 0,
      averageAccuracy,
      consistencyScore,
      warnings,
      errors,
    };
  }

  /**
   * Log location validation
   */
  private logLocationValidation(
    location: LocationData,
    result: LocationValidationResult,
    context: string,
  ): void {
    const logData = {
      timestamp: new Date().toISOString(),
      context,
      location: {
        lat: location.latitude,
        lng: location.longitude,
        accuracy: location.accuracy,
      },
      validation: {
        isValid: result.isValid,
        distance: result.distance,
        confidence: result.confidence,
        warnings: result.warnings,
        errors: result.errors,
      },
    };

    if (result.errors.length > 0) {
      console.error("Location validation failed:", logData);
    } else if (result.warnings.length > 0) {
      console.warn("Location validation warnings:", logData);
    } else {
      console.log("Location validation successful:", logData);
    }
  }
}
