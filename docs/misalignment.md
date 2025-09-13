# Map View Implementation - Alignment Issues

## Overview
This document describes the current implementation of the map view and identifies a critical issue where the top-left corner of the (0,0) tile becomes misaligned with the red crosshair during zooming and after panning operations.

## Current Implementation

### 1. Viewport Initialization
```typescript
// Current Implementation
const viewport = {
  x: -width / 2,   // Centers (0,0) at the crosshair
  y: -height / 2,  // Positions (0,0) at the crosshair
  zoom: 1.0
};
```
**Note**: The initial position is correct, with the (0,0) tile perfectly aligned with the crosshair when the map first loads.

### 2. Zoom Handling (Problematic)
```typescript
// Current Implementation - Has alignment issues
function handleWheel(e: WheelEvent) {
  // ...
  const worldX = currentVp.x + (mouseX / currentVp.zoom);
  const worldY = currentVp.y + (mouseY / currentVp.zoom);
  
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentVp.zoom * zoomFactor));
  
  // This calculation causes misalignment
  const newX = worldX - (mouseX / newZoom);
  const newY = worldY - (mouseY / newZoom);
  
  updateViewport({ x: newX, y: newY, zoom: newZoom });
}
```
**Issue**: The zoom calculation doesn't account for the crosshair's position, causing the (0,0) tile to drift by approximately 50px when zoomed in one step after initial load.

### 3. Panning Implementation (Problematic)
```typescript
// Current Implementation - Compounds the zoom misalignment
function handlePan(dx, dy) {
  const newX = viewport.x - (dx / viewport.zoom);
  const newY = viewport.y - (dy / viewport.zoom);
  updateViewport({ x: newX, y: newY });
}
```
**Issue**: The panning operation uses the potentially misaligned viewport position, further compounding the alignment error introduced during zooming.

## Root Cause Analysis

1. **Zoom Calculation Error**:
   - The current zoom calculation doesn't maintain the crosshair's position relative to the (0,0) tile

2. **Viewport Coordinate System**:
   - The viewport's (0,0) is at the top-left, but the crosshair is at the center
   - The current implementation doesn't properly account for this offset during transformations

## Required Fixes

1. **Zoom Calculation**:
   - Calculate the crosshair's world position before zoom
   - Apply the zoom while keeping the crosshair fixed on the same world point
   - Update the viewport position to maintain alignment

2. **Panning Correction**:
   - Ensure panning operations respect the crosshair's position
   - Consider implementing a correction factor to realign the viewport if misalignment is detected

## Transformation Strategy: Single Container Approach

### Option 3: Single Transform Container
1. **Implementation**:
   - Create a single container div that wraps both the grid and tiles
   - Apply all transformations (translate, scale) to this container
   - Both grid and tiles will inherit the same transformations

2. **Benefits**:
   - Guarantees perfect alignment between grid and tiles
   - More efficient as it reduces the number of transform calculations
   - Simpler to maintain as there's only one transformation to manage

3. **Changes Required**:
   - Restructure the component to have a single transform container
   - Move transformation logic to the container level
   - Update grid and tile rendering to use relative positioning
   - Remove individual transformations from tile rendering
