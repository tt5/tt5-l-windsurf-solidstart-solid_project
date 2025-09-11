import { Component, JSX, Show } from 'solid-js';
import styles from './SidePanel.module.css';

type Tab = 'info' | 'settings';

interface SidePanelProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  username: string;
  userId: string;
  onLogout: () => void;
}

const SidePanel: Component<SidePanelProps> = (props) => {
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
            <h2>Player Info</h2>
            <div>Welcome, {props.username}!</div>
            <div>User ID: {props.userId}</div>
            <button onClick={props.onLogout}>Logout</button>
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
