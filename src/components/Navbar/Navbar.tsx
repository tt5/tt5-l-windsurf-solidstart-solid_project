import { A } from '@solidjs/router';
import { Show } from 'solid-js';
import styles from './Navbar.module.css';

export default function Navbar() {
  // In a real app, you would get this from your auth context
  const isAuthenticated = false;

  return (
    <nav class={styles.navbar}>
      <div class={styles.container}>
        <div class={styles.brand}>
          <A href="/" class={styles.brandLink}>
            Your App
          </A>
        </div>
        
        <div class={styles.navLinks}>
          <Show
            when={isAuthenticated}
            fallback={
              <>
                <A href="/login" class={styles.navLink}>
                  Sign In
                </A>
                <A 
                  href="/register" 
                  class={`${styles.navLink} ${styles.primaryButton}`}
                >
                  Sign Up
                </A>
              </>
            }
          >
            {/* Add authenticated user menu items here */}
            <A href="/profile" class={styles.navLink}>
              Profile
            </A>
            <button class={`${styles.navLink} ${styles.logoutButton}`}>
              Logout
            </button>
          </Show>
        </div>
      </div>
    </nav>
  );
}
