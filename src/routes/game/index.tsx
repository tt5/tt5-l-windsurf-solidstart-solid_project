import { Title } from "@solidjs/meta";
import { Show } from 'solid-js';
import { useAuth } from '~/contexts/auth';
import Board from '~/components/Game/Board';
import Login from '~/components/Auth/Login';
import styles from './GamePage.module.css';

export default function GamePage() {
  const { user } = useAuth();

  return (
    <Show when={user()} fallback={
      <div class={styles.loginContainer}>
        <Login />
      </div>
    }>
      <main class={styles.container}>
        <Title>Game</Title>
        <Board />
      </main>
    </Show>
  );
}
