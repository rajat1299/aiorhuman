import express, { Router, RequestHandler } from 'express';
import { autoLogin, getProfile } from '../controllers/authController';
import { auth } from '../middleware/auth';
import type { IUser } from '../models/User'; // Adjust import path as needed

const router = express.Router();

// Define the AuthRequest type
interface AuthRequest extends Request {
  user?: IUser;
}

// Add OPTIONS handler for preflight requests
router.options('/auto-login', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).send();
});

router.post('/auto-login', autoLogin as RequestHandler);
router.get('/profile', auth, getProfile as RequestHandler);

export default router;
