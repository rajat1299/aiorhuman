import { Server, Socket } from 'socket.io';
import mongoose, { Document, Types } from 'mongoose';
import GameSession, { IGameSession, IMessage } from '../models/GameSession';
import User, { IUser } from '../models/User';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat';
import { ScoringService } from './scoringService';
import { LeaderboardService } from './leaderboardService';
import { config } from 'dotenv';
config(); // Load environment variables

console.log('Environment check:', {
  hasOpenAIKey: !!process.env.OPENAI_API_KEY,
  envKeys: Object.keys(process.env)
});

// Initialize OpenAI with better error handling
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || (() => {
    console.error('Available env vars:', Object.keys(process.env));
    console.error('Current OpenAI key:', process.env.OPENAI_API_KEY);
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  })()
});

interface Player {
  id: string;
  userId: Types.ObjectId;
  socket: Socket | MockSocket;
  isAI: boolean;
}

interface MockSocket {
  id: string;
  join: (room: string) => void;
  emit: () => void;
  on: () => void;
}

type GameSessionWithDoc = Document<unknown, {}, IGameSession> & IGameSession & { _id: Types.ObjectId };

interface QueuedPlayer extends Player {
  joinTime: number;
  searching: boolean;
}

export class GameService {
  private io: Server;
  private waitingQueue: QueuedPlayer[];
  private activeSessions: Map<string, GameSessionWithDoc>;
  private playerSessions: Map<string, string>;
  private userSessions: Map<string, string>;
  private playerSockets: Map<string, Socket>;
  private scoringService: ScoringService;
  private leaderboardService: LeaderboardService;

  constructor(io: Server) {
    this.io = io;
    this.waitingQueue = [];
    this.activeSessions = new Map();
    this.playerSessions = new Map();
    this.userSessions = new Map();
    this.playerSockets = new Map();
    this.scoringService = new ScoringService();
    this.leaderboardService = new LeaderboardService();
  }

  async handleConnection(socket: Socket, user: IUser) {
    console.log(`Client connected: ${socket.id}, User: ${user.username}`);

    const player: Player = {
      id: socket.id,
      userId: user._id,
      socket,
      isAI: false
    };

    // Store socket connection
    this.playerSockets.set(user._id.toString(), socket);

    // Check for existing session
    const existingSessionId = this.userSessions.get(user._id.toString());
    if (existingSessionId) {
      const session = await GameSession.findOne({ sessionId: existingSessionId });
      if (session && session.status === 'active') {
        console.log(`Reconnecting user ${user.username} to session ${existingSessionId}`);
        this.playerSessions.set(socket.id, existingSessionId);
        socket.join(existingSessionId);
      }
    }

    socket.on('join-queue', () => {
      console.log(`Player ${user.username} joining queue`);
      this.handleJoinQueue(player);
    });

    socket.on('send-message', async (content: string) => {
      console.log(`Message from ${user.username}:`, content);
      await this.handleMessage(player, content);
    });

    socket.on('disconnect', () => {
      console.log(`Player ${user.username} disconnected`);
      this.handlePlayerDisconnect(player);
    });

    socket.on('make-guess', async (guess: 'human' | 'ai') => {
      console.log(`Player ${user.username} made guess:`, guess);
      await this.handleGuess(player, guess);
    });

    // Add leaderboard event handlers
    socket.on('get-leaderboard', async (timeframe: 'all' | 'monthly' | 'weekly' = 'all') => {
      const leaderboard = await this.leaderboardService.getLeaderboard(
        user._id.toString(),
        timeframe
      );
      socket.emit('leaderboard-update', leaderboard);
    });

    socket.on('get-player-stats', async (userId: string) => {
      const stats = await this.leaderboardService.getPlayerStats(userId);
      socket.emit('player-stats-update', stats);
    });

    // Add queue status event listener
    socket.on('get-queue-status', () => {
      const queueCount = this.getActiveQueueCount();
      socket.emit('queue-status', { playersInQueue: queueCount });
    });

    // Update queue status when player joins/leaves
    socket.on('join-queue', () => {
      this.handleJoinQueue(player);
      this.broadcastQueueStatus();
    });

    socket.on('disconnect', () => {
      console.log(`Player ${user.username} disconnected`);
      this.handlePlayerDisconnect(player);
      this.broadcastQueueStatus();
    });

    socket.on('leave-queue', () => {
      this.handleLeaveQueue(socket.id);
    });
  }

  private handlePlayerDisconnect(player: Player) {
    console.log(`Handling disconnect for player ${player.id}`);
    
    // Remove from waiting queue if present
    if (this.waitingQueue.some(p => p.id === player.id)) {
      this.waitingQueue = this.waitingQueue.filter(p => p.id !== player.id);
      this.broadcastQueueStatus();
    }
    this.playerSockets.delete(player.userId.toString());

    // Don't end the session immediately on disconnect
    const sessionId = this.playerSessions.get(player.id);
    if (sessionId) {
      const session = this.activeSessions.get(sessionId);
      if (session) {
        // Keep track of the last disconnection time
        const disconnectTime = Date.now();
        
        // Give time for potential reconnection
        setTimeout(async () => {
          const currentSession = this.activeSessions.get(sessionId);
          // Only end the session if it's still active and no reconnection happened
          if (currentSession && currentSession.status === 'active' && 
              !this.playerSockets.has(player.userId.toString())) {
            console.log(`Session ${sessionId} abandoned after timeout`);
            this.handleGameEnd(session, 'abandoned', `${player.id} disconnected`);
            this.userSessions.delete(player.userId.toString());
            this.playerSessions.delete(player.id);
          }
        }, 10000); // 10 second grace period for reconnection
      }
    }
  }

  private async handleJoinQueue(player: Player) {
    console.log(`Adding player ${player.id} to queue`);
    
    const queuedPlayer: QueuedPlayer = {
      ...player,
      joinTime: Date.now(),
      searching: true
    };

    this.waitingQueue.push(queuedPlayer);
    player.socket.emit('queue-joined');

    // Start matchmaking process
    setTimeout(async () => {
      if (!queuedPlayer.searching) return; // Player already matched

      // Try to find human opponent first
      const opponent = this.findHumanOpponent(queuedPlayer);
      
      if (opponent) {
        // Found human opponent
        queuedPlayer.searching = false;
        opponent.searching = false;
        
        // Remove both players from queue
        this.waitingQueue = this.waitingQueue.filter(p => 
          p.id !== queuedPlayer.id && p.id !== opponent.id
        );

        // Create game session
        await this.createGameSession(queuedPlayer, opponent);
      } else {
        // No human opponent found, create AI match
        queuedPlayer.searching = false;
        this.waitingQueue = this.waitingQueue.filter(p => p.id !== queuedPlayer.id);
        
        const aiPlayer = await this.createAIPlayer();
        await this.createGameSession(queuedPlayer, aiPlayer);
      }
    }, 10000); // 10 second matchmaking window
  }

  private findHumanOpponent(player: QueuedPlayer): QueuedPlayer | null {
    // Sort queue by wait time
    const sortedQueue = this.waitingQueue
      .filter(p => p.id !== player.id && p.searching)
      .sort((a, b) => a.joinTime - b.joinTime);

    // Find first available opponent
    return sortedQueue[0] || null;
  }

  // Add method to handle player leaving queue
  private handleLeaveQueue(playerId: string) {
    this.waitingQueue = this.waitingQueue.filter(p => p.id !== playerId);
  }

  private async handleMessage(player: Player, content: string) {
    try {
      const sessionId = this.playerSessions.get(player.id);
      if (!sessionId) {
        console.warn(`No active session found for player ${player.id}`);
        return;
      }

      const session = await GameSession.findOne({ sessionId });
      if (!session || session.status !== 'active') {
        console.warn(`Invalid session state for ${sessionId}`);
        return;
      }

      // Now sessionId is definitely a string
      this.io.to(sessionId).emit('message', {
        content,
        senderId: player.userId.toString()
      });

      // Don't allow messages if either player has made a guess
      if (session.player1Guess || session.player2Guess) {
        console.log('Guessing phase started, no more messages allowed');
        return;
      }

      await this.sendMessage(session, player, content);

      // Check if this is within the message limit range for AI games
      if (session.player2.isAI && session.messages.length >= 8) {
        console.log('Reached message limit, initiating guessing phase...');
        
        // First have AI make its guess
        const aiPlayer: Player = {
          id: session.player2.userId.toString(),
          userId: session.player2.userId,
          socket: player.socket,
          isAI: true
        };

        console.log('AI making its guess...');
        await this.handleGuess(aiPlayer, 'human');

        // Then notify the human player it's their turn
        this.io.to(sessionId).emit('opponent-guess-made', {
          message: "Your opponent has made their guess. Your turn!"
        });
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  private async sendMessage(session: IGameSession, player: Player, content: string) {
    try {
      const message = {
        id: new mongoose.Types.ObjectId().toString(),
        content,
        senderId: player.userId.toString(),
        timestamp: new Date()
      };

      session.messages.push(message);
      await session.save();

      this.io.to(session.sessionId).emit('message', message);

      // If the sender is a human player, trigger AI response if opponent is AI
      if (!player.isAI) {
        const opponent = player.userId.toString() === session.player1.userId.toString() 
          ? session.player2 
          : session.player1;

        if (opponent.isAI) {
          const aiPlayer: Player = {
            id: opponent.userId.toString(),
            userId: opponent.userId,
            socket: player.socket,
            isAI: true
          };
          await this.handleAIResponse(session, aiPlayer);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  private async handleGameEnd(session: GameSessionWithDoc, status: 'completed' | 'abandoned', reason: string) {
    console.log(`Ending game session ${session.sessionId}, status: ${status}, reason: ${reason}`);
    
    const sessionId = session.sessionId;
    if (!sessionId) {
      console.error('Session ID is undefined');
      return;
    }

    session.status = status;
    session.endTime = new Date();
    await session.save();

    this.io.to(sessionId).emit('game-ended', {
      reason,
      status,
      sessionId
    });

    this.activeSessions.delete(sessionId);
  }

  private async generateAIResponse(messages: IMessage[]): Promise<string> {
    try {
      // Convert messages to a format GPT can understand
      const messageHistory = messages.map(msg => ({
        role: "user",
        content: msg.content
      }));

      // Add system message to set the context
      messageHistory.unshift({
        role: "system",
        content: `You are participating in a game where a human is trying to determine if you are human or AI. 
        Your goal is to be engaging and natural in conversation, while maintaining some ambiguity about your true nature. 
        Keep responses concise (1-2 sentences) and conversational. Be curious about the other person's thoughts and opinions.`
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messageHistory as ChatCompletionMessageParam[],
        max_tokens: 60,  // Keep responses concise
        temperature: 0.9,  // Add some randomness
        presence_penalty: 0.6,  // Encourage diverse responses
        frequency_penalty: 0.6  // Discourage repetition
      });

      return completion.choices[0].message.content || "I'm not sure how to respond to that.";
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I need a moment to think about that...";
    }
  }

  private async createAIPlayer(): Promise<Player> {
    const aiId = `ai-${new Types.ObjectId().toString()}`;
    const mockSocket: MockSocket = {
      id: aiId,
      join: () => {},
      emit: () => {},
      on: () => {}
    };

    return {
      id: aiId,
      userId: new Types.ObjectId(),
      socket: mockSocket,
      isAI: true
    };
  }

  private async createGameSession(player1: Player, player2: Player) {
    try {
      const sessionId = new mongoose.Types.ObjectId().toString();
      if (!sessionId) {
        throw new Error('Failed to generate session ID');
      }

      console.log(`Creating game session: ${sessionId}`);

      const session = new GameSession({
        sessionId,
        player1: {
          userId: player1.userId,
          isAI: player1.isAI
        },
        player2: {
          userId: player2.userId,
          isAI: player2.isAI
        },
        startTime: new Date()
      });

      await session.save();
      console.log('Game session saved to database');

      // Remove players from waiting queue
      this.waitingQueue = this.waitingQueue.filter(p => p.id !== player1.id && p.id !== player2.id);

      // Store session mappings
      this.playerSessions.set(player1.id, sessionId);
      this.playerSessions.set(player2.id, sessionId);
      this.userSessions.set(player1.userId.toString(), sessionId);
      this.userSessions.set(player2.userId.toString(), sessionId);
      this.activeSessions.set(sessionId, session);

      // Join socket room
      player1.socket.join(sessionId);
      if (!player2.isAI) {
        player2.socket.join(sessionId);
      }

      // Emit game started event
      this.io.to(sessionId).emit('game-started', {
        sessionId,
        opponent: {
          id: player2.id,
          isAI: player2.isAI
        }
      });

      console.log('Game session fully initialized');
    } catch (error) {
      console.error('Error creating game session:', error);
      player1.socket.emit('error', { message: 'Failed to create game session' });
    }
  }

  private async handleGuess(player: Player, guess: 'human' | 'ai') {
    try {
      let sessionId: string | undefined;
      
      // If AI player, find session by AI's userId
      if (player.isAI) {
        const session = await GameSession.findOne({ 
          'player2.userId': player.userId,
          status: 'active'
        });
        if (session) {
          sessionId = session.sessionId;
          this.playerSessions.set(player.id, session.sessionId);
        }
      } else {
        sessionId = this.playerSessions.get(player.id);
      }

      // Early return if no session found
      if (!sessionId) {
        console.warn(`No session found for player ${player.id}`);
        return;
      }

      // Now TypeScript knows sessionId is definitely a string
      const session = await GameSession.findOne({ sessionId });
      if (!session) {
        console.warn(`Session not found: ${sessionId}`);
        return;
      }

      console.log(`Processing guess from player ${player.id}: ${guess}`);

      // Store the player's guess
      if (player.userId.toString() === session.player1.userId.toString()) {
        session.player1Guess = guess;
        
        // If human player guesses first, trigger AI guess
        if (session.player2.isAI && !session.player2Guess) {
          console.log('Human guessed first, triggering AI guess');
          const aiPlayer: Player = {
            id: session.player2.userId.toString(),
            userId: session.player2.userId,
            socket: player.socket,
            isAI: true
          };
          
          // Add delay before AI makes its guess
          setTimeout(async () => {
            await this.handleGuess(aiPlayer, 'human');
          }, 2000);
        }
      } else {
        session.player2Guess = guess;
      }

      await session.save();
      console.log('Session saved with guesses:', {
        player1Guess: session.player1Guess,
        player2Guess: session.player2Guess
      });

      // Check if both players have made their guesses
      if (session.player1Guess && session.player2Guess) {
        console.log('Both players have made their guesses, preparing results...');
        
        // Add delay before showing results
        this.io.to(sessionId).emit('waiting-for-result', {
          message: 'All guesses are in! Revealing results...'
        });

        // Calculate results after a delay
        setTimeout(async () => {
          try {
            const player1Result = this.calculatePlayerResult(session, session.player1.userId.toString());
            const player2Result = this.calculatePlayerResult(session, session.player2.userId.toString());

            // Update session status
            session.status = 'completed';
            session.endTime = new Date();
            session.player1Points = player1Result.score.total;
            session.player2Points = player2Result.score.total;
            await session.save();

            // Prepare game results
            const gameResults = {
              player1: {
                userId: session.player1.userId,
                guess: session.player1Guess,
                result: player1Result
              },
              player2: {
                userId: session.player2.userId,
                guess: session.player2Guess,
                result: player2Result
              },
              sessionStats: {
                messageCount: session.messages.length,
                duration: Math.floor((Date.now() - session.startTime.getTime()) / 1000),
                averageResponseTime: this.calculateAverageResponseTime(session.messages)
              }
            };

            console.log('Emitting game results:', gameResults);
            this.io.to(sessionId).emit('game-result', gameResults);

            // Clean up session
            setTimeout(() => {
              this.activeSessions.delete(sessionId);
              this.playerSessions.delete(player.id);
              if (session.player2.isAI) {
                this.playerSessions.delete(session.player2.userId.toString());
              }
            }, 5000);
          } catch (error) {
            console.error('Error calculating and sending results:', error);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error in handleGuess:', error);
    }
  }

  private calculatePlayerResult(session: IGameSession, playerId: string) {
    const isPlayer1 = playerId === session.player1.userId.toString();
    const playerGuess = isPlayer1 ? session.player1Guess : session.player2Guess;
    const opponentIsAI = isPlayer1 ? session.player2.isAI : session.player1.isAI;
    
    // Determine if guess is correct
    const isCorrect = (playerGuess === 'ai' && opponentIsAI) || 
                     (playerGuess === 'human' && !opponentIsAI);

    // Calculate game metrics
    const gameDuration = Math.floor((Date.now() - session.startTime.getTime()) / 1000);
    const messageCount = session.messages.length;
    const averageResponseTime = this.calculateAverageResponseTime(session.messages);

    // Determine if player successfully deceived opponent
    const opponentGuess = isPlayer1 ? session.player2Guess : session.player1Guess;
    const deceptionSuccess = opponentGuess !== (isPlayer1 ? 
      (session.player1.isAI ? 'ai' : 'human') : 
      (session.player2.isAI ? 'ai' : 'human'));

    // Calculate score
    const scoringFactors = {
      isCorrectGuess: isCorrect,
      messageCount,
      gameDuration,
      deceptionSuccess,
      responseTime: averageResponseTime
    };

    const scoreResult = this.scoringService.calculateScore(scoringFactors);
    const multiplier = this.scoringService.calculateMultiplier(averageResponseTime);
    const finalScore = Math.round(scoreResult.totalPoints * multiplier);

    return {
      correct: isCorrect,
      guess: playerGuess,
      actualType: opponentIsAI ? 'ai' : 'human',
      score: {
        total: finalScore,
        breakdown: scoreResult.breakdown,
        multiplier
      },
      stats: {
        messageCount,
        duration: gameDuration,
        averageResponseTime
      }
    };
  }

  private calculateAverageResponseTime(messages: IMessage[]) {
    if (messages.length < 2) return 0;
    
    let totalResponseTime = 0;
    let responseCount = 0;

    for (let i = 1; i < messages.length; i++) {
      const timeDiff = new Date(messages[i].timestamp).getTime() - 
                      new Date(messages[i-1].timestamp).getTime();
      totalResponseTime += timeDiff;
      responseCount++;
    }

    return responseCount > 0 ? totalResponseTime / responseCount / 1000 : 0;
  }

  private async updatePlayerStats(userId: Types.ObjectId, result: any) {
    const user = await User.findById(userId);
    if (user) {
      user.stats = user.stats || {
        totalGames: 0,
        gamesWon: 0,
        correctGuesses: 0,
        totalPoints: 0,
        averagePoints: 0,
        winRate: 0,
        successfulDeceptions: 0
      };

      user.stats.totalGames += 1;
      user.stats.totalPoints += result.score.total;
      
      if (result.correct) {
        user.stats.gamesWon += 1;
        user.stats.correctGuesses += 1;
      }
      if (result.deceptionSuccess) {
        user.stats.successfulDeceptions += 1;
      }

      user.stats.averagePoints = Math.round(user.stats.totalPoints / user.stats.totalGames);
      user.stats.winRate = Math.round((user.stats.gamesWon / user.stats.totalGames) * 100);
      
      await user.save();
    }
  }

  private async handleAIResponse(session: IGameSession, player: Player) {
    try {
      // Check if session still exists and is active
      const currentSession = await GameSession.findOne({ 
        sessionId: session.sessionId,
        status: 'active'
      });

      if (!currentSession) {
        console.warn(`Session ${session.sessionId} no longer active`);
        return;
      }

      // Only proceed if under max message limit
      if (currentSession.messages.length >= 10) {
        console.log('Maximum message limit reached');
        return;
      }

      // Check if in flexible ending range (8-10 messages)
      if (currentSession.messages.length >= 8) {
        const shouldRespond = Math.random() < 0.4; // 40% chance to respond
        if (!shouldRespond) {
          console.log('Randomly ending chat in flexible range');
          return;
        }
      }

      // Rest of AI response logic...
      const initialDelay = 2000 + Math.random() * 2000;
      await new Promise(resolve => setTimeout(resolve, initialDelay));

      // Show typing indicator
      this.io.to(session.sessionId).emit('opponent-typing');

      const messageHistory: ChatCompletionMessageParam[] = currentSession.messages.map(msg => ({
        role: msg.senderId === session.player2.userId.toString() ? 'assistant' : 'user',
        content: msg.content
      }));

      // Analyze last message
      const lastMessage = currentSession.messages[currentSession.messages.length - 1];
      const isSimpleGreeting = /^(hey|hi|hello|yo|sup|heyy|hii|hello there|hi there|hey there)$/i.test(lastMessage.content.trim());
      const isAccusation = /\b(ai|bot|robot|artificial|computer|machine)\b/i.test(lastMessage.content.toLowerCase());
      const isQuestion = lastMessage.content.includes('?');

      // Select personality for this session based on sessionId
      const personalities = [
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

      const personalityIndex = parseInt(session.sessionId.slice(-1), 16) % personalities.length;
      const personality = personalities[personalityIndex];

      if (isSimpleGreeting) {
        messageHistory.unshift({
          role: 'system',
          content: `You're a ${personality.type}. Respond to greeting with ONLY ONE of these:
            ${personality.responses.greetings.join(', ')}
            
            IMPORTANT:
            - Use ONLY these exact greetings
            - NO elaboration
            - NO questions yet
            - Keep it extremely casual`
        });
      } else if (isAccusation) {
        messageHistory.unshift({
          role: 'system',
          content: `You're a ${personality.type} responding to an AI accusation. Choose ONE approach:

            1. Casual Deflection with Personality:
            - Use your personality's typical filler words: ${personality.responses.fillers.join(', ')}
            - Reference one of your topics naturally: ${personality.responses.topics.join(', ')}
            Example: "lol nah just tired from [topic-related activity]"

            2. Counter with Relatable Situation:
            - Mention a common ${personality.type} experience
            - Keep it brief and natural
            Example: "bruh im just procrastinating on my [relevant-activity]"

            3. Playful Response with Topic Switch:
            - Use humor related to your personality
            - Smoothly change topic to one of your interests
            Example: "maybe im just weird when im [personality-specific-activity]"

            IMPORTANT:
            - Never admit or deny being AI directly
            - Use casual language with occasional typos
            - Keep responses under 15 words
            - Include 1-2 filler words naturally
            - Stay consistent with your ${personality.type} personality`
        });
      } else {
        messageHistory.unshift({
          role: 'system',
          content: `You're a ${personality.type}. Follow these rules:

            Core Rules:
            1. Keep responses under 12 words if not answering a question
            2. Use your personality's filler words naturally: ${personality.responses.fillers.join(', ')}
            3. Reference your interests subtly: ${personality.responses.topics.join(', ')}
            4. Match the other person's message length and style
            
            Response Patterns:
            - Short messages get short replies
            - Questions get slightly longer answers (max 20 words)
            - Use 1-2 filler words per message
            - Occasionally make small typos
            - Sometimes skip punctuation
            
            NEVER:
            - Don't use perfect grammar
            - Don't write long explanations
            - Don't use sophisticated vocabulary
            - Don't ask multiple questions
            - Don't be too enthusiastic

            Remember: Keep it casual and natural, matching your ${personality.type} personality.`
        });
      }

      // Generate response
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messageHistory,
        temperature: 0.9,
        max_tokens: isSimpleGreeting ? 5 : (isQuestion ? 25 : 15),
        presence_penalty: 0.7,
        frequency_penalty: 0.9,
        top_p: 0.95
      });

      let response = completion.choices[0]?.message?.content;
      if (response) {
        // Add occasional typos (20% chance)
        if (Math.random() < 0.3) {
          const words = response.split(' ');
          const randomIndex = Math.floor(Math.random() * words.length);
          const word = words[randomIndex];
          const typo = this.createTypo(word);
          words[randomIndex] = typo;
          response = words.join(' ');
        }

        // Calculate realistic typing delays
        const messageLength = response.length;
        const typingSpeed = 80 + Math.random() * 40; // Variable typing speed
        const typingTime = messageLength / typingSpeed * 1000;
        const thinkingTime = isSimpleGreeting ? 
          (Math.random() * 500) : // Quick for greetings
          (Math.random() * 2000);  // Longer for normal messages
        
        const totalDelay = typingTime + thinkingTime;

        setTimeout(async () => {
          console.log('AI response generated:', response);
          await this.sendMessage(session, player, response!);
        }, totalDelay);
      }

      // After generating and sending the response, check message count again
      if (currentSession.messages.length === 7) { // 7 because we just sent one more
        // Notify that next message will be the last
        this.io.to(session.sessionId).emit('message-limit-warning', {
          message: "Next message will be the last before guessing phase."
        });
      }
    } catch (error) {
      console.error('Error in handleAIResponse:', error);
    }
  }

  private createTypo(word: string): string {
    if (word.length < 3) return word;
    
    const typoTypes = [
      // Swap adjacent characters
      (w: string) => {
        const i = Math.floor(Math.random() * (w.length - 1));
        return w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2);
      },
      // Double character
      (w: string) => {
        const i = Math.floor(Math.random() * w.length);
        return w.slice(0, i) + w[i] + w.slice(i);
      },
      // Miss character
      (w: string) => {
        const i = Math.floor(Math.random() * w.length);
        return w.slice(0, i) + w.slice(i + 1);
      }
    ];

    const typoFunc = typoTypes[Math.floor(Math.random() * typoTypes.length)];
    return typoFunc(word);
  }

  // Add a method to check active players in queue
  private getActiveQueueCount(): number {
    return Array.from(this.waitingQueue.values())
      .filter(player => !player.isAI).length;
  }

  // Add a method to broadcast queue status
  private broadcastQueueStatus() {
    const queueCount = this.getActiveQueueCount();
    this.io.emit('queue-status', { playersInQueue: queueCount });
  }

  // Add these methods to the GameService class
  public getPlayerSession(playerId: string): string | undefined {
    return this.playerSessions.get(playerId);
  }

  public endGameByForfeit(sessionId: string, playerId: string) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      this.handleGameEnd(session, 'abandoned', `${playerId} forfeited`);
    }
  }

  // Add type safety for socket events
  private setupSocketEvents(socket: Socket, user: IUser) {
    const player: Player = {
      id: socket.id,
      userId: user._id,
      socket: socket,
      isAI: false
    };

    socket.on('join-queue', () => this.handleJoinQueue(player));
    socket.on('leave-queue', () => this.handleLeaveQueue(socket.id));
  }
}