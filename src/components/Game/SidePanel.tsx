import { Component, Show, createSignal, onMount, onCleanup, For, createEffect } from 'solid-js';
import styles from './SidePanel.module.css';

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
      
      // Handle base point changes
      const eventToProcess = eventType === 'message' ? eventData : { 
        ...eventData, 
        type: eventType === 'created' && eventData?.type ? eventData.type : eventType 
      };
      
      // Handle base point changes and deletions
      if (eventToProcess.type === 'basePointChanged' || eventToProcess.event === 'basePointChanged' ||
          eventToProcess.type === 'basePointDeleted' || eventToProcess.event === 'basePointDeleted') {
        const pointData = eventToProcess.point || eventToProcess;
        if (pointData) {
          const isDeletion = eventToProcess.type === 'basePointDeleted' || eventToProcess.event === 'basePointDeleted';
          const count = eventToProcess.count || 1;
          
          // Update counters
          if (isDeletion) {
            setDeletedCount(prev => prev + count);
            // Update total points if available
            if (totalBasePoints() !== null) {
              setTotalBasePoints(prev => Math.max(0, (prev || 0) - count));
            }
          } else {
            setAddedCount(prev => prev + count);
            // Update total points if available
            if (totalBasePoints() !== null) {
              setTotalBasePoints(prev => (prev || 0) + count);
            }
          }
        }
      }
      // Handle cleanup events with total base points
      console.log('Event to process:', eventToProcess);
      
      // Check both 'type' and 'event' for compatibility
      if ((eventToProcess.type === 'cleanup' || eventToProcess.event === 'cleanup')) {
        // Update total base points if available
        if (eventToProcess.totalBasePoints !== undefined || eventToProcess.initialCount !== undefined) {
          const count = eventToProcess.initialCount !== undefined 
            ? eventToProcess.initialCount 
            : eventToProcess.totalBasePoints;
            
          setTotalBasePoints(prev => count);
        }
        
        // Update oldest prime timestamp if available
        if (eventToProcess.oldestPrimeTimestamp !== undefined) {
          setOldestPrimeTimestamp(eventToProcess.oldestPrimeTimestamp);
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
    <>
      <button 
        class={styles.menuToggle} 
        onClick={() => setIsOpen(!isOpen())}
        aria-label="Toggle menu"
      >
        ☰
      </button>
      <div 
        class={`${styles.sidePanel} ${isOpen() ? styles.open : ''}`} 
        ref={panelRef}
      >
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
        <Show when={props.activeTab === 'info'}>
          <div class={styles.infoTab}>
            <h3>Player: {props.username}</h3>
            <div class={styles.notifications}>
              <h4>Activity Counters</h4>
              <div class={styles.counters}>
                <div class={styles.counter}>
                  <span class={`${styles.counterNumber} ${styles.added}`}>{addedCount()}</span>
                  <span class={styles.counterLabel}>Added</span>
                </div>
                <div class={styles.counter}>
                  <span class={`${styles.counterNumber} ${styles.deleted}`}>{deletedCount()}</span>
                  <span class={styles.counterLabel}>Removed</span>
                </div>
                <div class={styles.counter}>
                  <span class={`${styles.counterNumber} ${styles.total}`}>{totalBasePoints()}</span>
                  <span class={styles.counterLabel}>Total</span>
                </div>
                <Show when={oldestPrimeTimestamp() !== null}>
                  <div class={styles.counter}>
                    <span class={`${styles.counterNumber} ${styles.timestamp}`}>
                      {new Date(oldestPrimeTimestamp()!).toLocaleTimeString()}
                    </span>
                    <span class={styles.counterLabel}>Oldest Prime</span>
                  </div>
                </Show>
              </div>
            </div>
          </div>
        </Show>
        
        <Show when={props.activeTab === 'settings'}>
          <div class={styles.settingsTab}>
            <button onClick={props.onLogout} class={styles.logoutButton}>
              Logout
            </button>
          </div>
        </Show>
      </div>
      </div>
      <div 
        class={`${styles.overlay} ${isOpen() ? styles.open : ''}`} 
        onClick={() => setIsOpen(false)}
      />
    </>
  );
};

export default SidePanel;
