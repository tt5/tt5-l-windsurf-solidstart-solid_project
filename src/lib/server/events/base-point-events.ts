import { EventEmitter } from 'events';
import { BasePoint } from '~/types/board';

type BasePointEvent = 'created' | 'updated' | 'deleted';

/**
 * Service for managing base point related events
 * Uses the singleton pattern to ensure a single event bus across the application
 */
export class BasePointEventService {
  private static instance: BasePointEventService;
  private eventEmitter: EventEmitter;

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
   * Emit a base point created event
   * @param point - The created base point
   */
  public emitCreated(point: BasePoint): void {
    this.eventEmitter.emit('created', point);
  }

  /**
   * Emit a base point updated event
   * @param point - The updated base point
   */
  public emitUpdated(point: BasePoint): void {
    this.eventEmitter.emit('updated', point);
  }

  /**
   * Emit a base point deleted event
   * @param point - The deleted base point
   */
  public emitDeleted(point: BasePoint): void {
    this.eventEmitter.emit('deleted', point);
  }

  /**
   * Get all listeners for a specific event (for testing/debugging)
   */
  public getListeners(event: BasePointEvent): Function[] {
    return this.eventEmitter.listeners(event);
  }
}

// Export a singleton instance
export const basePointEventService = BasePointEventService.getInstance();
