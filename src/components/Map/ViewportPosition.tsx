import { Component, createEffect, createSignal } from 'solid-js';
import { usePlayerPosition } from '~/contexts/PlayerPositionContext';
import styles from './ViewportPosition.module.css';

// Constants for the player's viewport (in world coordinates)
const VIEWPORT_WIDTH = 15; // 15 squares wide (world units)
const VIEWPORT_HEIGHT = 15; // 15 squares tall (world units)

// Map tile size (pixels per tile)
const TILE_SIZE = 64; // 64x64 pixels per map tile

const ViewportPosition: Component = () => {
  const { position } = usePlayerPosition();
  const [playerViewportStyle, setPlayerViewportStyle] = createSignal({});

  // Update player viewport position on the map
  createEffect(() => {
    const pos = position();
    if (pos) {
      // The player's position is in world coordinates (1 unit = 1 square in their viewport)
      // On the map, we need to convert these to pixel coordinates (1 tile = 64x64 pixels)
      const left = pos[0];  // Already in world coordinates
      const top = pos[1];   // Already in world coordinates
      
      // Convert world coordinates to map pixel coordinates
      const pixelLeft = left * TILE_SIZE;
      const pixelTop = top * TILE_SIZE;
      const pixelWidth = VIEWPORT_WIDTH * TILE_SIZE;
      const pixelHeight = VIEWPORT_HEIGHT * TILE_SIZE;
      
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
        backgroundColor: 'rgba(255, 0, 0, 0.1)'
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
        Player Viewport
      </div>
      <div class={styles.coordinates}>
        {position()?.[0] || 0},{position()?.[1] || 0}
      </div>
    </div>
  );
};

export default ViewportPosition;
