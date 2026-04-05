/**
 * AutoPark AI - PaybyPhone Service
 * Handles PaybyPhone integration via deep linking and web automation
 */

import { Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { createPaybyPhoneUrl, parsePaybyPhoneUrl } from "@utils/helpers";
import type {
  Vehicle,
  PaymentMethod,
  ParkingSession,
} from "@app-types/index";

// PaybyPhone URL schemes and web URLs
const PAYBYPHONE_SCHEME = "paybyphone://";
const PAYBYPHONE_WEB_URL = "https://www.paybyphone.com";
const PAYBYPHONE_BOOK_URL = "https://www.paybyphone.com/book";

// Mock data for demo purposes (since we don't have real API access)
const MOCK_LOCATIONS = [
  { id: "1", name: "London Zone 1", zoneCode: "LDN1", latitude: 51.5074, longitude: -0.1278, city: "London", country: "UK" },
  { id: "2", name: "Manchester Central", zoneCode: "MAN1", latitude: 53.4808, longitude: -2.2426, city: "Manchester", country: "UK" },
  { id: "3", name: "Birmingham City", zoneCode: "BHM1", latitude: 52.4862, longitude: -1.8904, city: "Birmingham", country: "UK" },
];

interface BookingOptions {
  locationId: string;
  zoneCode: string;
  vehicle: Vehicle;
  paymentMethod: PaymentMethod;
  duration: number; // in minutes
}

interface BookingResult {
  success: boolean;
  bookingReference?: string;
  sessionId?: string;
  expiryTime?: Date;
  cost?: number;
  error?: string;
  method: "app" | "web";
}

class PaybyPhoneService {
  private isPaybyPhoneInstalled = false;
  private sessionToken: string | null = null;

  constructor() {
    this.checkAppInstallation();
  }

  /**
   * Check if PaybyPhone app is installed
   */
  private async checkAppInstallation(): Promise<boolean> {
    try {
      const supported = await Linking.canOpenURL(PAYBYPHONE_SCHEME);
      this.isPaybyPhoneInstalled = supported;
      return supported;
    } catch (error) {
      this.isPaybyPhoneInstalled = false;
      return false;
    }
  }

  /**
   * Check if PaybyPhone app is installed (public)
   */
  isAppInstalled(): boolean {
    return this.isPaybyPhoneInstalled;
  }

  /**
   * Open PaybyPhone app with a specific location
   */
  async openAppWithLocation(zoneCode: string, locationId?: string): Promise<boolean> {
    try {
      const url = createPaybyPhoneUrl(zoneCode, locationId);
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error opening PaybyPhone app:", error);
      return false;
    }
  }

  /**
   * Open PaybyPhone website in browser
   */
  async openWebBooking(zoneCode?: string): Promise<boolean> {
    try {
      const url = zoneCode 
        ? `${PAYBYPHONE_BOOK_URL}?zone=${zoneCode}`
        : PAYBYPHONE_WEB_URL;
      
      await WebBrowser.openBrowserAsync(url);
      return true;
    } catch (error) {
      console.error("Error opening PaybyPhone website:", error);
      return false;
    }
  }

  /**
   * Book parking via app deep linking
   * Note: This is a simplified approach. Full automation would require
   * more sophisticated techniques or official API access.
   */
  async bookParking(options: BookingOptions): Promise<BookingResult> {
    // First try the app
    if (this.isPaybyPhoneInstalled) {
      return this.bookViaApp(options);
    }
    
    // Fall back to web
    return this.bookViaWeb(options);
  }

  /**
   * Book parking via PaybyPhone app
   */
  private async bookViaApp(options: BookingOptions): Promise<BookingResult> {
    try {
      // Open the app with the location
      const opened = await this.openAppWithLocation(options.zoneCode, options.locationId);
      
      if (opened) {
        // In a real implementation, we would need to:
        // 1. Wait for the app to open
        // 2. Pre-fill the booking details (duration, vehicle, payment)
        // 3. Either auto-confirm or wait for user confirmation
        
        // For now, we return success and let the user complete the booking
        return {
          success: true,
          method: "app",
          cost: this.estimateCost(options.duration),
          sessionId: `session_${Date.now()}`,
          expiryTime: new Date(Date.now() + options.duration * 60 * 1000),
        };
      }
      
      // If app failed, try web
      return this.bookViaWeb(options);
    } catch (error) {
      return {
        success: false,
        error: `App booking failed: ${error}`,
        method: "app",
      };
    }
  }

  /**
   * Book parking via PaybyPhone website
   */
  private async bookViaWeb(options: BookingOptions): Promise<BookingResult> {
    try {
      // Open the web booking page
      await this.openWebBooking(options.zoneCode);
      
      // Return result - user will need to complete booking manually
      return {
        success: true,
        method: "web",
        cost: this.estimateCost(options.duration),
        sessionId: `session_${Date.now()}`,
        expiryTime: new Date(Date.now() + options.duration * 60 * 1000),
      };
    } catch (error) {
      return {
        success: false,
        error: `Web booking failed: ${error}`,
        method: "web",
      };
    }
  }

  /**
   * Estimate parking cost based on duration
   * This is a simplified estimation - actual costs vary by location
   */
  private estimateCost(durationMinutes: number): number {
    // Average UK parking rate: ~£2.50 per hour
    const hourlyRate = 2.50;
    const hours = Math.ceil(durationMinutes / 60);
    return hours * hourlyRate;
  }

  /**
   * Get nearby PaybyPhone locations
   * In a real implementation, this would query the PaybyPhone API
   */
  async getNearbyLocations(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<typeof MOCK_LOCATIONS> {
    // For demo purposes, return mock locations
    // In production, this would call the actual PaybyPhone API
    
    return MOCK_LOCATIONS.filter((location) => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        location.latitude,
        location.longitude
      );
      return distance <= radiusKm * 1000;
    });
  }

  /**
   * Calculate distance between two points (simplified)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Get parking session details
   */
  async getSessionDetails(sessionId: string): Promise<ParkingSession | null> {
    // In production, this would query the PaybyPhone API
    // For now, return null
    return null;
  }

  /**
   * Extend parking session
   */
  async extendSession(
    sessionId: string,
    additionalMinutes: number
  ): Promise<boolean> {
    // In production, this would call the PaybyPhone API
    // For now, open the app/website for manual extension
    return this.openWebBooking();
  }

  /**
   * Cancel parking session
   */
  async cancelSession(sessionId: string): Promise<boolean> {
    // In production, this would call the PaybyPhone API
    // For now, open the app/website for manual cancellation
    return this.openWebBooking();
  }

  /**
   * Set session token for authenticated requests
   */
  setSessionToken(token: string | null): void {
    this.sessionToken = token;
  }

  /**
   * Get session token
   */
  getSessionToken(): string | null {
    return this.sessionToken;
  }
}

// Export singleton instance
export const paybyphoneService = new PaybyPhoneService();
export default paybyphoneService;