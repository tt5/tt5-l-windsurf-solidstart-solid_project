# Application Design

## Navigation
- **Home Page**: Welcome screen with navigation to Login, Register, and Game
- **Authentication**: Secure login and registration flows
- **Game Interface**: Main gameplay area with interactive board

## Game Layout

### Main Components
1. **Game Board**
   - 7x7 grid representing the play area
   - Each square can be in different states (normal, selected, base point, player position)
   - Responsive design that maintains square aspect ratio

2. **Side Panel**
   - **Info Tab**:
     - Player stats
     - Game instructions
     - Current score/level
   - **Settings Tab**:
     - Game preferences
     - Sound controls
     - Theme selection

## Game Objective

### Core Gameplay
- **Primary Goal**: 
  - Players explore an infinite 2D grid world by moving their viewport
  - The objective is to create interesting patterns by strategically placing base points

### Territory Control
- **Base Points**:
  - Placing a base point claims all empty squares in straight lines (horizontal, vertical, and both diagonals) from that point
  - **Base Point Mechanics**:
    - When a base point is placed, it's stored in the database with its coordinates and timestamp
    - The viewport displays a 7x7 grid (0-6 in both x and y) of the infinite world
    - World coordinates are calculated relative to the viewport's top-left corner:
      ```typescript
      const gridX = index % GRID_SIZE;  // 0-6
      const gridY = Math.floor(index / GRID_SIZE);  // 0-6
      const worldX = gridX - playerOffsetX;
      const worldY = gridY - playerOffsetY;
      ```
    - The player's position is always at the top-left of the visible grid
    
  - **Player Interaction**:
    - Players can only place base points on unclaimed squares
    - The UI prevents placing base points on already claimed squares
    - As the viewport moves, the game fetches base points for the visible area
    - The client-side validation ensures players can't place base points that would conflict with:
      - Already visible base points
      - Potentially conflicting base points that would be in the cleanup queue
    - This prevents placing base points that would be removed by the next scheduled cleanup process (which runs every 10 seconds)
  
  - **Conflict Resolution**:
    - A scheduled cleanup process runs periodically to resolve conflicting claims
    - Base points are considered in conflict if they share the same:
      - X coordinate (vertical line)
      - Y coordinate (horizontal line)
      - Diagonal (x-y difference)
      - Anti-diagonal (x+y sum)
    - When conflicts are found, the oldest base point (by ID or timestamp) is kept
    - All newer conflicting base points are automatically removed
    - The point at (0,0) is always preserved and never removed
  - **Visual Distinction**:
    - The base point itself is highlighted for better visibility
  - **Persistence**:
    - **Database Storage**:
      - Each base point is stored with the following fields:
        - `id`: Unique identifier (auto-incrementing integer or UUID)
        - `x`: X-coordinate in world space (integer)
        - `y`: Y-coordinate in world space (integer)
        - `player_id`: Identifier of the player who placed the point
        - `created_at`: Timestamp of when the point was created
        - `is_protected`: Boolean flag for special points like (0,0)
    - **Real-time Updates**:
      - **Synchronization Flow**:
        1. **Client-side Validation**:
           - **Coordinate Validation**:
             - Ensure coordinates are within the valid integer range
             - Check if the position is already occupied by a fetched base point
             - Verify the point doesn't conflict with any known base points in the current viewport
             - Note: The client only has knowledge of base points that have been fetched for the visible area
           - **Game Rules Check**:
             - **Player Permissions**:
               - Verify the player is authenticated
               - Check if the player is allowed to place points in the current game state
             - **Viewport Validation**:
               - Points can only be placed within the current 7x7 viewport
               - The point must be on a valid grid coordinate
               - The target square must not already contain a base point
           - **Optimistic Update**:
             - Immediately show the point in the UI for instant feedback
             - Mark it as 'pending' until server confirmation
        
        2. **Server Submission**:
           - Only validated points are sent to the server
           - The request includes player authentication and point coordinates
           - The client waits up to 10 seconds for a server response before timing out
        
        3. **Server Processing**:
           - The server performs additional validation
           - If valid, the point is stored in the database
           - The database change triggers real-time updates to all connected clients
        
        4. **Client Update**:
           - On successful server response (status 200), the new base point is added to the local state
           - The UI updates immediately to show the new base point
           - If there's an error (e.g., duplicate point, validation failure), an error message is shown
           - The client maintains a loading state (`isSaving`) during the request to prevent duplicate submissions
      - **Technology Stack**:
        - Optimistic UI updates for instant feedback while waiting for server confirmation
        - Conflict resolution ensures all clients eventually reach the same state
      - **Performance Considerations**:
        - Only the minimal necessary data is sent in each update
        - The client only loads base points visible in the current viewport
        - The system is optimized to handle individual updates efficiently
      - **Consistency**:
        - The database remains the single source of truth
        - All game state changes flow through the server
        - The client implements basic error handling for failed requests
        - Note: Automatic reconnection on network failure is not currently implemented
    - **Querying**:
      - Base points are queried based on the current viewport coordinates
      - The game only loads points visible in the current 7x7 grid
      - Queries are optimized with spatial indexes for fast lookups
    - **World State**:
      - The complete world state is distributed across all base points
      - No separate storage is needed for claimed areas - they're calculated dynamically
      - The point at (0,0) is always preserved in the database

### Strategic Elements
- **Line of Sight**:
  - Base points project influence in straight lines until blocked by another base point
  - Careful placement can block opponents' expansion while maximizing your own
  - The point at (0,0) is a special protected point that cannot be claimed

### Multiplayer Interaction
- **Shared World**:
  - All players exist in the same persistent world
  - Base points from all players are visible when in the current viewport
  - The world state is synchronized in real-time for all players

### Special Modes
- **Challenges**:
  - Time-limited events with special rules
  - Limited-move challenges where each base point placement counts
  - Puzzle modes with specific objectives to complete

## Game Mechanics

### Board System
- **Coordinate System**:
  - **Absolute Coordinates**:
    - Top-left corner of the entire game world is (0,0)
    - X increases to the right, Y increases downward
    - World coordinates can extend infinitely in all directions
  
  - **Relative Coordinates (Viewport)**:
    - The visible grid is a 7x7 window into the game world
    - The player's avatar is permanently fixed at world position (0,0)
    - The viewport can be moved using arrow keys to explore the world
    - The player's position never changes - only the viewport moves
    - Example: 
      - Initially, the viewport is centered on the player at (0,0)
      - Pressing right arrow moves the viewport right, revealing world to the left
      - The player remains at world (0,0) but may go off-screen as the viewport moves
    - The viewport can be moved freely to explore different areas while the player stays at (0,0)
  
  - **Position Calculation**:
    - The player is always at world position (0,0)
    - The viewport has its own coordinates that change as it moves
    - World coordinates visible in the viewport are calculated as:
      - Top-left of viewport: (-offsetX, -offsetY)
      - Bottom-right of viewport: (6-offsetX, 6-offsetY)
    - The player is only visible when the viewport includes (0,0)

### Player Interaction
- **Viewport Movement**:
  - Arrow keys pan the viewport in the corresponding direction
  - The player remains fixed at world position (0,0)
  - The viewport moves to explore different parts of the world
  - The player may go off-screen if the viewport is moved away from (0,0)

- **Square Selection**:
  - Click on any unselected square to add a base point
  - Base points are visually distinct on the grid
  - The viewport displays:
    - All base points the player has added (if they are within the current viewport)
    - Any fetched base points that are within the current viewport
  - The player can have multiple base points across the world

- **Base Point Management**:
  - **Deletion of Base Points**:
    - Base points are automatically cleaned up to maintain game balance and prevent duplication
    - A scheduled task runs periodically (every 10 seconds) to identify and remove duplicate base points
    - A base point is considered a duplicate if:
      - Another point exists on the same x or y axis (straight lines)
      - Another point exists on the same diagonal (x-y or x+y)
    - When duplicates are found, the system keeps the oldest point (lowest ID) and removes newer duplicates
    - The point at world coordinate (0,0) is always preserved
    - Players can also manually trigger cleanup via the `/api/cleanup-lines` endpoint (admin only in production)
    - The cleanup process is logged for monitoring and debugging purposes

- **Visual Feedback**:
  - Selected squares are visually distinct
  - The viewport moves smoothly when panning
  - The player is highlighted when visible in the viewport

### Game State
- Tracks:
  - Current viewport position (world coordinates of the top-left corner)
  - Selected squares in viewport coordinates (0,0) to (6,6)
  - Base points:
    - Tracks base points for all players in the game
    - Each point includes the owner's userId
    - Points are fetched based on viewport visibility
    - Includes both the player's own points and those of others in range
  - Game progress:
    - Tracks the player's base points with the following details:
      - Each base point has: id, x/y coordinates, userId, and creation timestamp
      - Points are stored in local state and synced with the server
      - Prevents duplicate base points at the same coordinates
      - Fetches base points in these scenarios:
        - On component mount (initial load)
        - When the current user changes
        - When the viewport position changes:
          - Triggered by Solid's `createEffect` hook tracking `currentPosition`
          - Fetches base points relative to the new viewport position
          - Uses world coordinates (current position + offset)
          - Prevents duplicate fetches with request deduplication
          - Updates the visible grid with base points in the new view
      - Visual feedback for base points on the grid
    - Viewport position history for navigation
    - No explicit scoring or achievements in current implementation

## UI/UX Considerations
- Clean, minimal interface
- Clear visual hierarchy
- Fixed-size 7x7 grid (315px × 315px)
- Centered layout with max-width of 600px
- Basic accessibility features (keyboard navigation, focus states)

*Note: The interface currently uses fixed dimensions and is not fully responsive across all screen sizes.*

## Technical Implementation
- Built with SolidJS and TypeScript
- State management using Solid's reactive primitives
- Modular component architecture
- **Error Handling**:
  - ✅ API call error handling with console logging
  - ✅ Input validation for coordinates (0-6 range)
  - ❌ User-facing error messages (only console logging)
  - ✅ Graceful degradation (app remains functional)
  - ✅ Timeout handling for API requests (10s)
  
- **Loading States**:
  - ❌ Loading indicator during initial data fetch (state exists but not displayed)
  - ✅ Disabled states during save operations
  - ❌ No visual feedback for ongoing API calls
  - ✅ State management for concurrent requests
  - ❌ No skeleton loaders or optimistic UI updates