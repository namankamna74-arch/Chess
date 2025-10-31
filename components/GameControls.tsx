
import React from 'react';
import type { GameMode } from '../types';

interface GameControlsProps {
  onNewGame: (mode: GameMode) => void;
  onFlipBoard: () => void;
  gameMode: GameMode;
}

export const GameControls: React.FC<GameControlsProps> = ({ onNewGame, onFlipBoard, gameMode }) => {
  const buttonStyle = "w-full text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-50";
  const activeStyle = "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";
  const inactiveStyle = "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500";
  
  return (
    <div className="grid grid-cols-2 gap-2">
      <button 
        onClick={() => onNewGame('local')}
        className={`${buttonStyle} ${gameMode === 'local' ? activeStyle : inactiveStyle}`}
      >
        Vs Player
      </button>
      <button 
        onClick={() => onNewGame('ai')}
        className={`${buttonStyle} ${gameMode === 'ai' ? activeStyle : inactiveStyle}`}
      >
        Vs AI
      </button>
      <button 
        onClick={onFlipBoard}
        className={`${buttonStyle} ${inactiveStyle} col-span-2`}
      >
        Flip Board
      </button>
    </div>
  );
};
