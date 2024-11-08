export const generateUsername = (): string => {
  const prefix = 'Player';
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${randomString}`;
}; 