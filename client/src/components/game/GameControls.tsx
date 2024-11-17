import React from 'react';

interface GameControlsProps {
  onGuessHuman: () => void;
  onGuessAI: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({ onGuessHuman, onGuessAI }) => {
  return (
    <div className="w-full flex space-x-2">
      <button
        onClick={onGuessHuman}
        className="flex-1 h-12 bg-gradient-to-r from-emerald-400 to-teal-400 text-white font-medium 
          hover:from-emerald-500 hover:to-teal-500 
          transition-all duration-300 ease-in-out
          rounded-lg shadow-lg hover:shadow-emerald-400/30
          transform hover:scale-[1.02]
          focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50"
      >
        Guess Human
      </button>
      <button
        onClick={onGuessAI}
        className="flex-1 h-12 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium 
          hover:from-violet-600 hover:to-fuchsia-600
          transition-all duration-300 ease-in-out
          rounded-lg shadow-lg hover:shadow-violet-500/30
          transform hover:scale-[1.02]
          focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-opacity-50"
      >
        Guess AI
      </button>
    </div>
  );
};

export default GameControls; 