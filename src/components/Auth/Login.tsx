import { Component, createSignal, onMount, Show } from 'solid-js';
import { useAuth } from '../../contexts/auth';
import styles from './Login.module.css';

const Login: Component = () => {
  const [username, setUsername] = createSignal('');
  const [isMounted, setIsMounted] = createSignal(false);
  const { login } = useAuth();

  onMount(() => {
    setIsMounted(true);
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const usernameValue = username().trim();
    if (usernameValue) {
      // Generate a simple user ID - in a real app, this would come from your auth system
      const userId = `user_${Date.now()}`;
      login(usernameValue, userId);
    }
  };

  return (
    <Show when={isMounted()} fallback={<div>Loading...</div>}>
      <div class={styles.loginContainer}>
        <form onSubmit={handleSubmit} class={styles.loginForm}>
          <h2>Welcome to the Game</h2>
          <input
            type="text"
            placeholder="Enter your name"
            value={username()}
            onInput={(e) => setUsername(e.currentTarget.value)}
            required
          />
          <button type="submit">Start Playing</button>
        </form>
      </div>
    </Show>
  );
};

export default Login;
