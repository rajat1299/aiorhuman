import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-game-dark-800/50 backdrop-blur-md border-b border-game-dark-400/50 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-8">
            <Link 
              to="/" 
              className="flex items-center space-x-2 group"
            >
              <span className="text-2xl font-bold bg-gradient-to-r from-game-primary to-game-secondary bg-clip-text text-transparent group-hover:from-game-primary-light group-hover:to-game-secondary-light transition-all duration-300">
                Human
              </span>
              <span className="text-2xl font-light text-game-light group-hover:text-game-light-600 transition-colors duration-300">
                or AI
              </span>
            </Link>
            
            {user && (
              <div className="hidden md:flex items-center space-x-2">
                <Link 
                  to="/game" 
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive('/game')
                      ? 'bg-game-primary/10 text-game-primary'
                      : 'text-game-light-600 hover:bg-game-dark-600/50 hover:text-game-primary'
                  }`}
                >
                  Play
                </Link>
                <Link 
                  to="/leaderboard" 
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive('/leaderboard')
                      ? 'bg-game-primary/10 text-game-primary'
                      : 'text-game-light-600 hover:bg-game-dark-600/50 hover:text-game-primary'
                  }`}
                >
                  Leaderboard
                </Link>
                <Link 
                  to="/profile" 
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive('/profile')
                      ? 'bg-game-primary/10 text-game-primary'
                      : 'text-game-light-600 hover:bg-game-dark-600/50 hover:text-game-primary'
                  }`}
                >
                  Profile
                </Link>
              </div>
            )}
          </div>

          {user && (
            <div className="flex items-center space-x-6">
              <div className="bg-game-dark-600/50 px-4 py-2 rounded-lg border border-game-dark-400/50">
                <span className="text-game-light-600 mr-2">Points:</span>
                <span className="text-game-primary font-bold">
                  {user.stats.totalPoints}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-game-dark-600/50 hover:bg-game-dark-600 text-game-light-600 hover:text-game-primary px-4 py-2 rounded-lg transition-all duration-200 border border-game-dark-400/50 hover:border-game-primary/50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;