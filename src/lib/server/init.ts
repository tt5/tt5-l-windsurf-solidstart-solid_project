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
      const startTime = Date.now();
      try {
        const db = await getDb();
        const slopes = getRandomSlopes(2);
        const cleanupStartTime = performance.now();
        
        // Get unique base slopes as whole numbers
        const uniqueBaseSlopes = [...new Set(slopes
          .filter(s => Math.abs(s) >= 1)  // Only take values >= 1 to avoid reciprocals
          .map(s => Math.round(Math.abs(s)))  // Round to nearest integer
        )];
        console.log(`[Cleanup] Starting cleanup with slopes: ${uniqueBaseSlopes.join(', ')}`);
        const { points: pointsToDelete, duration } = await getPointsInLines(db, slopes);
        
        if (pointsToDelete.length > 0) {
          console.log(`[Cleanup] Removing ${pointsToDelete.length} points...`);
          await deletePoints(db, pointsToDelete);
          const totalTime = performance.now() - cleanupStartTime;
          if (totalTime > 5000) {
            console.warn(`[Cleanup] WARNING: Cleanup took ${(totalTime/1000).toFixed(2)}s (over 5s threshold)`);
          }
          console.log(`[Cleanup] Removed ${pointsToDelete.length} points in ${duration.toFixed(2)}ms (total: ${totalTime.toFixed(2)}ms)`);
        } else {
          const totalTime = performance.now() - cleanupStartTime;
          if (totalTime > 5000) {
            console.warn(`[Cleanup] WARNING: Cleanup took ${(totalTime/1000).toFixed(2)}s (over 5s threshold)`);
          }
          console.log(`[Cleanup] No points to remove (took ${totalTime.toFixed(2)}ms)`);
        }
      } catch (error) {
        console.error('[Cleanup] Error:', error);
      }
    }, 10000);
  }
}

export const serverInitializer = ServerInitializer.getInstance();
