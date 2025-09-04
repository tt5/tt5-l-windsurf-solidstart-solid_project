import { Title } from "@solidjs/meta";
import { Show } from 'solid-js';
import { Navigate } from '@solidjs/router';
import { useAuth } from '~/contexts/auth';
import Board from '~/components/Game/Board';
import styles from './GamePage.module.css';

export default function GamePage() {
  const { user } = useAuth();

  return (
    <Show when={user()} fallback={<Navigate href="/login" />}>
      <main class={styles.container}>
        <Title>Game</Title>
        <Board />
      </main>
    </Show>
  );
}
