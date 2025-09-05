import { Title } from "@solidjs/meta";
import { createEffect } from 'solid-js';
import { useAuth } from '~/contexts/auth';
import { Show } from 'solid-js';
import Board from '~/components/Game/Board';

export default function GamePage() {
  const { user, isInitialized } = useAuth();
  
  createEffect(() => {
    const currentUser = user();
    console.log('GamePage - Auth state:', {
      isInitialized: isInitialized(),
      hasUser: !!currentUser,
      user: currentUser
    });
  });

  return (
    <div style={{ padding: '20px' }}>
      <Title>Game</Title>
      
      <Show when={isInitialized()} fallback={
        <div>
          <h1>Loading Game...</h1>
          <div>Initializing authentication...</div>
        </div>
      }>
        <Show when={user()} fallback={
          <div>
            <h1>Not Logged In</h1>
            <p>Please log in to access the game.</p>
          </div>
        }>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px' }}>
              <h1>Game Page</h1>
              <div>Welcome, {user()!.username}!</div>
              <div>User ID: {user()!.id}</div>
            </div>
            
            <div style={{
              border: '2px solid #333',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: '#f9f9f9'
            }}>
              <Board />
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                Refresh Game
              </button>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  );
}
