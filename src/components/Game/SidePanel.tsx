import { Component, createSignal, onMount, onCleanup, createEffect } from 'solid-js';
import styles from './SidePanel.module.css';
import InfoTab from './InfoTab';
import SettingsTab from './SettingsTab';

type Tab = 'info' | 'settings';

interface Notification {
  id: string | number;
  message: string;
  timestamp: number;
  userId?: string;
  count?: number;
}

interface SidePanelProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  username: string;
  userId: string;
  onLogout: () => void;
}

const SidePanel: Component<SidePanelProps> = (props) => {
  // Initialize state
  const [notifications, setNotifications] = createSignal<Notification[]>([]);
  const [oldestPrimeNotification, setOldestPrimeNotification] = createSignal<Notification | null>(null);
  const [addedCount, setAddedCount] = createSignal(0);
  const [deletedCount, setDeletedCount] = createSignal(0);
  const [totalBasePoints, setTotalBasePoints] = createSignal<number | null>(null);
  const [oldestPrimeTimestamp, setOldestPrimeTimestamp] = createSignal<number | null>(null);
  const [isOpen, setIsOpen] = createSignal(false);
  let panelRef: HTMLDivElement | undefined;
  
  // Store the EventSource instance and reconnection state
  let eventSource: EventSource | null = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;
  const INITIAL_RECONNECT_DELAY = 1000; // Start with 1 second
  const MAX_RECONNECT_DELAY = 30000; // Max 30 seconds
  let isConnected = false;
  let reconnectTimeout: NodeJS.Timeout | undefined;
  let connectionTimeout: NodeJS.Timeout | undefined;
  const CONNECTION_TIMEOUT = 5000; // 5 seconds
  let isMounted = true;
  
  // Type-safe event listener storage for cleanup
  const eventListeners: {
    [key: string]: (event: any) => void;
  } = {};

  const scheduleReconnect = () => {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      reconnectTimeout = setTimeout(() => {
        connect();
      }, delay) as unknown as NodeJS.Timeout;
    } else {
      console.error('[SSE] Max reconnection attempts reached');
    }
  };

  const getReadyStateName = (state: number | undefined): string => {
    switch (state) {
      case EventSource.CONNECTING: return 'CONNECTING';
      case EventSource.OPEN: return 'OPEN';
      case EventSource.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  };

  const handleMessage = (event: MessageEvent) => {
    try {

      // Skip empty events
      if (!event.data || event.data.trim() === '') {
        return;
      }

      let eventType = event.type;
      let messageData: any = {};
      
      // Handle different message formats
      if (event.data.startsWith('event: ')) {
        // Format: "event: created {\"type\":\"basePointChanged\",...}"
        const eventMatch = event.data.match(/^event: (\w+)\s*(\{.*\})?/s);
        if (eventMatch) {
          eventType = eventMatch[1];
          if (eventMatch[2]) {
            try {
              messageData = JSON.parse(eventMatch[2].trim());
            } catch (e) {
              console.error('[SSE] Error parsing message data:', e);
            }
          }
        }
      } else {
        // Try to parse as direct JSON
        try {
          messageData = JSON.parse(event.data);
        } catch (e) {
          console.error('[SSE] Error parsing message data as JSON:', e);
          return;
        }
      }
      
      // Handle ping events
      if (eventType === 'ping' || messageData?.type === 'ping') {
        return;
      }
      
      // The server sends the event type as the event name and the data in the message
      const eventData = messageData;
      
      // Handle base point changes and deletions
      if (eventData.type === 'basePointChanged' || eventData.event === 'basePointChanged' ||
          eventData.type === 'basePointDeleted' || eventData.event === 'basePointDeleted') {
        const pointData = eventData.point || eventData;
        if (pointData) {
          const isDeletion = eventData.type === 'basePointDeleted' || eventData.event === 'basePointDeleted';
          const count = eventData.count || 1;
          
          // Update added/deleted counts
          if (isDeletion) {
            setDeletedCount((prev: number) => prev + (count || 1));
          } else {
            setAddedCount((prev: number) => prev + (count || 1));
          }
          
          // Create a notification for the point change
          const notification: Notification = {
            id: pointData.id || Date.now(),
            message: isDeletion 
              ? `Removed ${count} base point${count > 1 ? 's' : ''} at (${pointData.x}, ${pointData.y})`
              : `Added ${count} base point${count > 1 ? 's' : ''} at (${pointData.x}, ${pointData.y})`,
            timestamp: pointData.timestamp || Date.now(),
            userId: pointData.userId,
            count: count
          };
          
          // Check if this is a prime notification
          if (pointData.isPrime || (pointData.message && (pointData.message as string).toLowerCase().includes('prime'))) {
            setOldestPrimeNotification((prev: Notification | null) => {
              // If we don't have a previous prime notification or this one is older
              if (!prev || notification.timestamp < prev.timestamp) {
                return notification;
              }
              return prev;
            });
          }
          
          setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep only the 50 most recent
        }
      }
      
      // Check both 'type' and 'event' for compatibility
      if ((eventData.type === 'cleanup' || eventData.event === 'cleanup')) {
        // Update total base points if available
        if (eventData.totalBasePoints !== undefined || eventData.initialCount !== undefined) {
          const count = eventData.initialCount !== undefined 
            ? eventData.initialCount 
            : eventData.totalBasePoints;
            
          setTotalBasePoints((prev: number) => count);
        }
        
        // Update oldest prime timestamp if available
        if (eventData.oldestPrimeTimestamp !== undefined) {
          setOldestPrimeTimestamp(eventData.oldestPrimeTimestamp);
          
          // If we have an oldest prime timestamp but no notification, create one
          if (!oldestPrimeNotification()) {
            setOldestPrimeNotification({
              id: 'system-prime',
              message: 'Initial prime point detected',
              timestamp: eventData.oldestPrimeTimestamp
            });
          }
        }
      } 
      // Handle world reset event
      else if (eventData.type === 'worldReset' || eventData.event === 'worldReset') {
        console.log('[World Reset] Received world reset event:', eventData);
        
        // Reset the total base points counter
        setTotalBasePoints(0);
        
        // Reset added/deleted counters
        setAddedCount(0);
        setDeletedCount(0);
        
        // Reset oldest prime notification
        setOldestPrimeNotification(null);
        
        // Show a notification to the user
        const notification: Notification = {
          id: Date.now(),
          message: `World has been reset! ${eventData.pointsBeforeReset} points were cleared.`,
          timestamp: Date.now()
        };
        
        // Add the notification to the top of the list
        setNotifications(prev => [notification, ...prev]);
        
        // Update oldest prime timestamp if available
        if (eventData.oldestPrimeTimestamp !== undefined) {
          setOldestPrimeTimestamp(eventData.oldestPrimeTimestamp);
        }
      }
      
    } catch (error) {
      console.error('[SSE] Error processing message:', error);
    }
  };

  const cleanupConnection = () => {
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = undefined;
    }
    
    if (eventSource) {
      eventSource.onopen = null;
      eventSource.onerror = null;
      eventSource.onmessage = null;
      eventSource.close();
      eventSource = null;
    }
  };

  const connect = () => {
    if (!isMounted) return;
    
    // Clean up any existing connection
    cleanupConnection();
    
    // Clear any existing reconnect timeout
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = undefined;
    }

    // Use the correct API URL based on the environment
    const apiUrl = '/api/events';
    
    // Add a timestamp to prevent caching
    const urlWithCacheBust = `${apiUrl}?_=${Date.now()}`;
    
    try {
      
      // Create a new EventSource with error handling
      eventSource = new EventSource(urlWithCacheBust, { 
        withCredentials: true 
      });
      
      isConnected = false;
      
      // Log initial state
      
      // Set up connection timeout
      connectionTimeout = setTimeout(() => {
        if (isMounted && eventSource?.readyState === EventSource.CONNECTING) {
          console.error('[SSE] Connection timeout - server is not responding');
          
          // Test the connection with a fetch request
          fetch(eventSource.url, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'text/event-stream',
              'Cache-Control': 'no-cache'
            }
          })
          .then(response => {
            return response.text().then(text => ({
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              text: text.substring(0, 200) // Only log first 200 chars
            }));
          })
          .catch(error => console.error('[SSE] Test fetch error:', error))
          .finally(() => {
            cleanupConnection();
            scheduleReconnect();
          });
        }
      }, CONNECTION_TIMEOUT) as unknown as NodeJS.Timeout;
      
      // Set up event listeners for standard EventSource events
      eventSource.onopen = (event) => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = undefined;
        }
        
        const now = new Date().toISOString();
        
        isConnected = true;
        reconnectAttempts = 0;
        
        // Send a test message to verify the connection
      };
      
      // Handle incoming messages
      eventSource.onmessage = (event) => {
        
        // Forward to handleMessage with the event type
        handleMessage({
          ...event,
          type: 'message',
          data: event.data
        } as MessageEvent);
      };
      
      // Store the current eventSource reference to avoid race conditions
      const currentEventSource = eventSource;
      if (!currentEventSource) {
        console.error('[SSE] Cannot add event listeners: eventSource is null');
        return;
      }
      
      // Define event types to listen for
      const eventTypes = ['created', 'updated', 'deleted', 'ping', 'cleanup'] as const;
      
      // Add event listeners
      eventTypes.forEach(eventType => {
        // Create a type-safe event handler
        const handler = (event: any) => {
          
          // Forward to handleMessage with the correct event type
          handleMessage({
            ...event,
            type: event.type,
            data: event.data
          } as MessageEvent);
        };
        
        // Store the handler for cleanup
        eventListeners[eventType] = handler;
        currentEventSource.addEventListener(eventType, handler);
      });
      // Clean up any existing event listeners when reconnecting
      const cleanupEventListeners = () => {
        if (eventSource) {
          Object.entries(eventListeners).forEach(([type, handler]) => {
            eventSource?.removeEventListener(type, handler);
          });
        }
        // Clear the listeners object
        Object.keys(eventListeners).forEach(key => delete eventListeners[key as keyof typeof eventListeners]);
      };
      
      // Set up cleanup on unmount
      onCleanup(() => {
        isMounted = false;
        cleanupEventListeners();
        cleanupConnection();
        
        // Clear all timeouts
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = undefined;
        }
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = undefined;
        }
        
        // Close event source
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
      });
      
      // Set up error handler
      eventSource.onerror = (event: Event) => {
        
        if (eventSource) {
          
          isConnected = false;
          
          // If we're not already trying to reconnect, schedule a reconnection
          if (eventSource.readyState === EventSource.CLOSED && !reconnectTimeout) {
            scheduleReconnect();
          } else {
            scheduleReconnect();
          }
        }
        
      };
      
      // Log the EventSource object for debugging
      
    } catch (error) {
      console.error('[SSE] Error creating EventSource:', error);
      scheduleReconnect();
    }
  };

  // Set up event source for real-time updates
  onMount(() => {
    // Initial connection
    connect();
    
    // Cleanup function
    return () => {
      
      // Clear any pending reconnection
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = undefined;
      }
      
      // Close the connection and remove event listeners
      if (eventSource) {
        
        try {
          // Remove event listeners
          eventSource.removeEventListener('created', handleMessage);
          eventSource.removeEventListener('updated', handleMessage);
          eventSource.removeEventListener('deleted', handleMessage);
          
          // Close the connection
          if (eventSource.readyState !== EventSource.CLOSED) {
            eventSource.close();
          }           

          eventSource = null;
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
        
      }
    };
  });

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Close panel when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    if (panelRef && !panelRef.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  // Add click outside listener
  createEffect(() => {
    if (isOpen()) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    onCleanup(() => {
      document.removeEventListener('mousedown', handleClickOutside);
    });
  });

  // Close panel when tab changes on mobile
  createEffect(() => {
    if (isOpen()) {
      setIsOpen(false);
    }
  });

  return (
    <div class={`${styles.sidePanel} ${isOpen() ? styles.open : ''}`} ref={panelRef}>
      <div class={styles.tabs}>
        <button
          class={`${styles.tab} ${props.activeTab === 'info' ? styles.active : ''}`}
          onClick={() => props.onTabChange('info')}
        >
          Info
        </button>
        <button
          class={`${styles.tab} ${props.activeTab === 'settings' ? styles.active : ''}`}
          onClick={() => props.onTabChange('settings')}
        >
          Settings
        </button>
      </div>
      
      <div class={styles.content}>
        {props.activeTab === 'info' ? (
          <div>
            <InfoTab 
              username={props.username}
              addedCount={addedCount()}
              deletedCount={deletedCount()}
              totalBasePoints={totalBasePoints}
              oldestPrimeNotification={oldestPrimeNotification()}
            />
          </div>
        ) : (
          <SettingsTab onLogout={props.onLogout} />
        )}
      </div>
      
      <button 
        class={styles.menuToggle} 
        onClick={() => setIsOpen(!isOpen())}
      >
        {isOpen() ? '×' : '☰'}
      </button>
      
      <div 
        class={`${styles.overlay} ${isOpen() ? styles.open : ''}`} 
        onClick={() => setIsOpen(false)}
      />
    </div>
  );
};

export default SidePanel;
