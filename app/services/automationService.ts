/**
 * AutoPark AI - Automation Service
 * Orchestrates the automation workflow for parking booking
 */

import { locationService } from "./locationService";
import { paybyphoneService } from "./paybyphoneService";
import { aiService } from "./aiService";
import { notificationService } from "./notificationService";
import { useStore } from "@store/useStore";
import type { Location, GeofenceEvent, ParkingSession, Vehicle, PaymentMethod } from "@types/index";
import { generateId } from "@utils/helpers";

type AutomationStatus = "idle" | "monitoring" | "processing" | "booking" | "completed" | "failed";

interface AutomationState {
  status: AutomationStatus;
  currentLocation: Location | null;
  lastEvent: GeofenceEvent | null;
  activeBooking: ParkingSession | null;
  error: string | null;
}

class AutomationService {
  private state: AutomationState = {
    status: "idle",
    currentLocation: null,
    lastEvent: null,
    activeBooking: null,
    error: null,
  };
  private isInitialized = false;
  private eventDebounce = new Map<string, number>(); // Prevent duplicate events
  private readonly DEBOUNCE_MS = 60000; // 1 minute debounce

  /**
   * Initialize automation service
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Request location permissions
      const hasLocationPermission = await locationService.requestPermissions();
      if (!hasLocationPermission) {
        console.error("Location permissions not granted");
        return false;
      }

      // Initialize notification service
      const notificationsEnabled = await notificationService.initialize();
      if (!notificationsEnabled) {
        console.warn("Notifications not enabled, continuing without them");
      }

      // Initialize AI service
      const store = useStore.getState();
      aiService.initialize({
        provider: store.settings.aiModelProvider,
        apiKey: store.settings.aiApiKey,
        apiEndpoint: store.settings.aiApiEndpoint,
      });

      // Set up notification response handler
      notificationService.setupNotificationResponseHandler((response) => {
        this.handleNotificationResponse(response);
      });

      this.isInitialized = true;
      this.updateState({ status: "idle" });
      return true;
    } catch (error) {
      console.error("Error initializing automation service:", error);
      return false;
    }
  }

  /**
   * Start monitoring for geofence events
   */
  async startMonitoring(): Promise<boolean> {
    if (!this.isInitialized) {
      console.error("Automation service not initialized");
      return false;
    }

    const store = useStore.getState();
    const locations = store.getActiveLocations();

    if (locations.length === 0) {
      console.warn("No active locations to monitor");
      return false;
    }

    try {
      const started = await locationService.startLocationMonitoring(locations, {
        onGeofenceEnter: (event) => this.handleGeofenceEnter(event),
        onGeofenceExit: (event) => this.handleGeofenceExit(event),
        onLocationUpdate: (location) => this.handleLocationUpdate(location),
      });

      if (started) {
        this.updateState({ status: "monitoring" });
        store.setActiveGeofences(locations.map((l) => l.id));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error starting monitoring:", error);
      return false;
    }
  }

  /**
   * Stop monitoring
   */
  async stopMonitoring(): Promise<void> {
    await locationService.stopLocationMonitoring();
    this.updateState({ status: "idle" });
    
    const store = useStore.getState();
    store.setActiveGeofences([]);
  }

  /**
   * Handle geofence enter event
   */
  private async handleGeofenceEnter(event: GeofenceEvent): Promise<void> {
    // Debounce events
    if (this.isDebounced(event.location.id)) {
      return;
    }
    this.debounceEvent(event.location.id);

    const store = useStore.getState();
    const settings = store.settings;

    this.updateState({
      currentLocation: event.location,
      lastEvent: event,
      status: "processing",
    });

    // Record the event
    store.addGeofenceEvent(event);

    // Get AI suggestion if enabled
    let duration = settings.defaultDuration;
    let estimatedCost = this.estimateCost(duration);

    if (settings.aiEnabled) {
      try {
        const historicalSessions = store.getParkingSessions(10);
        const aiResponse = await aiService.suggestDuration({
          location: event.location,
          currentDuration: duration,
          historicalSessions,
        });
        duration = aiResponse.suggestedDuration;
        estimatedCost = this.estimateCost(duration);
      } catch (error) {
        console.warn("AI suggestion failed, using default duration");
      }
    }

    // Handle based on automation mode
    switch (settings.automationMode) {
      case "fully_automatic":
        await this.performAutomaticBooking(event.location, duration, estimatedCost);
        break;

      case "semi_automatic":
        await this.requestConfirmation(event.location, duration, estimatedCost);
        break;

      case "manual":
        await this.sendManualNotification(event.location, duration, estimatedCost);
        break;
    }
  }

  /**
   * Handle geofence exit event
   */
  private async handleGeofenceExit(event: GeofenceEvent): Promise<void> {
    // Debounce events
    if (this.isDebounced(event.location.id)) {
      return;
    }
    this.debounceEvent(event.location.id);

    const store = useStore.getState();
    store.addGeofenceEvent(event);

    // If we have an active booking, we might want to notify about it
    if (this.state.activeBooking) {
      // Could send a notification about leaving the area with active parking
    }
  }

  /**
   * Handle location update
   */
  private handleLocationUpdate(location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  }): void {
    const store = useStore.getState();
    store.setCurrentLocation(location);
  }

  /**
   * Perform automatic booking (fully automatic mode)
   */
  private async performAutomaticBooking(
    location: Location,
    duration: number,
    estimatedCost: number
  ): Promise<void> {
    this.updateState({ status: "booking" });

    const store = useStore.getState();
    const vehicle = store.getDefaultVehicle();
    const paymentMethod = store.getDefaultPaymentMethod();

    if (!vehicle || !paymentMethod) {
      this.updateState({
        status: "failed",
        error: "No default vehicle or payment method configured",
      });
      await notificationService.sendBookingFailureNotification(
        location.name,
        "Please configure a default vehicle and payment method"
      );
      return;
    }

    try {
      // Attempt to book parking
      const result = await paybyphoneService.bookParking({
        locationId: location.id,
        zoneCode: location.parkingZone || "",
        vehicle,
        paymentMethod,
        duration,
      });

      if (result.success) {
        // Create parking session
        const session: Omit<ParkingSession, "id" | "createdAt"> = {
          locationId: location.id,
          locationName: location.name,
          vehicleId: vehicle.id,
          paymentMethodId: paymentMethod.id,
          startTime: new Date(),
          endTime: new Date(Date.now() + duration * 60 * 1000),
          duration,
          cost: result.cost || estimatedCost,
          status: "active",
          bookingReference: result.bookingReference,
        };

        const savedSession = store.addParkingSession(session);
        this.updateState({
          status: "completed",
          activeBooking: savedSession,
        });

        // Send success notification
        await notificationService.sendBookingSuccessNotification(
          location.name,
          result.bookingReference || "N/A",
          duration,
          result.cost || estimatedCost
        );
      } else {
        this.updateState({
          status: "failed",
          error: result.error || "Booking failed",
        });
        await notificationService.sendBookingFailureNotification(
          location.name,
          result.error || "Unknown error"
        );
      }
    } catch (error) {
      this.updateState({
        status: "failed",
        error: (error as Error).message,
      });
      await notificationService.sendBookingFailureNotification(
        location.name,
        (error as Error).message
      );
    }
  }

  /**
   * Request user confirmation (semi-automatic mode)
   */
  private async requestConfirmation(
    location: Location,
    duration: number,
    estimatedCost: number
  ): Promise<void> {
    this.updateState({ status: "processing" });

    await notificationService.sendBookingConfirmationNotification(
      location,
      duration,
      estimatedCost
    );

    // State will be updated when user responds to notification
  }

  /**
   * Send manual notification (manual mode)
   */
  private async sendManualNotification(
    location: Location,
    duration: number,
    estimatedCost: number
  ): Promise<void> {
    await notificationService.sendGeofenceEntryNotification(location);
    this.updateState({ status: "idle" });
  }

  /**
   * Handle notification response
   */
  private async handleNotificationResponse(
    response: Notifications.NotificationResponse
  ): Promise<void> {
    const { action, data } = response.notification.request.content;

    if (data?.type === "booking_confirmation") {
      if (action === "confirm" || response.actionIdentifier === "confirm_booking") {
        // User confirmed booking
        await this.performAutomaticBooking(
          this.state.currentLocation!,
          data.duration,
          data.cost
        );
      }
    }
  }

  /**
   * Estimate parking cost
   */
  private estimateCost(duration: number): number {
    const hourlyRate = 2.5; // Average UK rate
    return Math.ceil(duration / 60) * hourlyRate;
  }

  /**
   * Check if event is debounced
   */
  private isDebounced(locationId: string): boolean {
    const lastEvent = this.eventDebounce.get(locationId);
    if (lastEvent && Date.now() - lastEvent < this.DEBOUNCE_MS) {
      return true;
    }
    return false;
  }

  /**
   * Add event to debounce map
   */
  private debounceEvent(locationId: string): void {
    this.eventDebounce.set(locationId, Date.now());
  }

  /**
   * Update internal state
   */
  private updateState(updates: Partial<AutomationState>): void {
    this.state = { ...this.state, ...updates };
  }

  /**
   * Get current automation state
   */
  getState(): AutomationState {
    return { ...this.state };
  }

  /**
   * Check if automation is running
   */
  isRunning(): boolean {
    return this.state.status === "monitoring" || this.state.status === "processing";
  }

  /**
   * Get automation status
   */
  getStatus(): AutomationStatus {
    return this.state.status;
  }
}

// Export singleton instance
export const automationService = new AutomationService();
export default automationService;