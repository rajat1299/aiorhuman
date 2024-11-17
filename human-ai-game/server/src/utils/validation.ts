import { ValidationError } from './errors';

export const validateMessage = (content: string): void => {
  if (!content || typeof content !== 'string') {
    throw new ValidationError('Message content is required');
  }

  if (content.length > 500) {
    throw new ValidationError('Message is too long (max 500 characters)');
  }

  if (content.trim().length === 0) {
    throw new ValidationError('Message cannot be empty');
  }
};

export const validateUsername = (username: string): void => {
  if (!username || typeof username !== 'string') {
    throw new ValidationError('Username is required');
  }

  if (username.length < 3 || username.length > 20) {
    throw new ValidationError('Username must be between 3 and 20 characters');
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new ValidationError('Username can only contain letters, numbers, and underscores');
  }
};

export const validateSessionId = (sessionId: string): void => {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new ValidationError('Session ID is required');
  }

  if (!/^[A-Z0-9]{10}$/.test(sessionId)) {
    throw new ValidationError('Invalid session ID format');
  }
};

export const validateGuess = (guess: boolean | undefined): void => {
  if (typeof guess !== 'boolean') {
    throw new ValidationError('Guess must be a boolean value');
  }
}; 