// Small primes for slope selection (up to 13 for reasonable gameplay)
const PRIMES = [2, 3, 5, 7, 11, 13];

// Slopes and their reciprocals that we want to keep together
const SLOPE_PAIRS = [
  [2, 1/2],
  [3, 1/3],
  [5, 1/5],
  [7, 1/7],
  [11, 1/11],
  [13, 1/13]
];

/**
 * Gets a random selection of slopes, always including both a slope and its reciprocal
 * @param count Total number of slopes to select (default: 4)
 * @returns Array of numbers including pairs of slopes and their reciprocals
 */
export function getRandomSlopes(count: number = 4): number[] {
  // Make a copy of the pairs array to avoid modifying the original
  const availablePairs = [...SLOPE_PAIRS];
  const selectedSlopes = new Set<number>();
  
  // Always include 1 (which is its own reciprocal)
  selectedSlopes.add(1);
  
  // Randomly select pairs until we reach or exceed the desired count
  while (selectedSlopes.size < count && availablePairs.length > 0) {
    const randomIndex = Math.floor(Math.random() * availablePairs.length);
    const [slope, reciprocal] = availablePairs[randomIndex];
    
    // Add both the slope and its reciprocal
    selectedSlopes.add(slope);
    selectedSlopes.add(reciprocal);
    
    // Remove the selected pair from available pairs
    availablePairs.splice(randomIndex, 1);
  }
  
  // If we still need more slopes, add random fractions
  const fractions = [2/3, 3/2, 3/4, 4/3, 4/5, 5/4];
  while (selectedSlopes.size < count && fractions.length > 0) {
    const randomIndex = Math.floor(Math.random() * fractions.length);
    const fraction = fractions[randomIndex];
    selectedSlopes.add(fraction);
    selectedSlopes.add(1/fraction);
    fractions.splice(randomIndex, 1);
  }
  
  // If we still need more slopes, add random fractions (1/2, 1/3, etc.)
  if (selectedSlopes.size < count) {
    const fractions = [1/2, 1/3, 1/5, 2/3, 3/2];
    while (selectedSlopes.size < count && fractions.length > 0) {
      const randomIndex = Math.floor(Math.random() * fractions.length);
      selectedSlopes.add(fractions[randomIndex]);
      fractions.splice(randomIndex, 1);
    }
  }
  
  return Array.from(selectedSlopes);
}

/**
 * Generates SQL conditions for the given slopes
 * @param slopes Array of prime numbers to use as slopes
 * @returns SQL condition string
 */
export function getSlopeConditions(slopes: number[]): string {
  return slopes.flatMap(prime => [
    // Slope prime:1 (dx * prime = dy)
    `(p2.x - p1.x) * ${prime} = (p2.y - p1.y) AND (p2.x - p1.x) != 0`,
    // Slope -prime:1 (dx * -prime = dy)
    `(p2.x - p1.x) * -${prime} = (p2.y - p1.y) AND (p2.x - p1.x) != 0`,
    // Slope 1:prime (dx = dy * prime)
    `(p2.x - p1.x) = (p2.y - p1.y) * ${prime} AND (p2.y - p1.y) != 0`,
    // Slope -1:prime (dx = dy * -prime)
    `(p2.x - p1.x) = (p2.y - p1.y) * -${prime} AND (p2.y - p1.y) != 0`
  ]).join(' OR ');
}