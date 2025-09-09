import { User } from '~/types/user';

type DevUserConfig = {
  username: string;
  password: string;
};

const DEFAULT_DEV_USER: DevUserConfig = {
  username: 'devuser',
  password: 'devpassword',
};

export async function setupDevUser(updateUser: (user: User | null) => void): Promise<boolean> {
  // Skip in production
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return false;
  }

  const { username, password } = getDevUserConfig();

  try {
    // Try to log in first (in case the user already exists)
    const loginSuccess = await tryDevUserLogin(username, password, updateUser);
    if (loginSuccess) return true;

    // If login failed, try to register
    const registerSuccess = await registerDevUser(username, password, updateUser);
    return registerSuccess;
  } catch (error) {
    console.error('Error in dev user setup:', error);
    return false;
  }
}

async function tryDevUserLogin(
  username: string,
  password: string,
  updateUser: (user: User | null) => void
): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    
    if (response.ok) {
      const { user: userData } = await response.json();
      
      if (!userData?.id) {
        throw new Error('Invalid user data in login response');
      }
      
      updateUser({
        id: userData.id,
        username: userData.username || username
      });
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Dev user login failed:', error);
    return false;
  }
}

async function registerDevUser(
  username: string,
  password: string,
  updateUser: (user: User | null) => void
): Promise<boolean> {
  try {
    // Try to register
    const registerResponse = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    
    if (!registerResponse.ok) {
      const error = await registerResponse.json().catch(() => ({}));
      throw new Error(`Registration failed: ${JSON.stringify(error)}`);
    }
    
    // If registration succeeded, try to log in
    return await tryDevUserLogin(username, password, updateUser);
  } catch (error) {
    console.error('Dev user registration failed:', error);
    return false;
  }
}

function getDevUserConfig(): DevUserConfig {
  // In a real app, you might want to load these from environment variables
  // with proper validation and fallbacks
  if (typeof process !== 'undefined') {
    return {
      username: process.env.DEV_USERNAME || DEFAULT_DEV_USER.username,
      password: process.env.DEV_PASSWORD || DEFAULT_DEV_USER.password,
    };
  }
  
  // For browser environment, use defaults or values from window.config
  if (typeof window !== 'undefined' && (window as any).config?.devUser) {
    return {
      ...DEFAULT_DEV_USER,
      ...(window as any).config.devUser,
    };
  }
  
  return DEFAULT_DEV_USER;
}

// Type declaration for window.config
declare global {
  interface Window {
    config?: {
      devUser?: Partial<DevUserConfig>;
    };
  }
}
