// Small primes for slope selection (up to 13 for reasonable gameplay)
const PRIMES = [2, 3, 5, 7, 11, 13];

/**
 * Gets a random selection of prime numbers to use as slopes
 * @param count Number of slopes to select (default: 2)
 * @returns Array of prime numbers
 */
export function getRandomSlopes(count: number = 2): number[] {
  // Always include 1 for basic diagonals
  const slopes = new Set<number>([1]);
  
  // Add random primes until we reach the desired count
  while (slopes.size < count && slopes.size < PRIMES.length) {
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