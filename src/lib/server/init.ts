import { getDb } from './db';
import { getRandomSlopes } from '~/utils/randomSlopes';
import { getPointsInLines, deletePoints } from '~/utils/sqlQueries';

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
        const pointsToDelete = await getPointsInLines(db, slopes);
        
        if (pointsToDelete.length > 0) {
          await deletePoints(db, pointsToDelete);
          console.log(`[Cleanup] Removed ${pointsToDelete.length} points in lines`);
        } else {
          console.log('No duplicate base points found to clean up');
        }
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }, 30000); // 30 seconds
  }
}

export const serverInitializer = ServerInitializer.getInstance();
