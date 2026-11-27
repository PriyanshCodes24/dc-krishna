import React from "react";
import { TextInput, TextInputProps, StyleSheet } from "react-native";

export function AppInput({
  style,
  placeholderTextColor = "#94A3B8",
  selectionColor = "#2563EB",
  ...props
}: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={placeholderTextColor}
      selectionColor={selectionColor}
      style={[styles.input, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
});
