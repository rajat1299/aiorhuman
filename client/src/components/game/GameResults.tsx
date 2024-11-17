import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FadeIn } from '../common/Animations';

interface GameResultsProps {
  result: {
    winner?: string;
    score?: number;
    stats: {
      messageCount: number;
      duration: number;
      player1Correct: boolean;
      player2Correct: boolean;
      guesses?: {
        player: {
          guessedAI: boolean;
          timestamp: Date;
        };
        opponent: {
          guessedAI: boolean;
          timestamp: Date;
        };
      };
      isAIOpponent?: boolean;
    };
  };
  onPlayAgain: () => void;
}

const GameResults: React.FC<GameResultsProps> = ({ result, onPlayAgain }) => {
  const [showGuesses, setShowGuesses] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Stagger the reveal of different sections
    const showGuessesTimer = setTimeout(() => {
      setShowGuesses(true);
    }, 500);

    const showStatsTimer = setTimeout(() => {
      setShowStats(true);
    }, 1000);

    return () => {
      clearTimeout(showGuessesTimer);
      clearTimeout(showStatsTimer);
    };
  }, []);

  // Format opponent's guess for display
  const getOpponentGuessText = () => {
    if (!result.stats.guesses?.opponent) return '';
    return result.stats.guesses.opponent.guessedAI ? 'AI' : 'Human';
  };

  // Format player's guess for display
  const getPlayerGuessText = () => {
    if (!result.stats.guesses?.player) return '';
    return result.stats.guesses.player.guessedAI ? 'AI' : 'Human';
  };

  // Determine if opponent's guess was correct
  const isOpponentGuessCorrect = () => {
    if (!result.stats.guesses?.opponent || result.stats.isAIOpponent === undefined) return false;
    
    // If opponent is AI, their guess should be "Human" for a human player
    if (result.stats.isAIOpponent) {
      return !result.stats.guesses.opponent.guessedAI; // Should be false (Human) for human player
    }
    
    // For human opponent, check if their guess matches reality
    return result.stats.player2Correct;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <FadeIn>
        <div className="bg-game-dark-800 rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-game-dark-600">
          {/* Header - Always visible */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 animate-bounce">
              {result.score ? '🎉' : '😅'}
            </div>
            <h2 className="text-3xl font-bold text-game-light mb-2">
              {result.score ? 'Victory!' : 'Good Try!'}
            </h2>
            <div className="text-4xl font-bold bg-gradient-to-r from-game-primary to-game-secondary bg-clip-text text-transparent">
              +{result.score || 0} points
            </div>
          </div>

          {/* Guesses Section - Revealed after delay */}
          <div className={`transition-all duration-500 ${
            showGuesses ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
          }`}>
            <div className="bg-game-dark-700/50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-game-light mb-4">Guesses</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-sm text-game-light-600 mb-1">Your Guess</div>
                  <div className={`text-xl font-bold ${result.stats.player1Correct ? 'text-green-400' : 'text-red-400'}`}>
                    {getPlayerGuessText()}
                    {result.stats.player1Correct ? ' ✓' : ' ✗'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-game-light-600 mb-1">Opponent's Guess</div>
                  <div className={`text-xl font-bold ${isOpponentGuessCorrect() ? 'text-green-400' : 'text-red-400'}`}>
                    {getOpponentGuessText()}
                    {isOpponentGuessCorrect() ? ' ✓' : ' ✗'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Game Stats - Revealed after longer delay */}
          <div className={`transition-all duration-500 ${
            showStats ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
          }`}>
            <div className="bg-game-dark-700/50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-game-light mb-4">Game Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-game-dark-600/50 rounded-lg">
                  <div className="text-2xl font-bold text-game-light">
                    {Math.floor(result.stats.duration / 60)}:{(result.stats.duration % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-sm text-game-light-600">Duration</div>
                </div>
                <div className="text-center p-4 bg-game-dark-600/50 rounded-lg">
                  <div className="text-2xl font-bold text-game-light">
                    {result.stats.messageCount}
                  </div>
                  <div className="text-sm text-game-light-600">Messages</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between space-x-4">
              <button 
                onClick={() => navigate('/')} 
                className="flex-1 px-6 py-4 bg-game-dark-600 text-game-light rounded-lg hover:bg-game-dark-500 transition-all duration-300 transform hover:scale-[1.02]"
              >
                Home
              </button>
              <button 
                onClick={onPlayAgain} 
                className="flex-1 px-6 py-4 bg-[#9333EA] text-white rounded-lg hover:bg-[#7E22CE] transition-all duration-300 transform hover:scale-[1.02]"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
};

export default GameResults; 