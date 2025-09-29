NOTE: visual check for temporary collision removed after commit 03a61f5

# Basepoints and Restricted Lines

This document explains how basepoints and restricted lines work in the game board.

## Basepoints

Basepoints are special points that players can place on the game board. Each basepoint creates a pattern of restricted lines that affect where new basepoints can be placed.

## Restricted Lines

Restricted lines are straight lines on the game board where basepoints cannot be placed. These lines extend in specific directions from certain points.

### Types of Restricted Lines

1. **From Origin (0,0)**:
   - Axes: x=0 and y=0
   - Diagonals: y = x and y = -x
   - Slopes: y = 2x, y = x/2, y = -2x, y = -x/2

2. **From Basepoints**:
   Each basepoint creates the same pattern of restricted lines as the origin, but centered at its own position (bx,by):
   - Axes: x=bx and y=by
   - Diagonals: (y-by) = (x-bx) and (y-by) = -(x-bx)
   - Slopes: (y-by) = 2(x-bx), (y-by) = (x-bx)/2, etc.

## Visual Indicators

- Basepoints are shown with a green marker by default
- Basepoints that lie on any restricted line (from origin or other basepoints) are shown with an orange marker
- The basepoint itself is never considered restricted - only the lines extending from it

## Implementation Details

The restriction logic is implemented in `Board.tsx` with two main functions:

1. `isOnLineFromPoint(px, py, bx, by)` - Checks if point (px,py) is on a restricted line from (bx,by)
2. `isOnRestrictedLine(x, y)` - Checks if a world coordinate (x,y) is on any restricted line

## Styling

Styling for basepoints and restricted lines is defined in `Board.module.css`:

```css
/* Regular basepoint */
.basePointMarker {
  background: var(--color-success);
  /* other styles */
}

/* Basepoint on a restricted line */
.square.restricted.basePoint .basePointMarker {
  background: #ffa000;
}
```

## Notes

- The restriction system works in world coordinates, so it remains consistent as the player moves around the board
- The check is performed in real-time as the board renders
- The basepoint itself is never marked as restricted - only the lines extending from it are restricted for other basepoints
