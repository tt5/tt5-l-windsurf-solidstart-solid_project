import { createSignal, Show } from 'solid-js';
import { useAuth } from '~/contexts/auth';

export function DevTools() {
  const [isOpen, setIsOpen] = createSignal(false);
  const auth = useAuth();

  if (import.meta.env.PROD) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      zIndex: 9999,
      fontFamily: 'monospace',
      fontSize: '12px',
    }}>
      <Show when={isOpen()}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#fff',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '10px',
          maxWidth: '300px',
        }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>User ID:</strong> {auth.user()?.id || 'Not logged in'}
          </div>
          <div>
            <button 
              onClick={() => auth.logout().catch(console.error)}
              style={{
                background: '#ff4444',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </Show>
      
      <button
        onClick={() => setIsOpen(!isOpen())}
        style={{
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        }}
        title="Development Tools"
      >
        🛠️
      </button>
    </div>
  );
}
