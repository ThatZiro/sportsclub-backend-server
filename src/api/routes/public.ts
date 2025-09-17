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

// GET /public/leagues/:slug - Get public league information
router.get('/leagues/:slug', validate(leagueSlugParamSchema), publicController.getLeagueBySlug);

// GET /public/leagues/:slug/teams - Get public team listing for a league
router.get('/leagues/:slug/teams', validate(leagueSlugParamSchema), publicController.getTeamsByLeagueSlug);

export default router;