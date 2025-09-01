import { Component } from 'solid-js';

interface SquareProps {
  isSelected: boolean;
  onClick: () => void;
}

const Square: Component<SquareProps> = (props) => {
  const squareStyle = {
    aspectRatio: '1',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    border: '1px solid #e0e0e0',
    '&:hover': {
      backgroundColor: '#f5f5f5',
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
  } as const;

  const circleStyle = {
    transition: 'all 0.2s ease',
  } as const;

  return (
    <div 
      onClick={props.onClick}
      style={squareStyle}
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
