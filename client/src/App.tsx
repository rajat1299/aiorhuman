import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Game from './pages/Game';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import api from './services/api';
import socket from './services/socket';

const App: React.FC = () => {
  useEffect(() => {
    // Test API connection
    const testConnection = async () => {
      try {
        const response = await api.post('/auth/auto-login');
        console.log('Auto-login response:', response);
        
        // If login successful, connect socket
        if (response.data.success) {
          socket.auth = { token: response.data.token };
          socket.connect();
        }
      } catch (error) {
        console.error('API Error:', error);
      }
    };

    testConnection();

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-game-dark text-game-light">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/game"
                  element={
                    <PrivateRoute>
                      <Game />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/leaderboard"
                  element={
                    <PrivateRoute>
                      <Leaderboard />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </main>
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;

          