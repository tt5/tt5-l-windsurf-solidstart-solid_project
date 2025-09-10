# Territory Concept

## Core Idea
- **Definition**: An area of the game board controlled by a player
- **Ownership**: Determined by base points and their influence
- **Purpose**: Adds strategic depth and competition

## Territory Formation
1. **Base Points**
   - Act as territory anchors
   - Project influence in 4 directions
   - Influence extends until another base point or map edge

2. **Influence Areas**
   - Lines from base points create boundaries
   - Intersecting lines form territory borders
   - Enclosed areas become player territory

## Visual Representation
- **Base Points**: Colored circles
- **Influence Lines**: Faint lines from base points
- **Territory**: Lightly shaded areas
- **Borders**: Clear boundaries between territories

## Game Mechanics
1. **Scoring**
   - Points for controlled territory
   - Bonuses for surrounding opponents

2. **Conflict Resolution**
   - Boundaries at midpoints between bases
   - Equal distance = split territory
   - Origin (0,0) remains neutral

## Implementation Notes
- Use graph structures for boundaries
- Cache territory polygons
- Update on base point changes

## Cleanup Process Impact

When the cleanup-lines process runs, it affects territories in the following ways:

1. **Base Point Deletion**:
   - Removes newer points that form straight lines with existing points
   - Keeps the oldest point (lowest ID) in any line
   - The origin (0,0) is always preserved

2. **Territory Effects**:
   - Territory boundaries are automatically recalculated
   - If a base point is removed, its influence lines disappear
   - This can cause territory to be:
     - Absorbed by adjacent territories
     - Become unclaimed if no other base points support it
     - Redistributed among remaining base points

3. **Player Impact**:
   - Players may lose territory if their base points are removed
   - Strategic placement is important to maintain territory control
   - The cleanup process creates dynamic, shifting territories

## Future Ideas
- Special territory abilities
- Animated borders
- Team territories
- Visual indicators for cleanup-affected areas
- Dynamic resource generation