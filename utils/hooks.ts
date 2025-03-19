import { useState, useCallback, useEffect, useRef } from "react";

export const useToggle = (initialState = false) => {
  const [state, setState] = useState(initialState);
  const toggle = useCallback(() => setState((prev) => !prev), []);
  return [state, toggle] as const;
};

function boundedRandomGaussian(
  mean: number,
  stdDev: number,
  min: number,
  max: number
) {
  let u1 = Math.random();
  let u2 = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2); // Box-Muller transform
  const value = mean + z * stdDev;
  if (value < min) return min;
  else if (value > max) return max;
  return Math.round(value);
}
export const useFakeBLE = () => {
  const samples = useRef<number[]>([]);
  if (samples.current.length === 0) {
    samples.current = Array(100).fill(0);
  }
  const samplesStartIdx = useRef(0); // For circular buffer

  const [throttledSamples, setThrottledSamples] = useState(samples.current);

  // Simulate BLE notification
  useEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        const newSamples = [];
        for (let i = 0; i < 7; i++) {
          newSamples.push(boundedRandomGaussian(512, 100, 0, 1023));
        }
        onDataUpdate(newSamples);
      }, 34);

      return () => {
        clearInterval(interval);
      };
    }, []),
    []
  );

  // Throttle updates to prevent rendering too often
  useEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        setThrottledSamples(samples.current.slice(0));
      }, 500);

      return () => {
        clearInterval(interval);
      };
    }, []),
    []
  );

  const onDataUpdate = useCallback((data: number[]) => {
    // ADC to mV conversion factor
    const adcToMv = 0.00357; // 2mV / 560 ADC counts
    if (samples.current) {
      data.forEach((sample) => {
        const emg_mv = (sample - 1024 / 2) * adcToMv; // Convert ADC value to mV
        samples.current[samplesStartIdx.current] = emg_mv;
        samplesStartIdx.current =
          (samplesStartIdx.current + 1) % samples.current.length;
      });
    }
  }, []);

  return { throttledSamples };
};
