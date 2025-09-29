import { Component, createEffect, createSignal } from 'solid-js';
import { usePlayerPosition } from '~/contexts/PlayerPositionContext';

const ViewportPosition: Component = () => {
  const { position } = usePlayerPosition();
  const [viewportPos, setViewportPos] = createSignal({ x: 0, y: 0 });

  // The viewport's top-left corner is the player's position
  createEffect(() => {
    const pos = position();
    if (pos) {
      // The viewport's top-left corner is the player's position
      setViewportPos({ x: pos[0], y: pos[1] });
    }
  });

  return (
    <div class="viewport-position">
      Viewport: ({viewportPos().x}, {viewportPos().y}) to ({viewportPos().x + 14}, {viewportPos().y + 14})
    </div>
  );
};

export default ViewportPosition;
