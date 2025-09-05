import { Title } from "@solidjs/meta";
import { Show, createEffect } from 'solid-js';
import { Navigate } from '@solidjs/router';
import { useAuth } from '~/contexts/auth';
import Board from '~/components/Game/Board';
import styles from './GamePage.module.css';

export default function GamePage() {
  console.log('GamePage - Component rendering');
  const { user, isInitialized } = useAuth();
  
  // Log state changes for debugging
  createEffect(() => {
    console.log('GamePage - isInitialized:', isInitialized());
    console.log('GamePage - user:', user());
    
    // Additional debug info
    if (typeof window !== 'undefined') {
      console.log('localStorage user:', localStorage.getItem('user'));
      console.log('Environment is development:', import.meta.env.DEV);
      console.log('Current URL:', window.location.href);
      console.log('Auth context:', useAuth());
    }
  });

  // Show loading state only if we're not initialized yet
  if (!isInitialized()) {
    console.log('GamePage - Not initialized yet, showing loading...');
    return <div>Loading... (isInitialized: {isInitialized().toString()})</div>;
  }

  // If we're initialized but don't have a user, redirect to login
  if (!user()) {
    console.log('GamePage - No user, redirecting to login...');
    return (
      <div>
        <div>Redirecting to login...</div>
        <Navigate href="/login" />
      </div>
    );
  }

  // If we have a user, show the game
  return (
    <main class={styles.container}>
      <Title>Game</Title>
      <Board />
    </main>
  );
}
