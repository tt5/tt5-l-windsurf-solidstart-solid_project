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
    const screenX = tileZeroPos().x + (pos[0] - TILE_ZERO_WORLD_X);
    const screenY = tileZeroPos().y + (pos[1] - TILE_ZERO_WORLD_Y);

    setPlayerViewportStyle({
      left: `${screenX}px`,
      top: `${screenY}px`,
      width: `${VIEWPORT_WIDTH}px`,
      height: `${VIEWPORT_HEIGHT}px`,
      border: '2px solid #ff6b6b',
      position: 'fixed',
      pointerEvents: 'none',
      zIndex: 1000,
      boxSizing: 'border-box',
      backgroundColor: 'rgba(255, 0, 0, 0.1)',
      transform: 'translateZ(0)'
    });
  });

  return (
    <div 
      class={styles.playerViewport}
      style={playerViewportStyle()}
      title={
        `Player Viewport (world coords): ` +
        `(${position()?.[0] || 0}, ${position()?.[1] || 0}) to ` +
        `(${(position()?.[0] || 0) + VIEWPORT_WIDTH - 1}, ${(position()?.[1] || 0) + VIEWPORT_HEIGHT - 1})`
      }
    >
      <div class={styles.viewportLabel}>
        Player Viewport (15×15)
      </div>
      <div class={styles.coordinates}>
        {position()?.[0] || 0},{position()?.[1] || 0}
      </div>
      <div class={styles.worldCoords}>
        World: {position()?.[0] || 0},{position()?.[1] || 0}
      </div>
    </div>
  );
};

export default ViewportPosition;
