import { AIService } from '../services/AIService';
import { Game } from '../models/Game';
import mongoose from 'mongoose';

describe('AI Service', () => {
  let aiService: AIService;
  let testGame: any;

  beforeEach(() => {
    aiService = new AIService();
    testGame = new Game({
      sessionId: 'TEST123456',
      player1Id: new mongoose.Types.ObjectId(),
      player2Id: 'AI',
      isAIOpponent: true,
      aiPersonality: 'casual-gamer',
      messages: []
    });
  });

  it('should respond to greetings appropriately', async () => {
    testGame.messages.push({
      senderId: testGame.player1Id,
      content: 'hey',
      timestamp: new Date()
    });

    const response = await aiService.generateResponse(testGame);
    expect(response.toLowerCase()).toMatch(/^(hey|yo|sup|heya)$/);
  });

  it('should handle AI accusations naturally', async () => {
    testGame.messages.push({
      senderId: testGame.player1Id,
      content: 'Are you an AI?',
      timestamp: new Date()
    });

    const response = await aiService.generateResponse(testGame);
    expect(response.length).toBeLessThan(100);
    expect(response).not.toContain('I am an AI');
    expect(response).not.toContain('I am not an AI');
  });

  it('should maintain personality consistency', async () => {
    testGame.messages.push({
      senderId: testGame.player1Id,
      content: 'What do you like to do?',
      timestamp: new Date()
    });

    const response = await aiService.generateResponse(testGame);
    expect(response.toLowerCase()).toMatch(/(game|gaming|stream|esport)/i);
  });
}); 