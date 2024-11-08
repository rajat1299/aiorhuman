// Increase token expiration time (e.g., to 7 days)
export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: '7d'  // Changed from default
}; 