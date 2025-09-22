/**
 * Team Routes
 * Defines routes for team management
 */

import { Router } from 'express';
import { TeamController } from '../controllers/TeamController';
import { TeamService } from '../../application/services/TeamService';
import { TeamRepository } from '../../infrastructure/repositories/TeamRepository';
import { TeamMemberRepository } from '../../infrastructure/repositories/TeamMemberRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { LeagueRepository } from '../../infrastructure/repositories/LeagueRepository';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createTeamSchema,
  updateTeamSchema,
  teamIdParamSchema,
  joinTeamSchema,
  approveMemberSchema,
} from '../validators/team';

// Create router
const router = Router();

// Initialize dependencies
const teamRepository = new TeamRepository();
const teamMemberRepository = new TeamMemberRepository();
const userRepository = new UserRepository();
const leagueRepository = new LeagueRepository();
const teamService = new TeamService(
  teamRepository,
  teamMemberRepository,
  userRepository,
  leagueRepository
);
const teamController = new TeamController(teamService);

// Apply authentication middleware to all team routes
router.use(authMiddleware);

/**
 * @swagger
 * /teams:
 *   post:
 *     tags: [Teams]
 *     summary: Create a new team
 *     description: Creates a new team in a league with the authenticated user as captain
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTeamRequest'
 *     responses:
 *       201:
 *         description: Team created successfully
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
 *                   example: Team created successfully
 *                 team:
 *                   $ref: '#/components/schemas/TeamWithMembers'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: League not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: League not found
 *       409:
 *         description: Team name already exists in league
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Team name already exists in this league
 */
router.post('/', validate(createTeamSchema), teamController.createTeam);

/**
 * @swagger
 * /teams/{id}:
 *   get:
 *     tags: [Teams]
 *     summary: Get team details
 *     description: Retrieves team information including members and captain details
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *         example: clw1234567890abcdef
 *     responses:
 *       200:
 *         description: Team details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 team:
 *                   $ref: '#/components/schemas/TeamWithMembers'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', validate(teamIdParamSchema), teamController.getTeamById);

/**
 * @swagger
 * /teams/{id}:
 *   patch:
 *     tags: [Teams]
 *     summary: Update team information
 *     description: Updates team details (captain or organizer/admin only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
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
 *                 example: Updated Team Name
 *               color:
 *                 type: string
 *                 example: "#00FF00"
 *     responses:
 *       200:
 *         description: Team updated successfully
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
 *                   example: Team updated successfully
 *                 team:
 *                   $ref: '#/components/schemas/TeamWithMembers'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Team name already exists in league
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Team name already exists in this league
 */
router.patch('/:id', validate(updateTeamSchema), teamController.updateTeam);

/**
 * @swagger
 * /teams/{id}:
 *   delete:
 *     tags: [Teams]
 *     summary: Delete team
 *     description: Deletes a team and all memberships (organizer/admin only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *         example: clw1234567890abcdef
 *     responses:
 *       200:
 *         description: Team deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Team deleted successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', validate(teamIdParamSchema), teamController.deleteTeam);

/**
 * @swagger
 * /teams/{id}/join:
 *   post:
 *     tags: [Teams]
 *     summary: Join a team
 *     description: Request to join a team (creates pending membership or auto-approves based on settings)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *         example: clw1234567890abcdef
 *     responses:
 *       201:
 *         description: Team join request created successfully
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
 *                   example: Successfully joined team
 *                 membership:
 *                   $ref: '#/components/schemas/TeamMember'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Team not found
 *       409:
 *         description: Already a member of this team
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Already a member of this team
 */
router.post('/:id/join', validate(joinTeamSchema), teamController.joinTeam);

/**
 * @swagger
 * /teams/{id}/members/{userId}/approve:
 *   post:
 *     tags: [Teams]
 *     summary: Approve team member
 *     description: Approve a pending team member (captain or organizer/admin only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *         example: clw1234567890abcdef
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to approve
 *         example: clw1234567890abcdef
 *     responses:
 *       200:
 *         description: Member approved successfully
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
 *                   example: Member approved successfully
 *                 membership:
 *                   $ref: '#/components/schemas/TeamMember'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Team or membership not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Membership not found
 */
router.post(
  '/:id/members/:userId/approve',
  validate(approveMemberSchema),
  teamController.approveMember
);

export default router;
