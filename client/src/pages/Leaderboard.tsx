import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { FadeIn } from '../components/common/Animations';

interface LeaderboardEntry {
  userId: string;
  username: string;
  totalPoints: number;
  winRate: number;
  gamesPlayed: number;
  correctGuesses: number;
  successfulDeceptions: number;
  rank: number;
}

interface LeaderboardData {
  global: LeaderboardEntry[];
  userRank: {
    rank: number;
    total: number;
  };
  timeframe: 'all' | 'monthly' | 'weekly';
}

interface ResultState {
  isRevealing: boolean;
  showResult: boolean;
  result?: {
    correct: boolean;
    points: number;
    message: string;
  };
}

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [timeframe, setTimeframe] = useState<'all' | 'monthly' | 'weekly'>('all');
  const [loading, setLoading] = useState(true);
  const [resultState, setResultState] = useState<ResultState>({
    isRevealing: false,
    showResult: false,
  });

  useEffect(() => {
    if (!socket) return;

    socket.emit('get-leaderboard', timeframe);

    socket.on('leaderboard-update', (data: LeaderboardData) => {
      setLeaderboard(data);
      setLoading(false);
    });

    socket.on('guess-result', async (result) => {
      setResultState({
        isRevealing: true,
        showResult: false,
        result,
      });

      const delay = 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));

      setResultState(prev => ({
        ...prev,
        isRevealing: false,
        showResult: true,
      }));
    });

    return () => {
      socket.off('leaderboard-update');
      socket.off('guess-result');
    };
  }, [socket, timeframe]);

  const handleTimeframeChange = (newTimeframe: 'all' | 'monthly' | 'weekly') => {
    setTimeframe(newTimeframe);
    setLoading(true);
  };

  const renderResult = () => {
    if (!resultState.result) return null;

    return (
      <div className={`fixed inset-0 flex items-center justify-center z-50 
        ${resultState.isRevealing ? 'opacity-0' : 'opacity-100'} 
        transition-opacity duration-500`}>
        <div className="bg-game-dark-800 border border-game-dark-600 rounded-xl p-8 shadow-2xl">
          <div className="text-2xl font-bold text-center mb-4">
            {resultState.result.correct ? (
              <span className="text-green-500">Correct Guess!</span>
            ) : (
              <span className="text-red-500">Wrong Guess!</span>
            )}
          </div>
          <div className="text-game-light text-center mb-4">
            {resultState.result.message}
          </div>
          <div className="text-game-primary text-center text-xl">
            +{resultState.result.points} points
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-xl text-game-light animate-pulse">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <FadeIn>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-game-dark-800 rounded-xl shadow-2xl p-8 border border-game-dark-600">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-game-light">Global Rankings</h1>
            <div className="flex space-x-4">
              {['all', 'monthly', 'weekly'].map((period) => (
                <button
                  key={period}
                  onClick={() => handleTimeframeChange(period as 'all' | 'monthly' | 'weekly')}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                    timeframe === period
                      ? 'bg-game-primary text-white'
                      : 'bg-game-dark-600 text-game-light hover:bg-game-dark-500'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* User's Rank */}
          {leaderboard && user && (
            <div className="bg-game-dark-700/50 rounded-lg p-6 mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-game-light">Your Ranking</h2>
                  <p className="text-game-light-600">
                    #{leaderboard.userRank.rank} of {leaderboard.userRank.total} players
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold bg-gradient-to-r from-game-primary to-game-secondary bg-clip-text text-transparent">
                    {user.stats.totalPoints} points
                  </div>
                  <div className="text-game-light-600">
                    Win Rate: {user.stats.winRate}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="bg-game-dark-700/50 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-game-dark-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-game-light-600 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-game-light-600 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-game-light-600 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-game-light-600 uppercase tracking-wider">
                    Win Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-game-light-600 uppercase tracking-wider">
                    Games
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-game-dark-600">
                {leaderboard?.global.map((entry) => (
                  <tr
                    key={entry.userId}
                    className={`${
                      entry.userId === user?.id ? 'bg-game-primary/10' : ''
                    } hover:bg-game-dark-600/50 transition-colors duration-200`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-game-light">#{entry.rank}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-game-light">{entry.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-game-light">{entry.totalPoints}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-game-light">{entry.winRate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-game-light">{entry.gamesPlayed}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {(resultState.isRevealing || resultState.showResult) && renderResult()}
      </div>
    </FadeIn>
  );
};

export default Leaderboard; 