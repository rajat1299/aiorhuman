import React from 'react';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const FadeIn: React.FC<FadeInProps> = ({ 
  children, 
  delay = 0, 
  duration = 300,
  className = '' 
}) => {
  return (
    <div
      className={`animate-fadeIn ${className}`}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

export const SlideUp: React.FC<FadeInProps> = ({ 
  children, 
  delay = 0, 
  duration = 300,
  className = '' 
}) => {
  return (
    <div
      className={`animate-slideUp ${className}`}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

export const PulseEffect: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`absolute inset-0 animate-pulseRing rounded-lg ${className}`} />
); 