# Territory System

## Overview
The territory system governs how players claim and control areas of the infinite 2D grid world through strategic placement of base points. The system uses line-of-influence mechanics to determine territory boundaries and resolve conflicts.

## Core Concepts

### Base Points
Base points are the fundamental unit of territory control. Each base point projects influence in multiple directions, creating restricted areas that other players cannot claim.

#### Placement Rules
- Must be placed within the visible 15×15 viewport
- Can only be placed on non-restricted squares
- Each player starts with one base point at world coordinates (0,0)
- Additional points can be placed during exploration
- The initial (0,0) base point is permanent and neutral

#### Behavior
- Fixed at their world coordinates once placed
- Visible to all players when within their viewport
- Cannot be removed or destroyed (except through system cleanup)
- Influence extends infinitely in primary directions until another base point is encountered

## Territory Mechanics

### Influence System
Base points project influence in multiple directions to create restricted areas:

#### Primary Directions (Infinite Range)
- Horizontal (left/right)
- Vertical (up/down)
- Diagonal (45° and 135°)

#### Additional Directions (Viewport-Bound)
- Prime-numbered slopes (2:1, 1:2, 3:1, 1:3, 3:2, 2:3)
- Creates complex territory boundaries and strategic chokepoints

### Viewport Considerations (15×15 Grid)
- **Visibility**: 225 squares visible at once (4.6× more than previous 7×7)
- **Strategic Impact**:
  - Better situational awareness
  - Reduced need for constant panning
  - More efficient scouting and planning
  - Multiple base points may be visible simultaneously

### Territory Formation
- Territory consists of all squares uniquely claimed by a player's base points
- Created where influence lines don't intersect with others'
- Visualized with semi-transparent colored regions on the grid

### Conflict Resolution
When influence lines intersect:
1. Older base point's influence takes precedence
2. If same age, earlier database ID wins (first-come-first-served)
3. The neutral point at (0,0) is always protected

This system rewards early investment and prevents territory flipping through temporary advantages.

## System Maintenance

### Line Cleanup
To prevent gridlock and ensure fair play:
- Runs automatically every 30 seconds
- Process:
  1. Selects 2-4 random line slopes (including cardinal and diagonal)
  2. Identifies all points forming straight lines along these slopes
  3. Keeps only the oldest point in each line
  4. Removes other points in the line
- All cleanup actions are logged for monitoring

## Movement and Border System

The movement system controls how players navigate the world and how new territory becomes visible and claimable.

### Player Movement
- **Speed**: 3 cells/second maximum
- **Cooldown**: 100ms between moves (client-side)
- **Action Point Cost**: 1 per cell moved
- **Viewport Updates**: Real-time during movement

### Border Squares Management
When a player moves, new border squares come into view. These are handled as follows:

1. **Border Detection**:
   - Moving reveals a new row or column of squares at the edge of the viewport
   - The specific border depends on movement direction (top, bottom, left, or right)

2. **API Integration**:
   - New border squares are sent to the server via `/api/calculate-squares`
   - The server returns which of these squares are restricted
   - The response includes any new restricted squares that affect the player's movement

3. **Restricted Squares**:
   - Displayed visually to indicate where base points cannot be placed
   - Updated dynamically as the player moves
   - Persist in the current view until the player moves away

4. **Performance Optimization**:
   - 100ms cooldown prevents rapid successive API calls
   - Client-side caching of known restricted squares
   - Only newly revealed squares are checked against the server

5. **Visual Feedback**:
   - Newly restricted squares are immediately shown in the UI
   - The viewport updates smoothly to show new areas
   - Players can see their movement options update in real-time

## World Management

### World Instances
- **Automatic Splitting**:
  - Trigger: 1000 base points in a world
  - Method: k-means clustering
  - Players auto-assigned based on base point distribution
  - Maintains spatial relationships during split

- **World Merging**:
  - Trigger: World drops below 25% capacity
  - Grace period: 24 hours before merging

## Technical Implementation

### Restricted Squares Calculation
- Uses `calculateRestrictedSquares` function
- Only considers currently visible base points
- Creates temporary boundaries enforced during cleanup
- May allow temporary conflicts with points outside current view

### Performance Considerations
- Efficient line-of-sight calculations
- Viewport-based culling for performance
- Batch processing for territory updates
- Delta compression for network efficiency

## Future Considerations
- Dynamic influence range based on point age
- Temporary alliances for territory sharing
- Specialized base points with unique influence patterns
- Visual indicators for contested areas
- Auto-resolves conflicts (older points preserved)
- Anti-fragmentation measures
- World visitation system with cooldowns

## Player Systems

### Progression
- **Teleportation**:
  - **One-time Token**:
    - New players receive 1 token for unlimited-range teleport
    - Must be used during first session
    - Cannot be stored or banked
  - **Standard Teleport**:
    - All players can teleport up to 50 units
    - Must target previously explored areas
    - 5-minute cooldown between uses
    - Cannot teleport into or through:
      - Unexplored areas
      - Enemy territory
  - **Restrictions**:
    - Players are always at (0,0) in their local coordinate system
    - Teleportation moves the viewport, not the player
    - 3-turn protection after teleport
    - Global map shows explored areas for reference

### Security
- **Authentication**:
  - OAuth 2.0 (Google, GitHub, etc.)
  - Email verification required
  - Rate-limited account creation

- **Anti-Exploitation**:
  - Device fingerprinting
  - Behavior analysis
  - Manual review system

## Visual Elements

### Minimap
- Shows only explored areas (fog of war)
- Viewport indicator for current position
- Color-coded base points in visible range
- Interactive zoom/pan within explored areas
- Live updates as new areas are discovered
- Key landmarks revealed through exploration

### Territory Display
- Semi-transparent colored regions
- Clear border indicators
- Ownership labels
- Influence line visualization

## Performance Considerations

### Optimization Strategies
- **Spatial Indexing**:
  - Quad-tree implementation for base points
  - Only process points within viewport + buffer zone
  - Cache recent territory calculations
  
- **Update Management**:
  - Track dirty regions needing recalculation
  - Batch database operations
  - Implement incremental updates
  - Use delta compression for network traffic

### Resource Management
- **Memory Usage**:
  - Compress exploration data using bitmask or RLE
  - Implement level-of-detail for distant areas
  - Use object pooling for frequent allocations
  
- **Database Optimization**:
  - Index frequently queried fields
  - Use write-behind caching
  - Consider time-series databases for metrics
  - Implement connection pooling

### Scaling
- **Horizontal Scaling**:
  - Distribute world instances across servers
  - Implement automatic load balancing
  - Use region-based sharding
  
- **Monitoring**:
  - Track frame rates and memory usage
  - Monitor network latency
  - Log performance metrics
  - Set up alerts for degradation

## Implementation
- Quad-tree spatial indexing
- O(n log n) collision detection
- Parallel line calculations
- Multi-level caching
- Delta updates
- Priority processing
- Update throttling
- Background pre-computation

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
