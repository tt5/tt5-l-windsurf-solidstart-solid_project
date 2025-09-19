import { createPoint, type Point } from '~/types/board';
import { usePlayerPosition } from '~/contexts/playerPosition';

/**
 * Utility function to jump to a specific position in the game
 * @param x The x-coordinate to jump to
 * @param y The y-coordinate to jump to
 * @returns The new position as a Point, or null if position is invalid
 */
export function jumpToPosition(x: number, y: number): Point | null {
  try {
    // Get the current position context
    const { setPosition } = usePlayerPosition();
    
    // Create a new position point
    const newPosition = createPoint(
      Math.floor(x), // Ensure integer coordinates
      Math.floor(y)  // Ensure integer coordinates
    );
    
    // Update the position
    setPosition(newPosition);
    
    console.log(`Jumped to position: [${x}, ${y}]`);
    return newPosition;
  } catch (error) {
    console.error('Failed to jump to position:', error);
    return null;
  }
}

/**
 * Hook that provides a jumpToPosition function
 * @returns An object containing the jumpToPosition function
 */
export function useNavigation() {
  const { setPosition } = usePlayerPosition();
  
  return {
    /**
     * Jump to a specific position in the game
     * @param x The x-coordinate to jump to
     * @param y The y-coordinate to jump to
     * @returns The new position as a Point, or null if position is invalid
     */
    jumpToPosition: (x: number, y: number): Point | null => {
      try {
        const newPosition = createPoint(
          Math.floor(x),
          Math.floor(y)
        );
        setPosition(newPosition);
        console.log(`Jumped to position: [${x}, ${y}]`);
        return newPosition;
      } catch (error) {
        console.error('Failed to jump to position:', error);
        return null;
      }
    }
  };
}
