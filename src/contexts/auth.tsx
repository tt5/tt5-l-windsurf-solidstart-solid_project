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
    _setIsInitialized(value);
    
    // Verify the state was actually updated
    setTimeout(() => {
      console.log('[Auth] isInitialized after set:', isInitialized());
    }, 0);
  };
  
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
          
          // In development, verify the session is still valid
          if (isDev) {
            verifySession(userData);
          } else {
            setIsInitialized(true);
          }
          return;
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
      // First, try to register the user
      const registerUrl = '/api/auth/register';
      
      const registerResponse = await fetch(registerUrl, {
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
      
      const registerData = await registerResponse.json();
      
      // Now try to log in
      const loginUrl = '/api/auth/login';
      
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
      });
      
      // Process the response
      const responseText = await loginResponse.text();
      
      if (loginResponse.ok) {
        try {
          const responseData = JSON.parse(responseText);
          
          // Extract user data from the response
          const userData = responseData.user || responseData;
          
          if (!userData || !userData.id) {
            throw new Error('Invalid user data in response');
          }
          
          // Ensure required fields
          const formattedUser = {
            id: userData.id,
            username: userData.username || testUsername
          };
          
          // Save the user data directly (not nested under 'user')
          localStorage.setItem('user', JSON.stringify(formattedUser));
          
          // Update the user state
          updateUser(formattedUser);
          
          // Add base point for the user
          try {
            const basePointResponse = await fetch('/api/base-points', {
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
      
      // Log response headers for debugging
      const headers: Record<string, string> = {};
      loginResponse.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      // Try to read response body for debugging
      try {
        const responseText = await loginResponse.text();
        // Re-create response for further processing
        response = new Response(responseText, {
          status: loginResponse.status,
          statusText: loginResponse.statusText,
          headers: loginResponse.headers
        });
      } catch (error) {
        throw error;
      }
      
      // If login fails with 401 (Unauthorized), try to register
      if (loginResponse.status === 401) {
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
          throw new Error('Failed to register dev user');
        }
        
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
      
      if (response.ok) {
        const userData = await response.json();
        updateUser(userData);
        // Save user to localStorage for persistence
        localStorage.setItem('user', JSON.stringify(userData));
        // Set initialized to true after successful login
        setIsInitialized(true);
      } else {
        const errorText = await response.text();
        setIsInitialized(true); // Still set initialized to true to unblock the UI
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
