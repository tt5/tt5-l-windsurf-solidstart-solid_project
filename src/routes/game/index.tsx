import { Title } from "@solidjs/meta";
import { createEffect, Show } from 'solid-js';
import { useAuth } from '~/contexts/auth';
import Board from '~/components/Game/Board';
import styles from './game.module.css';

export default function GamePage() {
  const { user, isInitialized } = useAuth();
  
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
              <h1>Game</h1>
              <div>Welcome, {user()!.username}!</div>
              <div>User ID: {user()!.id}</div>
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
