/**
 * Main API Router
 * Combines all route modules into a single router
 */

import { Router } from 'express';
import {
  authRoutes,
  userRoutes,
  leagueRoutes,
  teamRoutes,
  publicRoutes,
} from './index';

// Create main router
const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/', userRoutes); // /me endpoints
router.use('/leagues', leagueRoutes);
router.use('/teams', teamRoutes);
router.use('/public', publicRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check endpoint
 *     description: Returns the current health status of the API
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API is healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-03-15T10:30:00.000Z"
 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
