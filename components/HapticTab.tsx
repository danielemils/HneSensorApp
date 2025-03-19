import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import { useTheme } from "react-native-paper";

export const HapticTab = (props: BottomTabBarButtonProps) => {
  const theme = useTheme();

  return (
    <PlatformPressable
      {...props}
      android_ripple={{
        color: theme.colors.surfaceDisabled,
        borderless: true,
      }}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === "ios") {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
};
