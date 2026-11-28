import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { scheduleEventReminder } from "../services/reminders";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import { colors, spacing, radius, sharedStyles } from "../theme";
import { AppInput } from "../components/AppInput";

const API_URL = `${API_BASE_URL}/events`;

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
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [rsvpPlot, setRsvpPlot] = useState("");
  const { isAdmin, adminPin } = useAuth();

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

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === "set" && selectedDate) {
      const updated = new Date(eventDate);
      updated.setFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
      );
      setEventDate(updated);
    }
  };

  const onChangeTime = (event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (event.type === "set" && selectedTime) {
      const updated = new Date(eventDate);
      updated.setHours(
        selectedTime.getHours(),
        selectedTime.getMinutes(),
        0,
        0,
      );
      setEventDate(updated);
    }
  };

  const handleCreateEvent = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Missing Info", "Title and Description are required.");
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
          title: title.trim(),
          type,
          description: description.trim(),
          venue: venue.trim() || "Society Common Plot",
          eventDate: eventDate.toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || data.message || "Failed to create event");

      setTitle("");
      setDescription("");
      setEventDate(new Date());
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
    <SafeAreaView style={sharedStyles.screenContainer}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.header}>Meetings & Invites</Text>

        {isAdmin && (
          <View style={sharedStyles.card}>
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

            <Text style={sharedStyles.label}>Title</Text>
            <AppInput
              placeholder="e.g. Monthly Committee Meeting"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={sharedStyles.label}>Agenda / Description</Text>
            <AppInput
              placeholder="e.g. Discuss water tank cleaning & security"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <Text style={sharedStyles.label}>Venue</Text>
            <AppInput
              placeholder="e.g. Society Common Plot"
              value={venue}
              onChangeText={setVenue}
            />

            <Text style={sharedStyles.label}>Date & Time</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.pickerText}>
                  📅{" "}
                  {eventDate.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.pickerText}>
                  ⏰{" "}
                  {eventDate.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={eventDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={new Date()}
                onChange={onChangeDate}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={eventDate}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onChangeTime}
              />
            )}

            <TouchableOpacity
              style={sharedStyles.primaryBtn}
              onPress={handleCreateEvent}
            >
              <Text style={sharedStyles.primaryBtnText}>Publish Invite</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[sharedStyles.card, styles.rsvpBar]}>
          <Text style={styles.rsvpLabel}>Your Plot No for RSVP:</Text>
          <AppInput
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
              <View style={sharedStyles.card}>
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
                        color: isAttending ? colors.card : colors.primary,
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
  header: {
    fontSize: 22,
    fontWeight: "700",
    marginVertical: spacing.md,
    color: colors.text,
  },
  row: {
    flexDirection: "row",
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
  pickerBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.inputBg,
    alignItems: "center",
  },
  pickerText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  rsvpBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  rsvpLabel: {
    fontWeight: "600",
    color: colors.text,
  },
  rsvpInput: {
    width: 110,
    marginBottom: 0,
    paddingVertical: 6,
    textAlign: "center",
    fontWeight: "700",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  badge: {
    backgroundColor: colors.primaryLight,
    color: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    fontSize: 12,
    fontWeight: "700",
  },
  dateText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  venue: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  desc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  attendingText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: "600",
    marginTop: spacing.sm,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  rsvpBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
  },
  rsvpBtnActive: {
    backgroundColor: colors.primary,
  },
  remindBtn: {
    flex: 1,
    backgroundColor: colors.warningLight,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
  },
  remindText: {
    color: colors.warning,
    fontWeight: "600",
  },
});
