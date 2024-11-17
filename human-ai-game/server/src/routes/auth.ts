import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/auto-login', asyncHandler(AuthController.autoLogin));
router.get('/profile', authenticate, asyncHandler(AuthController.getProfile));
router.put('/profile', authenticate, asyncHandler(AuthController.updateProfile));

export default router;
