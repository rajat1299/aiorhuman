import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-game-dark-900">
      <div className="fixed inset-0 bg-gradient-radial from-game-primary/5 to-transparent pointer-events-none opacity-20" />
      <Navbar />
      <main className="game-container relative">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;