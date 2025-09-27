import { type Component, JSX } from 'solid-js';
import styles from './Board.module.css';

interface GridCellProps {
  x: number;
  y: number;
  worldX: number;
  worldY: number;
  isBP: boolean;
  isSelected: boolean;
  isPlayerPosition: boolean;
  isHovered: boolean;
  isValid: boolean;
  isSaving: boolean;
  onMouseDown: (e: MouseEvent) => void;
  onMouseUp: (e: MouseEvent) => void;
  onMouseLeave: () => void;
  onClick: (e: MouseEvent) => void;
  onContextMenu: (e: MouseEvent) => void;
  onMouseEnter: () => void;
}

const GridCell: Component<GridCellProps> = (props) => {
  // Track if we should process the click
  let shouldProcessClick = true;
  let isMouseDown = false;
  let mouseDownTime = 0;
  const MAX_CLICK_DURATION = 300; // ms

  const handleMouseDown = (e: MouseEvent) => {
    // Only process left mouse button clicks
    shouldProcessClick = e.button === 0;
    isMouseDown = true;
    mouseDownTime = Date.now();
    e.preventDefault();
    props.onMouseDown(e);
  };

  const handleMouseUp = (e: MouseEvent) => {
    const clickDuration = Date.now() - mouseDownTime;
    isMouseDown = false;
    
    // Only prevent click if mouseup happened outside the button and it was a quick click
    if (e.currentTarget && e.target && !(e.currentTarget as HTMLElement).contains(e.target as Node) && clickDuration < MAX_CLICK_DURATION) {
      shouldProcessClick = false;
    }
    e.preventDefault();
    props.onMouseUp(e);
  };

  const handleMouseLeave = () => {
    props.onMouseLeave();
    
    // If mouse leaves while button is down, only cancel if it's a long press
    if (isMouseDown) {
      const pressDuration = Date.now() - mouseDownTime;
      if (pressDuration < MAX_CLICK_DURATION) {
        shouldProcessClick = false;
      }
    }
  };

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!shouldProcessClick || props.isSelected || props.isSaving || props.isBP) {
      return;
    }
    
    props.onClick(e);
  };

  const squareClass = () => {
    const classes = [styles.square];
    if (props.isBP) {
      classes.push(styles.basePoint);
      if (isOnRestrictedLine(props.worldX, props.worldY)) {
        classes.push(styles.restricted);
      }
    }
    if (props.isSelected) {
      classes.push(styles.selected);
    }
    if (props.isPlayerPosition) classes.push(styles.playerPosition);
    if (props.isSaving && props.isHovered) classes.push(styles.loading);
    else if (props.isHovered) {
      classes.push(props.isValid ? styles['valid-hover'] : styles['invalid-hover']);
    }
    return classes.join(' ');
  };

  // Check if two points are on the same restricted line
  const areOnSameLine = (x1: number, y1: number, x2: number, y2: number): boolean => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    if (dx === 0 && dy === 0) return false;
    if (dx === 0 || dy === 0) return true;
    if (dx === dy || dx === -dy) return true;
    if (dy === 2 * dx || dx === 2 * dy) return true;
    if (dy === -2 * dx || dx === -2 * dy) return true;
    
    return false;
  };
  
  // Check if this basepoint is on a restricted line from any other basepoint or origin
  const isOnRestrictedLine = (x: number, y: number): boolean => {
    // First check against origin (0,0)
    if (areOnSameLine(x, y, 0, 0)) return true;
    
    // Note: This is a simplified version - you'll need to pass basePoints as a prop
    // or use a context if you want to check against other base points
    return false;
  };

  return (
    <button
      class={squareClass()}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={props.onMouseEnter}
      onContextMenu={props.onContextMenu}
      disabled={props.isSaving}
      classList={{
        [styles.square]: true,
        [styles.saving]: props.isSaving,
        [styles.interactive]: !props.isSaving
      }}
    >
      {props.isBP ? (
        <div class={styles.basePointMarker} />
      ) : !props.isSelected ? (
        <div class={styles.emptyMarker}>×</div>
      ) : null}
    </button>
  );
};

export default GridCell;
