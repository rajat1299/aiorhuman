import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleAutoLogin = async () => {
    try {
      const response = await axios.post('http://localhost:5001/auth/auto-login');
      
      if (response.data.success) {
        await login(response.data.token);
        navigate('/');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Auto-login failed:', error);
    }
  };

  useEffect(() => {
    handleAutoLogin();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Welcome to Human or AI?</h2>
        <p className="text-gray-600 mb-6 text-center">
          Test your ability to distinguish between human and AI responses.
        </p>
        <div className="text-center">
          <button
            onClick={handleAutoLogin}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Start Playing
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login; 