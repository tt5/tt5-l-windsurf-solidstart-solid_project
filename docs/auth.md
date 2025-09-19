# Authentication System

This document provides an overview of the authentication system used in the application, including the authentication flow, security measures, and implementation details.

## Table of Contents
- [Authentication Flow](#authentication-flow)
- [Security Measures](#security-measures)
- [API Endpoints](#api-endpoints)
- [Client-Side Implementation](#client-side-implementation)
- [Server-Side Implementation](#server-side-implementation)
- [Development Notes](#development-notes)

## Authentication Flow

1. **Registration**
   - User submits username and password via the registration form
   - Server creates a new user in the database with a hashed password
   - User is redirected to the login page with a success message

2. **Login**
   - User submits credentials via the login form
   - Server verifies credentials and issues a JWT token
   - Token is stored in an HTTP-only cookie
   - User is redirected to the game page

3. **Authenticated Requests**
   - For protected routes, the `withAuth` middleware verifies the JWT token
   - If valid, the request proceeds with user context
   - If invalid or missing, a 401 Unauthorized response is returned

4. **Logout**
   - Clears the authentication cookie
   - Redirects to the login page

## Security Measures

- **JWT Tokens**: Stateless authentication with a 7-day expiration
- **HTTP-only Cookies**: Prevents XSS attacks by making tokens inaccessible to JavaScript
- **Environment Variables**: Sensitive data like JWT_SECRET is stored in environment variables
- **Input Validation**: All user inputs are validated on both client and server
- **Secure Flag**: Cookies are marked as Secure in production to ensure HTTPS-only transmission
- **SameSite Policy**: Prevents CSRF attacks by restricting cookie usage to same-site requests

## API Endpoints

### `POST /api/auth/register`
- Creates a new user account
- **Request Body**: `{ username: string, password: string }`
- **Response**: `{ success: boolean, message: string }`

### `POST /api/auth/login`
- Authenticates a user and issues a JWT token
- **Request Body**: `{ username: string, password: string }`
- **Response**: 
  ```json
  {
    "user": {
      "id": "user_123",
      "username": "example"
    },
    "token": "jwt.token.here"
  }
  ```
  - Sets an HTTP-only cookie with the JWT

### `POST /api/auth/logout`
- Clears the authentication cookie
- **Response**: `{ success: true, message: "Successfully logged out" }`

### `POST /api/auth`
- Validates the current user's token
- **Response**: `{ message: "Authenticated" }` or 401 if not authenticated

## Client-Side Implementation

### Auth Context
- Manages the user's authentication state
- Provides methods for login, logout, and registration
- Persists user data in sessionStorage

### Key Components
- `LoginForm.tsx`: Handles user login
- `RegisterForm.tsx`: Handles user registration
- `ProtectedRoute.tsx`: Wrapper for routes that require authentication

### Authentication Flow
1. User submits credentials via a form
2. Form calls the appropriate auth method from the context
3. On success, updates the auth state and redirects
4. On error, displays an appropriate message

## Server-Side Implementation

### JWT Authentication
- Tokens are signed with a secret key
- Token payload includes: `{ userId: string, username: string, role?: 'admin' | 'user' }`
- Tokens expire after 7 days

### Middleware
- `withAuth`: Protects routes by verifying the JWT token
- `getAuthUser`: Extracts and verifies the user from the request
- `requireAuth`: Middleware that returns 401 if user is not authenticated

### Database
- Users are stored in an SQLite database
- Passwords are hashed before storage (implementation depends on the registration endpoint)

## Development Notes

### Test User
In development mode, a test user is automatically created if it doesn't exist:
- **Username**: testuser
- **Password**: testpass123

### Environment Variables
Required environment variables:
```
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

### Testing Authentication
1. Make a POST request to `/api/auth/login` with test credentials
2. Use the returned token in the `Authorization: Bearer <token>` header for subsequent requests
3. Or let the browser handle cookies automatically for web requests

## Troubleshooting

### Common Issues
1. **Invalid Token**: Ensure the token hasn't expired and is being sent correctly
2. **CORS Issues**: Verify that credentials are included in cross-origin requests
3. **Cookie Not Set**: Check if the domain and path are correct, and that the Secure flag isn't set in development

### Logging
Server-side authentication events are logged to the console for debugging purposes. Look for logs starting with `[auth]` for authentication-related messages.
