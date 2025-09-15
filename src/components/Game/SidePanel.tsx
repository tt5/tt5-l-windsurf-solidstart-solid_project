import { Component, Show, createSignal, onMount, onCleanup, For, createEffect } from 'solid-js';
import styles from './SidePanel.module.css';

type Tab = 'info' | 'settings';

interface Notification {
  id: string | number;
  message: string;
  timestamp: number;
}

interface SidePanelProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  username: string;
  userId: string;
  onLogout: () => void;
}

const SidePanel: Component<SidePanelProps> = (props) => {
  // Initialize notifications state
  const [notifications, setNotifications] = createSignal<Notification[]>([]);
  
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

  // Debug effect to log notifications changes
  createEffect(() => {
    console.log('Current notifications:', notifications());
  });

  const scheduleReconnect = () => {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      reconnectTimeout = setTimeout(() => {
        console.log(`[SSE] Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
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
      console.group('[SSE] Message received');
      console.log('Event type:', event.type);
      console.log('Origin:', event.origin);
      console.log('Last event ID:', (event as any).lastEventId || 'none');
      console.log('Raw data:', event.data);
      console.log('EventSource state:', getReadyStateName(eventSource?.readyState));
      
      // Skip empty events
      if (!event.data || event.data.trim() === '') {
        console.log('[SSE] Empty message, skipping');
        console.groupEnd();
        return;
      }

      let eventType = event.type;
      let messageData: any = {};
      
      // Handle different message formats
      if (event.data.startsWith('event: ')) {
        // Format: "event: created\ndata: {...}"
        const lines = event.data.split('\n');
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.substring(7).trim();
          } else if (line.startsWith('data: ')) {
            try {
              messageData = JSON.parse(line.substring(5).trim());
            } catch (e) {
              console.error('[SSE] Error parsing message data:', e, 'Line:', line);
            }
          }
        }
      } else {
        // Try to parse as direct JSON
        try {
          messageData = JSON.parse(event.data);
        } catch (e) {
          console.error('[SSE] Error parsing message data as JSON:', e);
          console.groupEnd();
          return;
        }
      }
      
      console.log('[SSE] Parsed message:', { eventType, messageData });
      
      // Handle ping events
      if (eventType === 'ping' || messageData?.type === 'ping') {
        console.log('[SSE] Ping message, skipping');
        console.groupEnd();
        return;
      }
      
      // The server sends the event type as the event name and the data in the message
      const eventData = messageData;
      
      console.log(`[SSE] Processing ${eventType} event`);
      
      // Handle base point changes
      const eventToProcess = eventType === 'message' ? eventData : { ...eventData, type: eventType };
      
      if (eventToProcess.type === 'basePointChanged' || (eventToProcess && eventToProcess.type === 'basePointChanged')) {
        const pointData = eventToProcess.point || eventToProcess;
        if (pointData && pointData.x !== undefined && pointData.y !== undefined) {
          const eventAction = eventToProcess.event || 'updated';
          console.log(`[SSE] Base point ${eventAction} at (${pointData.x}, ${pointData.y})`);
          
          // Add notification with string ID
          setNotifications(prev => [{
            id: `${pointData.x},${pointData.y}-${Date.now()}`,
            message: `Base point at (${pointData.x}, ${pointData.y}) was ${eventAction}`,
            timestamp: Date.now()
          }, ...prev]);
        }
      }
      
      console.groupEnd();
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
      console.log('[SSE] Cleaning up connection');
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
    console.log('[SSE] Attempting to connect to:', apiUrl, 'at', new Date().toISOString());
    
    // Add a timestamp to prevent caching
    const urlWithCacheBust = `${apiUrl}?_=${Date.now()}`;
    
    try {
      console.group('[SSE] Creating new EventSource');
      console.log('URL:', urlWithCacheBust);
      console.log('With credentials:', true);
      console.log('Current time:', new Date().toISOString());
      
      // Create a new EventSource with error handling
      eventSource = new EventSource(urlWithCacheBust, { 
        withCredentials: true 
      });
      
      console.log('EventSource created, readyState:', getReadyStateName(eventSource.readyState));
      console.groupEnd();
      
      isConnected = false;
      
      // Log initial state
      console.log('[SSE] Initial EventSource state:', {
        url: eventSource.url,
        withCredentials: eventSource.withCredentials,
        readyState: getReadyStateName(eventSource.readyState),
        CONNECTING: EventSource.CONNECTING,
        OPEN: EventSource.OPEN,
        CLOSED: EventSource.CLOSED
      });
      
      // Set up connection timeout
      connectionTimeout = setTimeout(() => {
        if (isMounted && eventSource?.readyState === EventSource.CONNECTING) {
          console.error('[SSE] Connection timeout - server is not responding');
          console.log('[SSE] Server URL:', eventSource.url);
          console.log('[SSE] With credentials:', eventSource.withCredentials);
          console.log('[SSE] Current time:', new Date().toISOString());
          
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
            console.log('[SSE] Test fetch response status:', response.status);
            return response.text().then(text => ({
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              text: text.substring(0, 200) // Only log first 200 chars
            }));
          })
          .then(data => console.log('[SSE] Test fetch response:', data))
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
        console.group('[SSE] Connection opened');
        console.log('Time:', now);
        console.log('Ready state:', getReadyStateName(eventSource?.readyState));
        console.log('URL:', eventSource?.url);
        console.log('With credentials:', eventSource?.withCredentials);
        console.log('Event:', event);
        console.groupEnd();
        
        isConnected = true;
        reconnectAttempts = 0;
        
        // Send a test message to verify the connection
        console.log('[SSE] Connection established, waiting for events...');
      };
      
      // Handle incoming messages
      eventSource.onmessage = (event) => {
        console.group('[SSE] Message received (onmessage)');
        console.log('Event type:', event.type);
        console.log('Data:', event.data);
        console.groupEnd();
        
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
      const eventTypes = ['created', 'updated', 'deleted', 'ping'] as const;
      
      // Add event listeners
      eventTypes.forEach(eventType => {
        // Create a type-safe event handler
        const handler = (event: any) => {
          console.group(`[SSE] ${eventType} event received`);
          console.log('Event type:', event.type);
          console.log('Data:', event.data);
          console.groupEnd();
          
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
        console.log('[SSE] Cleaning up SSE connection on unmount');
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
        console.group('[SSE] EventSource error');
        console.error('Error event:', event);
        console.log('EventSource state:', getReadyStateName(eventSource?.readyState));
        console.log('Is connected:', isConnected);
        console.log('Reconnect attempts:', reconnectAttempts);
        
        if (eventSource) {
          console.log('EventSource URL:', eventSource.url);
          console.log('EventSource readyState:', getReadyStateName(eventSource.readyState));
          console.log('Headers:', {
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Pragma': 'no-cache'
          });
          
          isConnected = false;
          
          // If we're not already trying to reconnect, schedule a reconnection
          if (eventSource.readyState === EventSource.CLOSED && !reconnectTimeout) {
            console.log('[SSE] Connection closed, scheduling reconnection...');
            scheduleReconnect();
          } else if (eventSource.readyState === EventSource.CONNECTING) {
            console.log('[SSE] Still connecting...');
          } else {
            console.log('[SSE] Unknown error state, attempting to reconnect...');
            scheduleReconnect();
          }
        }
        
        console.groupEnd();
      };
      
      // Log the EventSource object for debugging
      console.log('[SSE] EventSource created:', {
        url: eventSource.url,
        withCredentials: eventSource.withCredentials,
        readyState: eventSource.readyState,
        CONNECTING: EventSource.CONNECTING,
        OPEN: EventSource.OPEN,
        CLOSED: EventSource.CLOSED
      });
      
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
      console.log('[SSE] Cleaning up SidePanel SSE connection');
      
      // Clear any pending reconnection
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = undefined;
      }
      
      // Close the connection and remove event listeners
      if (eventSource) {
        console.group('[SSE] Cleaning up EventSource');
        console.log('Current state:', getReadyStateName(eventSource.readyState));
        console.log('URL:', eventSource.url);
        
        try {
          // Remove event listeners
          eventSource.removeEventListener('created', handleMessage);
          eventSource.removeEventListener('updated', handleMessage);
          eventSource.removeEventListener('deleted', handleMessage);
          
          // Close the connection
          if (eventSource.readyState !== EventSource.CLOSED) {
            console.log('Closing connection...');
            eventSource.close();
          } else {
            console.log('Connection already closed');
          }
          
          eventSource = null;
          console.log('Cleanup complete');
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
        
        console.groupEnd();
      }
    };
  });

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div class={styles.sidePanel}>
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
              <h4>Recent Activity</h4>
              <div class={styles.notificationList}>
                <For each={notifications()}>
                  {(notification) => (
                    <div class={styles.notification}>
                      <div class={styles.notificationMessage}>{notification.message}</div>
                      <div class={styles.notificationTime}>
                        {formatTime(notification.timestamp)}
                      </div>
                    </div>
                  )}
                </For>
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
  );
};

export default SidePanel;
