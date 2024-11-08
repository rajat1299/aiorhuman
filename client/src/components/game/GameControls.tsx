import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { PulseEffect } from '../common/Animations';

const GameControls: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { sendMessage, makeGuess, isPlaying } = useGame();

  const handleSend = () => {
    if (message.trim() && isPlaying) {
      sendMessage(message);
      setMessage('');
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
    } else if (isTyping && !e.target.value.trim()) {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-game-dark-800 rounded-lg shadow-dark p-4 border border-game-dark-600">
      <div className="flex space-x-4 mb-4">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            className={`input resize-none transition-all duration-200 focus:shadow-dark ${
              !isPlaying ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            placeholder={isPlaying ? "Type your message..." : "Find a match to start chatting..."}
            rows={2}
            disabled={!isPlaying}
          />
          {isTyping && <PulseEffect className="border border-game-primary/20" />}
        </div>
        <button
          onClick={handleSend}
          className={`btn btn-primary self-end relative overflow-hidden group ${
            !isPlaying ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={!isPlaying}
        >
          <span className="relative z-10">Send</span>
          <div className="absolute inset-0 bg-gradient-to-r from-game-secondary to-game-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
        </button>
      </div>
      
      {isPlaying && (
        <div className="flex justify-between space-x-4">
          <button
            onClick={() => makeGuess('human')}
            className="flex-1 btn bg-gradient-to-r from-game-accent to-yellow-500 text-white hover:from-yellow-500 hover:to-game-accent"
          >
            Guess Human
          </button>
          <button
            onClick={() => makeGuess('ai')}
            className="flex-1 btn bg-gradient-to-r from-purple-500 to-game-secondary text-white hover:from-game-secondary hover:to-purple-500"
          >
            Guess AI
          </button>
        </div>
      )}
    </div>
  );
};

export default GameControls; 