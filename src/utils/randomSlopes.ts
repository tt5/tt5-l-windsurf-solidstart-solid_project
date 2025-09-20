// All prime numbers less than 2000
const PRIMES = [
   2,    3,    5,    7,   11,   13,   17,   19,   23,   29,   31,   37,   41,   43,   47,   53,   59,   61,   67,   71,
  73,   79,   83,   89,   97,  101,  103,  107,  109,  113,  127,  131,  137,  139,  149,  151,  157,  163,  167,  173,
 179,  181,  191,  193,  197,  199,  211,  223,  227,  229,  233,  239,  241,  251,  257,  263,  269,  271,  277,  281,
 283,  293,  307,  311,  313,  317,  331,  337,  347,  349,  353,  359,  367,  373,  379,  383,  389,  397,  401,  409,
 419,  421,  431,  433,  439,  443,  449,  457,  461,  463,  467,  479,  487,  491,  499,  503,  509,  521,  523,  541,
 547,  557,  563,  569,  571,  577,  587,  593,  599,  601,  607,  613,  617,  619,  631,  641,  643,  647,  653,  659,
 661,  673,  677,  683,  691,  701,  709,  719,  727,  733,  739,  743,  751,  757,  761,  769,  773,  787,  797,  809,
 811,  821,  823,  827,  829,  839,  853,  857,  859,  863,  877,  881,  883,  887,  907,  911,  919,  929,  937,  941,
 947,  953,  967,  971,  977,  983,  991,  997, 1009, 1013, 1019, 1021, 1031, 1033, 1039, 1049, 1051, 1061, 1063, 1069,
1087, 1091, 1093, 1097, 1103, 1109, 1117, 1123, 1129, 1151, 1153, 1163, 1171, 1181, 1187, 1193, 1201, 1213, 1217, 1223,
1229, 1231, 1237, 1249, 1259, 1277, 1279, 1283, 1289, 1291, 1297, 1301, 1303, 1307, 1319, 1321, 1327, 1361, 1367, 1373,
1381, 1399, 1409, 1423, 1427, 1429, 1433, 1439, 1447, 1451, 1453, 1459, 1471, 1481, 1483, 1487, 1489, 1493, 1499, 1511,
1523, 1531, 1543, 1549, 1553, 1559, 1567, 1571, 1579, 1583, 1597, 1601, 1607, 1609, 1613, 1619, 1621, 1627, 1637, 1657,
1663, 1667, 1669, 1693, 1697, 1699, 1709, 1721, 1723, 1733, 1741, 1747, 1753, 1759, 1777, 1783, 1787, 1789, 1801, 1811,
1823, 1831, 1847, 1861, 1867, 1871, 1873, 1877, 1879, 1889, 1901, 1907, 1913, 1931, 1933, 1949, 1951, 1973, 1979, 1987,
1993, 1997, 1999
];

// Track when prime numbers were last used
const primeTimestamps = new Map<number, number>();

// Function to get a prime's last used timestamp
function getPrimeTimestamp(prime: number): number {
  return primeTimestamps.get(prime) || 0; // Return 0 if never used
}

// Function to update a prime's timestamp
function updatePrimeTimestamp(prime: number, timestamp: number = Date.now()) {
  primeTimestamps.set(prime, timestamp);
}

// Function to get the oldest timestamp from all primes
export function getOldestPrimeTimestamp(): number | null {
  let oldest: number | null = null;
  for (const timestamp of primeTimestamps.values()) {
    if (timestamp > 0 && (oldest === null || timestamp < oldest)) {
      oldest = timestamp;
    }
  }
  return oldest;
}

// Server start time for initializing prime timestamps
const SERVER_START_TIME = Date.now();

// Initialize timestamps for all primes to server start time
PRIMES.forEach(prime => {
  if (!primeTimestamps.has(prime)) {
    primeTimestamps.set(prime, SERVER_START_TIME);
  }
});

// Slopes and their reciprocals that we want to keep together
const SLOPE_PAIRS = PRIMES.map(prime => [prime, 1/prime] as [number, number]);

/**
 * Gets a random selection of slopes, always including both a slope and its reciprocal,
 * as well as their negative counterparts.
 * @param count Total number of slope pairs to select (default: 4)
 * @returns Array of numbers including pairs of slopes, their reciprocals, and negative versions
 */
export function getRandomSlopes(count: number = 4): number[] {
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

  // Select exactly 'count' unique primes from PRIMES
  const availablePrimes = [...PRIMES];
  const selectedPrimes: number[] = [];
  const now = Date.now();
  
  // Ensure we don't try to select more primes than available
  const primesToSelect = Math.min(count, availablePrimes.length);
  
  // Select random primes
  for (let i = 0; i < primesToSelect && availablePrimes.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availablePrimes.length);
    const prime = availablePrimes.splice(randomIndex, 1)[0];
    selectedPrimes.push(prime);
    
    // Update the timestamp for this prime
    updatePrimeTimestamp(prime, now);
    
    // Add all variants of this prime
    addSlopeWithVariants(prime);
  }
  
  // Return all variants of the selected slopes
  return Array.from(selectedSlopes);
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
  const EPSILON = 1e-10; // Small value for floating-point comparison
  
  // Helper function to compare floating point numbers with epsilon
  const almostEqual = (a: string, b: string) => `ABS(${a} - ${b}) < ${EPSILON}`;
  
  // Add vertical and horizontal lines (exact matches)
  conditions.push('(p1.x = p2.x)'); // Vertical
  conditions.push('(p1.y = p2.y)'); // Horizontal
  
  // Add main diagonal and anti-diagonal
  conditions.push('(p1.x - p1.y = p2.x - p2.y)'); // Main diagonal (slope 1)
  conditions.push('(p1.x + p1.y = p2.x + p2.y)'); // Anti-diagonal (slope -1)
  
  for (const prime of slopes) {
    // Skip invalid numbers
    if (typeof prime !== 'number' || isNaN(prime)) continue;
    
    const absPrime = Math.abs(prime);
    const sign = prime < 0 ? -1 : 1;
    
    // For each prime, we'll check four variants:
    // 1. prime:1 (dx * prime = dy)
    // 2. -prime:1 (dx * -prime = dy)
    // 3. 1:prime (dx = dy * prime)
    // 4. -1:prime (dx = dy * -prime)
    
    // Using cross-multiplication to avoid division and floating point issues
    // For slope m = dy/dx, we check dy = m*dx using cross-multiplication: dy*1 = m*dx*1
    
    // 1. prime:1 (dy = prime * dx)
    conditions.push(`(ABS((p2.y - p1.y) - (${absPrime * sign} * (p2.x - p1.x))) < ${EPSILON} AND (p2.x - p1.x) != 0)`);
    
    // 2. -prime:1 (dy = -prime * dx)
    conditions.push(`(ABS((p2.y - p1.y) - (${-absPrime * sign} * (p2.x - p1.x))) < ${EPSILON} AND (p2.x - p1.x) != 0)`);
    
    // Skip if prime is 0 to avoid division by zero in the next conditions
    if (prime === 0) continue;
    
    // 3. 1:prime (dx = prime * dy)
    conditions.push(`(ABS((p2.x - p1.x) - (${absPrime * sign} * (p2.y - p1.y))) < ${EPSILON} AND (p2.y - p1.y) != 0)`);
    
    // 4. -1:prime (dx = -prime * dy)
    conditions.push(`(ABS((p2.x - p1.x) - (${-absPrime * sign} * (p2.y - p1.y))) < ${EPSILON} AND (p2.y - p1.y) != 0)`);
  }
  
  // If no valid conditions were added, return false condition
  if (conditions.length === 0) {
    return '1=0';
  }
  
  // Return the conditions joined with OR, wrapped in parentheses
  return `(${conditions.join(' OR ')})`;
}