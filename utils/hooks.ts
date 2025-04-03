import { useState, useCallback, useEffect, useRef } from "react";
import { boundedRandomGaussian } from "@/utils/helpers";

export const useToggle = (initialState = false) => {
  const [state, setState] = useState(initialState);
  const toggle = useCallback(() => setState((prev) => !prev), []);
  return [state, toggle] as const;
};

export const useFakeBLE = () => {
  // - Configuration
  // -- Device settings
  const sampleRate = 200; // Hz, MIGHT CHANGE
  const samplesPerPacket = 7; // MIGHT CHANGE
  const adcToMv = 0.00357; // ADC to mV conversion factor. 2mV / 560 ADC counts
  const adcMax = 1023;
  const adcHalf = adcMax / 2;
  // --

  const bufferSize = 400;

  const sampleBuffer = useRef<number[]>([]);
  if (!(sampleBuffer?.current?.length > 0)) {
    sampleBuffer.current = Array<number>(bufferSize).fill(0);
  }
  const sampleBufferIdx = useRef<number>(0);

  const lastUpdateTimestamp = useRef<number | null>(null);

  // New data received from BLE
  const onDataUpdate = useCallback(
    (emgSamples: number[], sampleId: number, numSamples: number) => {
      emgSamples.forEach((sample) => {
        const emg_mv = (sample - 1024 / 2) * adcToMv; // Convert ADC value to mV
        sampleBuffer.current[sampleBufferIdx.current] = emg_mv;
        sampleBufferIdx.current =
          (sampleBufferIdx.current + 1) % sampleBuffer.current.length;
      });
      lastUpdateTimestamp.current = performance.now();
    },
    []
  );

  // - Simulate BLE device
  const bleUpdateInterval = 1000 / (sampleRate / samplesPerPacket); // ms
  const totalBLEsamples = useRef(123); // Start at random number

  const sinusoidalFrequency = 0.2;
  const startTime = useRef(Date.now()); // Track the start time for the sinusoidal effect

  const [bleActive, setBleActive] = useState<boolean>(false);

  useEffect(() => {
    if (!bleActive) return;

    const interval = setInterval(() => {
      const newSamples = [];
      const currentTime = (Date.now() - startTime.current) / 1000; // Time in seconds
      for (let i = 0; i < samplesPerPacket; i++) {
        const sinusoidalEffect = Math.sin(
          2 * Math.PI * sinusoidalFrequency * currentTime
        );
        const randomValue = boundedRandomGaussian(adcHalf, 200, 0, adcMax);
        newSamples.push((randomValue - adcHalf) * sinusoidalEffect + adcHalf); // Add sinusoidal effect to random value
        totalBLEsamples.current++;
      }
      onDataUpdate(newSamples, totalBLEsamples.current, samplesPerPacket);
    }, bleUpdateInterval); // Calculate packet interval

    return () => {
      clearInterval(interval);
    };
  }, [bleActive]);
  // -

  // - Play/Pause
  const [isRunning, toggleRunning] = useToggle(false);

  useEffect(() => {
    if (isRunning) {
      sampleBuffer.current = Array<number>(bufferSize).fill(0);
      setBleActive(true);
    } else {
      setBleActive(false);
    }
  }, [isRunning]);
  // -

  return {
    sampleBuffer,
    sampleBufferIdx,
    samplesPerPacket,
    lastUpdateTimestamp,
    isRunning,
    toggleRunning,
  };
};
