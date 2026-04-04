/**
 * AutoPark AI - Zustand Store
 * Centralized state management using Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Location,
  Vehicle,
  PaymentMethod,
  ParkingSession,
  AppSettings,
  GeofenceEvent,
  AppState,
} from '@types/index';

// Default settings
const defaultSettings: AppSettings = {
  automationMode: 'semi_automatic',
  defaultDuration: 120, // 2 hours
  geofenceRadius: 100, // 100 meters
  locationAccuracyThreshold: 50, // 50 meters
  enableNotifications: true,
  notificationSound: true,
  vibrationEnabled: true,
  aiEnabled: true,
  aiModelProvider: 'ollama',
  theme: 'system',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  backgroundTrackingEnabled: true,
  batteryOptimizationEnabled: true,
};

// Initial app state
const initialAppState: AppState = {
  isInitialized: false,
  isLoading: false,
  activeGeofences: [],
  recentEvents: [],
};

interface StoreState {
  // App state
  appState: AppState;
  settings: AppSettings;
  
  // Data collections
  locations: Location[];
  vehicles: Vehicle[];
  paymentMethods: PaymentMethod[];
  parkingSessions: ParkingSession[];
  
  // Actions - App
  initializeApp: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
  setCurrentLocation: (location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  }) => void;
  
  // Actions - Settings
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  
  // Actions - Locations
  addLocation: (location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) => Location;
  updateLocation: (id: string, location: Partial<Location>) => void;
  removeLocation: (id: string) => void;
  getLocationById: (id: string) => Location | undefined;
  getActiveLocations: () => Location[];
  
  // Actions - Vehicles
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Vehicle;
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => void;
  removeVehicle: (id: string) => void;
  setDefaultVehicle: (id: string) => void;
  getDefaultVehicle: () => Vehicle | undefined;
  
  // Actions - Payment Methods
  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => PaymentMethod;
  updatePaymentMethod: (id: string, method: Partial<PaymentMethod>) => void;
  removePaymentMethod: (id: string) => void;
  setDefaultPaymentMethod: (id: string) => void;
  getDefaultPaymentMethod: () => PaymentMethod | undefined;
  
  // Actions - Parking Sessions
  addParkingSession: (session: Omit<ParkingSession, 'id' | 'createdAt'>) => ParkingSession;
  updateParkingSession: (id: string, session: Partial<ParkingSession>) => void;
  getParkingSessions: (limit?: number) => ParkingSession[];
  
  // Actions - Geofence Events
  addGeofenceEvent: (event: GeofenceEvent) => void;
  getRecentEvents: (limit?: number) => GeofenceEvent[];
  setActiveGeofences: (locationIds: string[]) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      appState: initialAppState,
      settings: defaultSettings,
      locations: [],
      vehicles: [],
      paymentMethods: [],
      parkingSessions: [],

      // App actions
      initializeApp: async () => {
        set({ appState: { ...initialAppState, isInitialized: true } });
      },

      setLoading: (isLoading) => {
        set({ appState: { ...get().appState, isLoading } });
      },

      setError: (error) => {
        set({ appState: { ...get().appState, error } });
      },

      setCurrentLocation: (location) => {
        set({
          appState: {
            ...get().appState,
            currentLocation: {
              ...location,
              timestamp: new Date(),
            },
          },
        });
      },

      // Settings actions
      updateSettings: (newSettings) => {
        set({ settings: { ...get().settings, ...newSettings } });
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
      },

      // Location actions
      addLocation: (locationData) => {
        const newLocation: Location = {
          ...locationData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set({ locations: [...get().locations, newLocation] });
        return newLocation;
      },

      updateLocation: (id, locationData) => {
        set({
          locations: get().locations.map((loc) =>
            loc.id === id
              ? { ...loc, ...locationData, updatedAt: new Date() }
              : loc
          ),
        });
      },

      removeLocation: (id) => {
        set({ locations: get().locations.filter((loc) => loc.id !== id) });
      },

      getLocationById: (id) => {
        return get().locations.find((loc) => loc.id === id);
      },

      getActiveLocations: () => {
        return get().locations.filter((loc) => loc.isActive);
      },

      // Vehicle actions
      addVehicle: (vehicleData) => {
        const isDefault = get().vehicles.length === 0;
        const newVehicle: Vehicle = {
          ...vehicleData,
          id: crypto.randomUUID(),
          isDefault,
        };
        set({ vehicles: [...get().vehicles, newVehicle] });
        return newVehicle;
      },

      updateVehicle: (id, vehicleData) => {
        set({
          vehicles: get().vehicles.map((v) =>
            v.id === id ? { ...v, ...vehicleData } : v
          ),
        });
      },

      removeVehicle: (id) => {
        set({ vehicles: get().vehicles.filter((v) => v.id !== id) });
      },

      setDefaultVehicle: (id) => {
        set({
          vehicles: get().vehicles.map((v) => ({
            ...v,
            isDefault: v.id === id,
          })),
        });
      },

      getDefaultVehicle: () => {
        return get().vehicles.find((v) => v.isDefault);
      },

      // Payment method actions
      addPaymentMethod: (methodData) => {
        const isDefault = get().paymentMethods.length === 0;
        const newMethod: PaymentMethod = {
          ...methodData,
          id: crypto.randomUUID(),
          isDefault,
        };
        set({ paymentMethods: [...get().paymentMethods, newMethod] });
        return newMethod;
      },

      updatePaymentMethod: (id, methodData) => {
        set({
          paymentMethods: get().paymentMethods.map((m) =>
            m.id === id ? { ...m, ...methodData } : m
          ),
        });
      },

      removePaymentMethod: (id) => {
        set({
          paymentMethods: get().paymentMethods.filter((m) => m.id !== id),
        });
      },

      setDefaultPaymentMethod: (id) => {
        set({
          paymentMethods: get().paymentMethods.map((m) => ({
            ...m,
            isDefault: m.id === id,
          })),
        });
      },

      getDefaultPaymentMethod: () => {
        return get().paymentMethods.find((m) => m.isDefault);
      },

      // Parking session actions
      addParkingSession: (sessionData) => {
        const newSession: ParkingSession = {
          ...sessionData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        };
        set({ parkingSessions: [newSession, ...get().parkingSessions] });
        return newSession;
      },

      updateParkingSession: (id, sessionData) => {
        set({
          parkingSessions: get().parkingSessions.map((s) =>
            s.id === id ? { ...s, ...sessionData } : s
          ),
        });
      },

      getParkingSessions: (limit = 50) => {
        const sessions = get().parkingSessions;
        return limit ? sessions.slice(0, limit) : sessions;
      },

      // Geofence event actions
      addGeofenceEvent: (event) => {
        const recentEvents = get().appState.recentEvents || [];
        set({
          appState: {
            ...get().appState,
            recentEvents: [event, ...recentEvents].slice(0, 100), // Keep last 100 events
          },
        });
      },

      getRecentEvents: (limit = 20) => {
        const events = get().appState.recentEvents || [];
        return events.slice(0, limit);
      },

      setActiveGeofences: (locationIds) => {
        set({
          appState: {
            ...get().appState,
            activeGeofences: locationIds,
          },
        });
      },
    }),
    {
      name: 'autopark-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, value);
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
      partialize: (state) => ({
        settings: state.settings,
        locations: state.locations,
        vehicles: state.vehicles,
        paymentMethods: state.paymentMethods,
        parkingSessions: state.parkingSessions,
      }),
    }
  )
);