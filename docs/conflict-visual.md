# Basepoint Conflict Detection

This document explains the conflict detection system for basepoints in the game.

## Conflict Detection

A basepoint is considered to be in conflict when it is placed on a restricted line from another basepoint. Visually, these are shown with an orange marker instead of the default green.

### How Conflicts Are Detected

1. When rendering the board, the system checks each basepoint to see if its coordinates lie on any existing restricted lines from:
   - The origin (0,0)
   - Any other existing basepoints

2. If a basepoint is found to be on a restricted line, it is marked as "in conflict" and displayed with an orange marker.

## Visual Indicators

- **Green Marker**: Basepoint with no conflicts
- **Orange Marker**: Basepoint that is in conflict (on a restricted line)

## Technical Implementation

The conflict detection is implemented in `Board.tsx` using the following logic:

```typescript
// Simplified conflict detection logic
const isOnRestrictedLine = (x: number, y: number): boolean => {
  // Check against origin (0,0)
  if (isOnLineFromPoint(x, y, 0, 0)) return true;
  
  // Check against all other basepoints
  return basePoints().some(bp => {
    if (bp.x === x && bp.y === y) return false; // Skip self
    return isOnLineFromPoint(x, y, bp.x, bp.y);
  });
};
```

## Current Limitations

- Conflict detection is visual only at this time
- No automatic cleanup of conflicting basepoints
- No notifications or animations for conflicts
