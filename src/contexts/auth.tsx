import { createContext, createSignal, useContext, ParentComponent, onMount } from 'solid-js';

type User = { id: string; username: string } | null;
type AuthContextType = ReturnType<typeof createAuthStore>;

const AuthContext = createContext<AuthContextType>();

function createAuthStore() {
  const [user, setUser] = createSignal<User>(null);
  
  const initialize = () => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedUser = localStorage.getItem('user');
      if (!savedUser) return;
      
      const parsed = JSON.parse(savedUser);
      setUser(typeof parsed === 'string' 
        ? { id: `user_${Date.now()}`, username: parsed }
        : parsed
      );
    } catch (error) {
      console.error('Auth initialization error:', error);
      localStorage.removeItem('user');
    }
  };

  const login = (username: string) => {
    const userData = { 
      id: `user_${username.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, 
      username 
    };
    
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // Important for cookies to be sent
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Logout failed');
      }
      
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, we should still clear the local state
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  const deleteAccount = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-account' })
      });
      setUser(null);
      localStorage.removeItem('user');
      return true;
    } catch (error) {
      console.error('Account deletion error:', error);
      return false;
    }
  };

  return { 
    user, 
    login, 
    logout, 
    deleteAccount,
    initialize 
  };
}

export const AuthProvider: ParentComponent = (props) => {
  const auth = createAuthStore();
  
  onMount(() => {
    if (typeof window !== 'undefined') {
      auth.initialize();
    }
  });

  return (
    <AuthContext.Provider value={auth}>
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
