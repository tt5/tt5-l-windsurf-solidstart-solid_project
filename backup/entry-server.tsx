import { createHandler, StartServer } from "@solidjs/start/server";
import { initializeServer } from './lib/server/init';

// Initialize the server
let isServerInitialized = false;

const initServer = async () => {
  if (isServerInitialized) return;
  
  console.log('Initializing server...');
  try {
    await initializeServer();
    isServerInitialized = true;
    console.log('Server initialization complete');
  } catch (error) {
    console.error('Failed to initialize server:', error);
    throw error;
  }
};

// Create the handler
const appHandler = createHandler(() => (
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

// Export the handler with initialization
export default async () => {
  await initServer();
  return appHandler;
};
