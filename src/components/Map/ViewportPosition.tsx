import { Component, createEffect, createSignal } from 'solid-js';
import { usePlayerPosition } from '~/contexts/PlayerPositionContext';
import styles from './ViewportPosition.module.css';

// Player's viewport size in world coordinates
const VIEWPORT_WIDTH = 15; // 15 world units wide
const VIEWPORT_HEIGHT = 15; // 15 world units tall

// Map tile size (pixels per tile)
const TILE_SIZE = 64; // 64x64 pixels per map tile (1 world unit = 1 pixel)

const ViewportPosition: Component = () => {
  const { position } = usePlayerPosition();
  const [playerViewportStyle, setPlayerViewportStyle] = createSignal({});

  // Update player viewport position on the map
  createEffect(() => {
    const pos = position();
    if (pos) {
      // Player's position is in world coordinates (1 unit = 1 pixel in world space)
      // On the map, we need to convert to pixel coordinates (1 world unit = 1 pixel)
      // But since the map shows tiles (64x64 pixels per tile), we need to scale accordingly
      
      // Calculate the viewport bounds in world coordinates
      const worldLeft = pos[0];
      const worldTop = pos[1];
      const worldRight = worldLeft + VIEWPORT_WIDTH;
      const worldBottom = worldTop + VIEWPORT_HEIGHT;
      
      // Convert to map pixel coordinates (1 world unit = 1 pixel)
      const pixelLeft = worldLeft;
      const pixelTop = worldTop;
      const pixelWidth = VIEWPORT_WIDTH;
      const pixelHeight = VIEWPORT_HEIGHT;
      
      setPlayerViewportStyle({
        left: `${pixelLeft}px`,
        top: `${pixelTop}px`,
        width: `${pixelWidth}px`,
        height: `${pixelHeight}px`,
        border: '2px solid #ff6b6b',
        position: 'absolute',
        pointerEvents: 'none',
        zIndex: 1000,
        boxSizing: 'border-box',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        // Ensure the viewport is always visible on top of map tiles
        transform: 'translateZ(0)'
      });
    }
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
