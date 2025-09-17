/**
 * League Routes
 * Defines routes for league management (organizer only)
 */

import { Router } from 'express';
import { LeagueController } from '../controllers/LeagueController';
import { LeagueService } from '../../application/services/LeagueService';
import { LeagueRepository } from '../../infrastructure/repositories/LeagueRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import { validate } from '../middleware/validation';
import { UserRole } from '../../domain/enums';
import { 
  createLeagueSchema, 
  updateLeagueSchema, 
  leagueIdParamSchema 
} from '../validators/league';

// Create router
const router = Router();

// Initialize dependencies
const leagueRepository = new LeagueRepository();
const userRepository = new UserRepository();
const leagueService = new LeagueService(leagueRepository, userRepository);
const leagueController = new LeagueController(leagueService);

// Apply authentication middleware to all league routes
router.use(authMiddleware);

// Apply organizer role requirement to all league routes
router.use(requireRole(UserRole.ORGANIZER, UserRole.ADMIN));

/**
 * @swagger
 * /leagues:
 *   post:
 *     tags: [Leagues]
 *     summary: Create a new league
 *     description: Creates a new league (organizer/admin only)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLeagueRequest'
 *     responses:
 *       201:
 *         description: League created successfully
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
 *                   example: League created successfully
 *                 league:
 *                   $ref: '#/components/schemas/League'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         description: League slug already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: League slug already exists
 */
router.post('/', validate(createLeagueSchema), leagueController.createLeague);

/**
 * @swagger
 * /leagues:
 *   get:
 *     tags: [Leagues]
 *     summary: Get all leagues
 *     description: Retrieves all leagues in the system (organizer/admin only)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Leagues retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 leagues:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/League'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/', leagueController.getAllLeagues);

/**
 * @swagger
 * /leagues/{id}:
 *   get:
 *     tags: [Leagues]
 *     summary: Get league by ID
 *     description: Retrieves a specific league by its ID (organizer/admin only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: League ID
 *         example: clw1234567890abcdef
 *     responses:
 *       200:
 *         description: League retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 league:
 *                   $ref: '#/components/schemas/League'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', validate(leagueIdParamSchema), leagueController.getLeagueById);

/**
 * @swagger
 * /leagues/{id}:
 *   patch:
 *     tags: [Leagues]
 *     summary: Update league
 *     description: Updates an existing league (organizer/admin only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: League ID
 *         example: clw1234567890abcdef
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated League Name
 *               season:
 *                 type: string
 *                 example: Fall 2024
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: League updated successfully
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
 *                   example: League updated successfully
 *                 league:
 *                   $ref: '#/components/schemas/League'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:id', validate(updateLeagueSchema), leagueController.updateLeague);

/**
 * @swagger
 * /leagues/{id}:
 *   delete:
 *     tags: [Leagues]
 *     summary: Delete league
 *     description: Deletes a league and all associated teams (organizer/admin only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: League ID
 *         example: clw1234567890abcdef
 *     responses:
 *       200:
 *         description: League deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: League deleted successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', validate(leagueIdParamSchema), leagueController.deleteLeague);

export default router;