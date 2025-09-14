import type { APIEvent } from '@solidjs/start/server';
import { withAuth } from '~/middleware/auth';
import { basePointEventService } from '~/lib/server/events/base-point-events';
import type { BasePoint } from '~/types/board';
import type { TokenPayload } from '~/lib/server/auth/jwt';

// Define the Client interface
interface Client {
  userId: string;
  ip?: string;
  connectedAt?: string;
  send: (data: string) => void;
}

// Extend the APIEvent type to include the user in the event
type SSEEvent = APIEvent & {
  user: TokenPayload;
  locals: {
    user?: TokenPayload;
    [key: string]: any;
  };
};

export const GET = withAuth(async (event: SSEEvent) => {
  const { request, clientAddress, locals } = event;
  // Log all available information for debugging
  console.log('[SSE] New connection', {
    ip: clientAddress,
    localsUser: locals?.user ? {
      userId: locals.user.userId,
      username: locals.user.username,
      role: locals.user.role
    } : 'none',
    headers: {
      accept: request.headers.get('accept'),
      authorization: request.headers.get('authorization')?.substring(0, 20) + '...' || 'none',
      cookie: request.headers.get('cookie') ? 'exists' : 'none'
    },
    // Log other potentially useful context
    url: request.url,
    method: request.method,
    // Log all locals for debugging
    allLocals: Object.keys(locals).filter(k => k !== 'user').reduce((acc, key) => {
      acc[key] = locals[key];
      return acc;
    }, {} as Record<string, any>)
  });
  
  if (!locals.user) {
    console.warn('[SSE] WARNING: No user in locals, connection will be anonymous');
  } else {
    console.log('[SSE] User authenticated:', {
      userId: locals.user.userId,
      username: locals.user.username,
      role: locals.user.role
    });
  }
  
  // Set up SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true'
  });
  
  // Log the incoming request
  console.log('[SSE] New connection request from:', clientAddress, {
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    method: request.method
  });

  // Create a transform stream for the response
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  
  // Get the user from the event (set by withAuth middleware)
  const currentUser = event.user || { userId: 'anonymous', username: 'anonymous' };
  
  // Create a client object for the event service
  const sseClient: Client = {
    userId: currentUser.userId,
    ip: clientAddress,
    send: (data: string) => {
      writer.write(encoder.encode(data)).catch(err => {
        console.error('[SSE] Error sending message to client:', err);
      });
    },
    connectedAt: new Date().toISOString()
  };
  
  // Register the client with the event service
  const { cleanup } = basePointEventService.registerClient(sseClient);
  console.log(`[SSE] Registered client ${currentUser.userId} (${clientAddress})`);
  
  // Send initial connection message
  const sendMessage = async (event: string, data: any) => {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    console.log(`[SSE] Sending ${event} event to client ${currentUser.userId}`);
    try {
      await writer.write(encoder.encode(message));
    } catch (err) {
      console.error(`[SSE] Error sending ${event}:`, err);
    }
  };

  // Log when the connection is established
  console.log('[SSE] Connection established, setting up ping interval');
  
  // Send a ping event to keep the connection alive
  let keepAlive: NodeJS.Timeout | null = setInterval(() => {
    const pingEvent = {
      type: 'ping',
      timestamp: Date.now()
    };
    const pingMessage = `event: ping\ndata: ${JSON.stringify(pingEvent)}\n\n`;
    console.log('[SSE] Sending ping event at', new Date().toISOString());
    writer.write(pingMessage)
      .then(() => console.log('[SSE] Ping sent successfully'))
      .catch(err => console.error('[SSE] Error sending ping:', err));
  }, 30000); // Send a ping every 30 seconds

  // Get the user from the event (set by withAuth middleware)
  const user = event.user || { userId: 'anonymous', username: 'anonymous' };
  
  console.log('[SSE] Creating client with user:', {
    userId: user.userId,
    username: user.username,
    ip: clientAddress,
    hasLocalsUser: !!locals?.user
  });
  
  const client = {
    send: (data: string) => {
      try {
        // Log a summary of the data being sent (avoid logging large data)
        let dataToLog = data.trim();
        if (dataToLog.length > 100) {
          dataToLog = dataToLog.substring(0, 100) + '...';
        }
        console.log(`[SSE] Sending to client ${locals.user?.userId || 'anonymous'}:`, dataToLog);
        
        // Write the data to the stream
        const result = writer.write(encoder.encode(data));
        console.log(`[SSE] Write result for ${locals.user?.userId || 'anonymous'}:`, {
          success: true,
          bytesWritten: data.length,
          ready: result
        });
      } catch (error) {
        console.error(`[SSE] Error writing to client ${locals.user?.userId || 'anonymous'}:`, error);
        cleanup();
      }
    },
    // User information
    userId: user.userId,
    username: user.username,
    ip: clientAddress,
    connectedAt: new Date().toISOString(),
    // Store the full user object
    user: {
      userId: user.userId,
      username: user.username,
      role: user.role
    }
  };

  // First, clean up any existing connections for this client
  const userInfo = locals.user 
    ? `user:${locals.user.userId} (${locals.user.username || 'no-username'})` 
    : 'anonymous';
    
  console.log(`[SSE] Registering client for ${userInfo} from ${client.ip}`);
  
  // Clean up any existing connections for this client
  console.log(`[SSE] Cleaning up any existing connections for user ${client.userId}`);
  const cleanupCount = basePointEventService.unregisterClient(client);
  if (cleanupCount > 0) {
    console.log(`[SSE] Cleaned up ${cleanupCount} existing connections for user ${client.userId}`);
  }
  
  let clientCleanup: (() => void) | null = null;
  
  try {
    // Register the client and get back the cleanup function
    const { id: clientId, cleanup } = basePointEventService.registerClient(client);
    clientCleanup = cleanup;
    
    // Store the client ID in the client object for later reference
    (client as any).__clientId = clientId;
    
    const clients = basePointEventService.getClients();
    console.log(`[SSE] Client registered (${clientId}). Current clients (${clients.length}):`, 
      clients.map(c => `${c.userId}@${c.ip}`).join(', '));
      
    // Log detailed connection stats
    basePointEventService.getConnectionStats();
  } catch (error) {
    console.error(`[SSE] Failed to register client ${client.userId}:`, error);
    return new Response('Internal Server Error', { status: 500 });
  }

  // Track cleanup state
  let isCleaningUp = false;
  
  // Handle client disconnect
  const handleDisconnect = () => {
    // Prevent multiple cleanup calls
    if (isCleaningUp) {
      console.log(`[SSE] Cleanup already in progress for ${client.userId}@${client.ip}`);
      return;
    }
    isCleaningUp = true;
    
    const clientId = `${client.userId}@${client.ip}`;
    console.log(`[SSE] Starting cleanup for ${clientId}`);
    
    try {
      // Clear the keep-alive interval
      if (keepAlive) {
        clearInterval(keepAlive);
        keepAlive = null;
      }
      
      // Clean up the client from the event service
      cleanup();
      
      // Close the writer
      writer.close().catch(error => {
        console.error(`[SSE] Error closing writer for ${clientId}:`, error);
      });
      
      console.log(`[SSE] Cleanup completed for ${clientId}`);
    } catch (error) {
      console.error(`[SSE] Error during cleanup for ${clientId}:`, error);
    } finally {
      isCleaningUp = false;
    }
  };

  // Set up request close handler
  request.signal.addEventListener('abort', handleDisconnect);
  
  // Set up process exit handlers for graceful shutdown
  const handleExit = () => {
    console.log(`[SSE] Process exiting, cleaning up client ${client.userId}@${client.ip}`);
    handleDisconnect();
  };
  
  // Only set up process exit handlers if we're not in a test environment
  if (process.env.NODE_ENV !== 'test') {
    process.on('exit', handleExit);
    process.on('SIGINT', handleExit);
    process.on('SIGTERM', handleExit);
  }

  // Send initial connection message
  try {
    await writer.write(encoder.encode('event: connected\ndata: {}\n\n'));
  } catch (error) {
    console.error(`[SSE] Error sending initial connection message to ${client.userId}:`, error);
    cleanup();
    return new Response('Internal Server Error', { status: 500 });
  }

  return new Response(readable, { headers });
});
