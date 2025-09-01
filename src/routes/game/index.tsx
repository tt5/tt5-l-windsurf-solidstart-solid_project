import { Title } from "@solidjs/meta";
import Board from '~/components/Game/Board';

export default function GamePage() {
  return (
    <main style={{
      'max-width': '800px',
      margin: '0 auto',
      padding: '20px',
    }}>
      <Title>Game</Title>
      <h1>View</h1>
      <Board />
    </main>
  );
}
