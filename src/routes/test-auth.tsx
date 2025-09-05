import { createSignal, createEffect, Show } from 'solid-js';
import { useAuth } from '~/contexts/auth';

export default function TestAuth() {
  const { user, isInitialized } = useAuth();
  const [count, setCount] = createSignal(0);
  
  // Log state changes
  createEffect(() => {
    console.log('Auth state changed:', {
      isInitialized: isInitialized(),
      hasUser: !!user(),
      count: count()
    });
  });

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Auth Test Page</h1>
      
      <div style={{
        padding: '20px',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>Auth State</h2>
        <div>isInitialized: <strong>{String(isInitialized())}</strong></div>
        <div>User: <strong>{user() ? user().username : 'None'}</strong></div>
        <div>User ID: <code>{user()?.id || 'N/A'}</code></div>
      </div>

      <div style={{
        padding: '20px',
        backgroundColor: '#e6f7ff',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>Test Component State</h2>
        <div>Counter: {count()}</div>
        <button 
          onClick={() => setCount(c => c + 1)}
          style={{
            padding: '8px 16px',
            marginTop: '10px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Increment Counter
        </button>
      </div>

      <Show when={isInitialized() && user()}>
        <div style={{
          padding: '20px',
          backgroundColor: '#e6ffe6',
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <h2>User Dashboard</h2>
          <p>Welcome back, {user()?.username}!</p>
          <p>Your user ID is: <code>{user()?.id}</code></p>
        </div>
      </Show>

      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <p>Check the browser console for detailed auth state changes.</p>
        <p>Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}
