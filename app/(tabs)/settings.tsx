import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useContext } from "react";
import {
  ThemeModeContext,
  ThemeModeToggleContext,
} from "@/const/ThemeModeContext";
import { Divider } from "@/components/Divider";

export default function Settings() {
  const themeMode = useContext(ThemeModeContext);
  const handleThemeToggle = useContext(ThemeModeToggleContext);

  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text variant="headlineMedium">Settings</Text>
      <Divider />
      <Button
        icon="theme-light-dark"
        mode={themeMode === "dark" ? "contained" : "outlined"}
        onPress={handleThemeToggle}
      >
        Dark mode
      </Button>
    </View>
  );
}
