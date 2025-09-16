import { randomInt } from 'crypto';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// Get the current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Debug logging helper
const debugLog = (...args: any[]) => {
  if (argv.debug) {
    console.log('[DEBUG]', ...args);
  }
};

// Display restricted squares as a 15x15 ASCII grid
const displayRestrictedGrid = (squares: number[], direction: string, position: {x: number, y: number}) => {
  //console.log("\x1b[H")
  const gridSize = 15;
  const grid: string[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill('.'));
  
  // Mark restricted squares
  squares.forEach(index => {
    const x = index % gridSize;
    const y = Math.floor(index / gridSize);
    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      grid[y][x] = 'x';
    }
  });
  
  // Mark player position (center of the grid)
  const center = Math.floor(gridSize / 2);
  grid[center][center] = 'P';
  
  // Print column headers (hex)
  console.log("\n")
  console.log('  ' + Array(gridSize).fill(0).map((_, i) => i.toString(16)).join(' '));
  
  // Print grid rows with row headers
  grid.forEach((row, y) => {
    console.log(y.toString(16) + ' ' + row.join(' '));
  });
  
};

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('grid-size', {
    alias: 'g',
    type: 'number',
    default: 15,
    description: 'Size of the game grid (must be odd)'
  })
  .option('points', {
    alias: 'p',
    type: 'number',
    default: 10,
    description: 'Number of base points to create'
  })
  .option('new-attempts', {
    alias: 'n',
    type: 'number',
    default: 100,
    description: 'Number of new attempts to make before giving up'
  })
  .option('start-x', {
    type: 'number',
    default: 0,
    description: 'Starting X coordinate'
  })
  .option('start-y', {
    type: 'number',
    default: 0,
    description: 'Starting Y coordinate'
  })
  .option('delay', {
    type: 'number',
    default: 0,
    description: 'Delay between moves in milliseconds'
  })
  .option('debug', {
    type: 'boolean',
    default: false,
    description: 'Enable debug logging'
  })
  .option('direction', {
    alias: 'd',
    choices: ['right', 'left', 'up', 'down'],
    default: 'right',
    description: 'Initial movement direction'
  })
  .option('delete', {
    type: 'boolean',
    default: false,
    description: 'Delete all base points instead of simulating'
  })
  .help()
  .alias('help', 'h')
  .parseSync();

// Log debug info at startup
console.log('Debug mode:', argv.debug);
console.log('Command line arguments:', process.argv);

// Game constants
//const GRID_SIZE = Math.max(3, argv.gridSize + (argv.gridSize % 2 === 0 ? 1 : 0)); // Ensure odd number
const GRID_SIZE = 15
const VIEW_RADIUS = Math.floor(GRID_SIZE / 2); // How far the player can see

// Load environment variables from the project root
config({ path: join(__dirname, '../.env') });

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const MAX_COORDINATE = 1000; // Match the server-side limit
const NUM_POINTS = argv.points;
const MAX_NEW_ATTEMPTS = argv.newAttempts;
const MOVE_DELAY = argv.delay;
const USER_ID = process.env.TEST_USER_ID; // Set this in your .env file
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN; // Set this in your .env file

// Track player state
let playerPosition = { x: 0, y: 0 };
let totalMoves = 0; // Track total number of moves in the simulation

// Track placed base points
const placedBasePoints: Array<{x: number, y: number}> = [];

// Track restricted squares from server
let restrictedSquares: Array<[number, number]> = [];

// Fetch restricted squares from server
async function fetchRestrictedSquares(direction: 'up' | 'down' | 'left' | 'right' = 'up'): Promise<void> {
  try {
    // Calculate the viewport bounds
    const viewportSize = 15; // Should match GRID_SIZE
    const halfViewport = Math.floor(viewportSize / 2);
    
    // Calculate the viewport bounds in world coordinates
    const viewport = {
      left: -playerPosition.x - halfViewport,
      right: -playerPosition.x + halfViewport,
      top: -playerPosition.y - halfViewport,
      bottom: -playerPosition.y + halfViewport
    };
    
    // Get all squares in the viewport
    const viewportSquares: number[] = [];
    for (let y = viewport.top; y <= viewport.bottom; y++) {
      for (let x = viewport.left; x <= viewport.right; x++) {
        // Convert world coordinates to grid indices (0-14 for a 15x15 grid)
        const gridX = ((x % viewportSize) + viewportSize) % viewportSize;
        const gridY = ((y % viewportSize) + viewportSize) % viewportSize;
        const index = gridY * viewportSize + gridX;
        viewportSquares.push(index);
      }
    }
    
    debugLog(direction);
    const response = await fetch(`${BASE_URL}/api/calculate-squares`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        borderIndices: viewportSquares, // 15x15, wasteful but ok
        currentPosition: [-playerPosition.x, -playerPosition.y],
        direction: direction
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data?.squares) {
        if (argv.debug) {
          displayRestrictedGrid(data.data.squares, direction, playerPosition);
        }

        console.log(`\n--- playerPosition ${playerPosition.x} ${playerPosition.y}`)
        // Convert 1D indices back to coordinates
        restrictedSquares = data.data.squares.map((index: number) => {
          const x = (index % GRID_SIZE) + playerPosition.x;
          const y = Math.floor(index / GRID_SIZE) + playerPosition.y;
          return [x, y] as [number, number];
        });
      }
    } else {
      console.error('Failed to fetch restricted squares:', await response.text());
    }
  } catch (error) {
    console.error('Error fetching restricted squares:', error);
  }
}

// Check if a point is restricted based on restricted squares from the server
function isRestricted(x: number, y: number): boolean {
  // Can't place on player's position
  if (x === -playerPosition.x + VIEW_RADIUS && y === -playerPosition.y + VIEW_RADIUS) {
    return true;
  }
  
  // Check if it's in the restricted squares from the server
  return restrictedSquares.some(([sx, sy]) => sx === x && sy === y);
}

if (!USER_ID || !AUTH_TOKEN) {
  console.error('Error: TEST_USER_ID and TEST_AUTH_TOKEN must be set in .env');
  process.exit(1);
}

async function placeBasePoint(x: number, y: number): Promise<boolean> {
  debugLog({ x, y });

  // Check if the point is restricted
  if (isRestricted(x, y)) {
    return false;
  }

  // Check if there's already a base point here
  if (placedBasePoints.some(p => p.x === x && p.y === y)) {
    return false;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/base-points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({ x, y }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error(`Failed to place base point at (${x}, ${y}):`, response.status, error);
      return false;
    }

    const data = await response.json();
    //console.log(`✅ Placed base point at (${x}, ${y}) with ID:`, data.data.basePoint.id);
    console.log(`✅ `);
    
    // Track the placed base point
    placedBasePoints.push({ x, y });
    return true;
  } catch (error) {
    console.error(`Error placing base point at (${x}, ${y}):`, error);
    return false;
  }
}

async function simulatePlayer() {
  console.log(`🎮 Simulating player ${USER_ID} placing ${NUM_POINTS} base points...`);
  
  // Initial fetch of restricted squares
  await fetchRestrictedSquares();
  
  let successCount = 0;
  let attempts = 0;
  let newAttempts = 0;
  const MAX_ATTEMPTS = NUM_POINTS * 100; // Prevent infinite loops
  
  // Loop
  while (successCount < NUM_POINTS && attempts < MAX_ATTEMPTS && newAttempts < MAX_NEW_ATTEMPTS) {
    attempts++;
    newAttempts++;


    // Round down to nearest 10s place
    const roundedAttempts = Math.floor(newAttempts / 10) * 10;
    console.log(`--- New attempts: ${String(roundedAttempts).padStart(4, ' ')}+`);
    
    // Generate random coordinates within the viewable area
    const x = playerPosition.x + randomInt(-VIEW_RADIUS, VIEW_RADIUS) + VIEW_RADIUS;
    const y = playerPosition.y + randomInt(-VIEW_RADIUS, VIEW_RADIUS) + VIEW_RADIUS;
    
    // Ensure coordinates are within world bounds
    if (x < -MAX_COORDINATE || x > MAX_COORDINATE || y < -MAX_COORDINATE || y > MAX_COORDINATE) {
      continue;
    }
    
    const success = await placeBasePoint(x, y);
    if (success) {
      successCount++;
      newAttempts = 0;
    }
    
    // Always move after each attempt, regardless of success
    await moveToNewPosition();
  }
  
  if (successCount < NUM_POINTS) {
    console.log(`\n⚠️  Simulation complete with partial success. Placed ${successCount}/${NUM_POINTS} base points after ${attempts} attempts.`);
  } else {
    console.log(`\n🎉 Simulation complete! Successfully placed ${successCount}/${NUM_POINTS} base points.`);
  }
}

// Movement types and state
type MoveDirection = 'right' | 'left' | 'up' | 'down';
const initialDirection: MoveDirection = argv.direction as MoveDirection;
let moveDirection: MoveDirection = initialDirection;
let moveCount = 0;

// Move player one step in the current direction
async function moveToNewPosition(): Promise<void> {
  let dx = 0;
  let dy = 0;
  
  // Define possible movement directions for each direction
  const directionOptions = {
    right: [
      { dx: 1, dy: 0 },   // right
      { dx: 0, dy: -1 },  // up
      //{ dx: 0, dy: 1 }    // down
    ],
    left: [
      { dx: -1, dy: 0 },  // left
      //{ dx: 0, dy: -1 },  // up
      { dx: 0, dy: 1 }    // down
    ],
    up: [
      { dx: 0, dy: -1 },  // up
      { dx: -1, dy: 0 },  // left
      //{ dx: 1, dy: 0 }    // right
    ],
    down: [
      { dx: 0, dy: 1 },   // down
      //{ dx: -1, dy: 0 },  // left
      { dx: 1, dy: 0 }    // right
    ]
  };

  // Change direction every 200 moves
  if (moveCount % 200 === 0 && moveCount > 0) {
    // Get all possible directions except the current one
    const allDirections: MoveDirection[] = ['right', 'left', 'up', 'down'];
    const otherDirections = allDirections.filter(d => d !== moveDirection);
    moveDirection = otherDirections[Math.floor(Math.random() * otherDirections.length)];
    console.log(`Changed direction to: ${moveDirection} after ${moveCount} moves`);
  }
  
  // Get the possible directions for the current movement direction
  const possibleDirections = directionOptions[moveDirection];
  
  // Randomly select one of the possible directions
  const randomDir = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
  moveCount++;
  dx = randomDir.dx;
  dy = randomDir.dy;
  
  // Calculate new position (reverse the movement direction)
  const newX = Math.max(-MAX_COORDINATE, Math.min(MAX_COORDINATE, -playerPosition.x - dx));
  const newY = Math.max(-MAX_COORDINATE, Math.min(MAX_COORDINATE, -playerPosition.y - dy));
  
  // Show move information in debug mode or if we actually moved
  totalMoves++; // Increment total move counter
  if (argv.debug) {
    const line = '='.repeat(40);
    console.log(`\n${line}`);
    console.log(` MOVE ${totalMoves}: ${moveDirection.toUpperCase()}`);
    console.log(` Total moves: ${totalMoves}`);
    console.log(line);
  } else if (newX !== -playerPosition.x || newY !== -playerPosition.y) {
    // Only log non-debug movement if we actually moved
    console.log(`🌍 [${totalMoves}] Moving ${moveDirection} to (${newX}, ${newY})`);
  }
  
  // Skip if we hit the world boundary and not in debug mode
  if (newX === -playerPosition.x && newY === -playerPosition.y) {
    if (!argv.debug) return;
    // In debug mode, continue to show the grid even if we didn't move
  }
  
  // Update position
  playerPosition = { x: -newX, y: -newY };
  
  // Add delay if specified
  if (MOVE_DELAY > 0) {
    await new Promise(resolve => setTimeout(resolve, MOVE_DELAY));
  }
  
  // Determine the direction for restricted squares (opposite of movement direction since the world moves in the opposite direction)
  let borderDirection: 'up' | 'down' | 'left' | 'right' = 'up';
  if (dx > 0) borderDirection = 'left';     // Player moves right → world moves left → get left border
  else if (dx < 0) borderDirection = 'right'; // Player moves left → world moves right → get right border
  if (dy > 0) borderDirection = 'up';       // Player moves down → world moves up → get top border
  else if (dy < 0) borderDirection = 'down'; // Player moves up → world moves down → get bottom border
  
  // Fetch restricted squares for the new position
  await fetchRestrictedSquares(borderDirection);
}

// Delete all base points for the test user
async function deleteAllBasePoints(): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/api/base-points`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
    });

    if (response.ok) {
      console.log('✅ Successfully deleted all base points');
    } else {
      console.error('Failed to delete base points:', await response.text());
    }
  } catch (error) {
    console.error('Error deleting base points:', error);
  }
}

// Main execution
async function main() {
  if (argv.delete) {
    console.log('🗑️  Deleting all base points...');
    await deleteAllBasePoints();
    return;
  }

  // Set initial position from arguments
  playerPosition = { x: argv.startX, y: argv.startY };
  
  console.log('🚀 Starting test user simulation with:');
  console.log(`- Grid size: ${GRID_SIZE}x${GRID_SIZE}`);
  console.log(`- Starting position: [${argv.startX}, ${argv.startY}]`);
  console.log(`- Target points: ${NUM_POINTS}`);
  console.log(`- Initial direction: ${moveDirection}`);
  console.log(`- Move delay: ${MOVE_DELAY}ms`);
  
  try {
    await simulatePlayer();
    console.log('✅ Simulation completed successfully');
  } catch (error) {
    console.error('❌ Simulation failed:', error);
    process.exit(1);
  }
}

// Start the simulation
main();
