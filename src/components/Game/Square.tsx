import { Component } from 'solid-js';
import styles from './Square.module.css';

interface SquareProps {
  isSelected: boolean;
  onClick: () => void;
}

const Square: Component<SquareProps> = (props) => {
  return (
    <div 
      onClick={props.onClick}
      class={styles.square}
      role="button"
      aria-pressed={props.isSelected}
      aria-label={props.isSelected ? 'Selected square' : 'Unselected square'}
    >
      <svg 
        width="80%" 
        height="80%" 
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          fill={props.isSelected ? '#FFD700' : 'transparent'}
          stroke="#333"
          strokeWidth="2"
          style={circleStyle}
        />
      </svg>
    </div>
  );
};

export default Square;
