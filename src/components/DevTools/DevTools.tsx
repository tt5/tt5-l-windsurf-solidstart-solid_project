import { createSignal, Show } from 'solid-js';
import { useAuth } from '~/contexts/auth';
import styles from './DevTools.module.css';

export function DevTools() {
  const [isOpen, setIsOpen] = createSignal(false);
  const auth = useAuth();

  if (import.meta.env.PROD) return null;

  return (
    <div class={styles.devToolsContainer}>
      <Show when={isOpen()}>
        <div class={styles.devToolsPanel}>
          <div class={styles.userInfo}>
            <strong>User ID:</strong> {auth.user()?.id || 'Not logged in'}
          </div>
          <div class={styles.buttonGroup}>
            <button 
              onClick={() => auth.logout().catch(console.error)}
              class={styles.logoutButton}
            >
              Logout
            </button>
            <button 
              onClick={async () => {
                if (!confirm('Are you sure you want to reset your game progress? This cannot be undone.')) return;
                try {
                  const response = await fetch('/api/reset-game-progress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                  });
                  const result = await response.json();
                  if (response.ok) {
                    window.location.reload();
                  } else {
                    throw new Error(result.error || 'Failed to reset game progress');
                  }
                } catch (error) {
                  console.error('Error resetting game progress:', error);
                  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                  alert(`Error: ${errorMessage}`);
                }
              }}
              class={styles.resetButton}
              title="Reset all your game progress"
            >
              Reset Game
            </button>
          </div>
        </div>
      </Show>
      
      <button
        onClick={() => setIsOpen(!isOpen())}
        class={styles.toggleButton}
        title="Development Tools"
      >
        🛠️
      </button>
    </div>
  );
}
