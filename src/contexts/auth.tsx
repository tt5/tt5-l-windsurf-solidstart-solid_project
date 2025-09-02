import { createContext, createSignal, useContext, ParentComponent, onMount, Show } from 'solid-js';

type User = {
  id: string;
  username: string;
} | null;

type AuthContextType = {
  user: () => User;
  login: (username: string, userId: string) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>();

export const AuthProvider: ParentComponent = (props) => {
  const [user, setUser] = createSignal<User>(null);
  
  // Only run on client-side
  onMount(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          // Handle both old (string) and new (object) user format
          if (typeof parsed === 'string') {
            // Convert old string format to new object format
            setUser({ id: `user_${Date.now()}`, username: parsed });
          } else {
            setUser(parsed);
          }
        } catch (e) {
          console.error('Failed to parse user data', e);
          localStorage.removeItem('user');
        }
      }
    }
  });

  const login = (username: string, userId: string) => {
    const userData = { id: userId, username };
    setUser(userData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  const logout = async () => {
    try {
      // Call any cleanup on the server if needed
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {props.children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
