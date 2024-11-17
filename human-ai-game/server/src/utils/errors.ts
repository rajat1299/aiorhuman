export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Not authorized') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GameError';
  }
}

export const handleError = (error: Error): { statusCode: number; message: string } => {
  console.error(`${error.name}: ${error.message}`);
  console.error(error.stack);

  switch (error.constructor) {
    case ValidationError:
      return { statusCode: 400, message: error.message };
    case AuthenticationError:
      return { statusCode: 401, message: error.message };
    case AuthorizationError:
      return { statusCode: 403, message: error.message };
    case GameError:
      return { statusCode: 400, message: error.message };
    default:
      return { statusCode: 500, message: 'Internal server error' };
  }
}; 