import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const features = [
  {
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: "Real-time Chat",
    description: "Engage in dynamic conversations with humans or AI opponents",
    color: "primary"
  },
  {
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
    title: "Competitive Play",
    description: "Test your perception and climb the global leaderboard",
    color: "secondary"
  },
  {
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Instant Matches",
    description: "Jump right into the action with no account required",
    color: "primary-light"
  }
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center px-4 relative overflow-hidden bg-game-dark pt-24">
      {/* Enhanced Background Layers */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-game-dark-800 via-game-dark to-game-dark-600 opacity-90" />
        <div className="absolute inset-0 bg-[url('../assets/grid-pattern.svg')] opacity-5" />
        <div className="absolute inset-0 bg-gradient-radial from-game-primary/10 via-transparent to-transparent animate-pulse-slow" />
        
        {/* Enhanced Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-game-primary/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${10 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Hero Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Main Title with Enhanced Gradient Animation */}
        <div className="mb-16 animate-fadeIn">
          <h1 className="text-7xl font-extrabold mb-6 relative">
            <span className="bg-gradient-to-r from-game-primary via-game-secondary to-game-primary-light bg-clip-text text-transparent bg-300% animate-gradient inline-block transform hover:scale-105 transition-transform duration-300">
              Unmask
            </span>
            <span className="text-game-light mx-4 opacity-90"> the </span>
            <span className="bg-gradient-to-l from-game-primary via-game-secondary to-game-primary-light bg-clip-text text-transparent bg-300% animate-gradient inline-block transform hover:scale-105 transition-transform duration-300">
              Impostor
            </span>
            <div className="absolute -inset-x-20 -inset-y-10 bg-gradient-to-r from-game-primary/0 via-game-primary/5 to-game-primary/0 animate-shine" />
          </h1>
          
          <p className="text-2xl text-game-light-600 leading-relaxed max-w-3xl mx-auto animate-slideIn">
            Engage in conversations and guess who—or what—is on the other side. 
            <span className="block mt-2 text-game-light font-medium">
              Outsmart others to climb the leaderboard!
            </span>
          </p>
        </div>

        {/* Enhanced CTA Button */}
        <div className="mb-20 animate-fadeIn animation-delay-300">
          <button
            onClick={() => navigate(isAuthenticated() ? '/game' : '/login')}
            className="group relative px-10 py-5 bg-gradient-to-r from-game-primary to-game-secondary text-white text-xl font-bold rounded-lg transform transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] focus:outline-none focus:ring-2 focus:ring-game-primary-light focus:ring-opacity-50 overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center">
              Start Playing
              <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-game-primary-dark to-game-secondary-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shine-fast" />
          </button>
        </div>

        {/* Enhanced Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 animate-fadeIn animation-delay-500">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-game-dark-600/30 backdrop-blur-md p-8 rounded-xl transform transition-all duration-300 hover:scale-105 hover:bg-game-dark-600/50 border border-game-dark-300/10 hover:border-game-primary/20"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-game-primary/0 via-game-primary/5 to-game-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Icon with Animation */}
              <div className={`text-game-${feature.color} mb-6 transform group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-bold text-game-light mb-3">{feature.title}</h3>
              <p className="text-game-light-400 group-hover:text-game-light-600 transition-colors duration-300">
                {feature.description}
              </p>
              
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 animate-shine" />
            </div>
          ))}
        </div>

        {/* Enhanced How to Play Section */}
        <div className="bg-game-dark-600/50 backdrop-blur-sm p-12 rounded-xl border border-game-dark-400/50 animate-fadeIn animation-delay-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-game-primary/5 to-transparent" />
          <h2 className="text-3xl font-bold text-game-primary mb-12 relative">How to Play</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {[
              { step: 1, text: "Join a match and start chatting" },
              { step: 2, text: "Analyze responses and behavior" },
              { step: 3, text: "Make your guess: Human or AI?" },
              { step: 4, text: "Earn points and climb the ranks" }
            ].map(({ step, text }) => (
              <div key={step} className="relative group">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-game-primary to-game-secondary rounded-full flex items-center justify-center text-2xl font-bold text-white transform group-hover:scale-110 transition-transform duration-300">
                  {step}
                </div>
                <div className="pt-8 text-game-light-600 transform group-hover:translate-x-2 transition-transform duration-300">
                  {text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;