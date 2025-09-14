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
  
  // Reconnection handling
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  let reconnectTimeout: number | undefined;
  let eventSource: EventSource | null = null;
  let isConnected = false;

  // Debug effect to log notifications changes
  createEffect(() => {
    console.log('Current notifications:', notifications());
  });

  const scheduleReconnect = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      reconnectAttempts++;
      console.log(`[SSE] Retrying connection in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
      reconnectTimeout = window.setTimeout(connect, delay);
    } else {
      console.error('[SSE] Max reconnection attempts reached');
    }
  };

  const handleMessage = (event: MessageEvent) => {
    try {
      console.log('[SSE] Message received:', event);
      
      // Skip empty or ping events
      if (!event.data || event.data === '{}' || event.data.includes('"event":"ping"')) {
        console.log('[SSE] Ping or empty message, skipping');
        return;
      }
      
      let data;
      try {
        data = JSON.parse(event.data);
        console.log('[SSE] Parsed message data:', data);
      } catch (e) {
        console.error('[SSE] Error parsing message data:', e, event.data);
        return;
      }
      
      // Handle different event types
      if (data.type === 'basePointChanged' && data.point) {
        const { event: eventType, point } = data;
        console.log(`[SSE] Base point ${eventType} at (${point.x}, ${point.y})`);
        
        // Add notification with string ID
        setNotifications(prev => [{
          id: `${point.x},${point.y}-${Date.now()}`,
          message: `Base point at (${point.x}, ${point.y}) was ${eventType}`,
          timestamp: Date.now()
        }, ...prev]);
      }
    } catch (error) {
      console.error('[SSE] Error processing message:', error);
    }
  };

  const connect = () => {
    // Clean up any existing connection
    if (eventSource) {
      console.log('[SSE] Closing existing connection');
      eventSource.close();
      eventSource = null;
    }
    
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
      console.log('[SSE] Creating new EventSource instance to:', urlWithCacheBust);
      eventSource = new EventSource(urlWithCacheBust, { 
        withCredentials: true 
      });
      
      isConnected = false;
      
      // Set up event listeners for standard EventSource events
      eventSource.onopen = () => {
        console.log('[SSE] Connection opened at', new Date().toISOString());
        isConnected = true;
        reconnectAttempts = 0;
      };
      
      // Handle incoming messages
      eventSource.onmessage = handleMessage;
      
      // Set up error handler
      eventSource.onerror = (event: Event) => {
        console.error('[SSE] EventSource error:', event);
        if (eventSource?.readyState === EventSource.CLOSED) {
          console.log('[SSE] Connection closed by server');
        }
        isConnected = false;
        scheduleReconnect();
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
      
      // Close the connection
      if (eventSource) {
        console.log('[SSE] Cleaning up EventSource');
        eventSource.close();
        eventSource = null;
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
