import { Component, createEffect, createSignal, onCleanup } from 'solid-js';
import { usePlayerPosition } from '~/contexts/PlayerPositionContext';
import styles from './ViewportPosition.module.css';

// Player's viewport size in world coordinates
const VIEWPORT_WIDTH = 15; // 15 world units wide
const VIEWPORT_HEIGHT = 15; // 15 world units tall

// Map tile size (pixels per tile)
const TILE_SIZE = 64; // 64x64 pixels per map tile (1 world unit = 1 pixel)

// World coordinates of the (0,0) tile's top-left corner
const TILE_ZERO_WORLD_X = 1024;
const TILE_ZERO_WORLD_Y = 1024;

const ViewportPosition: Component = () => {
  const { position } = usePlayerPosition();
  const [playerViewportStyle, setPlayerViewportStyle] = createSignal({});
  const [tileZeroPos, setTileZeroPos] = createSignal({ x: 0, y: 0 });

  // Find and track the (0,0) tile position
  const updateTileZeroPosition = () => {
    const zeroTile = document.querySelector('[data-tile-x="0"][data-tile-y="0"]');
    if (zeroTile) {
      const rect = zeroTile.getBoundingClientRect();
      setTileZeroPos({
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY
      });
    }
  };

  // Set up a mutation observer to watch for tile updates
  createEffect(() => {
    const observer = new MutationObserver(updateTileZeroPosition);
    const mapContainer = document.querySelector('.mapContainer');
    
    if (mapContainer) {
      observer.observe(mapContainer, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }

    // Initial update
    updateTileZeroPosition();

    // Set up periodic checks in case we miss updates
    const interval = setInterval(updateTileZeroPosition, 1000);

    onCleanup(() => {
      observer.disconnect();
      clearInterval(interval);
    });
  });

  // Update viewport position when position or tileZeroPos changes
  createEffect(() => {
    const pos = position();
    if (!pos || !tileZeroPos().x) return;

    // Calculate position relative to (0,0) tile
    // The (0,0) tile's top-left corner is at (TILE_ZERO_WORLD_X, TILE_ZERO_WORLD_Y) in world coordinates
    const screenX = tileZeroPos().x -250 + pos[0];
    const screenY = tileZeroPos().y + pos[1];

    // Log positions for debugging
    console.group('Map Position Debug');
    console.log('(0,0) Tile Position (top-left):', {
      x: tileZeroPos().x,
      y: tileZeroPos().y,
      width: TILE_SIZE,
      height: TILE_SIZE
    });
    
    console.log('Player Viewport Indicator (red frame):', {
      x: screenX,
      y: screenY,
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
      worldX: pos[0],
      worldY: pos[1]
    });
    
    // Get the actual viewport indicator element's position
    const indicator = document.querySelector(`.${styles.playerViewport}`);
    if (indicator) {
      const rect = indicator.getBoundingClientRect();
      console.log('Actual Indicator Element (computed):', {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        computedStyle: window.getComputedStyle(indicator)
      });
    }
    console.groupEnd();

    const viewportStyle = {
      left: `${screenX}px`,
      top: `${screenY}px`,
      width: `${VIEWPORT_WIDTH}px`,
      height: `${VIEWPORT_HEIGHT}px`,
      border: '2px solid #ff6b6b',
      position: 'absolute',  // Changed from 'fixed' to 'absolute'
      pointerEvents: 'none',
      zIndex: 1000,
      boxSizing: 'border-box',
      backgroundColor: 'rgba(255, 0, 0, 0.1)',
      transform: 'translateZ(0)'
    };
    
    console.log('Viewport Style:', viewportStyle);
    setPlayerViewportStyle(viewportStyle);
  });

  return (
    <div 
      class={styles.playerViewport}
      style={playerViewportStyle()}
    >
    </div>
  );
};

export default ViewportPosition;
