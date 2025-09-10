import { Title } from "@solidjs/meta";
import { createEffect, Show, createSignal } from 'solid-js';
import { useAuth } from '~/contexts/auth';
import Board from '~/components/Game/Board';
import styles from './game.module.css';

export default function GamePage() {
  const { user, isInitialized } = useAuth();
  const [activeTab, setActiveTab] = createSignal('info');
  
  return (
    <div class={styles.container}>
      <Title>Game</Title>
      
      <Show when={isInitialized()} fallback={
          <div class={styles.loadingContainer}>
            <h1>Loading Game...</h1>
            <div>Initializing authentication...</div>
          </div>
      }>
        <Show when={user()} fallback={
          <div class={styles.loginContainer}>
            <h1>Not Logged In</h1>
            <p>Please log in to access the game.</p>
          </div>
        }>
          <div class={styles.gameContainer}>
            <div class={styles.sidePanel}>
              <div class={styles.tabs}>
                <button 
                  class={`${styles.tab} ${styles.active}`}
                  onClick={() => setActiveTab('info')}
                >
                  Info
                </button>
                <button 
                  class={styles.tab}
                  onClick={() => setActiveTab('settings')}
                >
                  Settings
                </button>
              </div>
              
              <div class={styles.tabContent}>
                <Show when={activeTab() === 'info'}>
                  <div class={styles.infoTab}>
                    <h2>Player Info</h2>
                    <div>Welcome, {user()!.username}!</div>
                    <div>User ID: {user()!.id}</div>
                  </div>
                </Show>
                
                <Show when={activeTab() === 'settings'}>
                  <div class={styles.settingsTab}>
                    <h2>Game Settings</h2>
                    <div>Settings content goes here</div>
                  </div>
                </Show>
              </div>
            </div>
            
            <div class={styles.gameBoard}>
              <Board />
            </div>
          </div>
        </Show>
      </Show>
    </div>
  );
}
