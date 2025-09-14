import { withAuth } from '~/middleware/auth';
import { basePointEventService } from '~/lib/server/events/base-point-events';
import type { BasePoint } from '~/types/board';

export const GET = withAuth(async ({ request, clientAddress, locals }) => {
  console.log('[SSE] New connection', {
    ip: clientAddress,
    userId: locals.user?.id || 'anonymous',
    userEmail: locals.user?.email,
    user: locals.user ? JSON.stringify(locals.user) : 'none',
    authHeader: request.headers.get('authorization')?.substring(0, 20) + '...' || 'none'
  });
  
  if (!locals.user) {
    console.warn('[SSE] WARNING: No user in locals, connection will be anonymous');
  }
  
  // Set up SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Create a transform stream for the response
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Send a ping event to keep the connection alive
  let keepAlive: NodeJS.Timeout | null = setInterval(() => {
    writer.write(encoder.encode('event: ping\ndata: {}\n\n'));
  }, 30000); // Send a ping every 30 seconds

  // Create a client object for this connection with user context
  const user = locals.user || { userId: 'anonymous', username: 'anonymous' };
  const client = {
    send: (data: string) => {
      try {
        // Log a summary of the data being sent (avoid logging large data)
        let dataToLog = data.trim();
        if (dataToLog.length > 100) {
          dataToLog = dataToLog.substring(0, 100) + '...';
        }
        console.log(`[SSE] Sending to client ${locals.user?.id || 'anonymous'}:`, dataToLog);
        
        // Write the data to the stream
        const result = writer.write(encoder.encode(data));
        console.log(`[SSE] Write result for ${locals.user?.id || 'anonymous'}:`, {
          success: true,
          bytesWritten: data.length,
          ready: result
        });
      } catch (error) {
        console.error(`[SSE] Error writing to client ${locals.user?.id || 'anonymous'}:`, error);
        cleanup();
      }
    },
    // Use the authenticated user ID from the token if available
    userId: user.userId,
    username: user.username,
    ip: clientAddress,
    connectedAt: new Date().toISOString(),
    // Store the full user object for debugging
    user
  };

  // First, clean up any existing connections for this client
  const userInfo = locals.user 
    ? `user:${locals.user.id} (${locals.user.email || 'no-email'})` 
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
  const cleanup = async () => {
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
      
      // Unregister the client using the stored cleanup function
      try {
        console.log(`[SSE] Unregistering client ${clientId}`);
        if (clientCleanup) {
          clientCleanup();
          clientCleanup = null;
        } else {
          basePointEventService.unregisterClient(client);
        }
      } catch (error) {
        console.error(`[SSE] Error unregistering client ${clientId}:`, error);
      }
      
      // Close the writer
      try {
        console.log(`[SSE] Closing writer for ${clientId}`);
        await writer.close().catch(error => {
          console.error(`[SSE] Error closing writer for ${clientId}:`, error);
        });
      } catch (error) {
        console.error(`[SSE] Error in writer.close() for ${clientId}:`, error);
      }
      
      // Remove the abort event listener
      try {
        request.signal.removeEventListener('abort', cleanup);
      } catch (error) {
        // Ignore errors from removeEventListener
      }
      
      // Remove process exit handlers
      process.off('exit', handleExit);
      process.off('SIGINT', handleExit);
      process.off('SIGTERM', handleExit);
      
      console.log(`[SSE] Cleanup completed for ${clientId}`);
    } catch (error) {
      console.error(`[SSE] Error during cleanup for ${clientId}:`, error);
    } finally {
      isCleaningUp = false;
    }
  };

  // Set up request close handler
  const abortHandler = () => {
    console.log(`[SSE] Abort signal received for ${client.userId}@${client.ip}`);
    cleanup().catch(console.error);
  };
  request.signal.addEventListener('abort', abortHandler);
  
  // Handle process termination
  const handleExit = () => {
    console.log(`[SSE] Process exit signal received, cleaning up ${client.userId}@${client.ip}`);
    cleanup().catch(console.error);
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
