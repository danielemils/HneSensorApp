import { Tabs } from "expo-router";
import React from "react";
import { Icon } from "react-native-paper";
import { useTheme } from "react-native-paper";
import { HapticTab } from "@/components/HapticTab";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIconStyle: {
          height: "100%",
          width: "100%",
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
        },
        sceneStyle: {
          backgroundColor: theme.colors.primaryContainer,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingBottom: 10,
          paddingTop: insets.top,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Icon size={35} source="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="data"
        options={{
          title: "Data",
          tabBarIcon: ({ color }) => (
            <Icon
              size={35}
              source="chart-timeline-variant-shimmer"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: "About",
          tabBarIcon: ({ color }) => {
            return <Icon size={35} source="information" color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => {
            return <Icon size={35} source="cogs" color={color} />;
          },
        }}
      />
    </Tabs>
  );
}
