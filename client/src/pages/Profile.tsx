import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { FadeIn } from '../components/common/Animations';

interface UserStats {
  totalGames: number;
  gamesWon: number;
  winRate: number;
  totalPoints: number;
  correctGuesses: number;
  successfulDeceptions: number;
  averagePoints: number;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.emit('get-profile');

    socket.on('profile-update', (data) => {
      setStats(data.stats);
    });

    return () => {
      socket.off('profile-update');
    };
  }, [socket]);

  if (!user || !stats) return null;

  return (
    <FadeIn>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-game-dark-800 rounded-xl shadow-2xl p-8 border border-game-dark-600">
          {/* Profile Header */}
          <div className="flex items-center space-x-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-game-primary to-game-secondary flex items-center justify-center">
              <span className="text-4xl text-white font-bold">
                {user.username[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-game-light">{user.username}</h1>
              <p className="text-game-light-600">Player Stats</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Games Played */}
            <div className="bg-game-dark-700/50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-game-light mb-2">Games Played</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-game-primary to-game-secondary bg-clip-text text-transparent">
                {stats.totalGames}
              </p>
            </div>

            {/* Win Rate */}
            <div className="bg-game-dark-700/50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-game-light mb-2">Win Rate</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-game-primary to-game-secondary bg-clip-text text-transparent">
                {stats.winRate}%
              </p>
            </div>

            {/* Total Points */}
            <div className="bg-game-dark-700/50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-game-light mb-2">Total Points</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-game-primary to-game-secondary bg-clip-text text-transparent">
                {stats.totalPoints}
              </p>
            </div>

            {/* Correct Guesses */}
            <div className="bg-game-dark-700/50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-game-light mb-2">Correct Guesses</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-game-primary to-game-secondary bg-clip-text text-transparent">
                {stats.correctGuesses}
              </p>
            </div>

            {/* Successful Deceptions */}
            <div className="bg-game-dark-700/50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-game-light mb-2">Successful Deceptions</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-game-primary to-game-secondary bg-clip-text text-transparent">
                {stats.successfulDeceptions}
              </p>
            </div>

            {/* Average Points */}
            <div className="bg-game-dark-700/50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-game-light mb-2">Average Points</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-game-primary to-game-secondary bg-clip-text text-transparent">
                {stats.averagePoints}
              </p>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
};

export default Profile; 