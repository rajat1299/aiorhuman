import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
}

const ChatWindow: React.FC = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (socket) {
      socket.on('message', (message: Message) => {
        setMessages(prev => [...prev, message]);
      });

      socket.on('opponent-typing', () => {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      });

      return () => {
        socket.off('message');
        socket.off('opponent-typing');
      };
    }
  }, [socket]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (socket && inputMessage.trim()) {
      socket.emit('send-message', inputMessage.trim());
      setInputMessage('');
    }
  };

  const isOwnMessage = (senderId: string) => {
    return user?.id === senderId || senderId === socket?.id;
  };

  return (
    <div className="flex flex-col h-[600px] bg-game-dark-600 rounded-lg shadow-xl">
      <div className="p-4 border-b border-game-dark-400">
        <h2 className="text-xl font-semibold text-game-light">Chat</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-game-dark-400 scrollbar-track-transparent">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${isOwnMessage(message.senderId) ? 'justify-end' : 'justify-start'} animate-fadeIn`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 transform transition-all duration-200 hover:scale-[1.02] ${
                isOwnMessage(message.senderId)
                  ? 'bg-game-primary text-white'
                  : 'bg-game-dark-400 text-game-light'
              }`}
            >
              <p className="break-words">{message.content}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-fadeIn">
            <div className="bg-game-dark-400 text-game-light rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-game-light rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-game-light rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-game-light rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-game-dark-400">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 bg-game-dark-400 text-game-light placeholder-game-light-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-game-primary transition-all duration-200"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-game-primary text-white rounded-lg hover:bg-game-primary-dark focus:outline-none focus:ring-2 focus:ring-game-primary transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!inputMessage.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow; 