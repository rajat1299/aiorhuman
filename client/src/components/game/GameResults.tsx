import React from 'react';
import { useNavigate } from 'react-router-dom';

interface GameResultsProps {
  result: {
    winner?: string;
    forfeitedBy?: string;
    error?: string;
    stats: {
      player1Correct: boolean;
      player2Correct: boolean;
      duration: number;
      messageCount: number;
    };
  };
  onPlayAgain: () => void;
}

const GameResults: React.FC<GameResultsProps> = ({ result, onPlayAgain }) => {
  const navigate = useNavigate();

  if (result.error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-xl font-bold mb-4">Game Ended</h3>
          <p className="text-gray-600 mb-6">{result.error}</p>
          <div className="flex justify-end space-x-4">
            <button onClick={() => navigate('/')} className="btn btn-secondary">
              Home
            </button>
            <button onClick={onPlayAgain} className="btn btn-primary">
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">Game Results</h3>
        
        <div className="space-y-4 mb-6">
          <div>
            <p className="font-medium">Your Guess:</p>
            <p className="text-gray-600">
              {result.stats.player1Correct ? '✅ Correct!' : '❌ Wrong!'}
            </p>
          </div>

          <div>
            <p className="font-medium">Opponent's Guess:</p>
            <p className="text-gray-600">
              {result.stats.player2Correct ? '✅ Correct!' : '❌ Wrong!'}
            </p>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">
              Game Duration: {Math.floor(result.stats.duration / 60)}m {result.stats.duration % 60}s
            </p>
            <p className="text-sm text-gray-600">
              Messages Exchanged: {result.stats.messageCount}
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            Home
          </button>
          <button onClick={onPlayAgain} className="btn btn-primary">
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameResults; 