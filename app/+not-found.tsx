import { Stack } from "expo-router";
import { View } from "react-native";
import { Text } from "react-native-paper";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text variant="titleLarge">404</Text>
        <Text variant="titleMedium">This screen doesn't exist.</Text>
      </View>
    </>
  );
}
