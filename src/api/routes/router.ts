/**
 * Main API Router
 * Combines all route modules into a single router
 */

import { Router } from 'express';
import { authRoutes, userRoutes, leagueRoutes, teamRoutes, publicRoutes } from './index';

// Create main router
const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/', userRoutes); // /me endpoints
router.use('/leagues', leagueRoutes);
router.use('/teams', teamRoutes);
router.use('/public', publicRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;