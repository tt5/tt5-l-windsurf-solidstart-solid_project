import { render, screen } from '@solidjs/testing-library';
import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { Router, Route, useNavigate, useLocation } from '@solidjs/router';
import { Component } from 'solid-js';
import LoginForm from '../LoginForm';

// Mock the auth context
const mockLogin = vi.fn();
const mockLogout = vi.fn();

// Mock the useAuth hook
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: () => null,
    login: mockLogin,
    logout: mockLogout,
    isInitialized: () => true,
  }))
}));

// Mock the router
const mockNavigate = vi.fn();
const mockLocation = {
  pathname: '/login',
  search: '?returnUrl=/game',
  hash: '',
  state: null,
  key: 'test',
};

vi.mock('@solidjs/router', async () => {
  const actual = await vi.importActual('@solidjs/router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

// Mock window.location
const originalLocation = window.location;


// Set up the test environment
beforeAll(() => {
  // Mock window.location
  Object.defineProperty(window, 'location', {
    value: {
      ...originalLocation,
      search: '?returnUrl=/game',
      href: 'http://localhost/login',
      assign: vi.fn(),
      replace: vi.fn(),
    },
    writable: true,
  });
});

// Clean up after tests
afterEach(() => {
  vi.clearAllMocks();
});

// Reset mocks after all tests
afterAll(() => {
  vi.restoreAllMocks();
  Object.defineProperty(window, 'location', { value: originalLocation });
});

const renderLoginForm = () => {
  return render(() => (
    <Router>
      <Route path="/">
        <LoginForm />
      </Route>
    </Router>
  ));
};

describe('LoginForm', () => {
  it('renders the login form', async () => {
    renderLoginForm();
    
    // Wait for the form to be rendered
    await screen.findByText('Sign In');
    
    // Check if form elements are rendered
    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    const registerLink = screen.getByText(/register here/i);
    
    expect(usernameInput).toBeInTheDocument();
    expect(usernameInput).toHaveAttribute('type', 'text');
    expect(usernameInput).toHaveAttribute('id', 'username');
    
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('id', 'password');
    
    expect(submitButton).toBeInTheDocument();
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });
});
