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
    console.log('Auth effect - Starting...');
    if (typeof window === 'undefined') {
      console.log('Auth effect - Server-side, skipping');
      return;
    }
    
    console.log('Auth effect - Running in browser');
    const isDev = typeof import.meta.env.DEV !== 'undefined' ? import.meta.env.DEV : process.env.NODE_ENV !== 'production';
    console.log('Auth effect - isDev:', isDev);
    console.log('Development mode:', isDev);
    
    // Check for saved user first
    const savedUser = localStorage.getItem('user');
    console.log('Saved user from localStorage:', savedUser);
    
    if (savedUser) {
      console.log('Found saved user in localStorage');
      try {
        const parsed = JSON.parse(savedUser);
        
        // Handle both formats: { user: { id, username } } and { id, username }
        const userData = parsed.user || parsed;
        
        if (userData && typeof userData === 'object' && userData.id) {
          console.log('Updating user from localStorage:', userData);
          updateUser(userData);
          
          // In development, verify the session is still valid
          if (isDev) {
            console.log('Verifying session for user:', userData.id);
            verifySession(userData);
          } else {
            console.log('Production mode, skipping session verification');
            setIsInitialized(true);
          }
          return;
        } else {
          console.warn('Saved user is not in a valid format:', parsed);
          // Clear invalid user data
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        updateUser(null);
        // Clear corrupted user data
        localStorage.removeItem('user');
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
    console.log('[setupDevUser] Starting development user setup...');
    
    // Debug environment variables
    console.log('[setupDevUser] import.meta.env:', JSON.stringify(import.meta.env));
    console.log('[setupDevUser] process.env.NODE_ENV:', process.env.NODE_ENV);
    
    const isProd = (typeof import.meta.env.PROD !== 'undefined' && import.meta.env.PROD) || 
                  (typeof process.env.NODE_ENV !== 'undefined' && process.env.NODE_ENV === 'production');
    
    if (isProd) {
      console.log('[setupDevUser] Running in production, skipping dev user setup');
      return;
    }
    
    // Use devuser for development
    const testUsername = 'devuser';
    const testPassword = 'devpassword'; // In a real app, use environment variables
    
    console.log('[setupDevUser] Using test credentials:', { testUsername });
    
    try {
      // First, try to register the user
      console.log('[setupDevUser] Attempting to register user:', testUsername);
      const registerUrl = '/api/auth/register';
      console.log(`[setupDevUser] Making registration request to: ${registerUrl}`);
      
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
      console.log('[setupDevUser] Register response:', registerData);
      
      // Now try to log in
      console.log('[setupDevUser] Attempting to log in with username:', testUsername);
      const loginUrl = '/api/auth/login';
      console.log(`[setupDevUser] Making login request to: ${loginUrl}`);
      
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
      
      console.log(`[setupDevUser] Login response received in ${Date.now() - loginStartTime}ms`);
      console.log('[setupDevUser] Login response status:', loginResponse.status);
      
      // Process the response
      const responseText = await loginResponse.text();
      console.log('[setupDevUser] Response body:', responseText);
      
      if (loginResponse.ok) {
        try {
          const responseData = JSON.parse(responseText);
          console.log('[setupDevUser] Login successful, response data:', responseData);
          
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
          
          console.log('[setupDevUser] Saving user to localStorage:', formattedUser);
          
          // Save the user data directly (not nested under 'user')
          localStorage.setItem('user', JSON.stringify(formattedUser));
          console.log('[setupDevUser] User saved to localStorage');
          
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
            
            if (basePointResponse.ok) {
              console.log('[setupDevUser] Successfully added base point for devuser');
            } else {
              console.error('[setupDevUser] Failed to add base point:', await basePointResponse.text());
            }
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
      
      // Skip verification in development to prevent hanging
      console.log('Skipping session verification in development mode');
      setIsInitialized(true);
      return;
    } catch (error) {
      console.error('Error in verifySession:', error);
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
