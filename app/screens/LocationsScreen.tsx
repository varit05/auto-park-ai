/**
 * AutoPark AI - Locations Screen
 * Manage saved parking locations with geofencing
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Switch,
} from "react-native";
import { useStore } from "@store/useStore";
import type { Location } from "@types/index";
import { formatDuration } from "@utils/helpers";
import { generateId } from "@utils/helpers";

export default function LocationsScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationZone, setNewLocationZone] = useState("");
  const [newLocationRadius, setNewLocationRadius] = useState("100");

  const locations = useStore((state: any) => state.locations);
  const addLocation = useStore((state: any) => state.addLocation);
  const updateLocation = useStore((state: any) => state.updateLocation);
  const removeLocation = useStore((state: any) => state.removeLocation);
  const settings = useStore((state: any) => state.settings);

  // Filter locations based on search query
  const filteredLocations = locations.filter((location: Location) =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddLocation = () => {
    if (!newLocationName.trim()) {
      Alert.alert("Error", "Please enter a location name");
      return;
    }

    // For demo purposes, we'll use a default location (user's current location would be used in production)
    const newLocation: Omit<Location, "id" | "createdAt" | "updatedAt"> = {
      name: newLocationName.trim(),
      latitude: 51.5074, // London default
      longitude: -0.1278,
      parkingZone: newLocationZone.trim() || undefined,
      radius: parseInt(newLocationRadius) || 100,
      isActive: true,
    };

    addLocation(newLocation);
    setNewLocationName("");
    setNewLocationZone("");
    setNewLocationRadius("100");
    setModalVisible(false);
  };

  const handleToggleLocation = (location: Location) => {
    updateLocation(location.id, { isActive: !location.isActive });
  };

  const handleDeleteLocation = (location: Location) => {
    Alert.alert(
      "Delete Location",
      `Are you sure you want to delete "${location.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => removeLocation(location.id),
        },
      ],
    );
  };

  const renderLocationItem = ({ item }: { item: Location }) => (
    <View style={styles.locationCard}>
      <View style={styles.locationHeader}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationName}>{item.name}</Text>
          {item.parkingZone && (
            <Text style={styles.locationZone}>Zone: {item.parkingZone}</Text>
          )}
          <Text style={styles.locationCoords}>
            {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
          </Text>
          <Text style={styles.locationRadius}>
            Radius:{" "}
            {formatDuration((item.radius / 60) * 1000).replace("min", "m")}
          </Text>
        </View>
        <Switch
          value={item.isActive}
          onValueChange={() => handleToggleLocation(item)}
          trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
          thumbColor={item.isActive ? "#2563eb" : "#f4f3f4"}
        />
      </View>
      <View style={styles.locationActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteLocation(item)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search locations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Locations List */}
      {filteredLocations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📍</Text>
          <Text style={styles.emptyTitle}>No Locations Yet</Text>
          <Text style={styles.emptyText}>
            Add locations where you want automatic parking booking
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>Add Location</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredLocations}
          renderItem={renderLocationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Floating Add Button */}
      {filteredLocations.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Add Location Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Location</Text>

            <Text style={styles.inputLabel}>Location Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Home, Office, Gym"
              value={newLocationName}
              onChangeText={setNewLocationName}
            />

            <Text style={styles.inputLabel}>PaybyPhone Zone (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., LDN1"
              value={newLocationZone}
              onChangeText={setNewLocationZone}
            />

            <Text style={styles.inputLabel}>Geofence Radius (meters)</Text>
            <TextInput
              style={styles.input}
              placeholder="100"
              value={newLocationRadius}
              onChangeText={setNewLocationRadius}
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddLocation}
              >
                <Text style={styles.confirmButtonText}>Add Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  searchInput: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
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
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  locationCard: {
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
  locationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  locationInfo: {
    flex: 1,
    marginRight: 16,
  },
  locationName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  locationZone: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "500",
    marginBottom: 2,
  },
  locationCoords: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 2,
  },
  locationRadius: {
    fontSize: 12,
    color: "#9ca3af",
  },
  locationActions: {
    flexDirection: "row",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#fee2e2",
  },
  deleteButtonText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 36,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#e5e7eb",
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#2563eb",
    marginLeft: 8,
  },
  confirmButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
