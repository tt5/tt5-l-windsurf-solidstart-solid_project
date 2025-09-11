# Game Design Document

## Core Concept
- **Game Grid Implementation**:
  - **Viewport Movement**:
    - Fixed 7×7 grid (configured in `BOARD_CONFIG.GRID_SIZE`)
    - Movement handled by `handleDirection` in `boardUtils.ts`
    - Movement process:
      1. Calculates new position using `getMovementDeltas`
      2. Updates restricted squares using `moveSquares`
      3. Handles border squares based on movement direction
      4. Updates position and loads relevant base points
    - Position tracked in grid coordinates [x, y]
    - Viewport renders the fixed grid with relative positioning
  - **Coordinate System**:
    - Grid coordinates: [x, y] tuples (0 to GRID_SIZE-1)
    - Grid indices: 0 to (GRID_SIZE² - 1)
    - Conversion between coordinates and indices handled by:
      - `pointsToIndices`
      - `indicesToPoints`
- **Strategic Placement and Territory**:
  - **Territory Definition**:
    - Area uniquely claimed by a player's base point
    - Determined by lines that don't intersect with other players' lines
    - Visual representation is limited in current implementation
  - **Base Points**:
    - Claim lines in multiple directions:
      1. **Cardinal Directions**:
         - Horizontal (left/right)
         - Vertical (up/down)
      2. **Diagonals**:
         - Top-left to bottom-right
         - Top-right to bottom-left
      3. **Prime-numbered Slopes**:
         - 2:1 and 1:2 slopes in all directions
    - Implementation (`calculateRestrictedSquares` in `boardUtils.ts`):
      - Uses array operations to calculate line coverage
      - Handles grid boundaries
      - Combines results using Set to avoid duplicates
      - Returns 1D array of restricted square indices
  - **Pattern Creation**:
    - Base points create lines in multiple directions
    - Current visualization:
      - Base points shown as simple markers
      - Selected squares highlighted
      - No visual representation of claimed territory
    - Internal tracking:
      - Lines extend until grid boundaries
      - Intersection logic is calculated but not visually represented
  - **Special Rules**:
    - (0,0) is a protected position
    - **Line Cleanup Process** (`/api/cleanup-lines`):
      - Admin-triggered (not automatic)
      - Selects 2-4 random slopes (including prime-numbered slopes)
      - For each slope:
        1. Identifies all points forming straight lines
        2. Deletes all but the oldest point in each line
      - Preserves the first point in each line (by ID)
      - Handles errors gracefully
      - Returns cleanup statistics
- **Multiplayer Implementation**:
  - Shared state via database
  - Updates triggered by:
    - Game load
    - Player movement
    - Base point placement
  - Pull-based updates (no automatic refresh)
  - No real-time synchronization

## Game Mechanics
- Fixed 7×7 grid world
- Place base points to claim territory
- Server-side persistence with client-side state
- Admin-triggered cleanup process

## Technical Implementation
- **Frontend**:
  - SolidJS for reactive UI
  - Client-side state management
  - Grid-based rendering
- **Backend**:
  - Node.js with database
  - RESTful API endpoints
  - No real-time updates

## Performance Considerations
- Client-side filtering of base points
- Simple coordinate-based queries
- No spatial indexing
- Basic error handling

## Multiplayer Features
- Shared world state via database
- Basic conflict resolution
- No real-time synchronization
- Simple pull-based updates