# Territory Control Game - Implementation Documentation

## Table of Contents
1. [Core Architecture](#core-architecture)
2. [Game World](#game-world)
3. [Game Mechanics](#game-mechanics)
4. [Technical Implementation](#technical-implementation)
5. [Authentication System](#authentication-system)
6. [API Endpoints](#api-endpoints)
7. [Notification System](./NOTIFICATIONS.md)

## Core Architecture

### Technology Stack
- **Frontend**: SolidJS with TypeScript
- **Styling**: CSS Modules
- **Backend**: Node.js with SQLite
- **Authentication**: JWT (JSON Web Tokens)
- **State Management**: SolidJS Context API
- **Build Tool**: Vite

## Game World

### World Structure
- **Bounded 2D Grid**: World extends from (-1000,-1000) to (1000,1000)
- **Viewport**: 15×15 grid (225 cells) visible at any time
- **Coordinate System**:
  - Player always at (0,0) with viewport moving around them
  - Grid coordinates are represented as `[x, y]` tuples
  - World boundaries prevent moving beyond defined limits

### Core Entities

#### Base Points
- Represent player-controlled territory markers
- Each point has:
  - Unique ID
  - World coordinates (x, y)
  - Owner (user ID)
  - Creation timestamp
- Cannot be placed on restricted squares
- Protected base at (0,0) that cannot be removed

## Game Mechanics

### Movement System
- **Controls**: Arrow keys or on-screen buttons
- **Movement Mechanics**:
  - Player's avatar is fixed at viewport position (0,0)
  - World moves in the opposite direction when moving (creating the illusion of movement)
  - Viewport scrolls to reveal new areas of the world
- **Speed**: Smooth movement with configurable speed
- **Collision**: Bounds checking against world limits
- **Viewport Behavior**:
  - 15×15 grid. Left upper corner of the grid is at (0,0) grid coordinates, but world coordinates are realative to (0,0) world coordinates (currentPosition).
  - Player's avatar remains fixed at world coordinates (0,0)
  - Grid cells outside visible area are not rendered for performance

### Territory Control
- Players place base points to claim territory
- Each base point creates restricted areas
- Cleanup process runs periodically to maintain game balance

### Cleanup Process
- Runs every 10 seconds asynchronously
- For each cleanup cycle:
  1. Selects 2-4 random slopes (including cardinal, diagonal, and prime-numbered slopes)
  2. Identifies all straight lines where 3 or more base points are collinear along these slopes
  3. For each identified line, removes all points except the oldest one (by database ID)
  4. Preserves the protected (0,0) base point in all cases
- Operates on all base points in the database, not just those in the current viewport
- Logs all removed points for debugging and audit purposes

## Technical Implementation

### Frontend
- **Board Component**: Renders the game grid and handles user input
- **State Management**: Uses SolidJS signals and context for reactive state

### Backend
- **Database**: SQLite for data persistence
- **API**: RESTful endpoints for game actions
- **Authentication**: JWT-based session management
- **Migrations**: Database schema versioning

### Performance Optimizations
- Efficient grid rendering
- Batch updates for state changes
- Debounced API calls
- Server-side caching where applicable

## Authentication System

### Features
- User registration and login
- JWT-based session management
- Protected routes
- Development mode with auto-login

### Security
- Password hashing with bcrypt (not implemented)
- Secure HTTP-only cookies
- CSRF protection
- Input validation

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - End session

### Game Actions
- `GET /api/base-points` - Get visible base points
- `POST /api/base-points` - Place new base point
- `POST /api/cleanup-lines` - Trigger manual cleanup process
- `POST /api/calculate-squares` - Calculate restricted squares

4. **Performance**
   - Server-side rendering
   - Lazy loading
   - Optimized asset delivery

5. **Analytics**
   - Game metrics
   - Player behavior tracking
   - Performance monitoring
### Territory Control

#### Influence System
**Purpose**: Controls where new base points can be placed

**Mechanics**:
- **Influence Lines**: Each base point projects influence in 12 directions:
  - 4 cardinal (horizontal/vertical)
  - 4 diagonal (45°)
  - 4 prime-numbered slopes (26.565° and 63.435°)
- **Restricted Areas**:
  - Marks grid squares as unavailable for new base points
  - Extends to the edge of the visible 15×15 grid
  - Blocked only by grid edges (not by other base points)
- **Real-time Operation**:
  - Updates immediately as players move/place base points
  - Only affects the current player's visible grid
  - Prevents placement in influenced areas

#### Cleanup Process
**Purpose**: Maintains game balance by preventing clustering

**Execution**:
- **Schedule**: Runs every 10 seconds
- **Scope**: Global (all base points, not just visible ones)
- **Protection**: Never removes the neutral (0,0) base point

**Line Detection**:
- Uses exact line equations with floating-point precision
- Identifies collinear points with epsilon tolerance
- Handles all line types (vertical, horizontal, diagonal)

**Cleanup Rules**:
1. Randomly selects 2-4 slopes (including prime-numbered ones)
2. For each slope, finds all straight lines with 3+ base points
3. In each line, keeps only the oldest point (by ID)
4. Removes all other points in the line

**Conflict Resolution**:
- Older base points (by ID) take precedence
- The neutral (0,0) base is always protected
- First-come-first-served for same-age base points

**Impact on Gameplay**:
- Reduces clustering of base points in straight lines
- Encourages strategic placement

### Movement and Border System
- **Basic Movement**:
  - **Movement Mechanics**:
    - Player's avatar remains fixed at viewport (0,0)
    - World moves in the opposite direction of movement
    - Movement is grid-based (1 cell per key press)
    - Movement is processed synchronously with no queue
    - `isMoving` flag prevents overlapping movements
    - Movement is blocked during the current move
    - Additional cooldown of 20ms after movement
  
- **Movement Controls**:
  - Arrow keys or on-screen buttons for direction
  - Each key press moves exactly one cell
  - Smooth animations between positions
  - No movement queuing - rapid key presses may be ignored during movement

- **World Boundaries**:
  - World extends from (-1000,-1000) to (1000,1000)
  - Movement is blocked at world edges
  - Boundary checking prevents moving outside world limits

- **Border Squares Management**:
  - Viewport updates to show new areas as player moves
  - New border squares are checked against the server
  - Restricted squares are updated dynamically
  - Only visible grid cells are rendered for performance
  - Visual feedback for restricted areas

- **Map**:
  - Shows all base point in the world as dots.

### System Maintenance
- **Cleanup Process**:
  - **Server-side Cleanup**:
    - Automatically runs every 10 seconds via `setInterval`
    - Managed by the `ServerInitializer` singleton
    - **Process Flow**:
      1. Fetches 2-4 random slopes using `getRandomSlopes()`
      2. Logs the selected slopes for debugging
      3. Takes a snapshot of all points before cleanup
      4. Identifies points in straight lines using `getPointsInLines()`
      5. If points are found, deletes them using `deletePoints()`
      6. Takes a post-cleanup snapshot for verification
    - **Error Handling**:
      - Wrapped in try-catch to prevent unhandled rejections
      - Logs detailed error information to console
      - Continues running even if one cleanup cycle fails
    - **Logging**:
      - Logs before/after states of points
      - Logs which points are being deleted
      - Provides timing information for each cleanup cycle
  - **Admin Endpoint** (`/api/cleanup-lines`):
    - **Method**: POST
    - **Authentication**: Requires admin role
    - **Response**:
      - Success: 200 with deleted points count and IDs
      - Error: 500 with error details
    - **Response Example**:
      ```json
      {
        "success": true,
        "message": "Line cleanup completed",
        "deletedCount": 5,
        "deletedPoints": [1, 2, 3, 4, 5],
        "slopesUsed": [1, 2, 3]
      }
      ```

### Frontend
- SolidJS for reactive UI
- Client-side state management
- Grid-based rendering

### Backend
- Node.js with database
- RESTful API endpoints
- No real-time updates

## Performance Optimization

### Real-time Metrics
- **Endpoint**: `/api/admin/performance` (GET)
  - **Authentication**: Admin access required
  - **Metrics Tracked**:
    - `calculate-squares` operation metrics:
      - Average duration
      - Maximum base points processed
      - Average response size
    - Total request count
  - **Data Retention**: Last 1,000 metrics
  - **Response Format**:
    ```json
    {
      "success": true,
      "data": {
        "totalRequests": number,
        "calculateSquares": {
          "count": number,
          "averageDuration": number,
          "maxBasePoints": number,
          "averageResponseSize": number
        },
        "lastUpdated": "ISO timestamp"
      }
    }
    ```

### Optimization Strategies
  - Viewport-based culling (20-unit radius)
  - Client-side filtering of base points
  - Simple coordinate-based queries
  - Basic error handling

## Multiplayer Features
- Shared state via database
- Updates triggered by:
  - Game load
  - Player movement
  - Base point placement
- Pull-based updates (no automatic refresh)
- No real-time synchronization
- Basic conflict resolution