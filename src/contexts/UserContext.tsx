import { createContext, useContext, createSignal, Accessor, JSX, onMount } from 'solid-js';

export interface User {
  id: string;
  username: string;
  email?: string;
  gameJoined: boolean;
  homeX: number;
  homeY: number;
}

const UserContext = createContext<{
  user: Accessor<User | null>;
  setUser: (user: User | null) => void;
  loading: Accessor<boolean>;
}>();

export function UserProvider(props: { children: JSX.Element }) {
  const [user, setUser] = createSignal<User | null>(null);
  const [loading, setLoading] = createSignal(true);

  // Load user from session on mount
  onMount(async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  });

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {props.children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
