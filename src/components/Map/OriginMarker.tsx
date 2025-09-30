import { Component, createEffect, createSignal } from 'solid-js';
import styles from './OriginMarker.module.css';

const TILE_SIZE = 64; // 64x64 pixels per map tile

const OriginMarker: Component = () => {
  const [style, setStyle] = createSignal({
    left: '0px',
    top: '0px',
    width: '4px',
    height: '4px',
    transform: 'translate(-50%, -50%)',
  });

  // Position the marker at (0,0)
  createEffect(() => {
    // Position is fixed at world (0,0)
    const pixelX = 0;
    const pixelY = 0;
    
    setStyle({
      left: `${pixelX}px`,
      top: `${pixelY}px`,
      width: '12px',
      height: '12px',
      transform: 'translate(-50%, -50%)',
    });
  });

  return (
    <div 
      class={styles.originMarker}
      style={style()}
      title="World Origin (0,0)"
    >
      <div class={styles.originLabel}>(0,0)</div>
    </div>
  );
};

export default OriginMarker;
