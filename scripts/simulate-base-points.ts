import { randomInt } from 'crypto';
import { config } from 'dotenv';
import { join } from 'path';

// Game constants
const GRID_SIZE = 15; // Match the game's grid size
const VIEW_RADIUS = Math.floor(GRID_SIZE / 2); // How far the player can see

// Load environment variables from the project root
config({ path: join(__dirname, '../.env') });

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const MAX_COORDINATE = 1000; // Match the server-side limit
const NUM_POINTS = 10; // Number of base points to create
const USER_ID = process.env.TEST_USER_ID; // Set this in your .env file
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN; // Set this in your .env file

// Track player state
let playerPosition = { x: 0, y: 0 };

// Track placed base points
const placedBasePoints: Array<{x: number, y: number}> = [];

// Track restricted squares from server
let restrictedSquares: Array<[number, number]> = [];

// Fetch restricted squares from server
async function fetchRestrictedSquares(direction: 'up' | 'down' | 'left' | 'right' = 'up'): Promise<void> {
  try {
    // Calculate border indices that are newly visible in the direction of movement
    // For now, we'll let the server handle this calculation
    const response = await fetch(`${BASE_URL}/api/calculate-squares`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        borderIndices: [], // Let server calculate based on viewport
        currentPosition: [playerPosition.x, playerPosition.y],
        direction: direction
      })
    });

    if (response.ok) {
      const data = await response.json();
      // Convert 1D indices back to coordinates
      restrictedSquares = data.data.squares.map((index: number) => {
        const x = (index % GRID_SIZE) - Math.floor(GRID_SIZE / 2) + playerPosition.x;
        const y = Math.floor(index / GRID_SIZE) - Math.floor(GRID_SIZE / 2) + playerPosition.y;
        return [x, y] as [number, number];
      });
      console.log(`Fetched ${restrictedSquares.length} restricted squares`);
    } else {
      console.error('Failed to fetch restricted squares:', await response.text());
    }
  } catch (error) {
    console.error('Error fetching restricted squares:', error);
  }
}

// Calculate if a point is in the viewable area
function isInView(x: number, y: number): boolean {
  return (
    x >= playerPosition.x - VIEW_RADIUS && 
    x <= playerPosition.x + VIEW_RADIUS &&
    y >= playerPosition.y - VIEW_RADIUS &&
    y <= playerPosition.y + VIEW_RADIUS
  );
}

// Check if a point is restricted based on existing base points
function isRestricted(x: number, y: number): boolean {
  // Can't place on player's position
  if (x === playerPosition.x && y === playerPosition.y) {
    return true;
  }

  // Check against all existing base points
  for (const point of placedBasePoints) {
    const dx = Math.abs(x - point.x);
    const dy = Math.abs(y - point.y);
    
    // Skip if it's the same point
    if (dx === 0 && dy === 0) continue;
    
    // Check for straight lines and diagonals
    if (dx === 0 || dy === 0 || dx === dy) {
      return true;
    }
    
    // Check for 2:1 and 1:2 slopes
    if (dx === 2 * dy || 2 * dx === dy) {
      return true;
    }
  }
  
  // Check if it's in the restricted squares from the server
  if (restrictedSquares.some(([sx, sy]) => sx === x && sy === y)) {
    return true;
  }

  return false;
}

if (!USER_ID || !AUTH_TOKEN) {
  console.error('Error: TEST_USER_ID and TEST_AUTH_TOKEN must be set in .env');
  process.exit(1);
}

async function placeBasePoint(x: number, y: number): Promise<boolean> {
  // Check if the point is in the viewable area
  if (!isInView(x, y)) {
    console.log(`Skipping (${x}, ${y}) - outside viewable area`);
    return false;
  }

  // Check if the point is restricted
  if (isRestricted(x, y)) {
    console.log(`Skipping (${x}, ${y}) - in restricted area`);
    return false;
  }

  // Check if there's already a base point here
  if (placedBasePoints.some(p => p.x === x && p.y === y)) {
    console.log(`Skipping (${x}, ${y}) - base point already exists`);
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
    console.log(`✅ Placed base point at (${x}, ${y}) with ID:`, data.data.basePoint.id);
    
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
  const MAX_ATTEMPTS = NUM_POINTS * 10; // Prevent infinite loops
  
  while (successCount < NUM_POINTS && attempts < MAX_ATTEMPTS) {
    attempts++;
    
    // Generate random coordinates within the viewable area
    const x = playerPosition.x + randomInt(-VIEW_RADIUS, VIEW_RADIUS + 1);
    const y = playerPosition.y + randomInt(-VIEW_RADIUS, VIEW_RADIUS + 1);
    
    // Ensure coordinates are within world bounds
    if (x < -MAX_COORDINATE || x > MAX_COORDINATE || y < -MAX_COORDINATE || y > MAX_COORDINATE) {
      continue;
    }
    
    // Add a small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const success = await placeBasePoint(x, y);
    if (success) {
      successCount++;
    }
    
    // Always move after each attempt, regardless of success
    await moveToNewPosition();
  }
  
  if (successCount < NUM_POINTS) {
    console.log(`\n⚠️  Simulation complete with partial success. Placed ${successCount}/${NUM_POINTS} base points after ${attempts} attempts.`);
    console.log('This might be due to restricted areas or rate limiting.');
  } else {
    console.log(`\n🎉 Simulation complete! Successfully placed ${successCount}/${NUM_POINTS} base points.`);
  }
}

// Move player one unit in a random direction
async function moveToNewPosition(): Promise<void> {
  // Choose a random direction (up, down, left, right, or diagonals)
  const direction = randomInt(0, 8);
  let dx = 0;
  let dy = 0;
  
  // Convert direction to dx,dy
  switch(direction) {
    case 0: dx = 1; break;  // right
    case 1: dx = -1; break; // left
    case 2: dy = 1; break;  // down
    case 3: dy = -1; break; // up
    case 4: dx = 1; dy = 1; break;    // down-right
    case 5: dx = -1; dy = 1; break;   // down-left
    case 6: dx = 1; dy = -1; break;   // up-right
    case 7: dx = -1; dy = -1; break;  // up-left
  }
  
  // Calculate new position
  const newX = Math.max(-MAX_COORDINATE, Math.min(MAX_COORDINATE, playerPosition.x + dx));
  const newY = Math.max(-MAX_COORDINATE, Math.min(MAX_COORDINATE, playerPosition.y + dy));
  
  // Skip if we hit the world boundary
  if (newX === playerPosition.x && newY === playerPosition.y) {
    return;
  }
  
  // Update position
  playerPosition = { x: newX, y: newY };
  // Log position in world coordinates
  console.log(`🌍 Player position: [x: ${newX}, y: ${newY}]`);
  
  // Determine the direction for restricted squares (same as movement direction since the world moves in the opposite direction)
  let borderDirection: 'up' | 'down' | 'left' | 'right' = 'up';
  if (dx > 0) borderDirection = 'right';    // Moving right → get right border (world moves left)
  else if (dx < 0) borderDirection = 'left'; // Moving left → get left border (world moves right)
  if (dy > 0) borderDirection = 'down';     // Moving down → get bottom border (world moves up)
  else if (dy < 0) borderDirection = 'up';   // Moving up → get top border (world moves down)
  
  // Fetch restricted squares for the new position
  await fetchRestrictedSquares(borderDirection);
  
  // Small delay to simulate real player movement
  await new Promise(resolve => setTimeout(resolve, 100));
}

// Run the simulation
simulatePlayer().catch(console.error);
