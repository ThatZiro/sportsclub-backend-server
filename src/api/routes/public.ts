/**
 * Public Routes
 * Defines public endpoints that don't require authentication
 */

import { Router } from 'express';
import { PublicController } from '../controllers/PublicController';
import { LeagueService } from '../../application/services/LeagueService';
import { TeamService } from '../../application/services/TeamService';
import { LeagueRepository } from '../../infrastructure/repositories/LeagueRepository';
import { TeamRepository } from '../../infrastructure/repositories/TeamRepository';
import { TeamMemberRepository } from '../../infrastructure/repositories/TeamMemberRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { validate } from '../middleware/validation';
import { leagueSlugParamSchema } from '../validators/league';

// Create router
const router = Router();

// Initialize dependencies
const leagueRepository = new LeagueRepository();
const teamRepository = new TeamRepository();
const teamMemberRepository = new TeamMemberRepository();
const userRepository = new UserRepository();
const leagueService = new LeagueService(leagueRepository, userRepository);
const teamService = new TeamService(teamRepository, teamMemberRepository, userRepository, leagueRepository);
const publicController = new PublicController(leagueService, teamService);

/**
 * @swagger
 * /public/leagues/{slug}:
 *   get:
 *     tags: [Public]
 *     summary: Get public league information
 *     description: Retrieves league details by slug without requiring authentication
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: League slug identifier
 *         example: spring-2024-basketball
 *     responses:
 *       200:
 *         description: League information retrieved successfully
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
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/leagues/:slug', validate(leagueSlugParamSchema), publicController.getLeagueBySlug);

/**
 * @swagger
 * /public/leagues/{slug}/teams:
 *   get:
 *     tags: [Public]
 *     summary: Get public team listing for a league
 *     description: Retrieves all teams in a league with basic information (name, captain, member count)
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: League slug identifier
 *         example: spring-2024-basketball
 *     responses:
 *       200:
 *         description: Team listing retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 teams:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TeamSummary'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: League not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: League not found
 */
router.get('/leagues/:slug/teams', validate(leagueSlugParamSchema), publicController.getTeamsByLeagueSlug);

export default router;