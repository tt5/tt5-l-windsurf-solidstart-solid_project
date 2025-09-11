# Game Vocabulary Reference

## Core Concepts

- **User**: The human interacting with the game interface.
- **Player**: The in-game entity representing the user, fixed at world coordinate (0,0).
- **Point**: A unique (x,y) coordinate pair in the game world, often used to represent positions.
- **Viewport**: The 7×7 grid currently visible on screen, moving relative to the player.
- **Base Point**: A significant location in the game world that players can return to, with these characteristics:
  - Planned to support teleportation (future feature) to help new players
  - Serves as a personal waypoint for navigation:
    - Acts as a visual marker on the game grid
    - Helps players remember and return to important locations
    - Visible to the owner when within the 10-unit view radius
    - Each point represents a significant location the player wants to track
  - Each player starts with one at world coordinate (0,0)
  - Players can add more as they explore on any non-restricted square
  - All base points (from any player) are visible when they enter the viewport
  - The initial (0,0) base point is permanent and neutral
- **World**: A 2001×2001 unit grid (±1000 from center) that appears infinite during play.

## Game Elements

- **Square**: A single cell in the grid (smallest playable unit).
- **Minimap**: (Planned feature) A navigational aid that displays explored areas of the map, helping players track their progress and locate important landmarks.
- **Grid**: The visible matrix of squares (currently 7×7, planned to be 15×15 in the future).
- **Restricted Square**: A visually distinct square where base points cannot be placed. These squares are highlighted in the game grid to indicate restricted areas.

## Movement Mechanics

- **Direction**: Cardinal movement (up, down, left, right).
- **Move**: Action updating the viewport's position relative to the player.
- **Movement**: The process of navigating by shifting the viewport.
- **Direction Map**: Translates inputs to coordinate changes.
- **Teleportation**: Instantly moves the viewport to any coordinate while keeping the player fixed at (0,0). This mechanism enables rapid navigation across the world and helps players explore distant locations efficiently.

## World Mechanics

- **Coordinates**: World positions relative to the player's (0,0).
- **View Radius**: The visible area around the player, determined by the current grid dimensions.
- **Boundaries**: ±1000 units from center (2001×2001 total area).

## Gameplay

- Players explore by moving the viewport.
- Base points can be placed on any non-restricted square within the visible grid.
- The world appears infinite due to:
  - Viewport-centric design
  - Progressive loading
  - No visible boundaries
  - Large playable area
