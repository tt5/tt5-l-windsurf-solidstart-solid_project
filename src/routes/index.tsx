import { A } from '@solidjs/router';
import { useNavigate } from '@solidjs/router';
import { onMount } from 'solid-js';
import { useAuth } from '~/contexts/auth';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  onMount(() => {
    // If user is already logged in, redirect to game
    if (user()) {
      navigate('/game', { replace: true });
    }
  });

  return (
    <div style={{
      display: 'flex',
      'flex-direction': 'column',
      'justify-content': 'center',
      'align-items': 'center',
      height: '100vh',
      'background-color': '#f5f5f5',
      'text-align': 'center',
      padding: '0 20px'
    }}>
      <h1>Welcome to the Game</h1>
      <p style={{ 'margin-top': '20px' }}>
        <A href="/game" style={{
          'text-decoration': 'none',
          'background-color': '#4CAF50',
          color: 'white',
          padding: '10px 20px',
          'border-radius': '4px',
          'font-weight': 'bold'
        }}>
          Start Playing
        </A>
      </p>
    </div>
  );
}
