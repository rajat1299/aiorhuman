import mongoose from 'mongoose';
import config from '../config/config';

describe('MongoDB Connection', () => {
  it('should connect to MongoDB', async () => {
    try {
      await mongoose.connect(config.mongoUri);
      expect(mongoose.connection.readyState).toBe(1);
    } catch (err) {
      console.error('Connection test failed:', err);
      throw err;
    }
  });
}); 