import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import ChatWindow from '../components/game/ChatWindow';
import GameControls from '../components/game/GameControls';
import GameResults from '../components/game/GameResults';
import { GameProvider } from '../contexts/GameContext';

const SEARCH_TIMEOUT = 10000; // 10 seconds before AI fallback

interface GameSession {
  sessionId: string;
  opponent: {
    id: string;
    username: string;
  };
}

interface GameResult {
  winner?: string;
  score?: number;
  forfeitedBy?: string;
  error?: string;
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
}

const Game: React.FC = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const socket = useSocket();
  const { isAuthenticated, updatePoints } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [showGuessPrompt, setShowGuessPrompt] = useState(false);
  const [chatDisabled, setChatDisabled] = useState(false);
  const [isRevealingResult, setIsRevealingResult] = useState(false);

  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    socket.on('game-started', (data: GameSession) => {
      console.log('Game started:', data);
      setGameSession(data);
      setIsSearching(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      socket.emit('join-game', data.sessionId);
    });

    socket.on('game-ended', async (result: GameResult) => {
      console.log('Game ended:', result);
      
      // Set revealing state
      setIsRevealingResult(true);
      
      // Add random delay between 3-4 seconds
      const delay = 3000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Show results
      setGameResult(result);
      setIsRevealingResult(false);
      
      if (result.score) {
        updatePoints(result.score);
      }
    });

    socket.on('queue-status', (data) => {
      console.log('Queue status:', data);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setIsSearching(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    });

    socket.on('opponent-made-guess', () => {
      console.log('Opponent has made their guess');
      setShowGuessPrompt(true);
      setChatDisabled(true);
    });

    return () => {
      if (socket) {
        socket.off('game-started');
        socket.off('game-ended');
        socket.off('queue-status');
        socket.off('error');
        socket.off('opponent-made-guess');
        if (isSearching) {
          socket.emit('leave-queue');
        }
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [socket, isSearching, isAuthenticated, updatePoints]);

  const handleFindMatch = () => {
    if (!socket || !isAuthenticated) return;
    
    try {
      setIsSearching(true);
      socket.emit('join-queue');
      console.log('Joining queue...');

      timeoutRef.current = setTimeout(() => {
        if (isSearching && socket) {
          console.log('Timeout reached, requesting AI opponent...');
          socket.emit('request-ai-opponent');
        }
      }, SEARCH_TIMEOUT);
    } catch (error) {
      console.error('Error finding match:', error);
      setIsSearching(false);
    }
  };

  const handleCancelSearch = () => {
    if (!socket) return;
    setIsSearching(false);
    socket.emit('leave-queue');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    console.log('Leaving queue...');
  };

  const handleGuess = (guessedAI: boolean) => {
    if (!socket || !gameSession) return;
    socket.emit('make-guess', {
      sessionId: gameSession.sessionId,
      guessedAI
    });
  };

  const handlePlayAgain = () => {
    setGameResult(null);
    setGameSession(null);
    handleFindMatch();
  };

  if (isRevealingResult) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="text-2xl text-game-light animate-pulse">
          Revealing results...
        </div>
      </div>
    );
  }

  if (gameResult) {
    return <GameResults result={gameResult} onPlayAgain={handlePlayAgain} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      {gameSession ? (
        <div className="container mx-auto px-4 py-8 space-y-4">
          <GameProvider sessionId={gameSession.sessionId}>
            <ChatWindow 
              sessionId={gameSession.sessionId}
              opponent={gameSession.opponent}
              disabled={chatDisabled}
            />
            {showGuessPrompt && (
              <div className="text-center text-game-light mb-4">
                <p className="text-lg font-bold">Your opponent has made their guess!</p>
                <p className="text-game-light-600">Chat is now disabled. Please make your guess.</p>
              </div>
            )}
            <GameControls 
              onGuessHuman={() => handleGuess(false)}
              onGuessAI={() => handleGuess(true)}
            />
          </GameProvider>
        </div>
      ) : (
        <div className="text-center">
          {!isSearching ? (
            <button
              onClick={handleFindMatch}
              className="px-8 py-4 bg-game-primary text-white rounded-lg hover:bg-game-primary-dark transition-colors"
              disabled={!isAuthenticated || !socket}
            >
              Find Match
            </button>
          ) : (
            <div>
              <div className="mb-4">
                <div className="text-xl mb-2">Finding your opponent...</div>
                <div className="text-sm text-game-light-400">
                  This might take a moment
                </div>
              </div>
              <button
                onClick={handleCancelSearch}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Game;