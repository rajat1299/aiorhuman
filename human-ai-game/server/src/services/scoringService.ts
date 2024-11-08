interface ScoringFactors {
  isCorrectGuess: boolean;
  messageCount: number;
  gameDuration: number;  // in seconds
  deceptionSuccess: boolean;
  responseTime: number;  // in seconds
}

export class ScoringService {
  // Base points
  private static readonly CORRECT_GUESS_POINTS = 100;
  private static readonly DECEPTION_POINTS = 50;

  // Message count bonuses
  private static readonly QUICK_CHAT_THRESHOLD = 5;
  private static readonly MEDIUM_CHAT_THRESHOLD = 10;
  private static readonly LONG_CHAT_THRESHOLD = 15;

  // Time bonuses (in seconds)
  private static readonly QUICK_TIME_THRESHOLD = 60;  // 1 minute
  private static readonly MEDIUM_TIME_THRESHOLD = 120; // 2 minutes
  private static readonly LONG_TIME_THRESHOLD = 180;  // 3 minutes

  calculateScore(factors: ScoringFactors): {
    totalPoints: number;
    breakdown: {
      basePoints: number;
      messageBonus: number;
      timeBonus: number;
      deceptionBonus: number;
    };
  } {
    let breakdown = {
      basePoints: 0,
      messageBonus: 0,
      timeBonus: 0,
      deceptionBonus: 0
    };

    // Base points for correct guess
    if (factors.isCorrectGuess) {
      breakdown.basePoints = ScoringService.CORRECT_GUESS_POINTS;
    }

    // Message count bonus
    breakdown.messageBonus = this.calculateMessageBonus(factors.messageCount);

    // Time bonus
    breakdown.timeBonus = this.calculateTimeBonus(factors.gameDuration);

    // Deception bonus
    if (factors.deceptionSuccess) {
      breakdown.deceptionBonus = ScoringService.DECEPTION_POINTS;
    }

    // Calculate total
    const totalPoints = Object.values(breakdown).reduce((a, b) => a + b, 0);

    return {
      totalPoints,
      breakdown
    };
  }

  private calculateMessageBonus(messageCount: number): number {
    if (messageCount <= ScoringService.QUICK_CHAT_THRESHOLD) {
      return 50; // Quick decision bonus
    } else if (messageCount <= ScoringService.MEDIUM_CHAT_THRESHOLD) {
      return 30; // Medium length bonus
    } else if (messageCount <= ScoringService.LONG_CHAT_THRESHOLD) {
      return 20; // Longer conversation bonus
    }
    return 0;
  }

  private calculateTimeBonus(duration: number): number {
    if (duration <= ScoringService.QUICK_TIME_THRESHOLD) {
      return 50; // Quick time bonus
    } else if (duration <= ScoringService.MEDIUM_TIME_THRESHOLD) {
      return 30; // Medium time bonus
    } else if (duration <= ScoringService.LONG_TIME_THRESHOLD) {
      return 20; // Longer time bonus
    }
    return 0;
  }

  calculateMultiplier(responseTime: number): number {
    // Add multiplier based on response time
    if (responseTime < 5) {
      return 1.5; // 50% bonus for very quick responses
    } else if (responseTime < 10) {
      return 1.25; // 25% bonus for moderately quick responses
    }
    return 1;
  }
} 