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
   - Line types include:
     - Horizontal (slope 0)
     - Vertical (infinite slope)
     - Diagonal (slopes 1 and -1)
     - Prime-numbered slopes (2:1, 1:2, 3:1, 1:3)
   - Keeps the oldest point (lowest ID) in any line
   - The origin (0,0) is always preserved
   - **First Center Advantage**: The first point placed near the center becomes highly valuable as it can influence more potential lines

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

## New Player Teleportation

To help new players establish themselves in established games, they receive a one-time teleport ability:

1. **Activation**:
   - Available for the first 5 turns
   - Can only be used once per player
   - Must be used before placing any base points

2. **Restrictions**:
   - Can only teleport to unclaimed territory
   - Minimum distance from existing points (suggest 5-10 units)
   - Cannot teleport within existing territories

3. **Strategic Considerations**:
   - Choose between immediate center access or saving for later
   - Risk of teleporting into a vulnerable position
   - Can be used to establish a secondary stronghold

4. **Visual Feedback**:
   - Special highlight for valid teleport locations
   - Visual indicator of teleport availability
   - Confirmation dialog before teleporting

5. **Balance**:
   - Cooldown period after teleporting
   - Cannot attack or be attacked for 1 turn after teleport
   - Limited to one teleport per player account

## World Size and Balance

The game world is designed to balance competition and expansion:

1. **Current World Size**:
   - Coordinates range from -1000 to 1000 in both X and Y axes
   - Total playable area: 4 million possible positions
   - Center (0,0) is the most contested area

2. **Balancing Factors**:
   - **Player Density**: More players = more competition for space
   - **Expansion Rate**: How quickly players can claim new territory
   - **Interaction Frequency**: How often players encounter each other

3. **Scaling Options** (Future Consideration):
   - Dynamic world size based on active players
   - Formula: `1000 × √(number of players)` in each direction
   - Minimum size: 2000x2000 (for up to 4 players)
   - Maximum size: 10000x10000 (for large player bases)

4. **New Player Experience**:
   - Initial spawn areas are weighted towards less crowded regions
   - Teleport ability helps establish initial position
   - Early-game protection prevents immediate elimination

## Future Ideas
- Special territory abilities
- Animated borders
- Team territories
- Visual indicators for cleanup-affected areas
- Dynamic resource generation