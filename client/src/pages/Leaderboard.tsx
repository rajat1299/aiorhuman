import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

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

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [timeframe, setTimeframe] = useState<'all' | 'monthly' | 'weekly'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (socket) {
      socket.emit('get-leaderboard', timeframe);

      socket.on('leaderboard-update', (data: LeaderboardData) => {
        setLeaderboard(data);
        setLoading(false);
      });

      return () => {
        socket.off('leaderboard-update');
      };
    }
  }, [socket, timeframe]);

  const handleTimeframeChange = (newTimeframe: 'all' | 'monthly' | 'weekly') => {
    setTimeframe(newTimeframe);
    setLoading(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-xl text-game-dark animate-pulse">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="bg-game-light rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-game-dark">Leaderboard</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => handleTimeframeChange('all')}
              className={`px-4 py-2 rounded-lg ${
                timeframe === 'all'
                  ? 'bg-game-primary text-white'
                  : 'bg-white text-game-dark hover:bg-gray-100'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => handleTimeframeChange('monthly')}
              className={`px-4 py-2 rounded-lg ${
                timeframe === 'monthly'
                  ? 'bg-game-primary text-white'
                  : 'bg-white text-game-dark hover:bg-gray-100'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => handleTimeframeChange('weekly')}
              className={`px-4 py-2 rounded-lg ${
                timeframe === 'weekly'
                  ? 'bg-game-primary text-white'
                  : 'bg-white text-game-dark hover:bg-gray-100'
              }`}
            >
              Weekly
            </button>
          </div>
        </div>

        {/* User's Rank */}
        {leaderboard && user && (
          <div className="bg-white rounded-lg p-6 mb-8 shadow">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-game-dark">Your Ranking</h2>
                <p className="text-game-dark-600">
                  {leaderboard.userRank.rank} of {leaderboard.userRank.total} players
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-game-primary">
                  {user.stats.totalPoints} points
                </div>
                <div className="text-game-dark-600">
                  Win Rate: {user.stats.winRate}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Win Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Games
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard?.global.map((entry) => (
                <tr
                  key={entry.userId}
                  className={`${
                    entry.userId === user?.id ? 'bg-blue-50' : ''
                  } hover:bg-gray-50`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">#{entry.rank}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{entry.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{entry.totalPoints}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{entry.winRate}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{entry.gamesPlayed}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard; 