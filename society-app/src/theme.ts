import { StyleSheet } from "react-native";

export const colors = {
  // Brand & Actions
  primary: "#1e3a8a",      // Deep navy (headers, active tabs, primary buttons)
  primaryLight: "#dbeafe", // Soft blue (badges, active chips)
  accent: "#2563eb",       // Bright blue (links, secondary actions)

  // Status
  success: "#16a34a",      // Paid / Admin unlocked / Attending
  successLight: "#dcfce7",
  warning: "#d97706",      // Pending / Reminders
  warningLight: "#fef3c7",
  danger: "#dc2626",       // Overdue / Delete / Errors
  dangerLight: "#fee2e2",

  // Neutrals
  bg: "#f3f4f6",           // Screen background
  card: "#ffffff",         // Card & modal surface
  inputBg: "#f9fafb",      // Subtle input fill
  text: "#111827",         // Primary dark text
  textSecondary: "#374151",// Body / descriptions
  muted: "#6b7280",        // Subtitles / timestamps
  placeholder: "#9ca3af",  // Input placeholders
  border: "#d1d5db",       // Input & card borders
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  full: 999,
};

// Reusable building blocks you can spread into any screen's StyleSheet
export const sharedStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
});