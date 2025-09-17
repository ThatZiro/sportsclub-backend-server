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
  approveMemberSchema
} from '../validators/team';

// Create router
const router = Router();

// Initialize dependencies
const teamRepository = new TeamRepository();
const teamMemberRepository = new TeamMemberRepository();
const userRepository = new UserRepository();
const leagueRepository = new LeagueRepository();
const teamService = new TeamService(teamRepository, teamMemberRepository, userRepository, leagueRepository);
const teamController = new TeamController(teamService);

// Apply authentication middleware to all team routes
router.use(authMiddleware);

// POST /teams - Create new team
router.post('/', validate(createTeamSchema), teamController.createTeam);

// GET /teams/:id - Get team by ID with member details
router.get('/:id', validate(teamIdParamSchema), teamController.getTeamById);

// PATCH /teams/:id - Update team (captain/organizer only)
router.patch('/:id', validate(updateTeamSchema), teamController.updateTeam);

// DELETE /teams/:id - Delete team (organizer only)
router.delete('/:id', validate(teamIdParamSchema), teamController.deleteTeam);

// POST /teams/:id/join - Join a team
router.post('/:id/join', validate(joinTeamSchema), teamController.joinTeam);

// POST /teams/:id/members/:userId/approve - Approve team member
router.post('/:id/members/:userId/approve', validate(approveMemberSchema), teamController.approveMember);

export default router;