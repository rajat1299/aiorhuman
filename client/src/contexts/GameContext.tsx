import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
}

interface GameResult {
  correct: boolean;
  guess: 'human' | 'ai';
  actualType: 'human' | 'ai';
  points?: number;
  stats?: {
    messageCount: number;
    duration: number;
  };
}

interface GameContextType {
  isPlaying: boolean;
  isLoading: boolean;
  messages: Message[];
  isConnected: boolean;
  isOpponentTyping: boolean;
  socketId: string | null;
  startGame: () => void;
  endGame: () => void;
  sendMessage: (content: string) => void;
  makeGuess: (guess: 'human' | 'ai') => void;
  gameResult: GameResult | null;
  setGameResult: (result: GameResult | null) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpponentTyping, setIsOpponentTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const initializeSocket = React.useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping socket connection');
      setIsConnected(false);
      return;
    }

    console.log('Initializing socket connection...');
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5001', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 10000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      console.log('Connected to game server');
      setIsConnected(true);
      setSocketId(newSocket.id || null);
      reconnectAttempts.current = 0;
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from game server:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try reconnecting
        newSocket.connect();
      }
    });

    newSocket.on('queue-joined', () => {
      console.log('Successfully joined queue');
    });

    newSocket.on('game-started', (data) => {
      console.log('Game started:', data);
      setTimeout(() => {
        setIsPlaying(true);
        setIsLoading(false);
      }, 3000);
      setIsPlaying(true);
      setMessages([]);
    });

    newSocket.on('message', (message: Message) => {
      console.log('Received message:', message);
      if (isPlaying) {  // Only add messages if game is active
        setMessages(prev => [...prev, message]);
      }
    });

    newSocket.on('opponent-typing', () => {
      if (isPlaying) {  // Only show typing indicator if game is active
        setIsOpponentTyping(true);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => setIsOpponentTyping(false), 3000);
      }
    });

    newSocket.on('game-result', (result: GameResult) => {
      console.log('Game result received:', result);
      setGameResult(result);
    });

    newSocket.on('game-ended', (data) => {
      console.log('Game ended:', data);
      if (data.status === 'abandoned') {
        setIsPlaying(false);
        // Only disconnect if the game was abandoned
        newSocket.disconnect();
      }
      // For completed games, stay connected
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      console.log('Cleaning up socket connection...');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      newSocket.disconnect();
      setSocket(null);
      setSocketId(null);
      setIsConnected(false);
      if (isPlaying) {
        setIsPlaying(false);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    const cleanup = initializeSocket();
    return () => cleanup?.();
  }, [initializeSocket]);

  const startGame = () => {
    if (!socket) {
      console.error('Socket not connected');
      return;
    }
    if (isPlaying) {
      console.log('Already in a game');
      return;
    }
    
    setMessages([]); // Clear messages when starting new game
    console.log('Emitting join-queue event');
    socket.emit('join-queue');
  };

  const endGame = () => {
    if (isPlaying) {
      console.log('Ending game');
      socket?.emit('leave-game');
      setIsPlaying(false);
      setIsOpponentTyping(false);
      // Don't clear messages immediately to allow viewing final state
    }
  };

  const sendMessage = (content: string) => {
    if (socket && isPlaying && socketId) {
      console.log('Sending message:', content);
      
      // Create local message
      const newMessage = {
        id: Date.now().toString(),
        content,
        senderId: socketId,
        timestamp: new Date()
      };
      
      // Add message locally first for immediate feedback
      setMessages(prev => [...prev, newMessage]);
      
      // Send to server
      socket.emit('send-message', content);
    }
  };
  

  const makeGuess = (guess: 'human' | 'ai') => {
    if (socket && isPlaying) {
      console.log('Making guess:', guess);
      socket.emit('make-guess', guess);
    }
  };

  return (
    <GameContext.Provider value={{ 
      isPlaying, 
      isLoading,
      messages, 
      isConnected,
      isOpponentTyping,
      socketId,
      startGame, 
      endGame, 
      sendMessage, 
      makeGuess,
      gameResult,
      setGameResult
    }}>
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