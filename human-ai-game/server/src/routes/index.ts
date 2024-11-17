import { Router } from 'express';
import authRoutes from './auth';
import gameRoutes from './game';

const router = Router();

router.use('/auth', authRoutes);
router.use('/game', gameRoutes);

export default router; 