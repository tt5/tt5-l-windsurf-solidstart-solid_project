import { Title } from "@solidjs/meta";
import { Show } from 'solid-js';
import { useAuth } from '~/contexts/auth';
import Board from '~/components/Game/Board';
import Login from '~/components/Auth/Login';

export default function GamePage() {
  const { user } = useAuth();

  return (
    <Show when={user()}
      fallback={
        <div style={{
          display: 'flex',
          'justify-content': 'center',
          'align-items': 'center',
          height: '100vh',
          'background-color': '#f5f5f5'
        }}>
          <Login />
        </div>
      }
    >
      <main style={{
        'max-width': '800px',
        margin: '0 auto',
        padding: '20px',
      }}>
        <Title>Game</Title>
        <Board />
      </main>
    </Show>
  );
}
