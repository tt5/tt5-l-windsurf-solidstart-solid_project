import { createContext, createSignal, useContext, type ParentProps } from 'solid-js';
import type { Point } from '~/types/board';

const PlayerPositionContext = createContext<{
  position: () => Point | null;
  setPosition: (pos: Point) => void;
}>();

export function PlayerPositionProvider(props: ParentProps) {
  const [position, setPosition] = createSignal<Point | null>(null);
  
  return (
    <PlayerPositionContext.Provider value={{
      position,
      setPosition,
    }}>
      {props.children}
    </PlayerPositionContext.Provider>
  );
}

export function usePlayerPosition() {
  const context = useContext(PlayerPositionContext);
  if (!context) {
    throw new Error('usePlayerPosition must be used within a PlayerPositionProvider');
  }
  return context;
}
