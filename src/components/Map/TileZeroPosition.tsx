import { Component, createEffect, onCleanup } from 'solid-js';

const TileZeroPosition: Component = () => {
  // Log detailed information about an element
  const logElementInfo = (el: Element, prefix = '') => {
    if (!el) {
      console.log(`${prefix}Element is null or undefined`);
      return null;
    }

    const rect = el.getBoundingClientRect();
    const elementInfo = {
      tagName: el.tagName,
      id: el.id,
      className: el.className,
      coords: (el as HTMLElement).dataset?.coords,
      textContent: el.textContent?.trim(),
      rect: {
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      },
      dataset: { ...(el as HTMLElement).dataset },
      computedStyle: window.getComputedStyle(el)
    };
    
    console.log(`${prefix}Element Info:`, elementInfo);
    return elementInfo;
  };

  // Find and log the (0,0) tile
  const findAndLogTile = () => {
    console.log('=== Searching for (0,0) tile ===');
    
    // Try to find the tile container with data attributes
    const tileContainers = document.querySelectorAll('[data-tile-x][data-tile-y]');
    console.log(`Found ${tileContainers.length} tile containers`);
    
    // Look for the (0,0) tile
    const zeroTile = Array.from(tileContainers).find(el => {
      const tileX = el.getAttribute('data-tile-x');
      const tileY = el.getAttribute('data-tile-y');
      return tileX === '0' && tileY === '0';
    });

    if (zeroTile) {
      console.log('=== Found (0,0) tile container ===');
      logElementInfo(zeroTile, '  ');
      
      // Find the inner content div that contains the coordinates
      const contentDiv = zeroTile.querySelector('[data-coords]');
      if (contentDiv) {
        console.log('=== Found tile content ===');
        logElementInfo(contentDiv, '  ');
      }
      
      // Calculate position relative to viewport
      const rect = zeroTile.getBoundingClientRect();
      console.log('(0,0) Tile Screen Position:', {
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        worldX: zeroTile.getAttribute('data-world-x'),
        worldY: zeroTile.getAttribute('data-world-y')
      });
      
      // Also log the transform style of the parent
      const parent = zeroTile.parentElement;
      if (parent) {
        console.log('Parent transform:', window.getComputedStyle(parent).transform);
      }
    } else {
      console.log('(0,0) tile not found. Here are the first 5 tile containers:');
      Array.from(tileContainers).slice(0, 5).forEach((el, i) => {
        console.log(`[${i}]`, {
          tileX: el.getAttribute('data-tile-x'),
          tileY: el.getAttribute('data-tile-y'),
          worldX: el.getAttribute('data-world-x'),
          worldY: el.getAttribute('data-world-y'),
          className: el.className,
          rect: el.getBoundingClientRect()
        });
      });
    }
  };

  // Set up logging with a more robust timing
  createEffect(() => {
    // Initial check after a short delay
    const initialTimeout = setTimeout(() => {
      findAndLogTile();
      
      // Additional checks with increasing delays
      const timeouts = [
        setTimeout(findAndLogTile, 1000),
        setTimeout(findAndLogTile, 3000),
        setTimeout(findAndLogTile, 5000)
      ];
      
      // Cleanup all timeouts on unmount
      onCleanup(() => {
        timeouts.forEach(clearTimeout);
      });
    }, 500);
    
    // Cleanup initial timeout
    onCleanup(() => {
      clearTimeout(initialTimeout);
    });
  });

  // Return a valid JSX element
  return <div style={{ display: 'none' }}>TileZeroPosition Debug</div>;
};

export default TileZeroPosition;
