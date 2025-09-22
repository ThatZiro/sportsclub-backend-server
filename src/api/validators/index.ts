/**
 * Validators barrel export
 * Centralizes all validator exports for easy importing
 */

// Auth validators
export { signupSchema, loginSchema, SignupRequest, LoginRequest } from './auth';

// User validators
export {
  updateUserProfileSchema,
  updateUserRoleSchema,
  userIdParamSchema,
  UpdateUserProfileRequest,
  UpdateUserRoleRequest,
  UserIdParamRequest,
} from './user';

// League validators
export {
  createLeagueSchema,
  updateLeagueSchema,
  leagueIdParamSchema,
  leagueSlugParamSchema,
  CreateLeagueRequest,
  UpdateLeagueRequest,
  LeagueIdParamRequest,
  LeagueSlugParamRequest,
} from './league';

// Team validators
export {
  createTeamSchema,
  updateTeamSchema,
  teamIdParamSchema,
  joinTeamSchema,
  approveMemberSchema,
  getTeamsByLeagueSchema,
  CreateTeamRequest,
  UpdateTeamRequest,
  TeamIdParamRequest,
  JoinTeamRequest,
  ApproveMemberRequest,
  GetTeamsByLeagueRequest,
} from './team';
