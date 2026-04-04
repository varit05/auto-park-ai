/**
 * AutoPark AI - Location Service
 * Handles location tracking, geofencing, and background monitoring
 */

import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import type { TaskManagerTaskBody, TaskManagerError } from "expo-task-manager";
import { Platform } from "react-native";
import { isWithinRadius, calculateDistance } from "@utils/helpers";
import type { Location as LocationType, GeofenceEvent } from "../types";

// Background task name for location monitoring
export const LOCATION_MONITORING_TASK = "location-monitoring-task";

// Location update throttle interval (ms)
const LOCATION_UPDATE_INTERVAL = 5000; // 5 seconds

class LocationService {
  private isWatching = false;
  private watchSubscription: Location.LocationSubscription | null = null;
  private lastLocation: Location.LocationObject | null = null;
  private monitoredLocations: LocationType[] = [];
  private onGeofenceEnterCallback: ((event: GeofenceEvent) => void) | null =
    null;
  private onGeofenceExitCallback: ((event: GeofenceEvent) => void) | null =
    null;
  private onLocationUpdateCallback:
    | ((location: {
        latitude: number;
        longitude: number;
        accuracy: number;
      }) => void)
    | null = null;

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // Request foreground permission
      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== "granted") {
        return false;
      }

      // Request background permission (iOS specific)
      if (Platform.OS === "ios") {
        const { status: backgroundStatus } =
          await Location.requestBackgroundPermissionsAsync();

        return backgroundStatus === "granted";
      }

      return true;
    } catch (error) {
      console.error("Error requesting location permissions:", error);
      return false;
    }
  }

  /**
   * Check if location permissions are granted
   */
  async hasPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") return false;

      if (Platform.OS === "ios") {
        const backgroundStatus = await Location.getBackgroundPermissionsAsync();
        return backgroundStatus.status === "granted";
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      this.lastLocation = location;
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? 0,
      };
    } catch (error) {
      console.error("Error getting current location:", error);
      return null;
    }
  }

  /**
   * Start watching location for geofencing
   */
  async startLocationMonitoring(
    locations: LocationType[],
    callbacks: {
      onGeofenceEnter?: (event: GeofenceEvent) => void;
      onGeofenceExit?: (event: GeofenceEvent) => void;
      onLocationUpdate?: (location: {
        latitude: number;
        longitude: number;
        accuracy: number;
      }) => void;
    },
  ): Promise<boolean> {
    if (this.isWatching) {
      await this.stopLocationMonitoring();
    }

    this.monitoredLocations = locations;
    this.onGeofenceEnterCallback = callbacks.onGeofenceEnter || null;
    this.onGeofenceExitCallback = callbacks.onGeofenceExit || null;
    this.onLocationUpdateCallback = callbacks.onLocationUpdate || null;

    try {
      // Start watching position
      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: LOCATION_UPDATE_INTERVAL,
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          this.lastLocation = location;
          this.handleLocationUpdate(location);
        },
      );

      this.isWatching = true;
      return true;
    } catch (error) {
      console.error("Error starting location monitoring:", error);
      return false;
    }
  }

  /**
   * Stop location monitoring
   */
  async stopLocationMonitoring(): Promise<void> {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
    this.isWatching = false;
  }

  /**
   * Handle location updates and check geofences
   */
  private handleLocationUpdate(location: Location.LocationObject) {
    const { latitude, longitude, accuracy } = location.coords;

    // Notify location update callback
    if (this.onLocationUpdateCallback) {
      this.onLocationUpdateCallback({
        latitude,
        longitude,
        accuracy: accuracy ?? 0,
      });
    }

    // Check each monitored location
    for (const monitoredLocation of this.monitoredLocations) {
      const isInside = isWithinRadius(
        monitoredLocation.latitude,
        monitoredLocation.longitude,
        latitude,
        longitude,
        monitoredLocation.radius,
      );

      // Check if accuracy is good enough
      const accuracyThreshold = 50; // meters
      if ((accuracy ?? 999) > accuracyThreshold) {
        continue; // Skip if accuracy is poor
      }

      if (isInside) {
        // Trigger enter event
        if (this.onGeofenceEnterCallback) {
          const event: GeofenceEvent = {
            location: monitoredLocation,
            eventType: "enter",
            timestamp: new Date(),
            accuracy: accuracy ?? 0,
            latitude,
            longitude,
          };
          this.onGeofenceEnterCallback(event);
        }
      } else {
        // Trigger exit event
        if (this.onGeofenceExitCallback) {
          const event: GeofenceEvent = {
            location: monitoredLocation,
            eventType: "exit",
            timestamp: new Date(),
            accuracy: accuracy ?? 0,
            latitude,
            longitude,
          };
          this.onGeofenceExitCallback(event);
        }
      }
    }
  }

  /**
   * Get distance to a specific location
   */
  async getDistanceToLocation(
    latitude: number,
    longitude: number,
  ): Promise<number | null> {
    try {
      const currentLocation = await this.getCurrentLocation();
      if (!currentLocation) return null;

      return calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        latitude,
        longitude,
      );
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if currently at a location
   */
  async isAtLocation(
    latitude: number,
    longitude: number,
    radius: number,
  ): Promise<boolean> {
    try {
      const currentLocation = await this.getCurrentLocation();
      if (!currentLocation) return false;

      return isWithinRadius(
        latitude,
        longitude,
        currentLocation.latitude,
        currentLocation.longitude,
        radius,
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<string | null> {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        const parts = [];
        if (address.name) parts.push(address.name);
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        return parts.join(", ");
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get monitoring status
   */
  isMonitoring(): boolean {
    return this.isWatching;
  }

  /**
   * Get last known location
   */
  getLastLocation(): Location.LocationObject | null {
    return this.lastLocation;
  }
}

// Register background location task
TaskManager.defineTask(
  LOCATION_MONITORING_TASK,
  (
    taskBody: TaskManagerTaskBody<{ locations?: Location.LocationObject[] }>,
  ) => {
    const { data, error } = taskBody;
    if (error) {
      console.error("Background location task error:", error);
      return;
    }

    if (data?.locations) {
      const { locations } = data;
      console.log("Background location update:", locations);
      // Handle background location updates
    }
  },
);

// Export singleton instance
export const locationService = new LocationService();
export default locationService;
