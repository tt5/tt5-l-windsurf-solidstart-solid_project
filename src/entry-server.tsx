import { createHandler, StartServer } from "@solidjs/start/server";
import { runDatabaseMigrations } from './lib/server/migrate';

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
