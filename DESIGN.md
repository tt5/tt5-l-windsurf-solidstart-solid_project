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