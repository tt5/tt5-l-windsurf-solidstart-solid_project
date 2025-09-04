import { createSignal } from 'solid-js';
import { A, useNavigate, useLocation } from '@solidjs/router';
import { useAuth } from '~/contexts/auth';

export default function LoginForm() {
  const [username, setUsername] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal('');
  const [isLoading, setIsLoading] = createSignal(false);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  // Check for registration success message
  const registered = location.state?.registered;

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({
          username: username(),
          password: password(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Update auth context with the logged in user
      auth.login(username());
      
      // Redirect to game page after successful login
      navigate('/game', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 class="text-2xl font-bold mb-6 text-center">Sign In</h2>
      
      {registered && (
        <div class="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          Registration successful! Please sign in.
        </div>
      )}
      
      {error() && (
        <div class="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error()}
        </div>
      )}
      
      <form onSubmit={handleSubmit} class="space-y-4">
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username()}
            onInput={(e) => setUsername(e.currentTarget.value)}
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <button
            type="submit"
            disabled={isLoading()}
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading() ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </form>
      
      <div class="mt-4 text-center text-sm">
        <span class="text-gray-600">Don't have an account? </span>
        <A href="/register" class="font-medium text-blue-600 hover:text-blue-500">
          Sign up
        </A>
      </div>
    </div>
  );
}
