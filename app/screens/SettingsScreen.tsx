/**
 * AutoPark AI - Settings Screen
 * Configure automation settings, vehicles, and payment methods
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  Alert,
  Picker,
} from "react-native";
import { useStore } from "@store/useStore";
import type { Vehicle, PaymentMethod } from "@types/index";
import { generateId } from "@utils/helpers";

export default function SettingsScreen() {
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newVehicleName, setNewVehicleName] = useState("");
  const [newVehiclePlate, setNewVehiclePlate] = useState("");
  const [newPaymentType, setNewPaymentType] = useState<"card" | "apple_pay">(
    "card",
  );
  const [newPaymentLast4, setNewPaymentLast4] = useState("");

  const settings = useStore((state: any) => state.settings);
  const updateSettings = useStore((state: any) => state.updateSettings);
  const vehicles = useStore((state: any) => state.vehicles);
  const paymentMethods = useStore((state: any) => state.paymentMethods);
  const addVehicle = useStore((state: any) => state.addVehicle);
  const updateVehicle = useStore((state: any) => state.updateVehicle);
  const removeVehicle = useStore((state: any) => state.removeVehicle);
  const setDefaultVehicle = useStore((state: any) => state.setDefaultVehicle);
  const addPaymentMethod = useStore((state: any) => state.addPaymentMethod);
  const updatePaymentMethod = useStore(
    (state: any) => state.updatePaymentMethod,
  );
  const removePaymentMethod = useStore(
    (state: any) => state.removePaymentMethod,
  );
  const setDefaultPaymentMethod = useStore(
    (state: any) => state.setDefaultPaymentMethod,
  );

  // Automation mode options
  const automationModes = [
    { value: "fully_automatic", label: "Fully Automatic" },
    { value: "semi_automatic", label: "Semi-Automatic" },
    { value: "manual", label: "Manual" },
  ];

  // AI provider options
  const aiProviders = [
    { value: "mock", label: "Mock (Demo)" },
    { value: "ollama", label: "Ollama (Local)" },
    { value: "openai", label: "OpenAI" },
    { value: "claude", label: "Claude" },
  ];

  const handleAddVehicle = () => {
    if (!newVehicleName.trim() || !newVehiclePlate.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const newVehicle: Omit<Vehicle, "id"> = {
      name: newVehicleName.trim(),
      licensePlate: newVehiclePlate.trim().toUpperCase(),
      isDefault: vehicles.length === 0,
    };

    addVehicle(newVehicle);
    setNewVehicleName("");
    setNewVehiclePlate("");
    setShowVehicleModal(false);
  };

  const handleAddPaymentMethod = () => {
    if (newPaymentType === "card" && !newPaymentLast4.trim()) {
      Alert.alert("Error", "Please enter the last 4 digits");
      return;
    }

    const newMethod: Omit<PaymentMethod, "id"> = {
      type: newPaymentType,
      last4: newPaymentLast4.trim() || undefined,
      isDefault: paymentMethods.length === 0,
    };

    addPaymentMethod(newMethod);
    setNewPaymentLast4("");
    setShowPaymentModal(false);
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    Alert.alert(
      "Delete Vehicle",
      `Are you sure you want to delete "${vehicle.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => removeVehicle(vehicle.id),
        },
      ],
    );
  };

  const handleDeletePaymentMethod = (method: PaymentMethod) => {
    Alert.alert(
      "Delete Payment Method",
      `Are you sure you want to delete this payment method?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => removePaymentMethod(method.id),
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Automation Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Automation</Text>

        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>Automation Mode</Text>
          <View style={styles.pickerContainer}>
            {automationModes.map((mode) => (
              <TouchableOpacity
                key={mode.value}
                style={[
                  styles.modeOption,
                  settings.automationMode === mode.value &&
                    styles.modeOptionActive,
                ]}
                onPress={() =>
                  updateSettings({ automationMode: mode.value as any })
                }
              >
                <Text
                  style={[
                    styles.modeOptionText,
                    settings.automationMode === mode.value &&
                      styles.modeOptionTextActive,
                  ]}
                >
                  {mode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.settingDescription}>
            {settings.automationMode === "fully_automatic"
              ? "Automatically book parking when you arrive at a saved location"
              : settings.automationMode === "semi_automatic"
                ? "Ask for confirmation before booking parking"
                : "Only notify you when you arrive at a saved location"}
          </Text>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>AI-Powered Suggestions</Text>
            <Switch
              value={settings.aiEnabled}
              onValueChange={(value) => updateSettings({ aiEnabled: value })}
              trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
              thumbColor={settings.aiEnabled ? "#2563eb" : "#f4f3f4"}
            />
          </View>
          {settings.aiEnabled && (
            <>
              <Text style={styles.settingLabel}>AI Provider</Text>
              <View style={styles.pickerContainer}>
                {aiProviders.map((provider) => (
                  <TouchableOpacity
                    key={provider.value}
                    style={[
                      styles.modeOption,
                      settings.aiModelProvider === provider.value &&
                        styles.modeOptionActive,
                    ]}
                    onPress={() =>
                      updateSettings({ aiModelProvider: provider.value as any })
                    }
                  >
                    <Text
                      style={[
                        styles.modeOptionText,
                        settings.aiModelProvider === provider.value &&
                          styles.modeOptionTextActive,
                      ]}
                    >
                      {provider.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {(settings.aiModelProvider === "openai" ||
                settings.aiModelProvider === "claude") && (
                <>
                  <Text style={styles.settingLabel}>API Key</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your API key"
                    value={settings.aiApiKey}
                    onChangeText={(text) => updateSettings({ aiApiKey: text })}
                    secureTextEntry
                  />
                </>
              )}
            </>
          )}
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Default Parking Duration</Text>
            <TextInput
              style={styles.smallInput}
              placeholder="120"
              value={settings.defaultDuration.toString()}
              onChangeText={(text) =>
                updateSettings({ defaultDuration: parseInt(text) || 120 })
              }
              keyboardType="numeric"
            />
          </View>
          <Text style={styles.settingDescription}>Duration in minutes</Text>
        </View>
      </View>

      {/* Vehicles Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Vehicles</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowVehicleModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {vehicles.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No vehicles added yet</Text>
          </View>
        ) : (
          vehicles.map((vehicle: Vehicle) => (
            <View key={vehicle.id} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{vehicle.name}</Text>
                <Text style={styles.itemSubtitle}>{vehicle.licensePlate}</Text>
                {vehicle.isDefault && (
                  <Text style={styles.defaultBadge}>Default</Text>
                )}
              </View>
              <View style={styles.itemActions}>
                {!vehicle.isDefault && (
                  <TouchableOpacity
                    style={styles.setActionButton}
                    onPress={() => setDefaultVehicle(vehicle.id)}
                  >
                    <Text style={styles.setActionButtonText}>Set Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteVehicle(vehicle)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Payment Methods Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowPaymentModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {paymentMethods.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No payment methods added yet</Text>
          </View>
        ) : (
          paymentMethods.map((method: PaymentMethod) => (
            <View key={method.id} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>
                  {method.type === "card" ? "💳 Card" : "🍎 Apple Pay"}
                </Text>
                {method.last4 && (
                  <Text style={styles.itemSubtitle}>****{method.last4}</Text>
                )}
                {method.isDefault && (
                  <Text style={styles.defaultBadge}>Default</Text>
                )}
              </View>
              <View style={styles.itemActions}>
                {!method.isDefault && (
                  <TouchableOpacity
                    style={styles.setActionButton}
                    onPress={() => setDefaultPaymentMethod(method.id)}
                  >
                    <Text style={styles.setActionButtonText}>Set Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePaymentMethod(method)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Notifications</Text>
            <Switch
              value={settings.enableNotifications}
              onValueChange={(value) =>
                updateSettings({ enableNotifications: value })
              }
              trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
              thumbColor={settings.enableNotifications ? "#2563eb" : "#f4f3f4"}
            />
          </View>
          {settings.enableNotifications && (
            <>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Sound</Text>
                <Switch
                  value={settings.notificationSound}
                  onValueChange={(value) =>
                    updateSettings({ notificationSound: value })
                  }
                  trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                  thumbColor={
                    settings.notificationSound ? "#2563eb" : "#f4f3f4"
                  }
                />
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Vibration</Text>
                <Switch
                  value={settings.vibrationEnabled}
                  onValueChange={(value) =>
                    updateSettings({ vibrationEnabled: value })
                  }
                  trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                  thumbColor={settings.vibrationEnabled ? "#2563eb" : "#f4f3f4"}
                />
              </View>
            </>
          )}
        </View>
      </View>

      {/* Add Vehicle Modal */}
      <Modal
        visible={showVehicleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVehicleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Vehicle</Text>
            <Text style={styles.inputLabel}>Vehicle Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., My Car"
              value={newVehicleName}
              onChangeText={setNewVehicleName}
            />
            <Text style={styles.inputLabel}>License Plate</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., AB12 CDE"
              value={newVehiclePlate}
              onChangeText={setNewVehiclePlate}
              autoCapitalize="characters"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowVehicleModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddVehicle}
              >
                <Text style={styles.confirmButtonText}>Add Vehicle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Payment Method</Text>
            <Text style={styles.inputLabel}>Payment Type</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={[
                  styles.modeOption,
                  newPaymentType === "card" && styles.modeOptionActive,
                ]}
                onPress={() => setNewPaymentType("card")}
              >
                <Text
                  style={[
                    styles.modeOptionText,
                    newPaymentType === "card" && styles.modeOptionTextActive,
                  ]}
                >
                  💳 Credit/Debit Card
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeOption,
                  newPaymentType === "apple_pay" && styles.modeOptionActive,
                ]}
                onPress={() => setNewPaymentType("apple_pay")}
              >
                <Text
                  style={[
                    styles.modeOptionText,
                    newPaymentType === "apple_pay" &&
                      styles.modeOptionTextActive,
                  ]}
                >
                  🍎 Apple Pay
                </Text>
              </TouchableOpacity>
            </View>
            {newPaymentType === "card" && (
              <>
                <Text style={styles.inputLabel}>Last 4 Digits</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="1234"
                  value={newPaymentLast4}
                  onChangeText={setNewPaymentLast4}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddPaymentMethod}
              >
                <Text style={styles.confirmButtonText}>Add Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  section: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  settingCard: {
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
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
  },
  settingDescription: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 8,
    lineHeight: 18,
  },
  pickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  modeOption: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  modeOptionActive: {
    backgroundColor: "#2563eb",
  },
  modeOptionText: {
    fontSize: 14,
    color: "#374151",
  },
  modeOptionTextActive: {
    color: "#ffffff",
    fontWeight: "500",
  },
  textInput: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  smallInput: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    width: 100,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
  },
  itemCard: {
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
  itemInfo: {
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  defaultBadge: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "500",
    marginTop: 4,
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  setActionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#dbeafe",
    alignItems: "center",
  },
  setActionButtonText: {
    color: "#1e40af",
    fontSize: 14,
    fontWeight: "500",
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#fee2e2",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "500",
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
