import { EventEmitter } from 'events';
import { BasePoint } from '~/types/board';

type BasePointEvent = 'created' | 'updated' | 'deleted';
interface Client {
  send: (data: string) => void;
  userId: string;
  ip?: string;
  connectedAt?: string;
  [key: string]: any; // Allow additional properties
};

/**
 * Service for managing base point related events
 * Uses the singleton pattern to ensure a single event bus across the application
 */
export class BasePointEventService {
  private static instance: BasePointEventService;
  private eventEmitter: EventEmitter;
  private clients: Set<Client> = new Set();

  private constructor() {
    this.eventEmitter = new EventEmitter();
    // Increase max listeners for high-volume applications
    this.eventEmitter.setMaxListeners(50);
  }

  /**
   * Get the singleton instance of the service
   */
  public static getInstance(): BasePointEventService {
    if (!BasePointEventService.instance) {
      BasePointEventService.instance = new BasePointEventService();
    }
    return BasePointEventService.instance;
  }

  /**
   * Subscribe to base point events
   * @param event - The event type to listen for
   * @param listener - Callback function to handle the event
   */
  public on(event: BasePointEvent, listener: (point: BasePoint) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Unsubscribe from base point events
   * @param event - The event type to stop listening to
   * @param listener - The callback function to remove
   */
  public off(event: BasePointEvent, listener: (point: BasePoint) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Register a new client connection
   * @param client - The client connection
   */
  public registerClient(client: Client): void {
    this.clients.add(client);
    console.log(`Client connected. Total clients: ${this.clients.size}`);
  }

  /**
   * Unregister a client connection
   * @param client - The client connection to remove
   */
  public unregisterClient(client: Client): void {
    this.clients.delete(client);
    console.log(`Client disconnected. Total clients: ${this.clients.size}`);
  }

  /**
   * Broadcast a message to all connected clients
   * @param event - The event type
   * @param data - The data to send
   */
  public broadcast(event: string, data: any): void {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    console.log(`[EventService] Broadcasting '${event}' to ${this.clients.size} clients`);
    
    this.clients.forEach(client => {
      try {
        console.log(`[EventService] Sending to client ${client.userId}`, { 
          event, 
          data: {
            ...data,
            // Don't log the full point data to keep logs clean
            point: data.point ? { 
              id: data.point.id,
              x: data.point.x,
              y: data.point.y,
              userId: data.point.userId,
              timestamp: data.point.timestamp || data.point.createdAtMs
            } : undefined
          } 
        });
        
        client.send(message);
        console.log(`[EventService] Sent to client ${client.userId}`);
      } catch (error) {
        console.error(`[EventService] Error sending to client ${client.userId}:`, error);
      }
    });
  }

  /**
   * Emit a base point created event
   * @param point - The created base point
   */
  public emitCreated(point: BasePoint): void {
    console.log(`[EventService] Emitting 'created' event for point ${point.id} by user ${point.userId}`);
    this.eventEmitter.emit('created', point);
    this.broadcast('created', {
      type: 'basePointChanged',
      event: 'created',
      point: {
        id: point.id,
        x: point.x,
        y: point.y,
        userId: point.userId,
        timestamp: point.createdAtMs || Date.now()
      }
    });
  }

  /**
   * Emit a base point updated event
   * @param point - The updated base point
   */
  public emitUpdated(point: BasePoint): void {
    this.eventEmitter.emit('updated', point);
    this.broadcast('updated', {
      type: 'basePointChanged',
      event: 'updated',
      point: {
        id: point.id,
        x: point.x,
        y: point.y,
        userId: point.userId,
        timestamp: point.createdAtMs || Date.now()
      }
    });
  }

  /**
   * Emit a base point deleted event
   * @param point - The deleted base point
   */
  public emitDeleted(point: BasePoint): void {
    this.eventEmitter.emit('deleted', point);
    this.broadcast('deleted', {
      type: 'basePointChanged',
      event: 'deleted',
      point: {
        id: point.id,
        x: point.x,
        y: point.y,
        userId: point.userId,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Get all listeners for a specific event (for testing/debugging)
   */
  public getListeners(event: BasePointEvent): Function[] {
    return this.eventEmitter.listeners(event);
  }

  /**
   * Get all connected clients (for debugging)
   */
  public getClients(): Set<Client> {
    return new Set(this.clients);
  }
}

// Export a singleton instance
export const basePointEventService = BasePointEventService.getInstance();
