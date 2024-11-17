import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAutoLogin = useCallback(async () => {
    try {
      const response = await api.post('/auth/auto-login');
      console.log('Auto-login response:', response);
      
      if (response.data.success && response.data.token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        await login(response.data.token, response.data.user);
        navigate('/');
      } else {
        console.error('Invalid response structure:', response.data);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Auto-login failed:', error);
    }
  }, [login, navigate]);

  useEffect(() => {
    handleAutoLogin();
  }, [handleAutoLogin]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">
          <span className="text-game-primary">Unmask</span>
          <span className="text-game-light"> the Impostor</span>
        </h1>
        <p className="text-game-light-600 text-xl max-w-2xl mx-auto">
          Engage in conversations and guess who—or what—is on the other side. Outsmart others to climb the leaderboard!
        </p>
      </div>

      <div className="bg-game-dark-600 p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="space-y-6">
          <button
            onClick={handleAutoLogin}
            className="w-full bg-game-primary hover:bg-game-primary-dark text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-game-primary focus:ring-opacity-50"
          >
            Start Playing
          </button>
          <div className="text-center text-game-light-600 text-sm">
            No account needed - just click and play!
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;