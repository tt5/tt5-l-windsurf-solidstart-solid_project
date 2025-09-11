# Game Design Document

## Core Concept
- Infinite 2D grid world where players place base points
- Strategic placement creates patterns and claims territory:
  - **Territory Definition**:
    - A territory consists of all squares that are uniquely claimed by a player's base point
    - It's the area where a player's lines don't intersect with other players' lines
  - **Base Points**:
    - Each base point claims lines in 4 directions (horizontal, vertical, both diagonals)
    - Lines extend infinitely until hitting another base point
  - **Pattern Creation**:
    - When base points are placed, they create lines in 4 directions (like a + and X combined)
    - The current implementation shows:
      - Base points as simple markers (circles) on the grid
      - Selected squares are highlighted with a different background color
      - No visual representation of claimed territory or line intersections yet
    - The pattern logic is calculated but not visually represented:
      - Lines extend until they hit another base point
      - Intersections are tracked internally
      - The visual representation is currently limited to individual base points
  - **Special Rules**:
    - The point at (0,0) is protected and cannot be claimed
    - **Line Cleanup Process**:
      - The system runs an automatic cleanup every 30 seconds
      - During cleanup, it selects 2-4 random line slopes (including horizontal, vertical, and diagonal)
      - For each selected slope, it finds all points that form straight lines in that direction
      - For each line of points, it removes all points except the oldest one (by ID)
      - This creates a dynamic territory control system where only the first point in a line is preserved
      - The cleanup process is logged for monitoring and debugging purposes
      - The process is idempotent and handles errors gracefully to prevent server crashes
- **Multiplayer Experience**:
  - The world state is shared across all players through a central database
  - Updates are fetched when:
    - The game first loads
    - The player moves to a new position
    - A new base point is placed
  - There is no automatic refresh or push-based updates
  - Players need to move or take actions to see others' changes
  - The system uses a pull-based model rather than true real-time updates

## Game Mechanics
- 7x7 visible grid (viewport) into an infinite world
- Place base points to claim territory in straight lines (horizontal, vertical, diagonal)
- Points are stored in a database and synced across clients
- Cleanup process removes conflicting points, keeping the oldest

## Technical Implementation
- **Frontend**: SolidJS for reactive UI
- **Backend**: Node.js with a database for persistence
- **Real-time**: HTTP polling (no WebSockets/SSE)
- **State Management**: Client-side state with server validation

## Performance
- **Viewport-Based Loading**:
  - Only loads base points within the current 7x7 viewport
  - Uses simple coordinate comparisons to filter points
- **Query Implementation**:
  - Fetches all base points from the database using `getAll()`
  - Applies viewport filtering in memory on the server
  - Uses a simple distance check with `VIEW_RADIUS` (10 units)
- **Data Transfer**:
  - Transfers only points within the view radius to the client
  - Client receives a filtered subset of points
  - No spatial indexing or advanced query optimization

## Multiplayer
- Shared world state
- Conflict resolution through timestamp-based cleanup
- Basic error handling for network issues