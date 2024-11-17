import React, { createContext, useContext, useState } from 'react';
import { useSocket } from './SocketContext';

interface GameContextType {
  isPlaying: boolean;
  sendMessage: (message: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ 
  children: React.ReactNode;
  sessionId?: string;
}> = ({ children, sessionId }) => {
  const socket = useSocket();
  const [isPlaying] = useState(!!sessionId);

  const sendMessage = (message: string) => {
    if (!socket || !sessionId) return;
    
    socket.emit('send-message', {
      sessionId,
      content: message
    });
  };

  return (
    <GameContext.Provider value={{ isPlaying, sendMessage }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}; 