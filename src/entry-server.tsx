import { createHandler, StartServer } from "@solidjs/start/server";
import { initializeServer } from './lib/server/init';

// Initialize the database when the server starts
initializeServer().catch(err => {
  console.error('Failed to initialize server:', err);
  process.exit(1);
});

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
