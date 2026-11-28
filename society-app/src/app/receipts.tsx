import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { generateAndShareReceipt, ReceiptData } from "../services/pdfReceipt";
import { useAuth } from "../context/AuthContext";
import { AppInput } from "../components/AppInput";
import { colors, spacing, radius, sharedStyles } from "../theme";

import { API_BASE_URL } from "../config/api";

const API_URL = `${API_BASE_URL}/receipts`;

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
    <SafeAreaView style={sharedStyles.screenContainer}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {isAdmin && (
          <>
            <Text style={styles.header}>Generate Receipt</Text>
            <View style={sharedStyles.card}>
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

              <AppInput
                placeholder="Plot No (e.g. 14 or A-5)"
                value={plotNo}
                onChangeText={setPlotNo}
                autoCapitalize="characters"
              />
              <AppInput
                placeholder="Received From (Name)"
                value={payerName}
                onChangeText={setPayerName}
              />
              <AppInput
                placeholder="Purpose"
                value={purpose}
                onChangeText={setPurpose}
              />
              <AppInput
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
                          color:
                            paymentMode === mode
                              ? colors.card
                              : colors.textSecondary,
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

              <AppInput
                placeholder="UPI Ref / Cheque No (Optional)"
                value={transactionRef}
                onChangeText={setTransactionRef}
              />

              <TouchableOpacity
                style={[sharedStyles.primaryBtn, styles.submitBtn]}
                onPress={handleCreateAndShare}
              >
                <Text style={sharedStyles.primaryBtnText}>
                  Save & Share PDF Receipt
                </Text>
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
            <View style={sharedStyles.card}>
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
  header: {
    fontSize: 22,
    fontWeight: "700",
    marginVertical: spacing.md,
    color: colors.text,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pill: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillText: {
    fontWeight: "600",
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.card,
  },
  modeBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  modeBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  submitBtn: {
    backgroundColor: colors.success,
    marginTop: spacing.xs,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rcpNo: {
    fontWeight: "700",
    color: colors.primary,
    fontSize: 14,
  },
  amount: {
    fontWeight: "800",
    color: colors.success,
    fontSize: 16,
  },
  payer: {
    fontWeight: "600",
    color: colors.text,
    marginTop: 2,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  reShareBtn: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  reShareText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 12,
  },
});
