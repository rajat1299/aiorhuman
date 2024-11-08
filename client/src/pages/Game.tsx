import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import ChatWindow from '../components/game/ChatWindow';

interface GameStartData {
  sessionId: string;
  opponent: {
    id: string;
    isAI: boolean;
  };
}

interface GameResult {
  player1: {
    userId: string;
    guess: 'human' | 'ai';
    result: {
      correct: boolean;
      guess: 'human' | 'ai';
      actualType: 'human' | 'ai';
      score: {
        total: number;
        breakdown: {
          basePoints: number;
          messageBonus: number;
          timeBonus: number;
          deceptionBonus: number;
        };
        multiplier: number;
      };
      stats: {
        messageCount: number;
        duration: number;
        averageResponseTime: number;
      };
    };
  };
  player2: {
    userId: string;
    guess: 'human' | 'ai';
    result: {
      correct: boolean;
      guess: 'human' | 'ai';
      actualType: 'human' | 'ai';
      score: {
        total: number;
        breakdown: {
          basePoints: number;
          messageBonus: number;
          timeBonus: number;
          deceptionBonus: number;
        };
        multiplier: number;
      };
      stats: {
        messageCount: number;
        duration: number;
        averageResponseTime: number;
      };
    };
  };
  sessionStats: {
    messageCount: number;
    duration: number;
    averageResponseTime: number;
  };
}

interface WaitingState {
  isWaiting: boolean;
  message: string;
}

const Game: React.FC = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [inQueue, setInQueue] = useState(false);
  const [inGame, setInGame] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [waitingForGuess, setWaitingForGuess] = useState<WaitingState>({
    isWaiting: false,
    message: ''
  });
  const [matchmakingStage, setMatchmakingStage] = useState<'idle' | 'searching' | 'found' | 'connecting'>('idle');

  useEffect(() => {
    if (socket) {
      socket.on('queue-joined', () => {
        setInQueue(true);
        setGameResult(null);
        setMatchmakingStage('searching');
        setCountdown(10);

        // Simulate matchmaking stages
        setTimeout(() => setMatchmakingStage('found'), 5000);
        setTimeout(() => setMatchmakingStage('connecting'), 7000);
        setTimeout(() => {
          setMatchmakingStage('idle');
          setInQueue(false);
          setInGame(true);
        }, 10000);
      });

      socket.on('game-started', (data: GameStartData) => {
        console.log('Game started:', data);
        setInQueue(false);
        setInGame(true);
        setWaitingForGuess({ isWaiting: false, message: '' });
      });

      socket.on('prompt-guess', (data: { message: string }) => {
        console.log('Received prompt-guess:', data);
        setWaitingForGuess({
          isWaiting: true,
          message: data.message
        });
      });

      socket.on('opponent-guess-made', (data: { message: string }) => {
        console.log('Opponent made guess:', data);
        setWaitingForGuess({
          isWaiting: true,
          message: data.message
        });
        setInGame(false);
      });

      socket.on('waiting-for-result', (data: { message: string }) => {
        console.log('Waiting for result:', data);
        setWaitingForGuess({
          isWaiting: true,
          message: data.message
        });
        setInGame(false);
      });

      socket.on('game-result', (result: GameResult) => {
        console.log('Game result received:', result);
        setGameResult(result);
        setInGame(false);
        setWaitingForGuess({ isWaiting: false, message: '' });
      });

      socket.on('game-ended', () => {
        console.log('Game ended');
        setInGame(false);
        setWaitingForGuess({ isWaiting: false, message: '' });
      });

      return () => {
        socket.off('queue-joined');
        socket.off('game-started');
        socket.off('prompt-guess');
        socket.off('opponent-guess-made');
        socket.off('waiting-for-result');
        socket.off('game-result');
        socket.off('game-ended');
      };
    }
  }, [socket]);

  // Countdown effect
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev !== null ? prev - 1 : null);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const joinQueue = () => {
    if (socket) {
      socket.emit('join-queue');
    }
  };

  const makeGuess = (guess: 'human' | 'ai') => {
    if (socket) {
      console.log('Making guess:', guess);
      socket.emit('make-guess', guess);
      setWaitingForGuess({
        isWaiting: true,
        message: "Waiting for opponent's guess..."
      });
      setInGame(false);
    }
  };

  const playAgain = () => {
    setGameResult(null);
    setWaitingForGuess({
      isWaiting: false,
      message: ''
    });
    joinQueue();
  };

  const renderMatchmakingStatus = () => {
    switch (matchmakingStage) {
      case 'searching':
        return 'Searching for players...';
      case 'found':
        return 'Match found! Getting ready...';
      case 'connecting':
        return 'Connecting to match...';
      default:
        return 'Looking for a match...';
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="bg-game-dark-600 rounded-lg shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-game-light">Welcome, {user?.username}!</h1>
          {inGame && (
            <div className="flex space-x-4">
              <button
                onClick={() => makeGuess('human')}
                className="bg-game-secondary hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Guess Human
              </button>
              <button
                onClick={() => makeGuess('ai')}
                className="bg-game-primary hover:bg-game-primary-dark text-white px-6 py-2 rounded-lg transition-colors"
              >
                Guess AI
              </button>
            </div>
          )}
        </div>
        
        {!inQueue && !inGame && !gameResult && (
          <div className="text-center py-12">
            <button
              onClick={joinQueue}
              className="bg-game-primary hover:bg-game-primary-dark text-white font-bold py-3 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-[1.02]"
            >
              Find Match
            </button>
          </div>
        )}

        {inQueue && (
          <div className="text-center py-12">
            <div className="mb-6 text-4xl font-bold text-game-primary animate-pulse">
              {countdown}
            </div>
            <div className="text-xl text-game-light mb-8">
              {renderMatchmakingStatus()}
            </div>
            <div className="flex justify-center space-x-3">
              <div className="w-3 h-3 bg-game-primary rounded-full animate-bounce" 
                   style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-game-primary rounded-full animate-bounce" 
                   style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-game-primary rounded-full animate-bounce" 
                   style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {inGame && <ChatWindow />}

        {waitingForGuess.isWaiting && !gameResult && (
          <div className="fixed inset-0 bg-game-dark-800/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-game-dark-600 p-8 rounded-xl max-w-md w-full mx-4 text-center">
              <div className="text-xl text-game-light mb-6">
                {waitingForGuess.message}
              </div>
              {waitingForGuess.message.includes("Your turn") && (
                <div className="flex justify-center space-x-4 mb-6">
                  <button
                    onClick={() => makeGuess('human')}
                    className="bg-game-secondary hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Guess Human
                  </button>
                  <button
                    onClick={() => makeGuess('ai')}
                    className="bg-game-primary hover:bg-game-primary-dark text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Guess AI
                  </button>
                </div>
              )}
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-game-primary rounded-full animate-bounce" 
                     style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-game-primary rounded-full animate-bounce" 
                     style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-game-primary rounded-full animate-bounce" 
                     style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {gameResult && (
          <div className="fixed inset-0 bg-game-dark-800/90 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-game-dark-600 p-8 rounded-xl max-w-4xl w-full mx-4">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-game-primary mb-2">Results Revealed!</h2>
                <p className="text-game-light-600">Both players have made their guesses</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Your Results */}
                <div className="bg-game-dark-600/50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-game-primary mb-4">Your Results</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-game-light-600">Your Guess:</p>
                      <p className="text-xl font-bold text-game-light">
                        {user?.id === gameResult.player1.userId ? 
                          gameResult.player1.guess : gameResult.player2.guess}
                      </p>
                    </div>
                    <div>
                      <p className="text-game-light-600">Result:</p>
                      <p className={`text-xl font-bold ${user?.id === gameResult.player1.userId ? 
                        (gameResult.player1.result.correct ? 'text-green-500' : 'text-red-500') :
                        (gameResult.player2.result.correct ? 'text-green-500' : 'text-red-500')}`}>
                        {user?.id === gameResult.player1.userId ?
                          (gameResult.player1.result.correct ? 'Correct!' : 'Incorrect!') :
                          (gameResult.player2.result.correct ? 'Correct!' : 'Incorrect!')}
                      </p>
                    </div>
                    <div>
                      <p className="text-game-light-600">Points Earned:</p>
                      <p className="text-xl font-bold text-game-primary">
                        {user?.id === gameResult.player1.userId ?
                          gameResult.player1.result.score.total :
                          gameResult.player2.result.score.total}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Opponent's Results */}
                <div className="bg-game-dark-600/50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-game-primary mb-4">Opponent's Results</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-game-light-600">Their Guess:</p>
                      <p className="text-xl font-bold text-game-light">
                        {user?.id === gameResult.player1.userId ? 
                          gameResult.player2.guess : gameResult.player1.guess}
                      </p>
                    </div>
                    <div>
                      <p className="text-game-light-600">Result:</p>
                      <p className={`text-xl font-bold ${user?.id === gameResult.player1.userId ? 
                        (gameResult.player2.result.correct ? 'text-green-500' : 'text-red-500') :
                        (gameResult.player1.result.correct ? 'text-green-500' : 'text-red-500')}`}>
                        {user?.id === gameResult.player1.userId ?
                          (gameResult.player2.result.correct ? 'Correct!' : 'Incorrect!') :
                          (gameResult.player1.result.correct ? 'Correct!' : 'Incorrect!')}
                      </p>
                    </div>
                    <div>
                      <p className="text-game-light-600">Points Earned:</p>
                      <p className="text-xl font-bold text-game-primary">
                        {user?.id === gameResult.player1.userId ?
                          gameResult.player2.result.score.total :
                          gameResult.player1.result.score.total}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Stats */}
              <div className="mt-8 bg-game-dark-600/50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-game-primary mb-4">Session Stats</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-game-light-600">Messages</p>
                    <p className="text-2xl font-bold text-game-light">
                      {gameResult.sessionStats.messageCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-game-light-600">Duration</p>
                    <p className="text-2xl font-bold text-game-light">
                      {Math.floor(gameResult.sessionStats.duration / 60)}m {gameResult.sessionStats.duration % 60}s
                    </p>
                  </div>
                  <div>
                    <p className="text-game-light-600">Avg Response</p>
                    <p className="text-2xl font-bold text-game-light">
                      {gameResult.sessionStats.averageResponseTime.toFixed(1)}s
                    </p>
                  </div>
                </div>
              </div>

              {/* Play Again Button */}
              <div className="text-center mt-8">
                <button
                  onClick={playAgain}
                  className="bg-game-primary hover:bg-game-primary-dark text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
                >
                  Play Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;