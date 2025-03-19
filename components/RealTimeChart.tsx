import { useCallback, useState, Fragment, useMemo } from "react";
import { View, useWindowDimensions, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import Svg, { Path, Line, Text as SvgText } from "react-native-svg";
import { useTheme, Text, IconButton } from "react-native-paper";
import { Divider } from "@/components/Divider";
import { useToggle } from "@/utils/hooks";

type Stats = {
  current: number;
  min: number;
  max: number;
  average: number;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

const height = 300;
const minData = 0;
const maxData = 100;
const dataFetchInterval = 250;
const dataLifetime = 10000;
const numSamples = dataLifetime / dataFetchInterval;

const zoomAmount = 4;

export const RealTimeChart = () => {
  const theme = useTheme();

  const { width } = useWindowDimensions();
  const animatedData = useSharedValue(Array<number>(numSamples).fill(minData));
  const animatedXOffset = useSharedValue(0);

  const [stats, setStats] = useState<Stats>({
    current: 0,
    min: 0,
    max: 0,
    average: 0,
  });

  const [zoom, handleZoom] = useToggle();

  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        // simulate sensor data
        const newDataPoint = Math.round(
          Math.min(
            maxData,
            Math.max(
              minData,
              (animatedData.value.at(-1) || 0) +
                (maxData * 0.3 - Math.random() * maxData * 0.6)
            )
          )
        );

        // add new data point, remove oldest one. Need to replace entire array for sharedValues
        animatedData.value = [...animatedData.value.slice(1), newDataPoint];

        // update stats based on new data, can be optimized
        let min = maxData;
        let max = minData;
        const sum = animatedData.value.reduce((acc, curr) => {
          if (curr < min) min = curr;
          if (curr > max) max = curr;
          return acc + curr;
        });
        const average = Math.round(sum / numSamples);
        setStats({ current: newDataPoint, min, max, average });

        // restart left-scrolling animation
        animatedXOffset.value = 0;
        animatedXOffset.value = withTiming(1, {
          duration: dataFetchInterval,
          easing: Easing.linear,
        });
      }, dataFetchInterval);

      return () => {
        clearInterval(interval);
        cancelAnimation(animatedXOffset);
        animatedData.value = Array<number>(numSamples).fill(minData);
        animatedXOffset.value = 0;
      };
    }, [])
  );

  const animatedProps = useAnimatedProps(() => {
    const points = animatedData.value.map((value, index) => {
      const x =
        (width / (animatedData.value.length - 3)) *
          (zoom ? zoomAmount : 1) *
          (index - 1 - animatedXOffset.value) -
        (zoom ? width * (zoomAmount - 1) : 0);
      const y = height * 0.1 + height * 0.8 - (value / 100) * (height * 0.8);
      return { x, y };
    });

    const path = points.reduce((acc, point, index, arr) => {
      if (index === 0) {
        return `M${point.x},${point.y}`;
      }
      const prev = arr[index - 1];
      const controlX = (prev.x + point.x) / 2;
      const controlY = (prev.y + point.y) / 2;
      return `${acc} S${controlX},${controlY} ${point.x},${point.y}`;
    }, "");

    return {
      d: path,
    };
  });

  const YAxis = useMemo(() => {
    const ticks = [];
    const numTicks = 4;
    const tickSpacing = (height * 0.8) / numTicks;

    for (let i = 0; i <= numTicks; i++) {
      const y = height * 0.1 + height * 0.8 - i * tickSpacing;
      ticks.push(
        <Fragment key={`y-tick-${i}`}>
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
            {(i * maxData) / numTicks}
          </SvgText>
        </Fragment>
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
          animatedProps={animatedProps}
          fill="none"
          stroke={theme.colors.secondary}
          strokeWidth={1}
        />
        {YAxis}
      </Svg>
      <Divider noMargin />
      <View style={styles.container}>
        <IconButton
          icon="magnify-scan"
          size={28}
          onPress={handleZoom}
          style={styles.zoomButton}
          mode={zoom ? "contained" : "outlined"}
          selected={zoom}
        />
        <Text variant="headlineMedium">{stats.current}</Text>
        <Text>Statistics for the last 10 seconds:</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statsItem}>
            <Text>Minimum</Text>
            <Text>{stats.min}</Text>
          </View>
          <View style={styles.statsItem}>
            <Text>Maximum</Text>
            <Text>{stats.max}</Text>
          </View>
          <View style={styles.statsItem}>
            <Text>Average</Text>
            <Text>{stats.average}</Text>
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
