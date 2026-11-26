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
import { scheduleEventReminder } from "../services/reminders";

const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/events`;

interface SocietyEvent {
  _id: string;
  title: string;
  type: "Meeting" | "Event";
  description: string;
  venue: string;
  eventDate: string;
  attendingPlots: string[];
}

export default function EventsScreen() {
  const [events, setEvents] = useState<SocietyEvent[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"Meeting" | "Event">("Meeting");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("Society Common Plot");
  const [dateInput, setDateInput] = useState("2026-12-05 18:00");
  const [rsvpPlot, setRsvpPlot] = useState("");

  const fetchEvents = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Missing Info", "Title and Description are required.");
      return;
    }

    const parsedDate = new Date(dateInput.replace(" ", "T"));
    if (isNaN(parsedDate.getTime())) {
      Alert.alert(
        "Invalid Date",
        "Use format YYYY-MM-DD HH:MM (e.g. 2026-12-05 18:00)",
      );
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          type,
          description: description.trim(),
          venue: venue.trim() || "Society Common Plot",
          eventDate: parsedDate.toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Failed to create event");
      setTitle("");
      setDescription("");
      fetchEvents();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleRsvp = async (eventId: string) => {
    if (!rsvpPlot.trim()) {
      Alert.alert(
        "Enter Plot No",
        "Type your Plot No in the RSVP box above first.",
      );
      return;
    }

    try {
      const res = await fetch(`${API_URL}/${eventId}/rsvp`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plotNo: rsvpPlot.trim() }),
      });
      if (res.ok) fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.header}>Meetings & Invites</Text>

        <View style={styles.formCard}>
          <View style={styles.row}>
            {(["Meeting", "Event"] as const).map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.pill, type === item && styles.pillActive]}
                onPress={() => setType(item)}
              >
                <Text
                  style={[
                    styles.pillText,
                    type === item && styles.pillTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Title (e.g. Monthly Committee Meeting)"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Agenda / Description"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="Venue"
            value={venue}
            onChangeText={setVenue}
          />
          <TextInput
            style={styles.input}
            placeholder="Date & Time (YYYY-MM-DD HH:MM)"
            value={dateInput}
            onChangeText={setDateInput}
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleCreateEvent}
          >
            <Text style={styles.submitText}>Publish Invite</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rsvpBar}>
          <Text style={styles.rsvpLabel}>Your Plot No for RSVP:</Text>
          <TextInput
            style={styles.rsvpInput}
            placeholder="e.g. B113"
            value={rsvpPlot}
            onChangeText={setRsvpPlot}
            autoCapitalize="characters"
          />
        </View>

        <FlatList
          data={events}
          scrollEnabled={false}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const dt = new Date(item.eventDate);
            const isAttending =
              rsvpPlot.trim() !== "" &&
              item.attendingPlots.includes(rsvpPlot.trim().toUpperCase());

            return (
              <View style={styles.eventCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.badge}>{item.type}</Text>
                  <Text style={styles.dateText}>
                    {dt.toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    •{" "}
                    {dt.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>

                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.venue}>📍 {item.venue}</Text>
                <Text style={styles.desc}>{item.description}</Text>

                <Text style={styles.attendingText}>
                  Attending ({item.attendingPlots.length}):{" "}
                  {item.attendingPlots.length > 0
                    ? item.attendingPlots.join(", ")
                    : "None yet"}
                </Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[
                      styles.rsvpBtn,
                      isAttending && styles.rsvpBtnActive,
                    ]}
                    onPress={() => handleRsvp(item._id)}
                  >
                    <Text
                      style={{
                        color: isAttending ? "#fff" : "#1e3a8a",
                        fontWeight: "600",
                      }}
                    >
                      {isAttending ? "✓ Attending" : "Mark Attending"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.remindBtn}
                    onPress={() =>
                      scheduleEventReminder(
                        item.title,
                        item.venue,
                        item.eventDate,
                      )
                    }
                  >
                    <Text style={styles.remindText}>🔔 Remind Me</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
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
  formCard: { backgroundColor: "#fff", padding: 14, borderRadius: 12 },
  row: { flexDirection: "row", gap: 8, marginBottom: 10 },
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
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: "#1e3a8a",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  rsvpBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
    marginBottom: 10,
  },
  rsvpLabel: { fontWeight: "600", color: "#111" },
  rsvpInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: 110,
    textAlign: "center",
    fontWeight: "700",
  },
  eventCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  badge: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: "700",
  },
  dateText: { color: "#4b5563", fontSize: 13, fontWeight: "600" },
  eventTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  venue: { fontSize: 13, color: "#4b5563", marginTop: 2 },
  desc: { fontSize: 14, color: "#374151", marginTop: 6 },
  attendingText: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "600",
    marginTop: 8,
  },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  rsvpBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1e3a8a",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  rsvpBtnActive: { backgroundColor: "#1e3a8a" },
  remindBtn: {
    flex: 1,
    backgroundColor: "#fef3c7",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  remindText: { color: "#92400e", fontWeight: "600" },
});
