# Territory System Implementation Strategy

## Phase 1: Core Data Structures

### 1.1 Base Point System
```typescript
interface BasePoint {
  id: string;
  playerId: string;
  x: number;
  y: number;
  createdAt: Date;
  influenceRange: number; // Default: 4 directions (N-S, E-W, NE-SW, NW-SE)
  worldId: string; // Which world instance this point belongs to
}
```

### 1.2 Territory Representation
```typescript
interface Territory {
  id: string;
  playerId: string;
  vertices: { x: number; y: number }[]; // Polygon vertices
  area: number;
  lastUpdated: Date;
  worldId: string; // Reference to world instance
  basePointIds: string[]; // Base points forming this territory
```

## Phase 2: World Management

### 2.1 World Instances
```typescript
interface WorldInstance {
  id: string;
  basePoints: BasePoint[];
  playerCount: number;
  createdAt: Date;
  lastActivity: Date;
  status: 'active' | 'merging' | 'inactive';
}
```

### 2.2 World Splitting
1. **Trigger Conditions**
   - When world reaches 1000 base points
   - Use k-means clustering to find natural player groups
   - Create new world instance with split base points

2. **Player Assignment**
   - Auto-assign players based on base point distribution
   - Transfer relevant base points to new world
   - Update player world assignments

### 2.3 World Merging
1. **Trigger Conditions**
   - When world drops below 25% capacity
   - 24-hour grace period before merging
   
2. **Merge Process**
   - Find suitable target world (similar player count/activity)
   - Transfer base points with coordinate translation
   - Run anti-fragmentation algorithm
   - Notify affected players

## Phase 3: Core Algorithms

### 2.1 Influence Calculation
1. **Line Projection**
   - For each base point, project lines in 4 directions
   - Store line segments with metadata (origin, direction, length)
   - Implement line-of-sight algorithm to detect intersections

2. **Boundary Detection**
   - Find intersection points of all influence lines
   - Use Fortune's algorithm for Voronoi diagram generation
   - Calculate bounded regions to form territories

### 2.2 Territory Merging
1. **Adjacent Territories**
   - Detect territories sharing edges
   - Merge if owned by same player
   - Update boundary vertices

2. **Conflict Resolution**
   - When influence lines intersect:
     - Split territory at intersection point
     - Assign ownership based on distance to nearest base points

## Phase 4: Player Systems

### 4.1 Player State
```typescript
interface Player {
  id: string;
  currentWorldId: string;
  exploredAreas: { worldId: string; x: number; y: number; radius: number }[];
  teleportCooldown: Date | null;
  hasUsedStarterToken: boolean;
}
```

### 4.2 Teleportation System
1. **Starter Token**
   - Granted on first join
   - One-time use, unlimited range
   - Must be used in first session

2. **Standard Teleport**
   - 50-unit range limit
   - 5-minute cooldown
   - Can only target explored areas
   - Minimum 50-100 unit distance from other players

3. **Implementation**
   - Server validates all teleport requests
   - Maintains cooldown state
   - Updates player's position and explored areas

### 4.3 Exploration System
1. **Fog of War**
   - Track explored areas per player
   - Reveal areas within view radius
   - Persist exploration state

2. **Minimap Updates**
   - Only show explored areas
   - Update in real-time as player moves
   - Cache exploration data for performance

## Phase 5: Game Loop Integration

### 3.1 Event Handlers
```typescript
// On base point placement
function handleBasePointPlacement(basePoint: BasePoint) {
  // 1. Validate placement
  if (isInProtectedZone(basePoint)) return false;
  
  // 2. Add to database
  const newPoint = await db.basePoints.create(basePoint);
  
  // 3. Recalculate territories
  await updateTerritories();
  
  // 4. Run cleanup if needed
  if (shouldRunCleanup()) {
    await runLineCleanup();
    await updateTerritories();
  }
  
  return true;
}
```

### 3.2 Cleanup Process
1. **Line Detection**
   - Group base points by alignment
   - Detect collinear points
   - Keep oldest point in each line

2. **Territory Recalculation**
   - Clear affected regions
   - Rebuild influence lines
   - Recalculate all territories

## Phase 4: Performance Optimizations

### 4.1 Spatial Partitioning
- Implement quad-tree for base point storage
- Only process points within viewport + buffer zone
- Cache territory calculations

### 4.2 Incremental Updates
- Track dirty regions that need recalculation
- Only update affected territories
- Batch database operations

## Phase 5: Visual Representation

### 5.1 Rendering Pipeline
1. Draw base terrain
2. Render influence lines (semi-transparent)
3. Fill territory polygons
4. Draw borders
5. Add base point markers

### 5.2 Visual Feedback
- Hover effects on territories
- Animation for territory changes
- Visual indicators for contested areas

## Phase 6: Security & Anti-Exploitation

### 6.1 Authentication
- OAuth 2.0 integration
- Email verification
- Rate limiting
- Device fingerprinting

### 6.2 Anti-Cheat Measures
- Server-side validation of all actions
- Behavior analysis for unusual patterns
- Manual review system for flagged accounts
- Cooldown enforcement

## Phase 7: Multiplayer Sync

### 6.1 State Management
- Use CRDTs for conflict-free replicated data
- Implement optimistic updates
- Handle network partitions

### 6.2 Update Protocol
1. Client sends base point placement
2. Server validates and applies
3. Server broadcasts update
4. Clients reconcile state

## Testing Strategy

### 7.1 Unit Tests
- Line intersection calculations
- Territory merging logic
- Cleanup rules

### 7.2 Integration Tests
- End-to-end game flow
- Multiplayer synchronization
- Edge case handling

## Performance Metrics
- Frame rate monitoring
- Memory usage
- Network latency impact
- Database query performance

## Future Enhancements

### 8.1 Gameplay
- **Environmental Obstacles**
  - Natural terrain features
  - Player-created structures
  - Temporary zone effects
  
- **Team Play**
  - Shared territories
  - Team abilities
  - Cooperative strategies

### 8.2 Technical
- **Performance**
  - Client-side prediction
  - Optimized network protocols
  - Advanced spatial indexing
  
- **Analytics**
  - Player behavior tracking
  - Performance metrics
  - Balance telemetry
1. **Advanced Territory Abilities**
   - Special powers based on territory size
   - Resource generation
   - Defensive bonuses

2. **Dynamic World**
   - Procedural generation
   - Environmental effects
   - Moving obstacles

3. **Team Play**
   - Shared territories
   - Team abilities
   - Cooperative strategies
