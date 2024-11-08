import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import ChatWindow from './game/ChatWindow';

interface GameStartData {
  sessionId: string;
  opponent: {
    id: string;
    isAI: boolean;
  };
}

const Game: React.FC = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [inQueue, setInQueue] = useState(false);
  const [inGame, setInGame] = useState(false);

  useEffect(() => {
    if (socket) {
      socket.on('queue-joined', () => {
        setInQueue(true);
      });

      socket.on('game-started', (data: GameStartData) => {
        setInQueue(false);
        setInGame(true);
        console.log('Game started:', data);
      });

      socket.on('game-ended', () => {
        setInGame(false);
      });

      return () => {
        socket.off('queue-joined');
        socket.off('game-started');
        socket.off('game-ended');
      };
    }
  }, [socket]);

  const joinQueue = () => {
    if (socket) {
      socket.emit('join-queue');
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Welcome, {user?.username}!</h1>
        
        {!inQueue && !inGame ? (
          <button
            onClick={joinQueue}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Find Match
          </button>
        ) : inQueue ? (
          <div className="text-gray-600">
            Looking for a match...
          </div>
        ) : (
          <ChatWindow />
        )}
      </div>
    </div>
  );
};

export default Game; 