import { getDb, getBasePointRepository } from './db';
import { getRandomSlopes } from '~/utils/randomSlopes';
import { getPointsInLines } from '~/utils/sqlQueries';
import { tileInvalidationService } from './services/tile-invalidation.service';
import { simulationService } from './services/simulation.service';

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
      // In production, we run migrations during build, so we skip them here
      if (process.env.NODE_ENV !== 'production') {
        const { runDatabaseMigrations } = await import('./migrate');
        await runDatabaseMigrations();
        console.log('Development migrations completed successfully');
      } else {
        console.log('Skipping migrations in production (already handled during build)');
      }
      
      // Initialize tile invalidation service
      tileInvalidationService.initialize();

      // Start simulation service if enabled
      if (process.env.ENABLE_SIMULATION === 'true') {
        try {
          await simulationService.start();
          console.log('Simulation service started');
        } catch (error) {
          console.error('Failed to start simulation service:', error);
        }
      }

      this.setupCleanupInterval();
      console.log('Server initialization complete');
    } catch (error) {
      console.error('Failed to initialize server:', error);
      process.exit(1);
    }
  }

  public async cleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Stop the simulation service if it's running
    if (process.env.ENABLE_SIMULATION === 'true' && simulationService.isSimulationRunning()) {
      simulationService.stop();
      console.log('Simulation service stopped');
    }
    
    this.isInitialized = false;
  }

  private setupCleanupInterval() {
    // Clear any existing interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    console.log('[Cleanup] Setting up cleanup interval (every 10s)');

    // Schedule cleanup
    this.cleanupInterval = setInterval(async () => {
      console.log('[Cleanup] Cleanup interval triggered');
      const startTime = performance.now();
      try {
        const db = await getDb();
        const repository = await getBasePointRepository();
        const slopes = getRandomSlopes(16);
        const cleanupStartTime = performance.now();
        
        // Get initial count before any deletions (excluding origin)
        const initialCount = await repository.getCountExcludingOrigin();
        const totalIncludingOrigin = await repository.getTotalCount();
        console.log(`[Cleanup] Initial count: ${initialCount} (excluding origin), ${totalIncludingOrigin} (total)`);
        
        // Get unique base slopes as whole numbers
        const uniqueBaseSlopes = [...new Set(slopes
          .filter(s => Math.abs(s) >= 1)  // Only take values >= 1 to avoid reciprocals
          .map(s => Math.round(Math.abs(s)))  // Round to nearest integer
        )];
        // Sort slopes in ascending order for consistent logging
        const sortedSlopes = [...uniqueBaseSlopes].sort((a, b) => a - b);
        console.log(`
          [Cleanup] Starting cleanup with slopes: ${sortedSlopes.join(', ')}
        `);
        const { points: pointsToDelete, duration } = await getPointsInLines(db, slopes);

        if (pointsToDelete.length > 0) {
          console.log(`[Cleanup] Removing ${pointsToDelete.length} points in batches...`);
          const BATCH_SIZE = 10; // Adjust based on your needs
          const repository = await getBasePointRepository();
          let deletedCount = 0;
          const deleteStartTime = performance.now();
          
          for (let i = 0; i < pointsToDelete.length; i += BATCH_SIZE) {
            const batch = pointsToDelete.slice(i, i + BATCH_SIZE);
            try {
              if (batch.length > 1) {
                await repository.deletePoints(batch);
              } else if (batch.length === 1) {
                await repository.deleteBasePoint(batch[0].id);
              }
              deletedCount += batch.length;
              
              // Log progress every 5 batches
              if (i % (BATCH_SIZE * 5) === 0) {
                console.log(`[Cleanup] Progress: ${deletedCount}/${pointsToDelete.length} points...`);
              }
              
              // Small delay to allow other operations
              if (i + BATCH_SIZE < pointsToDelete.length) {
                await new Promise(resolve => setTimeout(resolve, 10));
              }
            } catch (error) {
              console.error(`[Cleanup] Error in batch ${i/BATCH_SIZE + 1}:`, error);
              // Continue with next batch
            }
          }
          
          const deleteTime = performance.now() - deleteStartTime;
          const totalTime = performance.now() - cleanupStartTime;
          
          // Keep the warning for long cleanups
          if (totalTime > 5000) {
            console.warn(`[Cleanup] WARNING: Cleanup took ${(totalTime/1000).toFixed(2)}s (over 5s threshold)`);
          }
          
          console.log(`[Cleanup] Removed ${deletedCount} points in ${deleteTime.toFixed(2)}ms (total: ${totalTime.toFixed(2)}ms)`);
        }
        
        // Get final counts after cleanup
        const finalCount = await repository.getCountExcludingOrigin();
        const finalTotal = await repository.getTotalCount();
        console.log(`[Cleanup] Final count: ${finalCount} (excluding origin), ${finalTotal} (total)`);
        
        // Check if we've reached the reset threshold (800 non-origin points)
        const RESET_THRESHOLD = 800;
        if (finalCount >= RESET_THRESHOLD) {
          console.log(`[World Reset] Triggering world reset - ${finalCount} non-origin points reached the threshold of ${RESET_THRESHOLD}`);
          
          // Delete all base points except (0,0)
          await db.run('DELETE FROM base_points WHERE x != 0 OR y != 0');
          
          // Reset map tiles
          await db.run('DELETE FROM map_tiles');
          
          // Get the oldest prime timestamp
          const { getOldestPrimeTimestamp } = await import('~/utils/randomSlopes');
          const oldestPrimeTimestamp = getOldestPrimeTimestamp();
          
          // Broadcast world reset event
          const { basePointEventService } = await import('./events/base-point-events');
          const resetEvent = {
            type: 'worldReset',
            reason: 'base_point_threshold_reached',
            threshold: RESET_THRESHOLD,
            pointsBeforeReset: finalCount,
            timestamp: new Date().toISOString(),
            oldestPrimeTimestamp: oldestPrimeTimestamp
          };
          basePointEventService.broadcast('worldReset', resetEvent);
          
          console.log(`[World Reset] World has been reset. All non-origin base points and map tiles have been cleared.`);
        } else {
          // Regular cleanup event if no reset was needed
          const { getOldestPrimeTimestamp } = await import('~/utils/randomSlopes');
          const oldestPrimeTimestamp = getOldestPrimeTimestamp();
          
          // Broadcast cleanup event with counts and timestamp info
          const { basePointEventService } = await import('./events/base-point-events');
          const eventData = {
            type: 'cleanup',
            initialCount,
            totalBasePoints: finalCount,  // This excludes (0,0) points
            totalIncludingOrigin: finalTotal,  // Include total for reference
            timestamp: new Date().toISOString(),
            oldestPrimeTimestamp: oldestPrimeTimestamp
          };
          basePointEventService.broadcast('cleanup', eventData);

        }
      const endTime = performance.now();
      console.log(`[Cleanup] Cleanup completed in ${(endTime - startTime).toFixed(0)}ms`);
        
      } catch (error) {
        console.error('[Cleanup] Error:', error);
      }
    }, 100000);
  }
}

export const serverInitializer = ServerInitializer.getInstance();
