import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { generateAndShareReceipt, ReceiptData } from "../services/pdfReceipt";
import { useAuth } from "../context/AuthContext";

const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/receipts`;

interface Receipt extends ReceiptData {
  _id: string;
}

export default function ReceiptsScreen() {
  const { isAdmin, adminPin } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [plotNo, setPlotNo] = useState("");
  const [payerName, setPayerName] = useState("");
  const [category, setCategory] = useState<"Maintenance" | "Donation">(
    "Maintenance",
  );
  const [purpose, setPurpose] = useState("Annual Maintenance 2026");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<
    "UPI" | "Cash" | "Cheque" | "Bank Transfer"
  >("UPI");
  const [transactionRef, setTransactionRef] = useState("");

  const fetchReceipts = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setReceipts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handleCreateAndShare = async () => {
    if (!plotNo.trim() || !payerName.trim() || !amount.trim()) {
      Alert.alert(
        "Missing Info",
        "Plot No, Payer Name, and Amount are required.",
      );
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plotNo: plotNo.trim(),
          payerName: payerName.trim(),
          category,
          purpose: purpose.trim() || category,
          amount: Number(amount),
          paymentMode,
          transactionRef: transactionRef.trim(),
        }),
      });

      const saved: Receipt = await res.json();
      if (!res.ok)
        throw new Error((saved as any).error || "Failed to create receipt");

      setPlotNo("");
      setPayerName("");
      setAmount("");
      setTransactionRef("");
      fetchReceipts();

      await generateAndShareReceipt(saved);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {isAdmin && (
          <>
            <Text style={styles.header}>Generate Receipt</Text>
            <View style={styles.formCard}>
              <View style={styles.row}>
                {(["Maintenance", "Donation"] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.pill, category === cat && styles.pillActive]}
                    onPress={() => {
                      setCategory(cat);
                      setPurpose(
                        cat === "Maintenance"
                          ? "Annual Maintenance 2026"
                          : "Festival / Temple Fund",
                      );
                    }}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        category === cat && styles.pillTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Plot No (e.g. 14 or A-5)"
                value={plotNo}
                onChangeText={setPlotNo}
              />
              <TextInput
                style={styles.input}
                placeholder="Received From (Name)"
                value={payerName}
                onChangeText={setPayerName}
              />
              <TextInput
                style={styles.input}
                placeholder="Purpose"
                value={purpose}
                onChangeText={setPurpose}
              />
              <TextInput
                style={styles.input}
                placeholder="Amount (₹)"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <View style={styles.row}>
                {(["UPI", "Cash", "Cheque", "Bank Transfer"] as const).map(
                  (mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[
                        styles.modeBtn,
                        paymentMode === mode && styles.modeBtnActive,
                      ]}
                      onPress={() => setPaymentMode(mode)}
                    >
                      <Text
                        style={{
                          color: paymentMode === mode ? "#fff" : "#374151",
                          fontSize: 12,
                          fontWeight: "600",
                        }}
                      >
                        {mode}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>

              <TextInput
                style={styles.input}
                placeholder="UPI Ref / Cheque No (Optional)"
                value={transactionRef}
                onChangeText={setTransactionRef}
              />

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCreateAndShare}
              >
                <Text style={styles.submitText}>Save & Share PDF Receipt</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <Text style={styles.subHeader}>
          Recent Receipts ({receipts.length})
        </Text>
        <FlatList
          data={receipts}
          scrollEnabled={false}
          keyExtractor={(item: Receipt) => item._id}
          renderItem={({ item }: { item: Receipt }) => (
            <View style={styles.receiptCard}>
              <View style={styles.cardRow}>
                <Text style={styles.rcpNo}>
                  {item.receiptNo} • Plot {item.plotNo}
                </Text>
                <Text style={styles.amount}>
                  ₹{item.amount.toLocaleString("en-IN")}
                </Text>
              </View>
              <Text style={styles.payer}>
                {item.payerName} ({item.category})
              </Text>
              <Text style={styles.meta}>
                {item.purpose} • {item.paymentMode}
              </Text>
              <TouchableOpacity
                style={styles.reShareBtn}
                onPress={() => generateAndShareReceipt(item)}
              >
                <Text style={styles.reShareText}>Share PDF Again</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6", paddingHorizontal: 14 },
  header: {
    fontSize: 22,
    fontWeight: "700",
    marginVertical: 12,
    color: "#111",
  },
  subHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
    color: "#111",
  },
  formCard: { backgroundColor: "#fff", padding: 14, borderRadius: 12 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  pill: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  pillActive: { backgroundColor: "#1e3a8a" },
  pillText: { fontWeight: "600", color: "#374151" },
  pillTextActive: { color: "#fff" },
  modeBtn: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modeBtnActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: "#16a34a",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  receiptCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rcpNo: { fontWeight: "700", color: "#1e3a8a", fontSize: 14 },
  amount: { fontWeight: "800", color: "#16a34a", fontSize: 16 },
  payer: { fontWeight: "600", color: "#111", marginTop: 2 },
  meta: { color: "#6b7280", fontSize: 13, marginTop: 2 },
  reShareBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  reShareText: { color: "#1d4ed8", fontWeight: "600", fontSize: 12 },
});
