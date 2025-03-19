import { StyleProp, ViewStyle } from "react-native";
import { Divider as RNPDivider } from "react-native-paper";

type DividerProps = {
  noMargin?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const Divider = ({ noMargin = false, style }: DividerProps) => (
  <RNPDivider
    style={[{ width: "100%", marginVertical: noMargin ? 0 : 10 }, style]}
  />
);
