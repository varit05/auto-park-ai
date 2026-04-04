/**
 * AutoPark AI - Home Screen
 * Main dashboard showing automation status and quick actions
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useStore } from "@store/useStore";
import { automationService } from "@services/automationService";
import type { AutomationStatus } from "@services/automationService";
import { formatDuration, formatCurrency, formatTimeAgo } from "@utils/helpers";

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [automationStatus, setAutomationStatus] =
    useState<AutomationStatus>("idle");
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);

  const locations = useStore((state) => state.locations);
  const activeLocations = locations.filter((l) => l.isActive);
  const recentSessions = useStore((state) => state.getParkingSessions(5));
  const recentEvents = useStore((state) => state.getRecentEvents(5));
  const settings = useStore((state) => state.settings);
  const vehicles = useStore((state) => state.vehicles);
  const paymentMethods = useStore((state) => state.paymentMethods);

  const onRefresh = async () => {
    setRefreshing(true);
    // Update automation status
    setAutomationStatus(automationService.getStatus());
    setRefreshing(false);
  };

  useEffect(() => {
    // Update automation status periodically
    const interval = setInterval(() => {
      setAutomationStatus(automationService.getStatus());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: AutomationStatus) => {
    switch (status) {
      case "monitoring":
        return "#10b981"; // Green
      case "processing":
        return "#f59e0b"; // Yellow
      case "booking":
        return "#3b82f6"; // Blue
      case "completed":
        return "#10b981"; // Green
      case "failed":
        return "#ef4444"; // Red
      default:
        return "#6b7280"; // Gray
    }
  };

  const getStatusText = (status: AutomationStatus) => {
    switch (status) {
      case "idle":
        return "Idle";
      case "monitoring":
        return "Monitoring";
      case "processing":
        return "Processing";
      case "booking":
        return "Booking...";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      default:
        return "Unknown";
    }
  };

  const isSetupComplete =
    activeLocations.length > 0 &&
    vehicles.length > 0 &&
    paymentMethods.length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Status Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Automation Status</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(automationStatus) },
            ]}
          />
          <Text style={styles.statusText}>
            {getStatusText(automationStatus)}
          </Text>
        </View>
        <Text style={styles.modeText}>
          Mode:{" "}
          {settings.automationMode === "fully_automatic"
            ? "Fully Automatic"
            : settings.automationMode === "semi_automatic"
              ? "Semi-Automatic"
              : "Manual"}
        </Text>
        {!isSetupComplete && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              ⚠️ Setup incomplete. Please add locations, vehicles, and payment
              methods.
            </Text>
          </View>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{activeLocations.length}</Text>
          <Text style={styles.statLabel}>Active Locations</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{recentSessions.length}</Text>
          <Text style={styles.statLabel}>Recent Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {settings.aiEnabled ? "On" : "Off"}
          </Text>
          <Text style={styles.statLabel}>AI Assistant</Text>
        </View>
      </View>

      {/* Active Locations */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active Locations</Text>
        {activeLocations.length === 0 ? (
          <Text style={styles.emptyText}>No active locations configured</Text>
        ) : (
          activeLocations.slice(0, 3).map((location) => (
            <View key={location.id} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <Text style={styles.listItemTitle}>{location.name}</Text>
                {location.parkingZone && (
                  <Text style={styles.listItemSubtitle}>
                    Zone: {location.parkingZone}
                  </Text>
                )}
              </View>
              <View style={styles.listItemRight}>
                <Text style={styles.listItemValue}>
                  {Math.round(location.radius)}m
                </Text>
              </View>
            </View>
          ))
        )}
        {activeLocations.length > 3 && (
          <Text style={styles.moreText}>
            +{activeLocations.length - 3} more
          </Text>
        )}
      </View>

      {/* Recent Activity */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Activity</Text>
        {recentEvents.length === 0 ? (
          <Text style={styles.emptyText}>No recent activity</Text>
        ) : (
          recentEvents.slice(0, 5).map((event, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <Text style={styles.listItemTitle}>
                  {event.eventType === "enter" ? "📍" : "🚗"}{" "}
                  {event.location.name}
                </Text>
                <Text style={styles.listItemSubtitle}>
                  {formatTimeAgo(new Date(event.timestamp))}
                </Text>
              </View>
              <Text
                style={[
                  styles.eventBadge,
                  {
                    backgroundColor:
                      event.eventType === "enter" ? "#d1fae5" : "#fce7f3",
                    color: event.eventType === "enter" ? "#065f46" : "#9d174d",
                  },
                ]}
              >
                {event.eventType === "enter" ? "Arrived" : "Left"}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Recent Bookings */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Bookings</Text>
        {recentSessions.length === 0 ? (
          <Text style={styles.emptyText}>No bookings yet</Text>
        ) : (
          recentSessions.slice(0, 3).map((session) => (
            <View key={session.id} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <Text style={styles.listItemTitle}>{session.locationName}</Text>
                <Text style={styles.listItemSubtitle}>
                  {formatDuration(session.duration)} •{" "}
                  {formatCurrency(session.cost)}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      session.status === "completed"
                        ? "#d1fae5"
                        : session.status === "active"
                          ? "#dbeafe"
                          : session.status === "failed"
                            ? "#fee2e2"
                            : "#f3f4f6",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color:
                        session.status === "completed"
                          ? "#065f46"
                          : session.status === "active"
                            ? "#1e40af"
                            : session.status === "failed"
                              ? "#991b1b"
                              : "#374151",
                    },
                  ]}
                >
                  {session.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  modeText: {
    fontSize: 14,
    color: "#6b7280",
  },
  warningBanner: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  warningText: {
    fontSize: 13,
    color: "#92400e",
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2563eb",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 12,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  listItemLeft: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1f2937",
  },
  listItemSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  listItemRight: {
    alignItems: "flex-end",
  },
  listItemValue: {
    fontSize: 14,
    color: "#6b7280",
  },
  eventBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  moreText: {
    fontSize: 13,
    color: "#2563eb",
    marginTop: 8,
    textAlign: "center",
  },
});
