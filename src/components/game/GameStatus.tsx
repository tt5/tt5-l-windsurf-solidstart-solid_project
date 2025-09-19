import { createSignal, createEffect, onMount, Show } from 'solid-js';
import { useUser } from '~/contexts/UserContext';
import Button from '../ui/Button';
import { useNavigate } from '@solidjs/router';

// API response types
interface GameStatusResponse {
  success: boolean;
  gameJoined: boolean;
  homeX: number;
  homeY: number;
  message?: string;
  error?: string;
}

// Component state type
interface GameStatusState {
  gameJoined: boolean;
  homeX: number;
  homeY: number;
  isLoading: boolean;
  error: string | null;
  message: string | null;
}

export function GameStatus() {
  const [state, setState] = createSignal<GameStatusState>({
    gameJoined: false,
    homeX: 0,
    homeY: 0,
    isLoading: true,
    error: null,
    message: null
  });
  
  const user = useUser();
  const navigate = useNavigate();
  
  // Update state helper
  const updateState = (updates: Partial<GameStatusState>) => {
    setState(prev => ({
      ...prev,
      ...updates,
      // Clear error when loading starts
      ...(updates.isLoading === true ? { error: null, message: null } : {})
    }));
  };

  // Fetch the current game status
  const fetchGameStatus = async () => {
    if (!user()) {
      updateState({ 
        isLoading: false,
        error: 'You must be logged in to view game status' 
      });
      return;
    }
    
    updateState({ isLoading: true });
    
    try {
      const response = await fetch('/api/game/status');
      const data: GameStatusResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch game status');
      }
      
      updateState({
        isLoading: false,
        gameJoined: data.gameJoined,
        homeX: data.homeX,
        homeY: data.homeY,
        message: data.message || null
      });
      
    } catch (error) {
      console.error('Error fetching game status:', error);
      updateState({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load game status',
        message: 'An error occurred while loading the game status.'
      });
    }
  };

  // Handle joining the game
  const handleJoinGame = async () => {
    if (!user()) {
      navigate('/login');
      return;
    }

    updateState({ isLoading: true });
    
    try {
      const response = await fetch('/api/game/join', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data: GameStatusResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join game');
      }
      
      // Show success message before reloading
      updateState({
        isLoading: false,
        gameJoined: data.gameJoined,
        homeX: data.homeX,
        homeY: data.homeY,
        message: data.message || 'Successfully joined the game!'
      });
      
      // Refresh the page after a short delay to show the success message
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Error joining game:', error);
      updateState({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to join game',
        message: 'An error occurred while joining the game.'
      });
    }
  };

  // Handle leaving the game
  const handleLeaveGame = async () => {
    if (!user()) return;
    
    if (!confirm('Are you sure you want to leave the game? Your base will remain but you won\'t be able to add new base points.')) {
      return;
    }
    
    updateState({ isLoading: true });
    
    try {
      const response = await fetch('/api/game/leave', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data: { success: boolean; message?: string; error?: string } = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to leave game');
      }
      
      // Show success message before reloading
      updateState({
        isLoading: false,
        gameJoined: false,
        message: data.message || 'Successfully left the game.'
      });
      
      // Refresh the page after a short delay to show the success message
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Error leaving game:', error);
      updateState({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to leave game',
        message: 'An error occurred while leaving the game.'
      });
    }
  };

  // Initial load
  onMount(() => {
    fetchGameStatus();
  });
  
  // Auto-refresh status when user changes
  createEffect(() => {
    if (user()) {
      fetchGameStatus();
    }
  });

  return (
    <div class="game-status">
      <style>
        {`
        .game-status {
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 1rem;
        }
        
        .loading {
          padding: 0.5rem;
          color: #666;
          font-style: italic;
          text-align: center;
        }
        
        .error-message {
          padding: 0.75rem;
          margin: 0.5rem 0;
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
          font-size: 0.9rem;
        }
        
        .success-message {
          padding: 0.75rem;
          margin: 0.5rem 0;
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
          border-radius: 4px;
          font-size: 0.9rem;
        }
        
        .status-info {
          margin: 1rem 0;
          padding: 1rem;
          background: white;
          border-radius: 6px;
          border: 1px solid #dee2e6;
          opacity: 1;
          transition: opacity 0.3s ease;
        }
        
        .status-info.is-loading {
          opacity: 0.7;
          pointer-events: none;
        }
        
        .status-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f1f1f1;
        }
        
        .status-row:last-child {
          margin-bottom: 0;
          border-bottom: none;
        }
        
        .status-label {
          font-weight: 500;
          color: #495057;
        }
        
        .status-value {
          color: #212529;
          font-weight: 500;
        }
        
        .actions {
          margin-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }`}
      </style>
      {/* Loading state */}
      <Show when={state().isLoading}>
        <div class="loading">Loading game status...</div>
      </Show>

      {/* Error message */}
      <Show when={state().error}>
        <div class="error-message">
          {state().error}
        </div>
      </Show>

      {/* Success message */}
      <Show when={state().message && !state().isLoading}>
        <div class="success-message">
          {state().message}
        </div>
      </Show>

      {/* Game status info */}
      <div class="status-info" classList={{ 'is-loading': state().isLoading }}>
        <div class="status-row">
          <span class="status-label">Game Status:</span>
          <span class="status-value">
            {state().gameJoined ? '✅ Joined' : '❌ Not Joined'}
          </span>
        </div>
        
        <Show when={state().gameJoined}>
          <div class="status-row">
            <span class="status-label">Home Base:</span>
            <span class="status-value">
              ({state().homeX}, {state().homeY})
            </span>
          </div>
        </Show>
      </div>

      {/* Action buttons */}
      <div class="actions">
        <Show
          when={state().gameJoined}
          fallback={
            <Button 
              onClick={handleJoinGame} 
              disabled={state().isLoading}
              class="join-button"
              variant="primary"
            >
              {state().isLoading ? 'Joining...' : 'Join Game'}
            </Button>
          }
        >
          <Button 
            onClick={handleLeaveGame} 
            disabled={state().isLoading}
            variant="danger"
            class="leave-button"
          >
            {state().isLoading ? 'Leaving...' : 'Leave Game'}
          </Button>
        </Show>
      </div>
    </div>
  );
}
