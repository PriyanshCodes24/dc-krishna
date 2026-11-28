import { TextInput, TextInputProps } from "react-native";
import { colors, sharedStyles } from "../theme";

export function AppInput({
  style,
  placeholderTextColor = colors.placeholder,
  selectionColor = colors.accent,
  ...props
}: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={placeholderTextColor}
      selectionColor={selectionColor}
      style={[sharedStyles.input, style]}
      {...props}
    />
  );
}
