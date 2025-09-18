import { randomInt } from 'crypto';

type MoveDirection = 'right' | 'left' | 'up' | 'down';

export class SimulationService {
  private static instance: SimulationService;
  private moveDirection: MoveDirection;
  private moveCount = 0;
  private totalMoves = 0;
  private isRunning = false;
  private simulationInterval: NodeJS.Timeout | null = null;
  
  // Game constants
  private readonly GRID_SIZE = 15;
  private readonly VIEW_RADIUS = Math.floor(this.GRID_SIZE / 2);
  private readonly MAX_COORDINATE = 1000; // Match the server-side limit
  
  // Player state
  private playerPosition = { x: 0, y: 0 };
  
  // Track placed base points
  private placedBasePoints: Array<{x: number, y: number}> = [{x: 0, y: 0}];
  
  // Track restricted squares from server
  private restrictedSquares: Array<[number, number]> = [];
  
  private constructor() {
    // Initialize with random direction
    const directions: MoveDirection[] = ['right', 'left', 'up', 'down'];
    this.moveDirection = directions[Math.floor(Math.random() * directions.length)];
  }

  public static getInstance(): SimulationService {
    if (!SimulationService.instance) {
      SimulationService.instance = new SimulationService();
    }
    return SimulationService.instance;
  }

  public async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    const moveDelay = parseInt(process.env.SIMULATION_MOVE_DELAY || '1000', 10);
    const numPoints = parseInt(process.env.SIMULATION_NUM_POINTS || '800', 10);
    
    // Set initial position from environment if provided, otherwise use random position
    if (process.env.SIMULATION_START_X && process.env.SIMULATION_START_Y) {
      this.playerPosition = {
        x: parseInt(process.env.SIMULATION_START_X, 10),
        y: parseInt(process.env.SIMULATION_START_Y, 10)
      };
    } else {
      // Generate random starting position within valid bounds
      this.playerPosition = {
        x: randomInt(-this.MAX_COORDINATE, this.MAX_COORDINATE + 1),
        y: randomInt(-this.MAX_COORDINATE, this.MAX_COORDINATE + 1)
      };
      console.log(`Using random starting position: [${this.playerPosition.x}, ${this.playerPosition.y}]`);
    }
    
    console.log('🚀 Starting simulation service with:');
    console.log(`- Starting position: [${this.playerPosition.x}, ${this.playerPosition.y}]`);
    console.log(`- Target points: ${numPoints}`);
    console.log(`- Move delay: ${moveDelay}ms`);
    
    // Initial fetch of restricted squares
    await this.fetchRestrictedSquares();
    
    // Start the simulation loop
    this.simulationInterval = setInterval(async () => {
      try {
        await this.simulationStep();
      } catch (error) {
        console.error('Error in simulation step:', error);
      }
    }, moveDelay);
  }

  public stop() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isRunning = false;
  }

  public isSimulationRunning(): boolean {
    return this.isRunning;
  }

  private async simulationStep() {
    // Generate random coordinates within the viewable area
    const x = this.playerPosition.x + randomInt(-this.VIEW_RADIUS, this.VIEW_RADIUS) + this.VIEW_RADIUS;
    const y = this.playerPosition.y + randomInt(-this.VIEW_RADIUS, this.VIEW_RADIUS) + this.VIEW_RADIUS;
    
    // Ensure coordinates are within world bounds
    if (x < -this.MAX_COORDINATE || x > this.MAX_COORDINATE || 
        y < -this.MAX_COORDINATE || y > this.MAX_COORDINATE) {
      await this.moveToNewPosition();
      return;
    }
    
    // Try to place a base point
    await this.placeBasePoint(x, y);
    
    // Always move after each attempt
    await this.moveToNewPosition();
  }

  private async fetchRestrictedSquares(direction: 'up' | 'down' | 'left' | 'right' = 'up'): Promise<void> {
    try {
      const viewportSize = this.GRID_SIZE;
      const halfViewport = Math.floor(viewportSize / 2);
      
      // Calculate the viewport bounds in world coordinates
      const viewport = {
        left: -this.playerPosition.x - halfViewport,
        right: -this.playerPosition.x + halfViewport,
        top: -this.playerPosition.y - halfViewport,
        bottom: -this.playerPosition.y + halfViewport
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
      
      const response = await fetch(`${process.env.API_URL || 'http://localhost:3000'}/api/calculate-squares`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TEST_AUTH_TOKEN}`,
        },
        body: JSON.stringify({
          borderIndices: viewportSquares,
          currentPosition: [-this.playerPosition.x, -this.playerPosition.y],
          direction: direction
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.squares) {
          // Convert 1D indices back to coordinates
          this.restrictedSquares = data.data.squares.map((index: number) => {
            const x = (index % this.GRID_SIZE) + this.playerPosition.x;
            const y = Math.floor(index / this.GRID_SIZE) + this.playerPosition.y;
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

  private isRestricted(x: number, y: number): boolean {
    // Can't place on player's position
    if (x === -this.playerPosition.x + this.VIEW_RADIUS && y === -this.playerPosition.y + this.VIEW_RADIUS) {
      return true;
    }
    
    // Check if it's in the restricted squares from the server
    return this.restrictedSquares.some(([sx, sy]) => sx === x && sy === y);
  }

  private async placeBasePoint(x: number, y: number): Promise<boolean> {
    // Special handling for (0,0) - we want to ensure our user has this point
    const isOrigin = x === 0 && y === 0;
    
    // For non-origin points, check local tracking
    if (!isOrigin && this.placedBasePoints.some(p => p.x === x && p.y === y)) {
      return false;
    }

    // Check if the point is restricted
    if (this.isRestricted(x, y)) {
      return false;
    }

    try {
      const response = await fetch(`${process.env.API_URL || 'http://localhost:3000'}/api/base-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TEST_AUTH_TOKEN}`,
        },
        body: JSON.stringify({ x, y }),
      });

      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        console.error(`❌ Failed to place base point at (${x}, ${y}):`, {
          status: response.status,
          statusText: response.statusText,
          error: responseData
        });
        return false;
      }
      
      console.log(`✅ Successfully placed base point at (${x}, ${y})`);
      
      // Track the placed base point
      this.placedBasePoints.push({ x, y });
      return true;
    } catch (error) {
      console.error(`Error placing base point at (${x}, ${y}):`, error);
      return false;
    }
  }

  private async moveToNewPosition(): Promise<void> {
    let dx = 0;
    let dy = 0;
    
    // Define possible movement directions for each direction
    const directionOptions = {
      right: [
        { dx: 1, dy: 0 },   // right
        { dx: 0, dy: -1 },  // up
      ],
      left: [
        { dx: -1, dy: 0 },  // left
        { dx: 0, dy: 1 }    // down
      ],
      up: [
        { dx: 0, dy: -1 },  // up
        { dx: -1, dy: 0 },  // left
      ],
      down: [
        { dx: 0, dy: 1 },   // down
        { dx: 1, dy: 0 }    // right
      ]
    };

    // Change direction every 200 moves
    if (this.moveCount % 200 === 0 && this.moveCount > 0) {
      // Get all possible directions except the current one
      const allDirections: MoveDirection[] = ['right', 'left', 'up', 'down'];
      const otherDirections = allDirections.filter(d => d !== this.moveDirection);
      this.moveDirection = otherDirections[Math.floor(Math.random() * otherDirections.length)];
      console.log(`Changed direction to: ${this.moveDirection} after ${this.moveCount} moves`);
    }
    
    // Get the possible directions for the current movement direction
    const possibleDirections = directionOptions[this.moveDirection];
    
    // Randomly select one of the possible directions
    const randomDir = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
    this.moveCount++;
    dx = randomDir.dx;
    dy = randomDir.dy;
    
    // Calculate new position (reverse the movement direction)
    const newX = Math.max(-this.MAX_COORDINATE, Math.min(this.MAX_COORDINATE, -this.playerPosition.x - dx));
    const newY = Math.max(-this.MAX_COORDINATE, Math.min(this.MAX_COORDINATE, -this.playerPosition.y - dy));
    
    this.totalMoves++;

    // Update position
    this.playerPosition = { x: -newX, y: -newY };
    
    // Determine the direction for restricted squares (opposite of movement direction since the world moves in the opposite direction)
    let borderDirection: 'up' | 'down' | 'left' | 'right' = 'up';
    if (dx > 0) borderDirection = 'left';     // Player moves right → world moves left → get left border
    else if (dx < 0) borderDirection = 'right'; // Player moves left → world moves right → get right border
    if (dy > 0) borderDirection = 'up';       // Player moves down → world moves up → get top border
    else if (dy < 0) borderDirection = 'down'; // Player moves up → world moves down → get bottom border
    
    // Fetch restricted squares for the new position
    await this.fetchRestrictedSquares(borderDirection);
  }
}

export const simulationService = SimulationService.getInstance();
