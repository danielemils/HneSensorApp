import { Stack } from "expo-router";
import { PaperProvider, Appbar } from "react-native-paper";
// import { useColorScheme } from "react-native";
import { useState } from "react";
import { lightTheme, darkTheme } from "@/const/Themes";
import {
  ThemeModeContext,
  ThemeModeToggleContext,
  ColorScheme,
} from "@/const/ThemeModeContext";

export default function RootLayout() {
  // const colorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorScheme>("light");

  const handleThemeToggle = () => {
    setColorScheme((prevScheme) => (prevScheme === "dark" ? "light" : "dark"));
  };

  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <ThemeModeContext.Provider value={colorScheme}>
        <ThemeModeToggleContext.Provider value={handleThemeToggle}>
          <Stack
            screenOptions={{
              statusBarBackgroundColor: theme.colors.primaryContainer,
              statusBarStyle: colorScheme === "dark" ? "light" : "dark",
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
  );
}
