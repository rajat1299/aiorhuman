export interface AIPersonality {
  traits: {
    extroversion: number;      // 1-10 scale
    humor: number;             // 1-10 scale
    formality: number;         // 1-10 scale
    emotionalExpression: number; // 1-10 scale
  };
  interests: string[];         // Topics the AI is interested in
  typingStyle: {
    typoFrequency: number;     // 0-1 probability
    emojiFrequency: number;    // 0-1 probability
    averageResponseTime: number; // base milliseconds
  };
  vocabulary: {
    commonPhrases: string[];
    emojis: string[];
    fillerWords: string[];
  };
}

export class AIPersonalityGenerator {
  static generate(): AIPersonality {
    return {
      traits: {
        extroversion: Math.floor(Math.random() * 10) + 1,
        humor: Math.floor(Math.random() * 10) + 1,
        formality: Math.floor(Math.random() * 10) + 1,
        emotionalExpression: Math.floor(Math.random() * 10) + 1
      },
      interests: this.generateInterests(),
      typingStyle: {
        typoFrequency: Math.random() * 0.1, // 0-10% chance of typos
        emojiFrequency: Math.random() * 0.2, // 0-20% chance of emojis
        averageResponseTime: 1000 + Math.random() * 2000 // 1-3 seconds base time
      },
      vocabulary: {
        commonPhrases: this.getRandomPhrases(),
        emojis: ["😊", "😄", "🤔", "👍", "😅"],
        fillerWords: ["um", "uh", "hmm", "well", "like"]
      }
    };
  }

  private static generateInterests(): string[] {
    const allInterests = [
      "movies", "music", "books", "travel", "food", 
      "sports", "technology", "art", "gaming", "nature"
    ];
    return allInterests
      .sort(() => Math.random() - 0.5)
      .slice(0, 3 + Math.floor(Math.random() * 3)); // 3-5 interests
  }

  private static getRandomPhrases(): string[] {
    return [
      "that's interesting",
      "I see what you mean",
      "makes sense",
      "totally agree",
      "not sure about that"
    ];
  }
} 