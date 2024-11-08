import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="container mx-auto px-4">
      <div className="bg-game-light rounded-lg shadow-lg p-8">
        {/* Profile Header */}
        <div className="flex items-center space-x-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-game-primary flex items-center justify-center">
            <span className="text-4xl text-white font-bold">
              {user.username[0].toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-game-dark">{user.username}</h1>
            <p className="text-game-dark-600">Player Stats</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Games Played */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-game-dark mb-2">Games Played</h3>
            <p className="text-3xl font-bold text-game-primary">{user.stats.totalGames}</p>
          </div>

          {/* Win Rate */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-game-dark mb-2">Win Rate</h3>
            <p className="text-3xl font-bold text-game-primary">{user.stats.winRate}%</p>
          </div>

          {/* Total Points */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-game-dark mb-2">Total Points</h3>
            <p className="text-3xl font-bold text-game-primary">{user.stats.totalPoints}</p>
          </div>

          {/* Correct Guesses */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-game-dark mb-2">Correct Guesses</h3>
            <p className="text-3xl font-bold text-game-primary">{user.stats.correctGuesses}</p>
          </div>

          {/* Successful Deceptions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-game-dark mb-2">Successful Deceptions</h3>
            <p className="text-3xl font-bold text-game-primary">{user.stats.successfulDeceptions}</p>
          </div>

          {/* Average Points */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-game-dark mb-2">Average Points</h3>
            <p className="text-3xl font-bold text-game-primary">{user.stats.averagePoints}</p>
          </div>
        </div>

        {/* Achievement Section (Placeholder for future implementation) */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-game-dark mb-4">Achievements</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-game-dark-600">Achievements coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 