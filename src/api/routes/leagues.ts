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

// POST /leagues - Create new league
router.post('/', validate(createLeagueSchema), leagueController.createLeague);

// GET /leagues - Get all leagues
router.get('/', leagueController.getAllLeagues);

// GET /leagues/:id - Get league by ID
router.get('/:id', validate(leagueIdParamSchema), leagueController.getLeagueById);

// PATCH /leagues/:id - Update league
router.patch('/:id', validate(updateLeagueSchema), leagueController.updateLeague);

// DELETE /leagues/:id - Delete league
router.delete('/:id', validate(leagueIdParamSchema), leagueController.deleteLeague);

export default router;