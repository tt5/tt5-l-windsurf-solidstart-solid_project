import { createContext, createSignal, useContext, ParentComponent, onMount } from 'solid-js';

type AuthContextType = {
  user: string | null;
  login: (username: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>();

export const AuthProvider: ParentComponent = (props) => {
  const [user, setUser] = createSignal<string | null>(null);
  
  // Only run on client-side
  onMount(() => {
    if (typeof window !== 'undefined') {
      setUser(localStorage.getItem('user') || null);
    }
  });

  const login = (username: string) => {
    setUser(username);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', username);
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
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
