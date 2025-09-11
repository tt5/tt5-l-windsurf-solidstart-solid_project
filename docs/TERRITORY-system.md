# Territory Control System

## Overview
An infinite 2D grid where players compete for control by strategically placing base points. The system automatically manages world instances to ensure optimal performance and balanced gameplay.

## Core Gameplay

### Base Points
- **Placement**:
  - Restricted to current 7x7 viewport
  - 2-second cooldown between placements
  - Consumes action points (regenerates over time)
- **Influence**:
  - Projects in straight lines (cardinal, diagonal, and prime slopes)
  - Extends infinitely until interrupted
  - Creates territory boundaries at intersections
- **Movement**:
  - Smooth movement (3 cells/second)
  - 0.2s cooldown between moves
  - Consumes action points (1 per cell)

### World Management
- **Splitting**:
  - Triggers at 1000 base points
  - Uses k-means clustering
  - Players choose which new world to join
- **Merging**:
  - When world drops below 25% capacity
  - 24-hour grace period
  - Automatic conflict resolution
- **Instances**:
  - Independent cleanup processes
  - Shared coordinate system
  - (0,0) preserved across all instances

## Visual Elements

### Minimap
- **Overview**: Miniature map showing the entire play area
- **Viewport Indicator**: Highlights the player's current visible area
- **Base Points**: Shows all base points with color-coded ownership
- **Zoom & Pan**: Interactive controls for navigation
- **Auto-update**: Live updates as the player moves or places points
- **Landmark Visibility**: Highlights key locations (0,0, world borders)

## Player Systems

### Progression
- **Teleportation**:
  - 1 token per 24h (max 3)
  - Global map access
  - Density heatmap preview
  - 50-100 unit minimum distance
  - 3-turn protection after teleport

### Account Management
- **Inactivity**:
  - 90-day auto-deletion
  - Warnings at 60/30 days
  - Weekly cleanup batches
- **Deletion**:
  - Immediate point removal
  - Territory recalculation
  - World merging if needed

## Performance

### Optimization
- **Spatial Indexing**:
  - Quad-tree implementation
  - O(n log n) collision detection
  - Efficient point queries
- **Line Processing**:
  - Parallel calculations
  - Segment caching
  - Progressive updates
- **Caching**:
  - Multi-level boundary cache
  - Smart invalidation
  - Background pre-computation

### Scaling
- **Load Distribution**:
  - Automatic instance creation
  - Balanced player distribution
  - Resource monitoring
- **Network**:
  - Delta updates
  - Update throttling
  - Priority queuing

## Future Enhancements

### Gameplay
- Territory-based abilities
- Resource generation
- Dynamic events

### Technical
- Improved line algorithms
- Client prediction
- Enhanced server architecture
