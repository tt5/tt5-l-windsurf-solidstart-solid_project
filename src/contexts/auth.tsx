import { createContext, createEffect, createSignal, useContext, type ParentComponent } from 'solid-js';

type User = { id: string; username: string } | null;

interface AuthStore {
  user: () => User;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isInitialized: () => boolean;
}

const AuthContext = createContext<AuthStore>();
// Generate a secure random user ID using crypto.getRandomValues
// This matches the server-side implementation in the registration endpoint
const createUserId = (): string => {
  // Generate 16 random bytes (32 hex characters)
  const randomBytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    // Fallback for environments without crypto.getRandomValues (shouldn't happen in modern browsers)
    console.warn('crypto.getRandomValues not available, using Math.random() fallback');
    for (let i = 0; i < 16; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return 'user_' + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

const createAuthStore = (): AuthStore => {
  const [user, setUser] = createSignal<User>(null);
  const [isInitialized, setIsInitialized] = createSignal(false);
  
  const updateUser = (userData: User) => {
    setUser(userData);
    userData ? localStorage.setItem('user', JSON.stringify(userData)) : localStorage.removeItem('user');
  };

  // Initialize auth state
  createEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    const isDev = typeof import.meta.env.DEV !== 'undefined' ? import.meta.env.DEV : process.env.NODE_ENV !== 'production';
    
    // Check for saved user first
    const savedUser = localStorage.getItem('user');
    
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        
        // Handle both formats: { user: { id, username } } and { id, username }
        const userData = parsed.user || parsed;
        
        if (userData && typeof userData === 'object' && userData.id) {
          updateUser(userData);
          
          // Verify the session is still valid
          verifySession(userData);
        } else {
          // Clear invalid user data
          localStorage.removeItem('user');
        }
      } catch (error) {
        updateUser(null);
        // Clear corrupted user data
        localStorage.removeItem('user');
      }
    } else {
    }
    
    // If we get here, either there's no saved user or there was an error
    setIsInitialized(true);
    
    // In development, try to auto-login if no user is set
    if (isDev) {
      setupDevUser().catch(error => {
        setIsInitialized(true);
      });
    } else {
      setIsInitialized(true);
    }
  });
  
  // Development-only function to set up a test user
  const setupDevUser = async () => {
    
    const isProd = (typeof import.meta.env.PROD !== 'undefined' && import.meta.env.PROD) || 
                  (typeof process.env.NODE_ENV !== 'undefined' && process.env.NODE_ENV === 'production');
    
    if (isProd) {
      return;
    }
    
    // Use devuser for development
    const testUsername = 'devuser';
    const testPassword = 'devpassword'; // In a real app, use environment variables
    
    try {
      // Try to log in first (in case the user already exists)
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'include',
          body: JSON.stringify({ 
            username: testUsername,
            password: testPassword
          })
        });
        
        if (response.ok) {
          const { user: userData } = await response.json();
          
          if (!userData || !userData.id) {
            throw new Error('Invalid user data in response');
          }
          
          // Ensure required fields
          const formattedUser = {
            id: userData.id,
            username: userData.username || testUsername
          };
          
          // Update the user state and storage
          updateUser(formattedUser);
          setIsInitialized(true);
          return;
        }
      } catch (error) {
        console.error('Dev user login failed, trying to register:', error);
      }
      
      // If login failed, try to register
      try {
        const registerResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'include',
          body: JSON.stringify({ 
            username: testUsername,
            password: testPassword
          })
        });
        
        if (registerResponse.ok) {
          const { user: userData } = await registerResponse.json();
          
          if (!userData || !userData.id) {
            throw new Error('Invalid user data in registration response');
          }
          
          // Ensure required fields
          const formattedUser = {
            id: userData.id,
            username: userData.username || testUsername
          };
          
          // Update the user state and storage
          updateUser(formattedUser);
          
          // Add base point for the user
          try {
            await fetch('/api/base-points', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
              },
              credentials: 'include',
              body: JSON.stringify({ x: 0, y: 0 })
            });
          } catch (error) {
            console.error('[setupDevUser] Error adding base point:', error);
          }
        } else {
          const error = await registerResponse.json().catch(() => ({}));
          console.error('Failed to register dev user:', error);
        }
      } catch (error) {
        console.error('Error during dev user registration:', error);
      }
    } catch (error) {
      setIsInitialized(true); // Ensure we don't get stuck in loading state
    }
  };

// Function to verify the current session
  const verifySession = async (savedUser: User) => {
    try {
      
      // Skip verification in development to prevent hanging
      setIsInitialized(true);
      return;
    } catch (error) {
      setIsInitialized(true);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Login failed');
      }

      const { user: userData } = await response.json();
      updateUser(userData);
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
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
      // Even if the API call fails, clear the user from state
      updateUser(null);
      window.location.href = '/';
    }
  };

  return {
    user,
    login,
    logout,
    isInitialized,
  };
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
