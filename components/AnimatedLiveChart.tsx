import { View, useWindowDimensions, StyleSheet } from "react-native";
import React, {
  useRef,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useTheme, Text, IconButton } from "react-native-paper";
import { Divider } from "@/components/Divider";
import { useFakeBLE } from "@/utils/hooks";
import { useFocusEffect, useNavigation } from "expo-router";

import {
  Canvas,
  Path,
  Group,
  Text as SkiaText,
  useFont,
} from "@shopify/react-native-skia";
import { useSharedValue } from "react-native-reanimated";

const svgHeight = 400;
const svgPadding = 5;
const minData = -5;
const maxData = 5;

type Stats = {
  min: number;
  max: number;
  average: number;
};

export const AnimatedLiveChart = () => {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const {
    sampleBuffer,
    sampleBufferIdx,
    samplesPerPacket,
    lastUpdateTimestamp,
    isRunning,
    toggleRunning,
  } = useFakeBLE(); // Ref of circular sample buffer

  const aFrameId = useRef<number | null>(null); // Store animation frame ID to be able to cancel it

  const path = useSharedValue("");

  const animStartTime = useRef<number | null>(null);
  const animDuration = useRef<number | null>(null);
  const animProgress = useRef<number | null>(null);

  // Update path on every animationFrame
  const updateGraph = (timestamp: number) => {
    if (!path) return;

    // Left-scrolling animation between updates to smooth out movement
    if (lastUpdateTimestamp.current) {
      if (animStartTime.current) {
        if (animStartTime.current != lastUpdateTimestamp.current) {
          animDuration.current =
            lastUpdateTimestamp.current - animStartTime.current;
          animStartTime.current = lastUpdateTimestamp.current;
        }
        if (animDuration.current) {
          animProgress.current =
            (timestamp - animStartTime.current) / animDuration.current;
        }
      } else {
        animStartTime.current = lastUpdateTimestamp.current;
      }
    }

    path.value = sampleBuffer.current
      .map((_, idx) => {
        const fixedIdx =
          (idx + sampleBufferIdx.current) % sampleBuffer.current.length;
        const x =
          (idx -
            (animProgress.current
              ? animProgress.current * samplesPerPacket
              : 0)) *
          (width / sampleBuffer.current.length);
        const y =
          svgHeight +
          svgPadding -
          ((sampleBuffer.current[fixedIdx] - minData) / (maxData - minData)) *
            svgHeight;
        return `${idx === 0 ? "M" : " L"} ${x} ${y}`;
      })
      .join(" ");

    if (isRunning) {
      aFrameId.current = requestAnimationFrame(updateGraph); // Call this function again on the next animation frame
    }
  };

  // Start the repeating animation frame function on mount
  useEffect(() => {
    if (!isRunning) return;

    aFrameId.current = requestAnimationFrame(updateGraph);

    // Cleanup on unmount
    return () => {
      if (aFrameId.current) {
        cancelAnimationFrame(aFrameId.current);
      }
    };
  }, [isRunning]);

  // Pause when navigating away
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      if (isRunning) {
        toggleRunning();
      }
    });

    return unsubscribe;
  }, [navigation, isRunning, toggleRunning]);

  const font = useFont(require("@/assets/fonts/SpaceMono-Regular.ttf"), 11);
  const YAxis = useMemo(() => {
    const ticks = [];
    const numTicks = 10;
    const tickSpacing = svgHeight / numTicks;

    for (let i = 0; i <= numTicks; i++) {
      const y = svgHeight + svgPadding - i * tickSpacing;
      const num = minData + (maxData - minData) * (i / numTicks);
      ticks.push(
        <Group key={`y-tick-${i}`}>
          <Path
            path={`M 0 ${y} L 10 ${y}`}
            color={theme.colors.onSurface}
            opacity={0.5}
            style="stroke"
            strokeWidth={1}
          />
          <SkiaText
            x={15}
            y={y + 3}
            opacity={0.5}
            font={font}
            color={theme.colors.onSurface}
            text={num < 0 ? num.toFixed(0) : ` ${num.toFixed(0)}`}
          />
        </Group>
      );
    }
    return <Group>{ticks}</Group>;
  }, [theme, font]);

  // -- Stats
  const [stats, setStats] = useState<Stats>({
    average: 0,
    min: 0,
    max: 0,
  });

  // Calculate stats every X ms
  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        let sum = 0;
        let min = Infinity;
        let max = -Infinity;
        sampleBuffer.current.forEach((val) => {
          if (val < min) min = val;
          if (val > max) max = val;
          sum += val;
        });
        setStats({
          average: sum / (sampleBuffer.current.length || 1),
          min,
          max,
        });
      }, 1000);

      return () => clearInterval(interval);
    }, [])
  );
  // --

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Live sensor data</Text>
      <Divider noMargin />
      <Canvas
        style={{ width: width, height: svgHeight + svgPadding * 2 }}
        mode="continuous"
      >
        <Path
          path={path}
          color={theme.colors.secondary}
          style="stroke"
          strokeWidth={1}
        />
        {YAxis}
      </Canvas>
      <Divider noMargin />
      <View style={styles.container}>
        <View style={styles.buttonRow}>
          <IconButton
            icon={isRunning ? "pause" : "play"}
            size={28}
            onPress={toggleRunning}
            mode={isRunning ? "contained" : "outlined"}
            selected={isRunning}
          />
        </View>
        <Divider noMargin />
        <View style={styles.statsContainer}>
          <View style={styles.statsItem}>
            <Text>Minimum</Text>
            <Text>{stats.min.toFixed(2)}</Text>
          </View>
          <View style={styles.statsItem}>
            <Text>Average</Text>
            <Text>{stats.average.toFixed(2)}</Text>
          </View>
          <View style={styles.statsItem}>
            <Text>Maximum</Text>
            <Text>{stats.max.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 30,
  },
  statsContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 30,
  },
  statsItem: {
    flexDirection: "column",
    flexBasis: 1,
    flexGrow: 1,
    alignItems: "center",
  },
  zoomButton: {
    alignSelf: "flex-end",
  },
});
