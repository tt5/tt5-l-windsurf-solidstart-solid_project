# MapView Tile Loading Behavior

## Issue Description
When switching from the 'info' tab to the 'settings' tab, the MapView component mounts and starts loading tiles, but the loading process is interrupted because the component unmounts during the loading process.

## What's Happening

1. **Tab Switch Occurs**
   - User clicks the 'settings' tab
   - React's `Show` component unmounts the Board component and mounts the MapView component

2. **MapView Initialization**
   - MapView's `onMount` is called
   - Initial tile loading starts
   - Viewport dimensions are logged (891x600)
   - Center tile (6, 4) is added to the loading queue

3. **Tile Loading Process**
   - `processTileQueue` starts processing 1 tile
   - `loadTile` is called for tile (6, 4)
   - **Critical Issue**: The component unmounts during the loading process
   - `loadTile` detects the unmount and skips the tile with message: "Component unmounting, skipping tile (6, 4)"

## Root Cause

The issue occurs because the component is being unmounted during the initial render cycle. This happens because:

1. The component is conditionally rendered with `Show`
2. The tile loading is asynchronous and starts in the `onMount` hook
3. The component appears to be unmounting and remounting during the initial render, which interrupts the tile loading process

## Expected Behavior

When the MapView mounts, it should:
1. Start loading tiles
2. Complete the loading process even if the user switches tabs
3. Cache the loaded tiles for future use

## Current Implementation Issues

1. The tile loading process doesn't complete if the component unmounts
2. There's no caching of loaded tiles between mounts
3. The loading state isn't persisted when switching tabs

## Recommended Solutions

1. **Persist the MapView component**
   - Instead of conditionally rendering with `Show`, use CSS to show/hide
   - This prevents the component from unmounting when switching tabs

2. **Implement a proper cleanup**
   - Track pending tile requests
   - Clean up properly in `onCleanup`
   - Resume loading when the component remounts

3. **Add a loading state**
   - Show a loading indicator while tiles are being loaded
   - Prevent user interaction until initial load completes

4. **Implement proper caching**
   - Cache loaded tiles in a service
   - Reuse cached tiles when remounting
   - Invalidate cache when needed (e.g., when data changes)

## Example Fix

```tsx
// Instead of this:
<Show when={activeTab() === 'settings'}>
  <MapView />
</Show>

// Use this:
<MapView 
  visible={activeTab() === 'settings'}
  onVisibilityChange={(isVisible) => {
    if (isVisible) {
      // Trigger tile refresh when becoming visible
    }
  }}
/>
```

## Next Steps

1. Update the MapView component to handle visibility props
2. Implement proper cleanup and loading state management
3. Add tile caching for better performance
4. Update the tab switching logic to use visibility instead of mounting/unmounting
