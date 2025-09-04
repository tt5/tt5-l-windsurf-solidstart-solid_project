import { createContext, createEffect, createSignal, useContext, type ParentComponent } from 'solid-js';

type User = { id: string; username: string } | null;
interface AuthStore {
  user: () => User;
  login: (username: string) => User;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
}

const AuthContext = createContext<AuthStore>();
// This is a temporary function - in a real app, we should get the user ID from the server
const createUserId = (username: string): string => {
  // Generate a consistent hash-based ID for all usernames
  const str = username.toLowerCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'user_' + Math.abs(hash).toString(16);
};

const createAuthStore = (): AuthStore => {
  const [user, setUser] = createSignal<User>(null);
  
  const updateUser = (userData: User) => {
    setUser(userData);
    userData ? localStorage.setItem('user', JSON.stringify(userData)) : localStorage.removeItem('user');
  };

  createEffect(() => {
    if (typeof window === 'undefined') return;
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && typeof parsed === 'object') {
          updateUser(parsed);
        }
      } catch {
        updateUser(null);
      }
    }
  });

  const login = (username: string) => {
    const userId = createUserId(username);
    const userData = { id: userId, username };
    updateUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      // Clear the user from local storage and state
      updateUser(null);
      
      // Force a full page reload to clear any application state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the API call fails, clear the user from state
      updateUser(null);
      window.location.href = '/';
    }
  };

  const deleteAccount = async () => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'delete-account' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete account');
      }
      
      return true;
    } catch (error) {
      console.error('Delete account error:', error);
      return false;
    } finally {
      updateUser(null);
    }
  };

  return { user, login, logout, deleteAccount };
};

export const AuthProvider: ParentComponent = (props) => (
  <AuthContext.Provider value={createAuthStore()}>
    {props.children}
  </AuthContext.Provider>
);

export const useAuth = (): AuthStore => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
