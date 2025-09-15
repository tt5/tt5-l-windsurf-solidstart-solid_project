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

// Track player position
let playerPosition = { x: 0, y: 0 };

// Track placed base points
const placedBasePoints: Array<{x: number, y: number}> = [];

// Calculate if a point is in the viewable area
function isInView(x: number, y: number): boolean {
  return (
    x >= playerPosition.x - VIEW_RADIUS && 
    x <= playerPosition.x + VIEW_RADIUS &&
    y >= playerPosition.y - VIEW_RADIUS &&
    y <= playerPosition.y + VIEW_RADIUS
  );
}

// Calculate restricted squares based on game rules
function isRestricted(x: number, y: number): boolean {
  // Player can't place on their own position
  if (x === playerPosition.x && y === playerPosition.y) {
    return true;
  }

  // Check if it's in a straight line from the player (horizontal, vertical, diagonal)
  const dx = Math.abs(x - playerPosition.x);
  const dy = Math.abs(y - playerPosition.y);
  
  // Horizontal, vertical, or diagonal lines
  if (dx === 0 || dy === 0 || dx === dy) {
    return true;
  }

  // Prime-numbered slopes (2:1, 1:2, etc.)
  if (dx === 2 * dy || 2 * dx === dy) {
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
      
      // After placing a point, there's a 30% chance to move to a new position
      if (Math.random() < 0.3) {
        await moveToNewPosition();
      }
    }
  }
  
  if (successCount < NUM_POINTS) {
    console.log(`\n⚠️  Simulation complete with partial success. Placed ${successCount}/${NUM_POINTS} base points after ${attempts} attempts.`);
    console.log('This might be due to restricted areas or rate limiting.');
  } else {
    console.log(`\n🎉 Simulation complete! Successfully placed ${successCount}/${NUM_POINTS} base points.`);
  }
}

// Move player to a new random position within world bounds
async function moveToNewPosition(): Promise<void> {
  const moveX = randomInt(-5, 6); // Move up to 5 units in any direction
  const moveY = randomInt(-5, 6);
  
  const newX = Math.max(-MAX_COORDINATE, Math.min(MAX_COORDINATE, playerPosition.x + moveX));
  const newY = Math.max(-MAX_COORDINATE, Math.min(MAX_COORDINATE, playerPosition.y + moveY));
  
  console.log(`🚶 Player moving from (${playerPosition.x}, ${playerPosition.y}) to (${newX}, ${newY})`);
  playerPosition = { x: newX, y: newY };
  
  // Small delay after moving
  await new Promise(resolve => setTimeout(resolve, 300));
}

// Run the simulation
simulatePlayer().catch(console.error);
