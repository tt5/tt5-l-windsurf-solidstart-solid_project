import { createContext, createSignal, useContext, type ParentComponent, onMount } from 'solid-js';

type User = { id: string; username: string } | null;
interface AuthStore {
  user: () => User;
  login: (username: string) => User;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
}

const AuthContext = createContext<AuthStore>();
const createUserId = (username: string) => `user_${username.toLowerCase().replace(/[^\w]/g, '_')}`;

const createAuthStore = (): AuthStore => {
  const [user, setUser] = createSignal<User>(null);
  
  const updateUser = (userData: User) => {
    setUser(userData);
    userData ? localStorage.setItem('user', JSON.stringify(userData)) : localStorage.removeItem('user');
  };

  onMount(() => {
    if (typeof window === 'undefined') return;
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        updateUser(typeof parsed === 'string' 
          ? { id: `user_${Date.now()}`, username: parsed }
          : parsed
        );
      } catch {
        updateUser(null);
      }
    }
  });

  const login = (username: string) => {
    const userData = { id: createUserId(username), username };
    updateUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
    } finally {
      updateUser(null);
    }
  };

  const deleteAccount = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete-account' })
      });
      return true;
    } catch {
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
