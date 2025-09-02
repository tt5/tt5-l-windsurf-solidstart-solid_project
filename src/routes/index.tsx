import { useNavigate } from '@solidjs/router';
import { onMount } from 'solid-js';
import { useAuth } from '~/contexts/auth';
import Login from '~/components/Auth/Login';

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
      'justify-content': 'center',
      'align-items': 'center',
      height: '100vh',
      'background-color': '#f5f5f5'
    }}>
      <Login />
    </div>
  );
}
