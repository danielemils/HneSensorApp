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
  // --
  const maxSamples = 500;
  // -

  const sampleBuffer = useRef<number[]>([]); // Circular buffer for samples
  if (sampleBuffer.current.length === 0) {
    sampleBuffer.current = Array(maxSamples).fill(0);
  }
  const samplesStartIdx = useRef(0); // Start index for circular buffer

  const [state, setState] = useState({
    samples: [...sampleBuffer.current],
    numSamplesSinceLastUpdate: 0,
    timeElapsedSinceLastUpdate: 0,
  });

  const [isRunning, toggleRunning] = useToggle(false);

  const bleUpdateInterval = 1000 / (sampleRate / samplesPerPacket); // ms
  // - For periodic updates
  const periodicUpdateFactor = 10;
  const bleNotificationCounter = useRef(0);
  // -

  const lastUpdateSampleId = useRef(-1);
  const lastUpdateTimestamp = useRef(Date.now());

  // Simulate BLE notification
  const totalBLEsamples = useRef(123); // Start at random number
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const newSamples = [];
      for (let i = 0; i < samplesPerPacket; i++) {
        newSamples.push(boundedRandomGaussian(512, 200, 0, 1023));
        totalBLEsamples.current++;
      }
      onDataUpdate(newSamples, totalBLEsamples.current, samplesPerPacket);
    }, bleUpdateInterval); // Calculate packet interval

    return () => {
      clearInterval(interval);
    };
  }, [isRunning]);

  // New data received from BLE
  const onDataUpdate = useCallback(
    (emgSamples: number[], sampleId: number, numSamples: number) => {
      // If first sample initialize lastUpdate info
      if (lastUpdateSampleId.current < 0) {
        lastUpdateSampleId.current = sampleId - numSamples - 1;
        lastUpdateTimestamp.current = Date.now();
      }

      emgSamples.forEach((sample) => {
        const emg_mv = (sample - 1024 / 2) * adcToMv; // Convert ADC value to mV
        sampleBuffer.current[samplesStartIdx.current] = emg_mv;
        samplesStartIdx.current =
          (samplesStartIdx.current + 1) % sampleBuffer.current.length;
      });

      // Update the state every few BLE packets
      bleNotificationCounter.current++;
      if (bleNotificationCounter.current % periodicUpdateFactor === 0) {
        setState({
          samples: [
            // Rotate the circular buffer so the most recent samples are at the end
            ...sampleBuffer.current.slice(samplesStartIdx.current),
            ...sampleBuffer.current.slice(0, samplesStartIdx.current),
          ],
          numSamplesSinceLastUpdate: sampleId - lastUpdateSampleId.current,
          timeElapsedSinceLastUpdate: Date.now() - lastUpdateTimestamp.current,
        });
        lastUpdateSampleId.current = sampleId;
        lastUpdateTimestamp.current = Date.now();
      }
    },
    []
  );

  // Reset samples when stopped
  useEffect(() => {
    if (!isRunning) {
      sampleBuffer.current = Array(maxSamples).fill(0);
      samplesStartIdx.current = 0;
      setState({
        samples: [...sampleBuffer.current],
        numSamplesSinceLastUpdate: 0,
        timeElapsedSinceLastUpdate: 0,
      });
    }
  }, [isRunning]);

  return {
    ...state,
    isRunning,
    toggleRunning,
  };
};
