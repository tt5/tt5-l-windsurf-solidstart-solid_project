# Game Design Document

## Table of Contents
1. [Core Concepts](#core-concepts)
2. [Game World](#game-world)
3. [Game Mechanics](#game-mechanics)
4. [Technical Implementation](#technical-implementation)
5. [Performance Optimization](#performance-optimization)
6. [Multiplayer Features](#multiplayer-features)
7. [Future Development](#future-development)
8. [Glossary](#glossary)

## Core Concepts

### World Structure
- **Infinite 2D Grid**: Expansive world with coordinates from (-1000,-1000) to (1000,1000)
- **Viewport**: 15×15 grid (225 cells) visible at any time
- **Coordinate System**: 
  - Player always at (0,0) with viewport moving around them
  - Grid coordinates: [x, y] tuples (0 to GRID_SIZE-1)
  - Grid indices: 0 to (GRID_SIZE² - 1)
  - Conversion between coordinates and indices handled by utility functions

### Key Entities
- **User**: The human interacting with the game interface
- **Player**: In-game entity representing the user, fixed at (0,0)
- **Base Point**: Significant location that projects influence and creates territory
- **Viewport**: The 15×15 grid currently visible on screen
- **World**: 2001×2001 unit grid (±1000 from center) with enforced boundaries
  - Players cannot move the viewport outside these boundaries
  - Boundary check occurs before any movement is processed
  - Visual feedback appears when boundary is reached

## Game World

### Viewport System
- Fixed 15×15 grid (configured in `BOARD_CONFIG.GRID_SIZE`)
- Movement handled by `handleDirection` in `boardUtils.ts`
- Movement process:
  1. Calculates new position using `getMovementDeltas`
  2. Updates restricted squares using `moveSquares`
  3. Handles border squares based on movement direction
  4. Updates position and loads relevant base points

### Base Points
#### Placement Rules
- Must be within visible viewport
- Can only be placed on non-restricted squares
- Each player starts with one base at (0,0)
- Additional points can be placed during exploration
- Initial (0,0) base point is permanent and neutral

#### Behavior
- Fixed at world coordinates once placed
- Visible to all players when in viewport
- Projects influence in multiple directions
- Cannot be removed (except through system cleanup)

## Game Mechanics

### Territory Control
- **Influence System**:
  - Projects in multiple directions (cardinal, diagonal, and prime-numbered slopes)
  - Creates restricted areas for other players
  - Infinite range until another base is encountered
  - **Pattern Creation**:
    - Base points create lines in multiple directions
    - Lines extend until grid boundaries
    - Intersection logic is calculated but not visually represented

- **Conflict Resolution**:
  - Older base points take precedence
  - Neutral (0,0) base is always protected
  - First-come-first-served for same-age bases
  - (0,0) is a protected position

### Movement and Border System
- **Basic Movement**:
  - Speed: 50 cells/second (20ms cooldown between moves)
  - 1 action point per cell
  - 20ms cooldown between moves to prevent rapid successive movements
  - Movement is blocked at world boundaries (±1000, ±1000)
  - Visual feedback when attempting to move beyond boundaries

- **Border Squares Management**:
  - Moving reveals a new row or column of squares
  - New border squares are checked against the server
  - Restricted squares are updated dynamically
  - Visual feedback for restricted areas

- **Teleportation**:
  - **New Players**:
    - 1 one-time unlimited-range teleport
    - Must be used in first session
  - **Standard**:
    - Up to 50 units
    - 5-minute cooldown
    - Must target explored areas

## Technical Implementation

### World Management
- **Instances**:
  - **Splitting**: At 1000 base points (k-means clustering)
  - **Merging**: Below 25% capacity (24h grace period)

### System Maintenance
- **Cleanup Process**:
  - **Server-side Cleanup**:
    - Runs automatically on a schedule
    - Selects 2-4 random slopes (including prime-numbered slopes)
    - For each slope:
      1. Identifies all points forming straight lines
      2. Deletes all but the oldest point in each line
    - Preserves the first point in each line (by ID)
    - Handles errors gracefully
  - **Admin Endpoint** (`/api/cleanup-lines`):
    - Manually triggers the cleanup process
    - Returns cleanup statistics including:
      - Number of points deleted
      - List of deleted point IDs
      - Slopes used for the cleanup
    - Requires admin privileges

### Frontend
- SolidJS for reactive UI
- Client-side state management
- Grid-based rendering

### Backend
- Node.js with database
- RESTful API endpoints
- No real-time updates

## Performance Optimization

### Current Implementation

#### Performance Tracker (`/src/utils/performance.ts`)
- **Metrics Collection**:
  - Tracks timing and operational data for key game operations
  - Stores up to 1,000 most recent metrics in memory
  - Each metric includes:
    - Timestamp
    - Operation name
    - Duration in milliseconds
    - Custom data payload

#### Admin Endpoint (`/api/admin/performance`)
- **Access**: Admin authentication required
- **Metrics Tracked**:
  - `calculate-squares` operation:
    - Call count
    - Average duration
    - Maximum base points processed
    - Average response size
  - Total request count
  - Last updated timestamp

#### Data Model
```typescript
type PerformanceMetric = {
  timestamp: number;
  operation: string;
  duration: number;
  data: {
    basePointCount?: number;
    playerCount?: number;
    responseSize?: number;
    dbTime?: number;
    processingTime?: number;
  };
};
```

#### Response Format
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
    "lastUpdated": "ISO-8601 timestamp"
  }
}
```

### Current Limitations
1. **In-Memory Storage**:
   - Metrics are lost on server restart
   - Limited to last 1,000 metrics

2. **Manual Instrumentation**:
   - Requires explicit `track()` calls
   - Not all operations are instrumented

3. **Limited Metrics**:
   - No memory usage tracking
   - No CPU utilization data
   - No network latency measurements

4. **No Alerting**:
   - No automated alerts for performance issues
   - No threshold monitoring

### Future Optimization Opportunities
1. **Automatic Instrumentation**:
   - Middleware for API endpoints
   - Database query monitoring
   - Client-side performance tracking

2. **Enhanced Metrics**:
   - Memory usage tracking
   - CPU utilization monitoring
   - Network latency measurements
   - Error rate tracking

3. **Persistence Layer**:
   - Time-series database integration
   - Long-term metric storage
   - Data retention policies

4. **Alerting System**:
   - Performance degradation alerts
   - Error rate monitoring
   - Resource utilization thresholds

## Multiplayer Features
- Shared state via database
- Updates triggered by:
  - Game load
  - Player movement
  - Base point placement
- Pull-based updates (no automatic refresh)
- No real-time synchronization
- Basic conflict resolution

## Future Development

### Gameplay
- Territory abilities
- Resource generation
- Dynamic events
- Team mechanics
- Environmental obstacles and barriers
  - Natural terrain features
  - Player-created structures
  - Temporary zone effects

### Technical
- Improved algorithms
- Client prediction
- Enhanced networking
- Analytics integration
- Dynamic influence range based on point age
- Temporary alliances for territory sharing
- Specialized base points with unique influence patterns
- Visual indicators for contested areas
- Auto-resolves conflicts (older points preserved)
- Anti-fragmentation measures
- World visitation system with cooldowns

## Glossary
*Terms and definitions will be added here as needed*
