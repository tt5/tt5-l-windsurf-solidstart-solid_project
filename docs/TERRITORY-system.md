# Territory Control System v2

## Core Gameplay

### Base Points & Influence
- **Placement**:
  - 15x15 viewport grid
  - 2-second cooldown between placements
  - Consumes action points (regenerates over time)
  - Restricted squares prevent placement too close to existing points
  - Encourages strategic placement and natural territory expansion

- **Influence Mechanics**:
  - Projects along straight lines (cardinal, diagonal, prime slopes)
  - Infinite reach until interrupted
  - Creates territory boundaries at intersections by:
    - Detecting where influence lines from different players cross
    - Forming polygon shapes where influences meet through:
      - Connecting intersection points in clockwise/counter-clockwise order
      - Creating Voronoi-like cells around each base point
      - Adjusting for line-of-sight obstacles
      - Ensuring all polygon edges follow grid alignment
    - Assigning enclosed areas to the nearest base point
    - Resolving conflicts using a weighted system:
      - 70% weight to point age because it:
        - Rewards early investment and long-term strategy
        - Prevents territory flipping through temporary advantages
        - Encourages players to plan their expansion carefully
        - Creates a sense of permanence and history in the game world
      - 30% weight to distance (closer points have advantage) because it:
        - Encourages players to spread out and explore
        - Prevents concentration of power in a single area
        - Creates a sense of balance and fairness
      - Additional factors in tiebreakers:
        - Number of connected friendly territories
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
    - 50-100 unit min distance from other players
    - 3-turn protection after teleport
    - Global map shows density heatmap for valid destinations

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
