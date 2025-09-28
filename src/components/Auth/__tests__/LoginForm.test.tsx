import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { Router } from '@solidjs/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createContext, useContext } from 'solid-js';
import LoginForm from '../LoginForm';
import { AuthProvider, useAuth } from '../../../contexts/AuthContext';

// Mock the AuthContext
const mockLogin = vi.fn();
const mockAuth = {
  user: () => ({
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    createdAt: new Date().toISOString()
  }),
  login: mockLogin,
  logout: vi.fn(),
  isInitialized: () => true,
};

// Mock the AuthContext
vi.mock('../../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(() => mockAuth),
  };
});


describe('LoginForm', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  const renderLoginForm = () => {
    return render(() => (
      <Router>
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      </Router>
    ));
  };

  it('renders the login form', () => {
    renderLoginForm();
    
    // Check if form elements are rendered
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    
    // Check for registration link
    const registerLink = screen.getByText(/don't have an account/i);
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });

  it('validates form inputs', async () => {
    renderLoginForm();
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Try to submit empty form
    fireEvent.click(submitButton);
    
    // Check for validation errors
    expect(await screen.findByText(/username is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('submits the form with valid data', async () => {
    const testUser = {
      username: 'testuser',
      password: 'password123'
    };

    // Mock a successful login
    mockLogin.mockResolvedValueOnce({ success: true });
    
    renderLoginForm();
    
    // Fill in the form
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.input(usernameInput, {
      target: { value: testUser.username }
    });
    
    fireEvent.input(passwordInput, {
      target: { value: testUser.password }
    });
    
    // Verify inputs have the correct values
    expect(usernameInput).toHaveValue(testUser.username);
    expect(passwordInput).toHaveValue(testUser.password);
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Check if login was called with the right credentials
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        testUser.username,
        testUser.password
      );
    });
  });

  it('shows error message when login fails', async () => {
    const errorMessage = 'Invalid credentials';
    
    // Mock a failed login
    mockLogin.mockRejectedValueOnce(new Error(errorMessage));
    
    renderLoginForm();
    
    // Fill in the form
    fireEvent.input(screen.getByLabelText(/username/i), {
      target: { value: 'wronguser' }
    });
    
    fireEvent.input(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpass' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Check if error message is displayed
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });
});
