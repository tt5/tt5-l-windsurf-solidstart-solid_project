import { Component, Show, createSignal, onMount, onCleanup, For, createEffect } from 'solid-js';
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
  // Initialize notifications state with debug logging
  const [notifications, setNotifications] = createSignal<Notification[]>([]);
  
  // Debug effect to log notifications changes
  createEffect(() => {
    console.log('Current notifications:', notifications());
  });
  
  // Set up event source for real-time updates
  onMount(() => {
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectTimeout: number | undefined;
    let eventSource: EventSource | null = null;
    let isConnected = false;
    let cleanupCallbacks: Array<() => void> = [];
    
    // Function to clean up all resources
    const cleanupAll = () => {
      console.log('[SSE] Running cleanup callbacks');
      cleanupCallbacks.forEach(cb => {
        try {
          cb();
        } catch (e) {
          console.error('[SSE] Error during cleanup:', e);
        }
      });
      cleanupCallbacks = [];
      
      if (eventSource) {
        console.log('[SSE] Closing EventSource in cleanup');
        eventSource.close();
        eventSource = null;
      }
      
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = undefined;
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
        console.log('[SSE] Creating new EventSource instance');
        eventSource = new EventSource(urlWithCacheBust, { 
          withCredentials: true 
        });
        
        isConnected = false;
        
        if (!eventSource) {
          console.error('[SSE] Failed to create EventSource: eventSource is null');
          return;
        }
        
        eventSource.onopen = () => {
          isConnected = true;
          reconnectAttempts = 0;
          console.log('[SSE] Connection established, readyState:', eventSource?.readyState);
          
          // Send a test message to verify the connection
          if (eventSource) {
            const testEvent = {
              type: 'test',
              message: 'Connection test',
              timestamp: Date.now()
            };
            console.log('[SSE] Sending test message');
            // @ts-ignore - This is just for testing
            eventSource.send(JSON.stringify(testEvent));
          }
        };
        
        eventSource.onerror = (error) => {
          const readyState = eventSource?.readyState;
          console.error(`[SSE] Connection error at ${new Date().toISOString()}, readyState: ${readyState}`, error);
          
          // Log more details about the readyState
          const readyStateMap = {
            0: 'CONNECTING',
            1: 'OPEN',
            2: 'CLOSED'
          };
          console.log(`[SSE] Connection state: ${readyStateMap[readyState as keyof typeof readyStateMap] || 'UNKNOWN'}`);
          
          if (isConnected) {
            console.log('[SSE] Connection was previously established, attempting to reconnect...');
            isConnected = false;
            
            // Close the existing connection if it exists
            if (eventSource) {
              eventSource.close();
              eventSource = null;
            }
            
            if (reconnectAttempts < maxReconnectAttempts) {
              const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
              reconnectAttempts++;
              console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
              reconnectTimeout = window.setTimeout(connect, delay);
            } else {
              console.error('[SSE] Max reconnection attempts reached');
            }
          } else {
            console.error('[SSE] Initial connection failed');
          }
        };

        // Add message event listener
        if (eventSource) {
          eventSource.addEventListener('message', (event) => {
            console.log('[SSE] Received message event:', event.type, event);
            handleMessage(event);
          });
          
          // Add specific event type listeners
          ['created', 'updated', 'deleted', 'ping'].forEach(eventType => {
            eventSource?.addEventListener(eventType, (event) => {
              console.log(`[SSE] Received ${eventType} event:`, event);
              handleMessage(event as MessageEvent);
            });
          });
        } else {
          console.error('[SSE] Cannot add event listeners: eventSource is null');
        }
        
        console.log('[SSE] Event listeners added successfully');
        
      } catch (error) {
        console.error('[SSE] Failed to create EventSource:', error);
        
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          reconnectAttempts++;
          console.log(`[SSE] Retrying connection in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
          reconnectTimeout = window.setTimeout(connect, delay);
        } else {
          console.error('[SSE] Max reconnection attempts reached');
        }
      }
      
      const handleMessage = (event: MessageEvent) => {
        try {
          // Log raw event data for debugging
          console.log('[SSE] Raw event received - type:', event.type, 'origin:', event.origin, 'data:', event.data);
          
          // Skip ping events and empty data
          if (event.data === '{}' || event.type === 'ping' || (event.data && event.data.includes('"event":"ping"'))) {
            console.log('[SSE] Ping event, skipping');
            return;
          }
          
          let data;
          try {
            // Parse the event data if it's a string
            data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            console.log('[SSE] Parsed event data:', data);
            
            // Handle different event formats
            if (event.type === 'message' && data.event) {
              // If this is a message event with an embedded event type
              console.log(`[SSE] Processing embedded event: ${data.event}`);
              // Create a new event object with the updated type
              const eventInit: MessageEventInit = {
                data: data.data || data,
                lastEventId: event.lastEventId,
                origin: event.origin
              };
              // Only include ports if they exist
              if (event.ports && event.ports.length > 0) {
                eventInit.ports = Array.from(event.ports);
              }
              event = new MessageEvent(data.event, eventInit);
            }
            
            // Log the processed event
            console.log(`[SSE] Processing ${event.type} event:`, data);
            
          } catch (e) {
            console.error('[SSE] Failed to parse event data:', event.data, 'Error:', e);
            return;
          }
          
          // Extract point data from different possible event formats
          let pointData = null;
          let eventType = event.type;
          
          // Log the full event for debugging
          console.log('[SSE] Full event received:', { type: eventType, data });
          
          // Handle different event formats
          if (data?.type === 'basePointChanged' && data.point) {
            // Format 1: { type: 'basePointChanged', event: 'created', point: {...} }
            pointData = data.point;
            eventType = data.event || eventType;
            console.log('[SSE] Processing basePointChanged event:', { 
              eventType,
              pointData 
            });
          } 
          else if (data?.point) {
            // Format 2: { point: {...}, event: 'created' }
            pointData = data.point;
            eventType = data.event || eventType;
            console.log('[SSE] Processing point data from nested object:', { eventType, pointData });
          }
          else if (data?.x !== undefined && data?.y !== undefined) {
            // Format 3: Direct point data in the root
            pointData = data;
            console.log('[SSE] Processing direct point data:', { eventType, pointData });
          }
          else if (data) {
            // Format 4: Generic data object
            pointData = data;
            console.log(`[SSE] Processing ${eventType} event:`, pointData);
          }
          
          if (!pointData) {
            console.log('[SSE] No relevant point data in event, skipping');
            return;
          }
          
          const eventUserId = pointData.userId || 'unknown';
          const currentUserId = props.userId;
          
          console.log('[SSE] User check - Current user ID:', currentUserId, 'Event user ID:', eventUserId);
          
          // Skip only if this is the current user's own action for created/updated/deleted events
          const isUserAction = ['created', 'updated', 'deleted'].includes(eventType);
          if (isUserAction && currentUserId && eventUserId === currentUserId) {
            console.log('[SSE] Skipping notification for current user (self-action)');
            return;
          }
          
          console.log('[SSE] Processing notification for user action');
          
          // Validate point data
          if (typeof pointData.x !== 'number' || typeof pointData.y !== 'number') {
            console.error('[SSE] Invalid point data:', pointData);
            return;
          }
          
          try {
            // Create a new notification with a unique ID
            const notificationId = Date.now();
            const timestamp = pointData.timestamp || pointData.createdAtMs || Date.now();
            
            // Determine the action type and message based on event type
            let message = '';
            const username = pointData.username ? `Player ${pointData.username}` : 'Another player';
            
            switch (eventType) {
              case 'created':
                message = `${username} added a base point at (${pointData.x}, ${pointData.y})`;
                break;
              case 'updated':
                message = `${username} updated a base point at (${pointData.x}, ${pointData.y})`;
                break;
              case 'deleted':
                message = `${username} removed a base point at (${pointData.x}, ${pointData.y})`;
                break;
              default:
                // For custom events, use the event type in the message
                message = pointData.message || `${username} performed ${eventType} at (${pointData.x || '?'}, ${pointData.y || '?'})`;
            }
            
            const newNotification: Notification = {
              id: notificationId,
              message: message,
              timestamp: timestamp
            };
            
            console.log('[SSE] Creating new notification:', {
              id: notificationId,
              point: { x: pointData.x, y: pointData.y },
              timestamp: new Date(timestamp).toISOString(),
              eventType: event.type,
              fromUser: pointData.userId
            });
            
            // Update the state with the new notification
            setNotifications(prev => {
              // Create a new array with the new notification at the start
              const updated = [newNotification, ...prev]
                // Remove any duplicate notifications (shouldn't happen with unique IDs, but just in case)
                .filter((notification, index, self) => 
                  index === self.findIndex(n => n.id === notification.id)
                )
                // Keep only the 10 most recent
                .slice(0, 10);
                
              console.log(`[SSE] Updated notifications. Had ${prev.length}, now have ${updated.length}`);
              return updated;
            });
            
            // Schedule auto-removal after 10 seconds
            const removalTimeout = setTimeout(() => {
              setNotifications(prev => {
                const filtered = prev.filter(n => n.id !== notificationId);
                if (filtered.length !== prev.length) {
                  console.log(`[SSE] Auto-removed notification ${notificationId}. Remaining: ${filtered.length}`);
                }
                return filtered;
              });
            }, 10000);
            
            // Clean up the timeout if the component unmounts
            onCleanup(() => clearTimeout(removalTimeout));
            
          } catch (error) {
            console.error('[SSE] Error creating notification:', error);
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

      if (eventSource) {
        eventSource.addEventListener('open', handleOpen);
        eventSource.addEventListener('error', handleError);
      }
      
      // Register cleanup callbacks
      const cleanupListeners = () => {
        if (eventSource) {
          console.log('[SSE] Removing event listeners');
          eventSource.removeEventListener('message', handleMessage);
          eventSource.removeEventListener('open', handleOpen);
          eventSource.removeEventListener('error', handleError);
          
          // Remove all event listeners of specific types
          ['created', 'updated', 'deleted', 'ping'].forEach(eventType => {
            eventSource?.removeEventListener(eventType, handleMessage as any);
          });
        }
      };
      
      // Add to cleanup callbacks
      cleanupCallbacks.push(cleanupListeners);
      
      // Return cleanup function for this connection
      return () => {
        console.log('[SSE] Connection cleanup triggered');
        cleanupListeners();
        
        if (eventSource) {
          console.log('[SSE] Closing EventSource in connection cleanup');
          eventSource.close();
          eventSource = null;
        }
        
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = undefined;
        }
      };
    };

    // Initial connection
    const cleanup = connect();

    // Cleanup on component unmount
    onCleanup(() => {
      console.log('[SSE] Cleaning up SidePanel SSE connection');
      cleanup?.();
      
      // Force cleanup of any remaining resources
      if (eventSource) {
        console.log('[SSE] Force closing EventSource');
        eventSource.close();
        eventSource = null;
      }
      
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = undefined;
      }
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
              <div style={{"display": "flex", "justify-content": "space-between", "align-items": "center"}}>
                <h3>Recent Activity</h3>
                <button 
                  onClick={() => setNotifications([])}
                  style={{"font-size": "12px", "padding": "2px 8px"}}
                >
                  Clear
                </button>
              </div>
              <Show when={notifications().length > 0} fallback={
                <div class={styles.noNotifications}>No recent activity</div>
              }>
                <div class={styles.notificationsList}>
                  <For each={notifications()}>
                    {(notification, index) => {
                      console.log(`Rendering notification ${index()}:`, notification);
                      return (
                        <div class={styles.notificationItem} data-testid={`notification-${notification.id}`}>
                          <div style={{"display": "flex", "justify-content": "space-between"}}>
                            <span class={styles.notificationTime}>
                              {formatTime(notification.timestamp)}
                            </span>
                            <span style={{"font-size": "10px", "color": "#999"}}>ID: {notification.id}</span>
                          </div>
                          <div class={styles.notificationText}>
                            {notification.message}
                          </div>
                        </div>
                      );
                    }}
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
