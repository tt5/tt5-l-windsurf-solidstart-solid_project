import { Title } from "@solidjs/meta";
import { Show, createSignal } from 'solid-js';
import { useAuth } from '~/contexts/AuthContext';
import { PlayerPositionProvider, usePlayerPosition } from '~/contexts/PlayerPositionContext';
import Board from '~/components/Game/Board';
import SidePanel from '~/components/Game/SidePanel';
import MapView from '~/components/Map/MapView';
import styles from './game.module.css';

function GameContent() {
  const { user, isInitialized, logout } = useAuth();
  const [activeTab, setActiveTab] = createSignal('info');
  const { position } = usePlayerPosition();
  
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
          <PlayerPositionProvider>
            <div class={styles.gameContainer}>
              <SidePanel 
                activeTab={activeTab() as 'info' | 'settings'}
                onTabChange={(tab) => setActiveTab(tab)}
                username={user()!.username}
                userId={user()!.id}
                onLogout={logout}
              />
              
              <div class={styles.gameBoard}>
                <div class={styles.positionIndicator}>
                  Position: ({position()?.[0] ?? 0}, {position()?.[1] ?? 0})
                </div>
                <Show when={activeTab() === 'info'}>
                  <Board />
                </Show>
                <Show when={activeTab() === 'settings'}>
                  <MapView />
                </Show>
              </div>
            </div>
          </PlayerPositionProvider>
        </Show>
      </Show>
    </div>
  );
}

export default function GamePage() {
  return (
    <PlayerPositionProvider>
      <GameContent />
    </PlayerPositionProvider>
  );
}
