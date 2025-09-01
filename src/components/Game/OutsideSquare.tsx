import { Component } from 'solid-js';

interface OutsideSquareProps {
  isSelected: boolean;
  onClick: () => void;
}

const OutsideSquare: Component<OutsideSquareProps> = (props) => {
  return (
    <button
      class={`w-full h-full flex items-center justify-center text-sm font-mono
        ${props.isSelected 
          ? 'bg-blue-200 border-2 border-blue-500' 
          : 'bg-gray-100 border border-gray-300'}
        transition-colors duration-200`}
      onClick={props.onClick}
    >
      {props.isSelected ? 'X' : '•'}
    </button>
  );
};

export default OutsideSquare;
