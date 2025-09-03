import { createContext, createSignal, useContext, type ParentComponent, onMount } from 'solid-js';

type User = { id: string; username: string } | null;
interface AuthStore {
  user: () => User;
  login: (username: string) => { id: string; username: string };
  logout: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
}

const AuthContext = createContext<AuthStore>();

const createUserData = (username: string) => ({
  id: `user_${username.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
  username
});

const createAuthStore = (): AuthStore => {
  const [user, setUser] = createSignal<User>(null);
  
  const updateUser = (userData: User) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }
  };

  onMount(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedUser = localStorage.getItem('user');
      if (!savedUser) return;
      
      const parsed = JSON.parse(savedUser);
      updateUser(typeof parsed === 'string' 
        ? { id: `user_${Date.now()}`, username: parsed }
        : parsed
      );
    } catch (error) {
      console.error('Auth initialization error:', error);
      updateUser(null);
    }
  });

  const login = (username: string) => {
    const userData = createUserData(username);
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
      
      if (!response.ok || !(await response.json()).success) {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      updateUser(null);
    }
  };

  const deleteAccount = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-account' })
      });
      updateUser(null);
      return true;
    } catch (error) {
      console.error('Account deletion error:', error);
      return false;
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
