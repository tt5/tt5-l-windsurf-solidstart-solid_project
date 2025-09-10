import { createHandler, StartServer } from "@solidjs/start/server";
import { runDatabaseMigrations } from '~/lib/server/migrate';
import { getDb } from '~/lib/server/db';
import { MetaProvider } from '@solidjs/meta';

// Run migrations before starting the server
const initServer = async () => {
  try {
    await runDatabaseMigrations();
    console.log('Migrations completed successfully');
    
    // Schedule line cleanup every 30 seconds
    setInterval(async () => {
      try {
        const db = await getDb();
        await db.run(`
      SELECT p1.id, p1.x, p1.y
      FROM base_points p1
      WHERE EXISTS (
        SELECT 1 FROM base_points p2
        WHERE p2.id != p1.id
        AND (
          -- Same x (vertical line)
          p2.x = p1.x
          -- OR same y (horizontal line)
          OR p2.y = p1.y
          -- OR same diagonal (x-y)
          OR (p2.x - p2.y) = (p1.x - p1.y)
          -- OR same anti-diagonal (x+y)
          OR (p2.x + p2.y) = (p1.x + p1.y)
        )
        -- Keep the oldest point (lowest id)
        AND p2.id < p1.id
      )
      -- Always keep [0,0]
      AND NOT (p1.x = 0 AND p1.y = 0);
        `);
        console.log('Scheduled cleanup of duplicate base points completed');
      } catch (error) {
        console.error('Error cleaning up duplicate base points:', error);
      }
    }, 10000);
    
  } catch (error) {
    console.error('Failed to run migrations:', error);
    process.exit(1);
  }
};

// Initialize the server
initServer();

// Root component that wraps the application
export default createHandler(({ request, manifest }) => {
  return (
    <StartServer
      document={({ assets, children, scripts }) => (
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="/favicon.ico" />
            {assets}
          </head>
          <body>
            <div id="app">{children}</div>
            {scripts}
          </body>
        </html>
      )}
    />
  );
});
