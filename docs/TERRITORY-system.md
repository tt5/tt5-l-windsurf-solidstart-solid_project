# Territory System

## Base Points

### Placement Rules
- Placed on the visible grid (currently 7×7, planned 15×15)
- Can only be placed on non-restricted squares
- Each player starts with one base point at (0,0)
- Additional points can be placed during exploration

### Behavior
- Fixed at their world coordinates
- Visible to all players when in view
- The initial (0,0) base point is permanent and neutral
- Base points cannot be removed or destroyed

## Territory Mechanics

### Influence

Each base point projects influence in multiple directions to create restricted areas. While new base points can be placed in these areas, they will be removed during the next cleanup process:

1. **Primary Directions** (infinite range until another base point):
   - Horizontal (left/right)
   - Vertical (up/down)
   - Both diagonals (45° and 135°)

2. **Additional Directions** (within visible grid bounds):
   - Prime-numbered slopes (e.g., 2:1, 1:2)
   - Other calculated angles that create strategic chokepoints

3. **Restricted Squares**:
   - Calculated using `calculateRestrictedSquares` based on visible base points
   - Only considers base points currently in the viewport
   - May allow placement that conflicts with base points outside the current view
   - Creates temporary territory boundaries that are enforced during cleanup

### Territory Formation
- Territory consists of all squares uniquely claimed by a player's base point
- Created where a player's influence lines don't intersect with others'
- Visualized as highlighted areas on the grid

### Conflict Resolution
- When influence lines intersect:
  - The older base point's influence takes precedence
  - If same age, first-come-first-served based on database ID
  - Rewards early investment and long-term strategy
  - Prevents territory flipping through temporary advantages
- The point at (0,0) is protected and cannot be claimed

## System Maintenance

### Line Cleanup
- Automatic cleanup runs periodically (every 30 seconds)
- Process:
  1. Selects 2-4 random line slopes (including cardinal and diagonal)
  2. For each slope, finds all points forming straight lines
  3. Keeps only the oldest point in each line (by ID)
  4. Removes other points in the line
- Ensures fair play and prevents gridlock
- Logs all cleanup actions for monitoring
        - Player's overall influence in the region
        - Random element (small %) to prevent stalemates
  - Visualized with semi-transparent colored regions

### Player Movement
- Smooth movement at 3 cells/second
- 0.2s cooldown between moves
- Action point consumption (1 per cell)
- Viewport updates in real-time

## World Management

### World Instances
- **Automatic Splitting**:
  - Triggers at 1000 base points
  - Uses k-means clustering
  - Players auto-assigned based on base point distribution
  - Maintains spatial relationships

- **World Merging**:
  - When world drops below 25% capacity
  - 24-hour grace period
  - Auto-resolves conflicts (older points preserved)
  - Anti-fragmentation measures

- **World Visitation**:
  - Visit any world with your base points
  - 60-second cooldown between world changes
  - Active points remain in original world
  - World list shows player count/activity

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
