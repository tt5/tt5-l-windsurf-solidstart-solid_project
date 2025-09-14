import { withAuth } from '~/middleware/auth';
import { basePointEventService } from '~/lib/server/events/base-point-events';
import type { BasePoint } from '~/types/board';

export const GET = withAuth(async ({ request, clientAddress, locals }) => {
  console.log(`[SSE] New connection from ${clientAddress}, user: ${locals.user?.id || 'anonymous'}`);
  
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
  const keepAlive = setInterval(() => {
    writer.write(encoder.encode('event: ping\ndata: {}\n\n'));
  }, 30000); // Send a ping every 30 seconds

  // Create a client object for this connection
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
    userId: locals.user?.id || 'anonymous',
    ip: clientAddress,
    connectedAt: new Date().toISOString()
  };

  // Register the client with the event service
  console.log(`[SSE] Registering client for user ${client.userId} from ${client.ip}`);
  try {
    basePointEventService.registerClient(client);
    const clients = Array.from(basePointEventService.getClients());
    console.log(`[SSE] Client registered. Current clients (${clients.length}):`, 
      clients.map(c => `${c.userId}@${c.ip}`).join(', '));
  } catch (error) {
    console.error(`[SSE] Failed to register client ${client.userId}:`, error);
    return new Response('Internal Server Error', { status: 500 });
  }

  // Handle client disconnect
  const cleanup = () => {
    console.log(`[SSE] Cleaning up connection for user ${client.userId}`);
    clearInterval(keepAlive);
    basePointEventService.unregisterClient(client);
    writer.close();
    console.log(`[SSE] Connection closed for user ${client.userId}`);
  };

  // Set up request close handler
  request.signal.addEventListener('abort', cleanup);

  // Send initial connection message
  writer.write(encoder.encode('event: connected\ndata: {}\n\n'));

  return new Response(readable, { headers });
});
