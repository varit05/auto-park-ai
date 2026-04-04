/**
 * AutoPark AI - Type Definitions
 */

// Location types
export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  radius: number; // Geofence radius in meters
  parkingZone?: string; // PaybyPhone zone code
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Vehicle types
export interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
  isDefault: boolean;
}

// Payment method types
export interface PaymentMethod {
  id: string;
  type: 'card' | 'apple_pay' | 'google_pay';
  last4?: string;
  isDefault: boolean;
}

// Parking session types
export interface ParkingSession {
  id: string;
  locationId: string;
  locationName: string;
  vehicleId: string;
  paymentMethodId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  cost: number;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';
  bookingReference?: string;
  createdAt: Date;
}

// Automation mode types
export type AutomationMode = 'fully_automatic' | 'semi_automatic' | 'manual';

// Settings types
export interface AppSettings {
  // Automation
  automationMode: AutomationMode;
  
  // Default values
  defaultDuration: number; // in minutes
  defaultVehicleId?: string;
  defaultPaymentMethodId?: string;
  
  // Location settings
  geofenceRadius: number; // default radius in meters
  locationAccuracyThreshold: number; // in meters
  
  // Notification settings
  enableNotifications: boolean;
  notificationSound: boolean;
  vibrationEnabled: boolean;
  
  // AI settings
  aiEnabled: boolean;
  aiModelProvider: 'local' | 'openai' | 'ollama' | 'claude';
  aiApiKey?: string;
  aiApiEndpoint?: string;
  
  // PaybyPhone settings
  paybyphoneUsername?: string;
  paybyphoneSessionToken?: string;
  
  // General
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  
  // Tracking
  backgroundTrackingEnabled: boolean;
  batteryOptimizationEnabled: boolean;
}

// AI/LLM types
export interface AIPrompt {
  context: string;
  userMessage: string;
  systemPrompt: string;
}

export interface AIResponse {
  suggestedDuration: number;
  confidence: number;
  reasoning: string;
  alternativeOptions?: Array<{
    duration: number;
    reason: string;
  }>;
}

// Geofence event types
export interface GeofenceEvent {
  location: Location;
  eventType: 'enter' | 'exit';
  timestamp: Date;
  accuracy: number;
  latitude: number;
  longitude: number;
}

// Notification types
export interface LocalNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  vibration?: boolean;
  priority?: 'high' | 'default' | 'low';
}

// API response types
export interface PaybyPhoneLocation {
  id: string;
  name: string;
  zoneCode: string;
  latitude: number;
  longitude: number;
  country: string;
  city: string;
}

export interface PaybyPhoneBookingRequest {
  locationId: string;
  zoneCode: string;
  vehicleRegistration: string;
  duration: number; // in minutes
  paymentMethodId: string;
}

export interface PaybyPhoneBookingResponse {
  success: boolean;
  bookingReference?: string;
  sessionId?: string;
  expiryTime?: Date;
  cost?: number;
  error?: string;
}

// App state types
export interface AppState {
  isInitialized: boolean;
  isLoading: boolean;
  error?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };
  activeGeofences: string[]; // Location IDs
  recentEvents: GeofenceEvent[];
}