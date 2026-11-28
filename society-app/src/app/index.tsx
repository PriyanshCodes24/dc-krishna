import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Linking,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppInput } from "../components/AppInput";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import { colors, spacing, radius, sharedStyles } from "../theme";

const API_URL = `${API_BASE_URL}/plots`;

interface Plot {
  _id: string;
  plotNo: string;
  plotStatus:
    | "Occupied - Owner"
    | "Occupied - Tenant"
    | "Vacant House"
    | "Open Plot";
  owner: { name: string; phone: string; city?: string };
  tenant?: { name: string; phone: string };
}

export default function PlotDirectoryScreen() {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [wakingUp, setWakingUp] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "OCCUPIED" | "OPEN">("ALL");
  const [modalVisible, setModalVisible] = useState(false);
  const { isAdmin, adminPin } = useAuth();

  // Form states
  const [plotNo, setPlotNo] = useState("");
  const [plotStatus, setPlotStatus] =
    useState<Plot["plotStatus"]>("Occupied - Owner");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");

  const fetchPlots = async () => {
    setLoading(true);
    setWakingUp(false);

    const slowTimer = setTimeout(() => setWakingUp(true), 3000);

    try {
      const url = `${API_BASE_URL}/plots`;
      const response = await fetch(url);
      const rawText = await response.text();

      if (!response.ok) {
        console.warn(
          `Server waking up or error (${response.status}):`,
          rawText.slice(0, 120),
        );
        return;
      }

      const data = JSON.parse(rawText);
      setPlots(data);
    } catch (error) {
      console.error("Error fetching plots:", error);
    } finally {
      clearTimeout(slowTimer);
      setLoading(false);
      setWakingUp(false);
    }
  };

  useEffect(() => {
    fetchPlots();
  }, []);

  const handleAddPlot = async () => {
    if (!plotNo.trim() || !ownerName.trim() || !ownerPhone.trim()) {
      Alert.alert(
        "Missing Info",
        "Plot No, Owner Name, and Phone are required.",
      );
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": adminPin,
        },
        body: JSON.stringify({
          plotNo: plotNo.trim(),
          plotStatus,
          owner: { name: ownerName.trim(), phone: ownerPhone.trim() },
          tenant:
            plotStatus === "Occupied - Tenant"
              ? { name: tenantName.trim(), phone: tenantPhone.trim() }
              : { name: "", phone: "" },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save plot");

      setModalVisible(false);
      setPlotNo("");
      setOwnerName("");
      setOwnerPhone("");
      setTenantName("");
      setTenantPhone("");
      fetchPlots();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const filteredPlots = plots.filter((p) => {
    const matchesSearch =
      p.plotNo.toLowerCase().includes(search.toLowerCase()) ||
      p.owner.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.tenant?.name || "").toLowerCase().includes(search.toLowerCase());

    if (filter === "OPEN") return matchesSearch && p.plotStatus === "Open Plot";
    if (filter === "OCCUPIED")
      return matchesSearch && p.plotStatus.startsWith("Occupied");
    return matchesSearch;
  });

  if (loading && plots.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingTitle}>
          {wakingUp ? "Waking up society server..." : "Loading plots..."}
        </Text>
        {wakingUp && (
          <Text style={styles.loadingSub}>
            First load after inactivity takes ~30 seconds. Hang tight!
          </Text>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={sharedStyles.screenContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Plot Directory ({plots.length})</Text>
        {isAdmin && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addBtnText}>+ Add Plot</Text>
          </TouchableOpacity>
        )}
      </View>

      <AppInput
        style={styles.search}
        placeholder="Search by plot no (e.g. 12) or name..."
        value={search}
        onChangeText={setSearch}
      />

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        {(["ALL", "OCCUPIED", "OPEN"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.pill, filter === tab && styles.pillActive]}
            onPress={() => setFilter(tab)}
          >
            <Text
              style={[styles.pillText, filter === tab && styles.pillTextActive]}
            >
              {tab === "ALL"
                ? "All Plots"
                : tab === "OCCUPIED"
                  ? "Occupied"
                  : "Open Plots"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredPlots}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => {
          const isOpenPlot = item.plotStatus === "Open Plot";
          const contactPhone =
            item.plotStatus === "Occupied - Tenant" && item.tenant?.phone
              ? item.tenant.phone
              : item.owner.phone;

          return (
            <View style={sharedStyles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.plotBadge}>Plot {item.plotNo}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    isOpenPlot ? styles.openBadge : styles.occBadge,
                  ]}
                >
                  <Text style={styles.statusText}>{item.plotStatus}</Text>
                </View>
              </View>

              <Text style={styles.name}>Owner: {item.owner.name}</Text>
              {item.plotStatus === "Occupied - Tenant" && item.tenant?.name ? (
                <Text style={styles.subText}>Tenant: {item.tenant.name}</Text>
              ) : null}

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => Linking.openURL(`tel:${contactPhone}`)}
                >
                  <Text style={styles.actionText}>Call ({contactPhone})</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.waBtn}
                  onPress={() =>
                    Linking.openURL(
                      `https://wa.me/91${contactPhone.replace(/\D/g, "")}`,
                    )
                  }
                >
                  <Text style={styles.actionText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Add Plot Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBox}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>Add Plot / House</Text>

              <AppInput
                placeholder="Plot Number (e.g. 14 or A-5)"
                value={plotNo}
                onChangeText={setPlotNo}
              />

              <Text style={sharedStyles.label}>Plot Status:</Text>
              <View style={styles.statusSelector}>
                {(
                  [
                    "Occupied - Owner",
                    "Occupied - Tenant",
                    "Vacant House",
                    "Open Plot",
                  ] as const
                ).map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.statusOption,
                      plotStatus === st && styles.statusOptionActive,
                    ]}
                    onPress={() => setPlotStatus(st)}
                  >
                    <Text
                      style={{
                        color:
                          plotStatus === st
                            ? colors.card
                            : colors.textSecondary,
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <AppInput
                placeholder="Owner Full Name"
                value={ownerName}
                onChangeText={setOwnerName}
              />
              <AppInput
                placeholder="Owner Mobile Number"
                keyboardType="phone-pad"
                value={ownerPhone}
                onChangeText={setOwnerPhone}
              />

              {plotStatus === "Occupied - Tenant" && (
                <>
                  <AppInput
                    placeholder="Tenant Full Name"
                    value={tenantName}
                    onChangeText={setTenantName}
                  />
                  <AppInput
                    placeholder="Tenant Mobile Number"
                    keyboardType="phone-pad"
                    value={tenantPhone}
                    onChangeText={setTenantPhone}
                  />
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleAddPlot}
                >
                  <Text style={styles.saveBtnText}>Save Plot</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: spacing.md,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  addBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  addBtnText: {
    color: colors.card,
    fontWeight: "600",
  },
  search: {
    backgroundColor: colors.card,
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pill: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillText: {
    color: colors.textSecondary,
    fontWeight: "600",
    fontSize: 13,
  },
  pillTextActive: {
    color: colors.card,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  plotBadge: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  openBadge: {
    backgroundColor: colors.warningLight,
  },
  occBadge: {
    backgroundColor: colors.successLight,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  subText: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  callBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
  },
  waBtn: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
  },
  actionText: {
    color: colors.card,
    fontWeight: "600",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalBox: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "85%",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  statusSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: spacing.md,
  },
  statusOption: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  statusOptionActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    padding: 10,
  },
  cancelText: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  saveBtnText: {
    color: colors.card,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  loadingTitle: {
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  loadingSub: {
    marginTop: 6,
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
  },
});
