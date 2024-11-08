import React from 'react';
import { FadeIn } from '../common/Animations';

interface GameResultProps {
  result: {
    correct: boolean;
    guess: 'human' | 'ai';
    actualType: 'human' | 'ai';
    points?: number;
    stats?: {
      messageCount: number;
      duration: number;
    };
  };
  onPlayAgain: () => void;
}

const GameResult: React.FC<GameResultProps> = ({ result, onPlayAgain }) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <FadeIn>
        <div className="card max-w-lg mx-4">
          <div className="text-center">
            <div className={`text-6xl mb-4 ${result.correct ? 'text-game-success' : 'text-game-error'}`}>
              {result.correct ? '🎉' : '😅'}
            </div>
            <h2 className="text-2xl font-bold mb-2 text-game-light">
              {result.correct ? 'Correct Guess!' : 'Not Quite Right!'}
            </h2>
            <p className="text-game-light/70 mb-6">
              You guessed {result.guess}, and it was {result.actualType}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-game-dark-700 p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-game-primary mb-1">
                {result.points || 0}
              </div>
              <div className="text-sm text-game-light/70">Points Earned</div>
            </div>
            {result.stats && (
              <>
                <div className="bg-game-dark-700 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-game-secondary mb-1">
                    {result.stats.messageCount}
                  </div>
                  <div className="text-sm text-game-light/70">Messages Exchanged</div>
                </div>
                <div className="bg-game-dark-700 p-4 rounded-xl text-center col-span-2">
                  <div className="text-2xl font-bold text-game-accent mb-1">
                    {formatDuration(result.stats.duration)}
                  </div>
                  <div className="text-sm text-game-light/70">Conversation Duration</div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={onPlayAgain}
            className="btn btn-primary w-full"
          >
            Play Again
          </button>
        </div>
      </FadeIn>
    </div>
  );
};

export default GameResult; 