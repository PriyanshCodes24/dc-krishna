import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Linking,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "http://192.168.1.9:5000/api/plots"; // Your PC IPv4

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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "OCCUPIED" | "OPEN">("ALL");
  const [modalVisible, setModalVisible] = useState(false);

  // Form states
  const [plotNo, setPlotNo] = useState("");
  const [plotStatus, setPlotStatus] =
    useState<Plot["plotStatus"]>("Occupied - Owner");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");

  const fetchPlots = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setPlots(data);
    } catch (err) {
      console.error(err);
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
        headers: { "Content-Type": "application/json" },
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Plot Directory ({plots.length})</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addBtnText}>+ Add Plot</Text>
        </TouchableOpacity>
      </View>

      <TextInput
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
            <View style={styles.card}>
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
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Plot / House</Text>

            <TextInput
              style={styles.input}
              placeholder="Plot Number (e.g. 14 or A-5)"
              value={plotNo}
              onChangeText={setPlotNo}
            />

            <Text style={styles.label}>Plot Status:</Text>
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
                      color: plotStatus === st ? "#fff" : "#333",
                      fontSize: 12,
                    }}
                  >
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Owner Full Name"
              value={ownerName}
              onChangeText={setOwnerName}
            />
            <TextInput
              style={styles.input}
              placeholder="Owner Mobile Number"
              keyboardType="phone-pad"
              value={ownerPhone}
              onChangeText={setOwnerPhone}
            />

            {plotStatus === "Occupied - Tenant" && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Tenant Full Name"
                  value={tenantName}
                  onChangeText={setTenantName}
                />
                <TextInput
                  style={styles.input}
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
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddPlot}>
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  Save Plot
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6", paddingHorizontal: 14 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 12,
  },
  header: { fontSize: 22, fontWeight: "700", color: "#111" },
  addBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: "#fff", fontWeight: "600" },
  search: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 15,
  },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  pill: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillActive: { backgroundColor: "#111827" },
  pillText: { color: "#374151", fontWeight: "600", fontSize: 13 },
  pillTextActive: { color: "#fff" },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  plotBadge: { fontSize: 17, fontWeight: "800", color: "#1e3a8a" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  openBadge: { backgroundColor: "#fef3c7" },
  occBadge: { backgroundColor: "#dcfce7" },
  statusText: { fontSize: 12, fontWeight: "600", color: "#1f2937" },
  name: { fontSize: 15, fontWeight: "600", color: "#111" },
  subText: { fontSize: 14, color: "#4b5563", marginTop: 2 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  callBtn: {
    flex: 1,
    backgroundColor: "#2563eb",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  waBtn: {
    flex: 1,
    backgroundColor: "#16a34a",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  actionText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16,
  },
  modalBox: { backgroundColor: "#fff", borderRadius: 14, padding: 18 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  label: { fontWeight: "600", marginBottom: 6, color: "#374151" },
  statusSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  statusOption: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusOptionActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: { padding: 10 },
  saveBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
