import { withAuth } from '~/middleware/auth';
import { basePointEventService } from '~/lib/server/events/base-point-events';
import type { BasePoint } from '~/types/board';

export const GET = withAuth(async ({ request, clientAddress, locals }) => {
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

  // Handle base point events
  const handleBasePointEvent = (event: 'created' | 'updated' | 'deleted', point: BasePoint) => {
    try {
      const eventData = {
        type: 'basePointChanged',
        event,
        point: {
          id: point.id,
          x: point.x,
          y: point.y,
          userId: point.userId,
          timestamp: point.createdAtMs || Date.now()
        }
      };
      
      const message = `event: ${event}\ndata: ${JSON.stringify(eventData)}\n\n`;
      writer.write(encoder.encode(message));
      console.log('Sent SSE event:', message);
    } catch (error) {
      console.error('Error sending SSE event:', error);
    }
  };

  // Set up event listeners with proper type safety
  const handleCreated = (point: BasePoint) => handleBasePointEvent('created', point);
  const handleUpdated = (point: BasePoint) => handleBasePointEvent('updated', point);
  const handleDeleted = (point: BasePoint) => handleBasePointEvent('deleted', point);
  
  basePointEventService.on('created', handleCreated);
  basePointEventService.on('updated', handleUpdated);
  basePointEventService.on('deleted', handleDeleted);

  // Handle client disconnect
  const cleanup = () => {
    clearInterval(keepAlive);
    basePointEventService.off('created', handleCreated);
    basePointEventService.off('updated', handleUpdated);
    basePointEventService.off('deleted', handleDeleted);
    writer.close();
  };

  // Set up request close handler
  request.signal.addEventListener('abort', cleanup);

  // Send initial connection message
  writer.write(encoder.encode('event: connected\ndata: {}\n\n'));

  return new Response(readable, { headers });
});
