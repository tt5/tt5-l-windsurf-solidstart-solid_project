import { Component, Show, createSignal, onMount, onCleanup, For } from 'solid-js';
import styles from './SidePanel.module.css';

type Tab = 'info' | 'settings';

interface Notification {
  id: number;
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
  const [notifications, setNotifications] = createSignal<Notification[]>([]);
  
  // Set up event source for real-time updates
  onMount(() => {
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectTimeout: number | undefined;
    let eventSource: EventSource | null = null;

    const connect = () => {
      if (eventSource) {
        eventSource.close();
      }

      // Use the correct API URL based on the environment
      const apiUrl = new URL('/api/events', window.location.origin).toString();
      eventSource = new EventSource(apiUrl);

      const handleMessage = (event: MessageEvent) => {
        console.log('Received SSE event:', event);
        
        // Skip ping events
        if (event.data === '{}' || event.type === 'ping' || (event.data && event.data.includes('"event":"ping"'))) {
          return;
        }
        
        try {
          let data;
          try {
            data = JSON.parse(event.data);
          } catch (e) {
            console.error('Failed to parse event data:', event.data);
            return;
          }
          
          // Handle different event formats
          if (event.type === 'created' || (data && data.event === 'created')) {
            const point = data.point || data;
            const userId = point.userId || 'unknown';
            const currentUserId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : null;
            
            // Skip notifications for the current user's own actions
            if (currentUserId && userId === currentUserId) {
              return;
            }
            
            const newNotification: Notification = {
              id: Date.now(),
              message: `New base point added at (${point.x}, ${point.y})`,
              timestamp: point.timestamp || point.createdAtMs || Date.now()
            };
            
            console.log('Adding notification:', newNotification);
            setNotifications(prev => [newNotification, ...prev].slice(0, 10));
            
            // Auto-remove notification after 10 seconds
            setTimeout(() => {
              setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
            }, 10000);
          }
        } catch (err) {
          console.error('Error processing SSE event:', err, 'Event data:', event.data);
        }
      };

      const handleOpen = () => {
        console.log('SSE connection established');
        reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      };

      const handleError = (error: Event) => {
        console.error('SSE error:', error);
        
        if (eventSource) {
          eventSource.close();
        }

        // Exponential backoff for reconnection
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Max 30s delay
          reconnectAttempts++;
          
          console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
          
          reconnectTimeout = window.setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached. Giving up.');
        }
      };

      eventSource.addEventListener('message', handleMessage);
      eventSource.addEventListener('open', handleOpen);
      eventSource.addEventListener('error', handleError);
      
      // Return cleanup function for this connection
      return () => {
        eventSource?.removeEventListener('message', handleMessage);
        eventSource?.removeEventListener('open', handleOpen);
        eventSource?.removeEventListener('error', handleError);
        eventSource?.close();
        
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
      };
    };

    // Initial connection
    const cleanup = connect();

    // Cleanup on component unmount
    onCleanup(() => {
      cleanup?.();
    });
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
      
      <div class={styles.tabContent}>
        <Show when={props.activeTab === 'info'}>
          <div class={styles.infoTab}>
            <div class={styles.infoHeader}>
              <h2>Player Info</h2>
              <div class={styles.notificationBadge} classList={{ [styles.hasNotifications]: notifications().length > 0 }}>
                {notifications().length}
              </div>
            </div>
            <div class={styles.playerInfo}>
              <div>Welcome, {props.username}!</div>
              <div>User ID: {props.userId}</div>
              <button onClick={props.onLogout}>Logout</button>
            </div>
            
            <div class={styles.notificationsSection}>
              <h3>Recent Activity</h3>
              <Show when={notifications().length > 0} fallback={
                <div class={styles.noNotifications}>No recent activity</div>
              }>
                <div class={styles.notificationsList}>
                  <For each={notifications()}>
                    {(notification) => (
                      <div class={styles.notificationItem}>
                        <span class={styles.notificationTime}>{formatTime(notification.timestamp)}</span>
                        <span class={styles.notificationText}>{notification.message}</span>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </div>
        </Show>
        
        <Show when={props.activeTab === 'settings'}>
          <div class={styles.settingsTab}>
            <h2>Game Settings</h2>
            <div>Settings content goes here</div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default SidePanel;
