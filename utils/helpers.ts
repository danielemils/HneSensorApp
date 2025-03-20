export const boundedRandomGaussian = (
  mean: number,
  stdDev: number,
  min: number,
  max: number
) => {
  let u1 = Math.random();
  let u2 = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2); // Box-Muller transform
  const value = mean + z * stdDev;
  if (value < min) return min;
  else if (value > max) return max;
  return Math.round(value);
};
