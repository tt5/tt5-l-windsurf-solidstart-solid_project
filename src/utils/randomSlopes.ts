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
 * Gets a random selection of slopes, always including both a slope and its reciprocal,
 * as well as their negative counterparts.
 * @param count Total number of slope pairs to select (default: 4)
 * @returns Array of numbers including pairs of slopes, their reciprocals, and negative versions
 */
export function getRandomSlopes(count: number = 4): number[] {
  // Make a copy of the pairs array to avoid modifying the original
  const availablePairs = [...SLOPE_PAIRS];
  const selectedSlopes = new Set<number>();
  
  // Function to add a slope and its variants to the result
  const addSlopeWithVariants = (slope: number) => {
    // Add the original slope
    selectedSlopes.add(slope);
    // Add its reciprocal if not 0
    if (slope !== 0) {
      selectedSlopes.add(1 / slope);
    }
    // Add negative versions
    selectedSlopes.add(-slope);
    if (slope !== 0) {
      selectedSlopes.add(-1 / slope);
    }
  };
  // Always include the main diagonal (1) and anti-diagonal (-1)
  addSlopeWithVariants(1);  // Main diagonal (slope 1)
  addSlopeWithVariants(-1); // Anti-diagonal (slope -1)

  // Select random pairs until we have enough slopes
  while (availablePairs.length > 0 && selectedSlopes.size < count * 4) { // *4 because each selection adds 4 variants
    // Pick a random pair
    const randomIndex = Math.floor(Math.random() * availablePairs.length);
    const [slope1, slope2] = availablePairs[randomIndex];
    
    // Add both slopes from the pair with all their variants
    addSlopeWithVariants(slope1);
    addSlopeWithVariants(slope2);
    
    // Remove the selected pair
    availablePairs.splice(randomIndex, 1);
  }
  
  // If we still need more slopes, add some common fractions
  if (selectedSlopes.size < count * 4) {
    const commonFractions = [
      [2/3, 3/2],
      [3/4, 4/3],
      [2/5, 5/2],
      [3/5, 5/3],
      [4/5, 5/4]
    ];
    
    for (const [frac1, frac2] of commonFractions) {
      if (selectedSlopes.size >= count * 4) break;
      addSlopeWithVariants(frac1);
      addSlopeWithVariants(frac2);
    }
  }
  
  // Convert to array and ensure we don't exceed the requested count
  return Array.from(selectedSlopes).slice(0, count);
}

/**
 * Generates SQL conditions for the given slopes
 * @param slopes Array of prime numbers to use as slopes
 * @returns SQL condition string
 */
export function getSlopeConditions(slopes: number[]): string {
  if (!slopes || slopes.length === 0) {
    return '1=0'; // Return false condition if no slopes provided
  }
  
  const conditions: string[] = [];
  
  for (const prime of slopes) {
    // Skip invalid numbers
    if (typeof prime !== 'number' || isNaN(prime)) continue;
    
    const absPrime = Math.abs(prime);
    const sign = prime < 0 ? -1 : 1;
    
    // Slope prime:1 (dx * prime = dy)
    conditions.push(`((p2.x - p1.x) * ${absPrime} * ${sign} = (p2.y - p1.y) AND (p2.x - p1.x) != 0)`);
    
    // Slope -prime:1 (dx * -prime = dy)
    conditions.push(`((p2.x - p1.x) * ${absPrime} * ${-sign} = (p2.y - p1.y) AND (p2.x - p1.x) != 0)`);
    
    // Skip if prime is 0 to avoid division by zero
    if (prime === 0) continue;
    
    // Slope 1:prime (dx = dy * prime)
    conditions.push(`((p2.x - p1.x) = (p2.y - p1.y) * ${absPrime} * ${sign} AND (p2.y - p1.y) != 0)`);
    
    // Slope -1:prime (dx = dy * -prime)
    conditions.push(`((p2.x - p1.x) = (p2.y - p1.y) * ${absPrime} * ${-sign} AND (p2.y - p1.y) != 0)`);
  }
  
  // If no valid conditions were added, return false condition
  if (conditions.length === 0) {
    return '1=0';
  }
  
  // Return the conditions joined with OR, wrapped in parentheses
  return `(${conditions.join(' OR ')})`;
}