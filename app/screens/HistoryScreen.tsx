/**
 * AutoPark AI - History Screen
 * View parking booking history and statistics
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useStore } from "@store/useStore";
import type { ParkingSession } from "@types/index";
import {
  formatDuration,
  formatCurrency,
  formatDate,
  formatTimeAgo,
} from "@utils/helpers";

export default function HistoryScreen() {
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "completed" | "active" | "failed"
  >("all");

  const parkingSessions = useStore((state: any) =>
    state.getParkingSessions(50),
  );
  const locations = useStore((state: any) => state.locations);

  // Filter sessions based on selected filter
  const filteredSessions = parkingSessions.filter((session: ParkingSession) => {
    if (selectedFilter === "all") return true;
    return session.status === selectedFilter;
  });

  // Calculate statistics
  const stats = {
    totalBookings: parkingSessions.length,
    completedBookings: parkingSessions.filter(
      (s: ParkingSession) => s.status === "completed",
    ).length,
    totalSpent: parkingSessions
      .filter((s: ParkingSession) => s.status === "completed")
      .reduce((sum: number, s: ParkingSession) => sum + s.cost, 0),
    avgDuration:
      parkingSessions.length > 0
        ? Math.round(
            parkingSessions.reduce(
              (sum: number, s: ParkingSession) => sum + s.duration,
              0,
            ) / parkingSessions.length,
          )
        : 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return { bg: "#d1fae5", text: "#065f46" };
      case "active":
        return { bg: "#dbeafe", text: "#1e40af" };
      case "failed":
        return { bg: "#fee2e2", text: "#991b1b" };
      case "cancelled":
        return { bg: "#f3f4f6", text: "#374151" };
      default:
        return { bg: "#f3f4f6", text: "#374151" };
    }
  };

  const renderSessionItem = ({ item }: { item: ParkingSession }) => {
    const statusColors = getStatusColor(item.status);

    return (
      <View style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionLocation}>{item.locationName}</Text>
            <Text style={styles.sessionDate}>
              {formatDate(new Date(item.startTime))}
            </Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}
          >
            <Text
              style={[styles.statusBadgeText, { color: statusColors.text }]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.sessionDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>
                {formatDuration(item.duration)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Cost</Text>
              <Text style={styles.detailValue}>
                {formatCurrency(item.cost)}
              </Text>
            </View>
            {item.bookingReference && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Reference</Text>
                <Text style={styles.detailValue}>{item.bookingReference}</Text>
              </View>
            )}
          </View>
        </View>

        {item.status === "active" && (
          <View style={styles.activeSessionFooter}>
            <Text style={styles.activeSessionText}>
              Expires: {formatDate(new Date(item.endTime))}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalBookings}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.completedBookings}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {formatCurrency(stats.totalSpent)}
          </Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {formatDuration(stats.avgDuration)}
          </Text>
          <Text style={styles.statLabel}>Avg Duration</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === "all" && styles.filterTabActive,
          ]}
          onPress={() => setSelectedFilter("all")}
        >
          <Text
            style={[
              styles.filterTabText,
              selectedFilter === "all" && styles.filterTabTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === "active" && styles.filterTabActive,
          ]}
          onPress={() => setSelectedFilter("active")}
        >
          <Text
            style={[
              styles.filterTabText,
              selectedFilter === "active" && styles.filterTabTextActive,
            ]}
          >
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === "completed" && styles.filterTabActive,
          ]}
          onPress={() => setSelectedFilter("completed")}
        >
          <Text
            style={[
              styles.filterTabText,
              selectedFilter === "completed" && styles.filterTabTextActive,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === "failed" && styles.filterTabActive,
          ]}
          onPress={() => setSelectedFilter("failed")}
        >
          <Text
            style={[
              styles.filterTabText,
              selectedFilter === "failed" && styles.filterTabTextActive,
            ]}
          >
            Failed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🅿️</Text>
          <Text style={styles.emptyTitle}>No Parking History</Text>
          <Text style={styles.emptyText}>
            Your parking bookings will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          renderItem={renderSessionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
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
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabActive: {
    backgroundColor: "#2563eb",
  },
  filterTabText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  filterTabTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  sessionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionLocation: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 13,
    color: "#6b7280",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  sessionDetails: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  activeSessionFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#dbeafe",
    backgroundColor: "#eff6ff",
    marginHorizontal: -16,
    marginBottom: -16,
    padding: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  activeSessionText: {
    fontSize: 13,
    color: "#1e40af",
    textAlign: "center",
  },
});
