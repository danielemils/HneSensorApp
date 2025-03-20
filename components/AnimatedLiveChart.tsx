import { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { View, useWindowDimensions, StyleSheet } from "react-native";
import { useFocusEffect, useNavigation } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import Svg, { Path, Line, Text as SvgText, G } from "react-native-svg";
import { useTheme, Text, IconButton } from "react-native-paper";
import { Divider } from "@/components/Divider";
import { useToggle, useFakeBLE } from "@/utils/hooks";

type Stats = {
  current: number;
  min: number;
  max: number;
  average: number;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

const height = 300;
const maxData = 2;
const minData = -2;

const zoomAmount = 3;

export const AnimatedLiveChart = () => {
  const theme = useTheme();

  const { width } = useWindowDimensions();
  // const animatedData = useSharedValue(Array<number>(numSamples).fill(0));
  const animatedSamples = useSharedValue<number[]>([]);
  const animatedXMovement = useSharedValue(0);
  const animatedXOffset = useSharedValue(0);

  const [stats, setStats] = useState<Stats>({
    current: 0,
    min: 0,
    max: 0,
    average: 0,
  });

  const [zoom, handleZoom] = useToggle();

  const {
    samples,
    numSamplesSinceLastUpdate,
    timeElapsedSinceLastUpdate,
    isRunning,
    toggleRunning,
  } = useFakeBLE();

  // Saving previously received samples for animation
  const prevSamples = useRef<number[]>([]);
  const prevNumSamplesSinceLastUpdate = useRef(0);

  const handlePause = useCallback(() => {
    if (isRunning) {
      cancelAnimation(animatedXMovement);
      toggleRunning();
      prevSamples.current = [];
    }
  }, [isRunning, toggleRunning]);

  // Pause when navigating away
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      handlePause();
    });

    return unsubscribe;
  }, [navigation, handlePause]);

  // New samples received
  useFocusEffect(
    useCallback(() => {
      if (isRunning) {
        // Keep track of previously received samples for animation
        // Update path from previous samples
        animatedSamples.value = [...prevSamples.current];
        animatedXOffset.value = prevNumSamplesSinceLastUpdate.current;
        // Calculate statistics from previous samples
        if (prevSamples.current.length > 0) {
          let min = Number.MAX_VALUE;
          let max = Number.MIN_VALUE;
          let sum = 0;
          prevSamples.current.forEach((sample) => {
            min = Math.min(min, sample);
            max = Math.max(max, sample);
            sum += sample;
          });
          const average = sum / prevSamples.current.length;
          setStats({
            current: prevSamples.current[prevSamples.current.length - 1],
            min,
            max,
            average,
          });
        }

        prevSamples.current = samples;
        prevNumSamplesSinceLastUpdate.current = numSamplesSinceLastUpdate;

        // restart left-scrolling animation
        animatedXMovement.value = 0;
        if (numSamplesSinceLastUpdate && timeElapsedSinceLastUpdate) {
          animatedXMovement.value = withTiming(numSamplesSinceLastUpdate, {
            duration: timeElapsedSinceLastUpdate,
            easing: Easing.linear,
          });

          return () => {
            cancelAnimation(animatedXMovement);
          };
        }
      }
    }, [
      samples,
      numSamplesSinceLastUpdate,
      timeElapsedSinceLastUpdate,
      isRunning,
    ])
  );

  const animatedPropsPath = useAnimatedProps(() => {
    const points = animatedSamples.value.map((value, index) => {
      const x =
        (width / (animatedSamples.value.length - animatedXOffset.value)) *
          (zoom ? zoomAmount : 1) *
          (index - animatedXMovement.value) -
        (zoom ? width * (zoomAmount - 1) : 0);
      const y = height - ((value - minData) / (maxData - minData)) * height;
      return { x, y };
    });

    const path = points.reduce((acc, point, index, arr) => {
      if (index === 0) {
        return `M${point.x},${point.y}`;
      }
      return `${acc} L${point.x},${point.y}`;
    }, "");

    return {
      d: path,
    };
  });

  const YAxis = useMemo(() => {
    const ticks = [];
    const numTicks = 4;
    const tickSpacing = height / numTicks;

    for (let i = 0; i <= numTicks; i++) {
      const y = height - i * tickSpacing;
      ticks.push(
        <G key={`y-tick-${i}`}>
          <Line
            x1={0}
            y1={y}
            x2={10}
            y2={y}
            stroke={theme.colors.onSurface}
            opacity={0.5}
          />
          <SvgText
            x={15}
            y={y + 3}
            fontSize="10"
            textAnchor="start"
            fill={theme.colors.onSurface}
            opacity={0.5}
          >
            {(minData + (maxData - minData) * (i / numTicks)).toFixed(1)}
          </SvgText>
        </G>
      );
    }

    return ticks;
  }, [theme]);

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Live sensor data</Text>
      <Divider noMargin />
      <Svg width={width} height={height}>
        <AnimatedPath
          animatedProps={animatedPropsPath}
          fill="none"
          stroke={theme.colors.secondary}
          strokeWidth={1}
        />
        {YAxis}
      </Svg>
      <Divider noMargin />
      <View style={styles.container}>
        <View style={styles.buttonRow}>
          <IconButton
            icon={isRunning ? "pause" : "play"}
            size={28}
            onPress={isRunning ? handlePause : toggleRunning}
            mode={isRunning ? "contained" : "outlined"}
            selected={isRunning}
          />
          <IconButton
            icon="magnify-scan"
            size={28}
            onPress={handleZoom}
            style={styles.zoomButton}
            mode={zoom ? "contained" : "outlined"}
            selected={zoom}
          />
        </View>
        <Divider noMargin />
        <Text variant="headlineMedium">{`${stats.current.toFixed(2)} mV`}</Text>
        <Text>Statistics for the last {samples.length} samples:</Text>
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
    justifyContent: "space-between",
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
