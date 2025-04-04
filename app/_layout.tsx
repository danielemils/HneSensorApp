import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { useState } from "react";
import { lightTheme, darkTheme } from "@/const/Themes";
import {
  ThemeModeContext,
  ThemeModeToggleContext,
  ColorScheme,
} from "@/const/ThemeModeContext";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const [colorScheme, setColorScheme] = useState<ColorScheme>("light");

  const handleThemeToggle = () => {
    setColorScheme((prevScheme) => (prevScheme === "dark" ? "light" : "dark"));
  };

  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <ThemeModeContext.Provider value={colorScheme}>
          <ThemeModeToggleContext.Provider value={handleThemeToggle}>
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
            <Stack
              screenOptions={{
                navigationBarColor: theme.colors.surface,
              }}
            >
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
          </ThemeModeToggleContext.Provider>
        </ThemeModeContext.Provider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
