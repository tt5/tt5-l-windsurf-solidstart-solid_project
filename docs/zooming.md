# Zoom Behavior Analysis

## Initial State (Zoom = 1.0)

### Red Crosshair (0,0)
- **Position**: Center of the viewport
- **Viewport Coordinates**: (width/2, height/2)
- **World Coordinates**: (0,0)

### Top-Left Corner of (0,0) Tile
- **Position**: Exactly at the red crosshair
- **Viewport Coordinates**: (width/2, height/2)
- **World Coordinates**: (0,0)

## After Clicking + Zoom (e.g., Zoom = 1.1)

### Red Crosshair (0,0)
- **New Position**: Moves down and right from center
- **Viewport Coordinates**: (width/2 * 1.1, height/2 * 1.1)
- **World Coordinates**: Still (0,0)

### Top-Left Corner of (0,0) Tile
- **Position**: Stays at viewport's top-left (0,0)
- **Viewport Coordinates**: (0,0)
- **World Coordinates**: (0,0)

## Key Observations
1. Initially, both points overlap at the viewport center
2. After zooming:
   - Tile corner stays fixed at viewport's (0,0)
   - Crosshair moves to maintain world (0,0) position
   - The separation shows the difference between viewport and world coordinates

## Visual Representation

```
Before Zoom (1.0):
+-------------------+
|                   |
|       •           |  • = Both points overlap at center
|                   |
+-------------------+

After Zoom (1.1):
•-------------------+
|                   |
|         •         |  • = Red crosshair (moved)
|                   |  • = Tile corner (stays at top-left)
+-------------------+
|+                  |
|                   |
|       +           |  + = Red crosshair (moved)
+-------------------+  + = (0,0) tile top-left (stays in corner)
