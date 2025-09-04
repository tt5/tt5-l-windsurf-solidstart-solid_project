import { renderStream } from 'solid-js/web';
import { StartServer } from '@solidjs/start/server';
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

export default async function handleRequest(request, response, next) {
  try {
    await initServer();
    
    const stream = renderStream(() => (
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
    
    response.setHeader('Content-Type', 'text/html');
    response.status(200);
    
    for await (const chunk of stream) {
      response.write(chunk);
    }
    
    response.end();
  } catch (error) {
    console.error('Error handling request:', error);
    response.status(500).send('Internal Server Error');
  }
}
