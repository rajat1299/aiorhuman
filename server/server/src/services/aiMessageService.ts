import { AIPersonality, AIPersonalityGenerator } from '../models/AIPersonality';
import OpenAI from 'openai';
import { ChatCompletionMessageParam, ChatCompletionSystemMessageParam } from 'openai/resources/chat';

export class AIMessageService {
  private personality: AIPersonality;
  private openai: OpenAI;

  constructor(openai: OpenAI) {
    this.openai = openai;
    this.personality = AIPersonalityGenerator.generate();
  }

  async generateResponse(messages: ChatCompletionMessageParam[]): Promise<string> {
    try {
      const personalityContext = this.getPersonalityPrompt();
      const systemMessage: ChatCompletionSystemMessageParam = {
        role: 'system',
        content: personalityContext
      };

      const augmentedMessages: ChatCompletionMessageParam[] = [
        systemMessage,
        ...messages
      ];

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: augmentedMessages,
        max_tokens: 100,
        temperature: 0.9,
        presence_penalty: 0.6,
        frequency_penalty: 0.6
      });

      return this.processResponse(completion.choices[0].message.content || "");
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "Sorry, I need a moment to collect my thoughts...";
    }
  }

  private getPersonalityPrompt(): string {
    return `You are participating in a chat game with the following personality traits:
      - Extroversion: ${this.personality.traits.extroversion}/10
      - Humor: ${this.personality.traits.humor}/10
      - Formality: ${this.personality.traits.formality}/10
      - Emotional Expression: ${this.personality.traits.emotionalExpression}/10
      Your interests include: ${this.personality.interests.join(', ')}.
      
      Maintain consistent personality throughout the conversation.
      Use natural language and occasionally make minor typos.
      Show appropriate emotional responses.
      Ask questions to engage the user.
      Never reveal that you are an AI.`;
  }

  private processResponse(response: string): string {
    // Add typos based on personality
    if (Math.random() < this.personality.typingStyle.typoFrequency) {
      response = this.addTypo(response);
    }

    // Add emojis based on personality
    if (Math.random() < this.personality.typingStyle.emojiFrequency) {
      response = this.addEmoji(response);
    }

    return response;
  }

  private addTypo(text: string): string {
    const words = text.split(' ');
    const typoTypes = ['swap', 'double', 'missing', 'adjacent'];
    
    // Select a random word to modify
    const wordIndex = Math.floor(Math.random() * words.length);
    const word = words[wordIndex];
    
    // Only apply typo to words longer than 3 characters
    if (word.length <= 3) return text;

    // Select a random typo type
    const typoType = typoTypes[Math.floor(Math.random() * typoTypes.length)];
    
    switch (typoType) {
      case 'swap': {
        // Swap two adjacent characters
        const charIndex = Math.floor(Math.random() * (word.length - 1));
        const chars = word.split('');
        [chars[charIndex], chars[charIndex + 1]] = [chars[charIndex + 1], chars[charIndex]];
        words[wordIndex] = chars.join('') + '*'; // Add asterisk to indicate correction
        return words.join(' ');
      }
      
      case 'double': {
        // Double a character
        const charIndex = Math.floor(Math.random() * word.length);
        const chars = word.split('');
        chars.splice(charIndex, 0, chars[charIndex]);
        words[wordIndex] = chars.join('') + '*';
        return words.join(' ');
      }
      
      case 'missing': {
        // Miss a character
        const charIndex = Math.floor(Math.random() * word.length);
        const chars = word.split('');
        chars.splice(charIndex, 1);
        words[wordIndex] = chars.join('') + '*';
        return words.join(' ');
      }
      
      case 'adjacent': {
        // Hit adjacent key
        const adjacentKeys: { [key: string]: string[] } = {
          'a': ['s', 'q', 'w'],
          'e': ['w', 'r', 'd'],
          'i': ['u', 'o', 'k'],
          'n': ['b', 'm', 'h'],
          's': ['a', 'd', 'w'],
          't': ['r', 'y', 'g'],
          // Add more mappings as needed
        };
        
        const chars = word.split('');
        for (let i = 0; i < chars.length; i++) {
          const char = chars[i].toLowerCase();
          if (adjacentKeys[char]) {
            const adjacent = adjacentKeys[char];
            chars[i] = adjacent[Math.floor(Math.random() * adjacent.length)];
            words[wordIndex] = chars.join('') + '*';
            return words.join(' ');
          }
        }
        return text;
      }
      
      default:
        return text;
    }
  }
  private addEmoji(text: string): string {
    const emoji = this.personality.vocabulary.emojis[
      Math.floor(Math.random() * this.personality.vocabulary.emojis.length)
    ];
    return `${text} ${emoji}`;
  }
}
      