import { useState } from "react";
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
import { colors, spacing, radius } from "../theme";

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
          tabBarActiveTintColor: colors.accent,
          headerRight: () => (
            <TouchableOpacity
              onPress={handleTogglePress}
              style={styles.lockBtn}
            >
              <Ionicons
                name={isAdmin ? "lock-open" : "lock-closed"}
                size={16}
                color={isAdmin ? colors.success : colors.muted}
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
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.unlockBtn}
                onPress={handleUnlock}
                disabled={checking}
              >
                <Text style={styles.unlockText}>
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
    borderRadius: radius.full,
    backgroundColor: colors.bg,
  },
  lockText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  lockTextActive: {
    color: colors.success,
  },
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
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  cancelText: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  unlockBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radius.md,
  },
  unlockText: {
    color: colors.card,
    fontWeight: "600",
  },
});
