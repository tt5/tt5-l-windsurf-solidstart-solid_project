import { createContext, createEffect, createSignal, useContext, type ParentComponent } from 'solid-js';

type User = { id: string; username: string } | null;

interface AuthStore {
  user: () => User;
  login: (username: string) => User;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
  isInitialized: () => boolean;
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
  const [isInitialized, _setIsInitialized] = createSignal(false);
  
  // Wrapper to log isInitialized state changes
  const setIsInitialized = (value: boolean) => {
    console.log(`[Auth] Setting isInitialized to: ${value}`, new Error().stack);
    _setIsInitialized(value);
  };
  
  const updateUser = (userData: User) => {
    setUser(userData);
    userData ? localStorage.setItem('user', JSON.stringify(userData)) : localStorage.removeItem('user');
  };

  // Initialize auth state
  createEffect(() => {
    if (typeof window === 'undefined') return;
    
    console.log('Auth effect running...');
    const isDev = import.meta.env.DEV;
    console.log('Development mode:', isDev);
    
    // Check for saved user first
    const savedUser = localStorage.getItem('user');
    console.log('Saved user from localStorage:', savedUser);
    
    if (savedUser) {
      console.log('Found saved user in localStorage');
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && typeof parsed === 'object' && parsed.user && parsed.user.id) {
          console.log('Updating user from localStorage:', parsed);
          updateUser(parsed.user);
          
          // In development, verify the session is still valid
          if (isDev) {
            console.log('Verifying session for user:', parsed.user.id);
            verifySession(parsed.user);
          } else {
            console.log('Production mode, skipping session verification');
            setIsInitialized(true);
          }
          return;
        } else {
          console.warn('Saved user is not in the expected format:', parsed);
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        updateUser(null);
      }
    } else {
      console.log('No saved user found in localStorage');
    }
    
    // If we get here, either there's no saved user or there was an error
    console.log('Setting isInitialized to true');
    setIsInitialized(true);
    
    // In development, try to auto-login if no user is set
    if (isDev) {
      console.log('Development mode - attempting to auto-login');
      setupDevUser().catch(error => {
        console.error('Error during auto-login:', error);
        setIsInitialized(true);
      });
    } else {
      console.log('Production mode - skipping auto-login');
      setIsInitialized(true);
    }
  });
  
  // Development-only function to set up a test user
  const setupDevUser = async () => {
    if (import.meta.env.PROD) {
      console.log('Not in production, skipping dev user setup');
      return;
    }
    
    console.log('[setupDevUser] Starting development user setup...');
    // Use devuser for development
    const testUsername = 'devuser';
    const testPassword = 'devpassword'; // In a real app, use environment variables
    
    console.log('[setupDevUser] Environment variables:', {
      NODE_ENV: import.meta.env.NODE_ENV,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD
    });
    
    try {
      // First, try to log in
      console.log('[setupDevUser] Attempting to log in with username:', testUsername);
      const loginUrl = '/api/auth/login';
      console.log(`[setupDevUser] Making request to: ${loginUrl}`);
      
      const loginStartTime = Date.now();
      const loginResponse = await fetch(loginUrl, {
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
      }).catch(error => {
        console.error('[setupDevUser] Login request failed:', error);
        throw error;
      });
      
      console.log(`[setupDevUser] Login response received in ${Date.now() - loginStartTime}ms`);
      console.log('[setupDevUser] Login response status:', loginResponse.status);
      
      // Process the response
      const responseText = await loginResponse.text();
      console.log('[setupDevUser] Response body:', responseText);
      
      if (loginResponse.ok) {
        try {
          const userData = JSON.parse(responseText);
          console.log('[setupDevUser] Login successful, user data:', userData);
          
          // Ensure the user data is in the correct format
          const formattedUser = {
            user: {
              id: userData.id || `user_${Math.random().toString(36).substr(2, 9)}`,
              username: userData.username || testUsername
            }
          };
          
          // Save the formatted user to localStorage
          localStorage.setItem('user', JSON.stringify(formattedUser));
          console.log('[setupDevUser] User saved to localStorage');
          
          // Update the user state
          updateUser(formattedUser.user);
          setIsInitialized(true);
          return;
        } catch (error) {
          console.error('[setupDevUser] Error processing login response:', error);
          throw error;
        }
      } else {
        console.error(`[setupDevUser] Login failed with status ${loginResponse.status}:`, responseText);
        throw new Error(`Login failed with status ${loginResponse.status}`);
      }
      
      console.log('[setupDevUser] Login response status:', loginResponse.status);
      
      // Log response headers for debugging
      const headers: Record<string, string> = {};
      loginResponse.headers.forEach((value, key) => {
        headers[key] = value;
      });
      console.log('[setupDevUser] Response headers:', headers);
      
      // Try to read response body for debugging
      try {
        const responseText = await loginResponse.text();
        console.log('[setupDevUser] Response body:', responseText);
        // Re-create response for further processing
        response = new Response(responseText, {
          status: loginResponse.status,
          statusText: loginResponse.statusText,
          headers: loginResponse.headers
        });
      } catch (error) {
        console.error('[setupDevUser] Failed to read response body:', error);
        throw error;
      }
      
      // If login fails with 401 (Unauthorized), try to register
      if (loginResponse.status === 401) {
        console.log('Login failed, attempting to register...');
        const createResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: testUsername,
            password: testPassword
          })
        });
        
        if (!createResponse.ok) {
          const error = await createResponse.json().catch(() => ({}));
          console.error('Failed to register user:', error);
          throw new Error('Failed to register dev user');
        }
        
        console.log('User registered, attempting to log in...');
        // Try to log in again after registration
        response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            username: testUsername,
            password: testPassword
          })
        });
      } else {
        response = loginResponse;
      }
      
      console.log('Login response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('Successfully logged in development user:', userData);
        updateUser(userData);
        // Save user to localStorage for persistence
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('User saved to localStorage');
        // Set initialized to true after successful login
        setIsInitialized(true);
        console.log('isInitialized set to true after successful login');
      } else {
        const errorText = await response.text();
        console.warn('Failed to set up development user, continuing without auto-login. Status:', response.status, 'Response:', errorText);
        setIsInitialized(true); // Still set initialized to true to unblock the UI
        console.log('isInitialized set to true after failed login attempt');
      }
    } catch (error) {
      console.error('Error setting up development user:', error);
      setIsInitialized(true); // Ensure we don't get stuck in loading state
    }
  };

  // Function to verify the current session
  const verifySession = async (savedUser: User) => {
    try {
      console.log('Verifying session for user:', savedUser?.id);
      
      // Skip verification in development for now to prevent hanging
      if (import.meta.env.DEV) {
        console.log('Development mode - skipping session verification');
        setIsInitialized(true);
        return;
      }
      
      console.log('Making request to /api/auth/me...');
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('Session verification response status:', response.status);
      
      if (response.ok) {
        console.log('Session is valid');
        setIsInitialized(true);
      } else {
        const errorText = await response.text().catch(() => 'Failed to read error message');
        console.log(`Session invalid (${response.status}):`, errorText);
        
        // In development, just continue with the saved user
        if (import.meta.env.DEV) {
          console.log('Development mode - continuing with saved user');
          setIsInitialized(true);
          return;
        }
        
        // In production, try to log in again
        console.log('Attempting to log in...');
        try {
          await setupDevUser();
        } catch (err) {
          console.error('Error in setupDevUser:', err);
          setIsInitialized(true);
        }
      }
    } catch (error) {
      console.error('Error verifying session:', error);
      // In development, continue anyway
      if (import.meta.env.DEV) {
        console.log('Development mode - continuing despite session verification error');
      }
      setIsInitialized(true);
    }
  };

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

  return {
    user,
    login,
    logout,
    deleteAccount,
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
