import { createHandler, StartServer } from "@solidjs/start/server";
import { runDatabaseMigrations } from './lib/server/migrate';
import { getDb } from './lib/server/db';

// Run migrations before starting the server
const startServer = async () => {
  try {
    await runDatabaseMigrations();
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Failed to run migrations:', error);
    process.exit(1);
  }
};

startServer();

/*
// Schedule line cleanup every 30 seconds
setInterval(async () => {
  try {
    const db = await getDb();
    await db.run(`
      DELETE FROM base_points
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM base_points
        GROUP BY x, y
      )
      AND (
        x = y OR
        x IN (SELECT x FROM base_points GROUP BY x HAVING COUNT(*) > 1) OR
        y IN (SELECT y FROM base_points GROUP BY y HAVING COUNT(*) > 1)
      )
      AND NOT (x = 0 AND y = 0) -- Always keep [0,0] base point
    `);
    console.log('Scheduled line cleanup completed');
  } catch (error) {
    console.error('Error in scheduled line cleanup:', error);
  }
}, 30000);
*/

export default createHandler(() => (
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
));
