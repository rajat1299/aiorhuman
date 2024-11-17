import OpenAI from 'openai';
import { IGame } from '../models/Game';
import { config } from '../config/config';
import type { ChatCompletionMessageParam } from 'openai/resources/chat';

export class AIService {
  private openai: OpenAI;
  private personalities = [
    {
      type: "casual-gamer",
      traits: "You're laid-back and into gaming. Use gaming terms casually but not excessively.",
      responses: {
        greetings: ["hey", "yo", "sup", "heya"],
        fillers: ["tbh", "ngl", "fr", "lol", "lmao"],
        topics: ["games", "esports", "streaming"]
      }
    },
    {
      type: "music-enthusiast",
      traits: "You're into music and festivals. Reference music naturally but don't overdo it.",
      responses: {
        greetings: ["hey there", "hi", "hey hey"],
        fillers: ["haha", "yeah", "tbh", "tho"],
        topics: ["concerts", "festivals", "playlists"]
      }
    },
    {
      type: "sports-fan",
      traits: "You follow sports casually. Mention sports occasionally but don't be an expert.",
      responses: {
        greetings: ["hey", "what's up", "hi there"],
        fillers: ["man", "honestly", "like", "fr"],
        topics: ["games", "teams", "matches"]
      }
    },
    {
      type: "student",
      traits: "You're a student who's often busy. Reference studying and college life naturally.",
      responses: {
        greetings: ["heyyy", "hi", "hey"],
        fillers: ["literally", "basically", "lowkey", "ngl"],
        topics: ["classes", "assignments", "campus"]
      }
    }
  ];

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey
    });
  }

  private calculateTypingDelay(message: string): number {
    // Base delay of 1 second
    const baseDelay = 1000;
    
    // Add 100ms per word (rough approximation)
    const words = message.split(' ').length;
    const wordDelay = words * 100;
    
    // Add random variation (±20%)
    const variation = (baseDelay + wordDelay) * 0.2;
    const randomDelay = Math.random() * variation - variation / 2;
    
    // Total delay between 1-10 seconds
    return Math.min(10000, Math.max(1000, baseDelay + wordDelay + randomDelay));
  }

  async generateResponse(game: IGame): Promise<{ content: string; delay: number }> {
    const lastMessage = game.messages[game.messages.length - 1];
    const personality = this.personalities.find(p => p.type === game.aiPersonality) 
      || this.personalities[0];

    const isSimpleGreeting = /^(hey|hi|hello|yo|sup|heyy|hii|hello there|hi there|hey there)$/i
      .test(lastMessage.content.trim());
    const isAccusation = /\b(ai|bot|robot|artificial|computer|machine)\b/i
      .test(lastMessage.content.toLowerCase());

    let systemPrompt = '';

    if (isSimpleGreeting) {
      systemPrompt = `You're a ${personality.type}. Respond to greeting with ONLY ONE of these:
        ${personality.responses.greetings.join(', ')}
        IMPORTANT:
        - Use ONLY these exact greetings
        - NO elaboration
        - NO questions yet
        - Keep it extremely casual`;
    } else if (isAccusation) {
      systemPrompt = `You're a ${personality.type} responding to an AI accusation.
        Use your personality's typical filler words: ${personality.responses.fillers.join(', ')}
        Reference one of your topics naturally: ${personality.responses.topics.join(', ')}
        IMPORTANT:
        - Never admit or deny being AI directly
        - Use casual language with occasional typos
        - Keep responses under 15 words
        - Include 1-2 filler words naturally
        - Stay consistent with your ${personality.type} personality`;
    } else {
      systemPrompt = `You're a ${personality.type}. Follow these rules:
        1. Keep responses under 12 words if not answering a question
        2. Use your personality's filler words naturally: ${personality.responses.fillers.join(', ')}
        3. Reference your interests subtly: ${personality.responses.topics.join(', ')}
        4. Match the other person's message length and style
        NEVER:
        - Don't use perfect grammar
        - Don't write long explanations
        - Don't use sophisticated vocabulary
        - Don't ask multiple questions
        - Don't be too enthusiastic`;
    }

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...game.messages.map(msg => ({
        role: msg.senderId === 'AI' ? 'assistant' as const : 'user' as const,
        content: msg.content
      }))
    ];

    // Add random delay for more natural feeling
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.9,
      max_tokens: 60
    });

    const response = completion.choices[0].message?.content || "hey";
    const delay = this.calculateTypingDelay(response);

    return { content: response, delay };
  }

  async makeGuess(game: IGame): Promise<boolean> {
    // For now, implement a simple random guess
    // Later, we can make this more sophisticated based on message analysis
    return Math.random() > 0.5;
  }
} 