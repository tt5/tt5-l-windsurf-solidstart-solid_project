# Join/Leave Game Implementation

## Key Components to Implement

### 1. User State Management
- Track if a user has joined the game
- Store the user's home starting point

### 2. Game Joining Logic
- Create a new base point at (-3, -2) from the oldest base point
- Update the user's home position
- Handle the special timestamp logic

### 3. Game Leaving Logic
- Clean up when a user leaves the game
- Handle logout scenarios

### 4. Access Control
- Restrict base point creation to users who have joined
- Allow movement for all users

## Implementation Plan

### 1. Database Changes
- Add `game_joined` boolean column to the users table
- Add `home_x` and `home_y` columns to track the user's home position

### 2. API Endpoints
- `POST /api/game/join` - Handle joining the game
- `POST /api/game/leave` - Handle leaving the game

### 3. Authentication Middleware
- Add game join status to the session/user object

### 4. Frontend Components
- Join/Leave game buttons
- UI updates based on join status

## Considerations:

Concurrency: The join operation should be atomic to prevent race conditions when multiple users join simultaneously.

Error Handling: Properly handle cases where the oldest point might be deleted between fetching and processing.