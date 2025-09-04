import { useAuth } from '~/contexts/auth';
import { createSignal } from 'solid-js';

export default function DeleteAccount() {
  const { user, logout } = useAuth();
  const [isDeleting, setIsDeleting] = createSignal(false);
  const [error, setError] = createSignal('');

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user()?.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      // Logout after successful deletion
      await logout();
      window.location.href = '/';
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div class="mt-8 p-4 border border-red-500 rounded-lg">
      <h3 class="text-lg font-medium text-red-600">Danger Zone</h3>
      <p class="mt-2 text-sm text-gray-600">
        Deleting your account will remove all your data permanently. This action cannot be undone.
      </p>
      
      <button
        onClick={handleDeleteAccount}
        disabled={isDeleting()}
        class={`mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
          isDeleting() ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isDeleting() ? 'Deleting...' : 'Delete My Account'}
      </button>
      
      {error() && (
        <p class="mt-2 text-sm text-red-600">{error()}</p>
      )}
    </div>
  );
}
