/**
 * AutoPark AI - Main App Component
 * AI-powered automatic parking booking app
 */

import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useStore } from "@store/useStore";
import { automationService } from "@services/automationService";
import { aiService } from "@services/aiService";
import HomeScreen from "@screens/HomeScreen";
import LocationsScreen from "@screens/LocationsScreen";
import SettingsScreen from "@screens/SettingsScreen";
import HistoryScreen from "@screens/HistoryScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Navigation types
export type RootStackParamList = {
  Main: undefined;
  AddLocation: { initialLatitude?: number; initialLongitude?: number };
  EditLocation: { locationId: string };
  AddVehicle: undefined;
  EditVehicle: { vehicleId: string };
  AddPaymentMethod: undefined;
  BookingDetail: { sessionId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Locations: undefined;
  History: undefined;
  Settings: undefined;
};

// Loading screen component
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}

// Main tab navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#9ca3af",
        headerStyle: {
          backgroundColor: "#2563eb",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "AutoPark AI",
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name="Locations"
        component={LocationsScreen}
        options={{
          title: "Locations",
          tabBarLabel: "Locations",
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: "History",
          tabBarLabel: "History",
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          tabBarLabel: "Settings",
        }}
      />
    </Tab.Navigator>
  );
}

// Root stack navigator
function RootStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#2563eb",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="Main"
        component={MainTabs}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Main App component
export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);
  const initializeApp = useStore((state) => state.initializeApp);
  const locations = useStore((state) => state.locations);
  const vehicles = useStore((state) => state.vehicles);
  const settings = useStore((state) => state.settings);

  // Initialize app on mount
  useEffect(() => {
    async function initialize() {
      try {
        // Initialize the store
        await initializeApp();

        // Initialize AI service
        aiService.initialize({
          provider: settings.aiModelProvider,
          apiKey: settings.aiApiKey,
          apiEndpoint: settings.aiApiEndpoint,
        });

        // Initialize automation service
        const automationInitialized = await automationService.initialize();

        if (automationInitialized) {
          // Start monitoring if there are active locations
          const activeLocations = locations.filter((l) => l.isActive);
          if (activeLocations.length > 0) {
            await automationService.startMonitoring();
          }
        }

        setIsAppReady(true);
      } catch (error) {
        console.error("Error initializing app:", error);
        // Still set ready but with potential issues
        setIsAppReady(true);
      }
    }

    initialize();
  }, []);

  // Update AI service when settings change
  useEffect(() => {
    if (aiService.isReady()) {
      aiService.initialize({
        provider: settings.aiModelProvider,
        apiKey: settings.aiApiKey,
        apiEndpoint: settings.aiApiEndpoint,
      });
    }
  }, [settings.aiModelProvider, settings.aiApiKey, settings.aiApiEndpoint]);

  // Restart monitoring when locations change
  useEffect(() => {
    if (isAppReady && automationService.isRunning()) {
      const activeLocations = locations.filter((l) => l.isActive);
      if (activeLocations.length > 0) {
        automationService.stopMonitoring();
        automationService.startMonitoring();
      } else {
        automationService.stopMonitoring();
      }
    }
  }, [locations]);

  if (!isAppReady) {
    return (
      <SafeAreaProvider>
        <LoadingScreen />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootStackNavigator />
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
});
