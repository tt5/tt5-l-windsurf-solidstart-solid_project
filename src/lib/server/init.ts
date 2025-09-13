import { getDb } from './db';
import { getRandomSlopes } from '~/utils/randomSlopes';
import { getPointsInLines, deletePoints } from '~/utils/sqlQueries';
import { tileInvalidationService } from './services/tile-invalidation.service';

class ServerInitializer {
  private static instance: ServerInitializer;
  private isInitialized = false;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): ServerInitializer {
    if (!ServerInitializer.instance) {
      ServerInitializer.instance = new ServerInitializer();
    }
    return ServerInitializer.instance;
  }

  public async initialize() {
    if (this.isInitialized) {
      console.log('Server already initialized, skipping...');
      return;
    }

    this.isInitialized = true;
    console.log('Initializing server...');

    try {
      const { runDatabaseMigrations } = await import('./migrate');
      await runDatabaseMigrations();
      
      // Initialize tile invalidation service
      tileInvalidationService.initialize();
      console.log('Migrations completed successfully');

      this.setupCleanupInterval();
      console.log('Server initialization complete');
    } catch (error) {
      console.error('Failed to initialize server:', error);
      process.exit(1);
    }
  }

  private setupCleanupInterval() {
    // Clear any existing interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Schedule cleanup
    this.cleanupInterval = setInterval(async () => {
      try {
        console.log('Running cleanup...');
        const db = await getDb();
        const slopes = getRandomSlopes(2 + Math.floor(Math.random() * 3));
        console.log('Using slopes:', slopes);
        
        // Get all points before cleanup for comparison
        const allPoints = await db.all('SELECT id, x, y FROM base_points');
        console.log('Points before cleanup:', allPoints);
        
        const pointsToDelete = await getPointsInLines(db, slopes);
        console.log('Points to delete:', pointsToDelete);
        
        if (pointsToDelete.length > 0) {
          console.log('Executing delete for points:', pointsToDelete.map(p => `(${p.x},${p.y})`).join(', '));
          await deletePoints(db, pointsToDelete);
          console.log(`[Cleanup] Removed ${pointsToDelete.length} points in lines`);
          
          // Get points after cleanup
          const remainingPoints = await db.all('SELECT id, x, y FROM base_points');
          console.log('Points after cleanup:', remainingPoints);
        } else {
          console.log('No duplicate base points found to clean up');
        }
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }, 10000);
  }
}

export const serverInitializer = ServerInitializer.getInstance();
