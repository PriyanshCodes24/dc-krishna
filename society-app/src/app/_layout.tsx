import React, { useState } from "react";
import { Tabs } from "expo-router";
import {
  TouchableOpacity,
  Text,
  Modal,
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { AppInput } from "../components/AppInput";

function AppTabs() {
  const { isAdmin, unlockAdmin, lockAdmin } = useAuth();
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [checking, setChecking] = useState(false);

  const handleTogglePress = () => {
    if (isAdmin) {
      lockAdmin();
      Alert.alert("Locked", "Switched back to Resident (read-only) mode.");
    } else {
      setPinInput("");
      setPinModalVisible(true);
    }
  };

  const handleUnlock = async () => {
    if (!pinInput.trim()) return;
    setChecking(true);
    const ok = await unlockAdmin(pinInput.trim());
    setChecking(false);

    if (ok) {
      setPinModalVisible(false);
      setPinInput("");
    } else {
      Alert.alert("Access Denied", "Incorrect Committee PIN.");
    }
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#2563EB",
          headerRight: () => (
            <TouchableOpacity
              onPress={handleTogglePress}
              style={styles.lockBtn}
            >
              <Ionicons
                name={isAdmin ? "lock-open" : "lock-closed"}
                size={16}
                color={isAdmin ? "#16A34A" : "#64748B"}
              />
              <Text style={[styles.lockText, isAdmin && styles.lockTextActive]}>
                {isAdmin ? "Admin" : "Resident"}
              </Text>
            </TouchableOpacity>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Plots",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="home-outline"
                size={size}
                color={color as string}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: "Invites",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="calendar-outline"
                size={size}
                color={color as string}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="receipts"
          options={{
            title: "Receipts",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="receipt-outline"
                size={size}
                color={color as string}
              />
            ),
          }}
        />
        {/* Hide the unused explore route from the tab bar */}
      </Tabs>

      <Modal
        visible={pinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPinModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.overlay}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Committee Admin Access</Text>
            <Text style={styles.subtitle}>
              Enter the society PIN to add plots, create events, or issue
              receipts.
            </Text>

            <AppInput
              placeholder="Enter PIN"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              value={pinInput}
              onChangeText={setPinInput}
            />

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setPinModalVisible(false)}
              >
                <Text style={{ color: "#475569" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.unlockBtn}
                onPress={handleUnlock}
                disabled={checking}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  {checking ? "Checking..." : "Unlock"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppTabs />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  lockBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginRight: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  lockText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  lockTextActive: { color: "#16A34A" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#0F172A", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#64748B", marginBottom: 14 },
  row: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 14 },
  unlockBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
});
