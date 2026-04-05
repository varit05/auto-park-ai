/**
 * AutoPark AI - Notification Service
 * Handles local notifications for parking automation
 */

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Location, GeofenceEvent } from "@app-types/index";
import { formatDuration, formatCurrency } from "@utils/helpers";

// Notification channel IDs (Android)
const GEOFENCE_CHANNEL_ID = "geofence-alerts";
const BOOKING_CHANNEL_ID = "booking-alerts";
const GENERAL_CHANNEL_ID = "general-alerts";

interface NotificationConfig {
  enableNotifications: boolean;
  sound: boolean;
  vibration: boolean;
  priority: "high" | "default" | "low";
}

class NotificationService {
  private config: NotificationConfig = {
    enableNotifications: true,
    sound: true,
    vibration: true,
    priority: "high",
  };
  private isInitialized = false;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.NotificationResponseSubscription | null =
    null;

  constructor() {
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        return {
          shouldShowAlert: this.config.enableNotifications,
          shouldPlaySound: this.config.sound,
          shouldSetBadge: true,
        };
      },
    });
  }

  /**
   * Initialize notification service
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Request permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("Notification permissions not granted");
        return false;
      }

      // Create Android notification channels
      if (Platform.OS === "android") {
        await this.createAndroidChannels();
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("Error initializing notification service:", error);
      return false;
    }
  }

  /**
   * Create Android notification channels
   */
  private async createAndroidChannels(): Promise<void> {
    // Geofence alerts channel
    await Notifications.setNotificationChannelAsync(GEOFENCE_CHANNEL_ID, {
      name: "Geofence Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2563eb",
      sound: this.config.sound ? "default" : null,
    });

    // Booking alerts channel
    await Notifications.setNotificationChannelAsync(BOOKING_CHANNEL_ID, {
      name: "Booking Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#10b981",
      sound: this.config.sound ? "default" : null,
    });

    // General alerts channel
    await Notifications.setNotificationChannelAsync(GENERAL_CHANNEL_ID, {
      name: "General Alerts",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: this.config.sound ? "default" : null,
    });
  }

  /**
   * Send geofence entry notification
   */
  async sendGeofenceEntryNotification(
    location: Location,
    onConfirm?: () => void,
  ): Promise<string | null> {
    if (!this.config.enableNotifications) {
      return null;
    }

    const notificationId = `geofence-${location.id}-${Date.now()}`;

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title: `Arrived at ${location.name}`,
          body: "Would you like to book parking?",
          data: {
            type: "geofence_entry",
            locationId: location.id,
            locationName: location.name,
            parkingZone: location.parkingZone,
            action: "confirm_booking",
          },
          sound: this.config.sound,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: "geofence_actions",
        },
        trigger: null, // Immediate notification
      });

      return notificationId;
    } catch (error) {
      console.error("Error sending geofence entry notification:", error);
      return null;
    }
  }

  /**
   * Send booking confirmation notification
   */
  async sendBookingConfirmationNotification(
    location: Location,
    duration: number,
    estimatedCost: number,
    onConfirm?: () => void,
  ): Promise<string | null> {
    if (!this.config.enableNotifications) {
      return null;
    }

    const notificationId = `booking-${location.id}-${Date.now()}`;

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title: "Confirm Parking Booking",
          body: `${location.name} - ${formatDuration(duration)} - ${formatCurrency(estimatedCost)}`,
          data: {
            type: "booking_confirmation",
            locationId: location.id,
            locationName: location.name,
            duration: duration,
            cost: estimatedCost,
            action: "confirm_booking",
          },
          sound: this.config.sound,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: "booking_actions",
        },
        trigger: null,
      });

      return notificationId;
    } catch (error) {
      console.error("Error sending booking confirmation notification:", error);
      return null;
    }
  }

  /**
   * Send booking success notification
   */
  async sendBookingSuccessNotification(
    locationName: string,
    bookingReference: string,
    duration: number,
    cost: number,
  ): Promise<string | null> {
    if (!this.config.enableNotifications) {
      return null;
    }

    const notificationId = `booking-success-${Date.now()}`;

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title: "Parking Booked! ✓",
          body: `${locationName} - Ref: ${bookingReference} - ${formatDuration(duration)}`,
          data: {
            type: "booking_success",
            bookingReference: bookingReference,
            locationName: locationName,
            duration: duration,
            cost: cost,
          },
          sound: this.config.sound,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: null,
      });

      return notificationId;
    } catch (error) {
      console.error("Error sending booking success notification:", error);
      return null;
    }
  }

  /**
   * Send booking failure notification
   */
  async sendBookingFailureNotification(
    locationName: string,
    error: string,
  ): Promise<string | null> {
    if (!this.config.enableNotifications) {
      return null;
    }

    const notificationId = `booking-failure-${Date.now()}`;

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title: "Booking Failed",
          body: `Failed to book parking at ${locationName}. ${error}`,
          data: {
            type: "booking_failure",
            locationName: locationName,
            error: error,
          },
          sound: this.config.sound,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });

      return notificationId;
    } catch (error) {
      console.error("Error sending booking failure notification:", error);
      return null;
    }
  }

  /**
   * Send parking expiry warning notification
   */
  async sendExpiryWarningNotification(
    locationName: string,
    minutesRemaining: number,
  ): Promise<string | null> {
    if (!this.config.enableNotifications) {
      return null;
    }

    const notificationId = `expiry-warning-${Date.now()}`;

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title: "Parking Expiring Soon",
          body: `Your parking at ${locationName} expires in ${minutesRemaining} minutes`,
          data: {
            type: "expiry_warning",
            locationName: locationName,
            minutesRemaining: minutesRemaining,
            action: "extend_parking",
          },
          sound: this.config.sound,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });

      return notificationId;
    } catch (error) {
      console.error("Error sending expiry warning notification:", error);
      return null;
    }
  }

  /**
   * Send general notification
   */
  async sendGeneralNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<string | null> {
    if (!this.config.enableNotifications) {
      return null;
    }

    const notificationId = `general-${Date.now()}`;

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title: title,
          body: body,
          data: data,
          sound: this.config.sound,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: null,
      });

      return notificationId;
    } catch (error) {
      console.error("Error sending general notification:", error);
      return null;
    }
  }

  /**
   * Schedule a notification for later
   */
  async scheduleNotification(
    title: string,
    body: string,
    delaySeconds: number,
    data?: Record<string, any>,
  ): Promise<string | null> {
    if (!this.config.enableNotifications) {
      return null;
    }

    const notificationId = `scheduled-${Date.now()}`;

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title: title,
          body: body,
          data: data,
          sound: this.config.sound,
        },
        trigger: {
          seconds: delaySeconds,
        },
      });

      return notificationId;
    } catch (error) {
      console.error("Error scheduling notification:", error);
      return null;
    }
  }

  /**
   * Cancel a notification
   */
  async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      return true;
    } catch (error) {
      console.error("Error cancelling notification:", error);
      return false;
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<boolean> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return true;
    } catch (error) {
      console.error("Error cancelling all notifications:", error);
      return false;
    }
  }

  /**
   * Set up notification response handler
   */
  setupNotificationResponseHandler(
    handler: (response: Notifications.NotificationResponse) => void,
  ): void {
    if (this.responseListener) {
      this.responseListener.remove();
    }

    this.responseListener =
      Notifications.addNotificationResponseReceivedListener(handler);
  }

  /**
   * Update notification configuration
   */
  updateConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get notification configuration
   */
  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled(): boolean {
    return this.config.enableNotifications && this.isInitialized;
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
