import { randomInt } from 'crypto';
import { getBasePointRepository, getDb } from '../db';
import { basePointEventService } from '../events/base-point-events';
import { calculateRestrictedSquares } from '../../../utils/boardUtils';
import { createPoint, Point } from '~/types/board';

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
  private restrictedSquares: Point[] = [];
  
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
    
    // Reset base points before starting simulation
    console.log('🔄 Preparing simulation environment...');
    await this.resetBasePoints();
    
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

  private async resetBasePoints(): Promise<void> {
    const db = await getDb();
    try {
      // Ensure simulation user exists
      const existingUser = await db.get(
        'SELECT id FROM users WHERE id = ?', 
        ['simulation']
      );

      if (!existingUser) {
        console.log('Creating simulation user...');
        // Create a simulation user with a hashed password (this is just a placeholder)
        // In a real app, you'd want to use a proper password hashing library
        const hashedPassword = 'simulation_hashed_password';
        await db.run(
          'INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)',
          ['simulation', 'simulation', hashedPassword]
        );
        console.log('✅ Created simulation user');
      }
      console.log('🧹 Resetting base points for simulation...');
      
      // Get the repository
      const repository = await getBasePointRepository();
      
      // Get all base points for the simulation user and delete them one by one
      const simulationPoints = await repository.getByUser('simulation');
      for (const point of simulationPoints) {
        await repository.deleteBasePoint(point.id);
      }
      
      console.log(`✅ Successfully deleted ${simulationPoints.length} base points from database`);
      
      // Clear local tracking
      this.placedBasePoints = [];
      
      // Add (0,0) point for this simulation
      console.log('Adding (0,0) base point for simulation...');
      await repository.add('simulation', 0, 0);
      
      // Update local tracking
      this.placedBasePoints = [{ x: 0, y: 0 }];
      console.log('✅ Successfully added (0,0) base point for simulation');
      
    } catch (error) {
      console.error('Error resetting base points:', error);
      throw error;
    }
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
      
      // Calculate restricted squares for the current player position
      const currentPosition = createPoint(-this.playerPosition.x, -this.playerPosition.y);
      const newRestrictedSquares: Point[] = [];
      
      // For each square in the viewport, check if it would be restricted if placed
      for (let y = viewport.top; y <= viewport.bottom; y++) {
        for (let x = viewport.left; x <= viewport.right; x++) {
          const point = createPoint(x, y);
          const restrictedIndices = calculateRestrictedSquares(
            point,
            [],
            currentPosition
          );
          
          // If this position would restrict any squares, add it to our list
          if (restrictedIndices.length > 0) {
            newRestrictedSquares.push(point);
          }
        }
      }
      
      this.restrictedSquares = newRestrictedSquares;
    } catch (error) {
      console.error('Error in fetchRestrictedSquares:', error);
      this.restrictedSquares = [];
    }
  }
  
  private isRestricted(x: number, y: number): boolean {
    // Can't place on player's position
    if (x === -this.playerPosition.x + this.VIEW_RADIUS && y === -this.playerPosition.y + this.VIEW_RADIUS) {
      return true;
    }
    
    // Check against restricted squares
    return this.restrictedSquares.some(point => point[0] === x && point[1] === y);
  }

  private async placeBasePoint(x: number, y: number): Promise<boolean> {
    try {
      // Check if we already have a point at this location
      const existingPoint = this.placedBasePoints.find(p => p.x === x && p.y === y);
      if (existingPoint) {
        console.log(`Point already exists at [${x}, ${y}], skipping...`);
        return false;
      }

      // Check if the point is restricted
      if (this.isRestricted(x, y)) {
        console.log(`Point at [${x}, ${y}] is restricted, skipping...`);
        return false;
      }

      // Get the repository and add the point directly
      const repository = await getBasePointRepository();
      await repository.add('simulation', x, y);
      
      // Update local tracking
      this.placedBasePoints.push({ x, y });
      
      // Emit event for any listeners
      basePointEventService.emitCreated({ 
        x, 
        y, 
        userId: 'simulation', 
        id: Date.now(),
        createdAtMs: Date.now()
      });
      
      console.log(`✅ Placed base point at [${x}, ${y}] (Total: ${this.placedBasePoints.length})`);
      return true;
    } catch (error) {
      console.error(`Failed to place base point at (${x}, ${y}):`, error);
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
