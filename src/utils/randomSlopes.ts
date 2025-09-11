// Small primes for slope selection (up to 13 for reasonable gameplay)
const PRIMES = [5, 7, 11, 13]; // Removed 2 and 3 since they're now always included

/**
 * Gets a selection of prime numbers to use as slopes
 * Always includes 1, 2, and 3, plus additional random primes
 * @param count Total number of slopes to select (default: 4 - will include 1, 2, 3 + 1 random)
 * @returns Array of numbers including 1, 2, 3 and additional primes
 */
export function getRandomSlopes(count: number = 4): number[] {
  // Always include 1 for basic diagonals, and 2 and 3 as requested
  const slopes = new Set<number>([1, 2, 3]);
  
  // Add random primes until we reach the desired count
  while (slopes.size < count && slopes.size < PRIMES.length + 3) { // +3 for 1, 2, 3
    const randomIndex = Math.floor(Math.random() * PRIMES.length);
    slopes.add(PRIMES[randomIndex]);
  }
  
  return Array.from(slopes);
}

/**
 * Generates SQL conditions for the given slopes
 * @param slopes Array of prime numbers to use as slopes
 * @returns SQL condition string
 */
export function getSlopeConditions(slopes: number[]): string {
  return slopes.flatMap(prime => [
    // Slope prime:1 (dx * prime = dy)
    `(p2.x - p1.x) * ${prime} = (p2.y - p1.y)`,
    // Slope 1:prime (dx = dy * prime)
    `(p2.x - p1.x) = (p2.y - p1.y) * ${prime}`
  ]).join(' OR ');
}