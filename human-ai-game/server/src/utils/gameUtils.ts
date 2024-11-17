import { customAlphabet } from 'nanoid';

// Create a custom nanoid instance for game session IDs
const generateId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

export { generateId };

export const calculateScore = (
  isAIGame: boolean,
  correctGuess: boolean,
  messageCount: number
): number => {
  const baseScore = 100;
  const messageBonus = Math.max(0, 10 - messageCount) * 5; // Bonus for using fewer messages
  const aiBonus = isAIGame ? 20 : 0; // Bonus for AI games
  const guessMultiplier = correctGuess ? 1 : 0;

  return (baseScore + messageBonus + aiBonus) * guessMultiplier;
};

export const isGameComplete = (
  messagesCount: number,
  maxMessages: number,
  guessesCount: number,
  playerCount: number
): boolean => {
  return (
    messagesCount >= maxMessages || // Max messages reached
    guessesCount === playerCount    // All players have made their guesses
  );
}; 