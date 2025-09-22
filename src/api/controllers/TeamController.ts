/**
 * Team Controller
 * Handles team management endpoints
 * Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 6.1, 6.2, 8.1, 8.2, 8.3
 */

import { Response, NextFunction } from 'express';
import { TeamService } from '../../application/services/TeamService';
import { AuthenticatedRequest } from '../middleware/auth';
import { CreateTeamRequest } from '../validators/team';

export class TeamController {
  constructor(private teamService: TeamService) {}

  /**
   * POST /teams
   * Create a new team
   * Requirements: 4.1, 4.2
   */
  createTeam = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { body } = req as CreateTeamRequest;

      const team = await this.teamService.createTeam(body, req.user.id);

      res.status(201).json({
        success: true,
        message: 'Team created successfully',
        data: {
          team,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /teams/:id
   * Get team by ID with member details
   * Requirements: 8.1
   */
  getTeamById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const teamId = req.params['id'];
      if (!teamId) {
        res.status(400).json({
          success: false,
          message: 'Team ID is required',
        });
        return;
      }

      const team = await this.teamService.getTeamById(teamId);

      res.status(200).json({
        success: true,
        message: 'Team retrieved successfully',
        data: {
          team,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /teams/:id
   * Update team (captain/organizer only)
   * Requirements: 4.3, 8.2
   */
  updateTeam = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const teamId = req.params['id'];
      if (!teamId) {
        res.status(400).json({
          success: false,
          message: 'Team ID is required',
        });
        return;
      }

      const body = req.body;

      const updatedTeam = await this.teamService.updateTeam(
        teamId,
        body,
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: 'Team updated successfully',
        data: {
          team: updatedTeam,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /teams/:id
   * Delete team (organizer only)
   * Requirements: 8.3
   */
  deleteTeam = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const teamId = req.params['id'];
      if (!teamId) {
        res.status(400).json({
          success: false,
          message: 'Team ID is required',
        });
        return;
      }

      await this.teamService.deleteTeam(teamId, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Team deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /teams/:id/join
   * Join a team
   * Requirements: 5.1, 5.2
   */
  joinTeam = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const teamId = req.params['id'];
      if (!teamId) {
        res.status(400).json({
          success: false,
          message: 'Team ID is required',
        });
        return;
      }

      const membership = await this.teamService.joinTeam(teamId, req.user.id);

      res.status(201).json({
        success: true,
        message: 'Team join request submitted successfully',
        data: {
          membership,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /teams/:id/members/:userId/approve
   * Approve team member (captain/organizer only)
   * Requirements: 6.1, 6.2
   */
  approveMember = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const teamId = req.params['id'];
      const userId = req.params['userId'];

      if (!teamId || !userId) {
        res.status(400).json({
          success: false,
          message: 'Team ID and User ID are required',
        });
        return;
      }

      const membership = await this.teamService.approveMember(
        teamId,
        userId,
        req.user.id,
        { approve: true }
      );

      res.status(200).json({
        success: true,
        message: 'Member approved successfully',
        data: {
          membership,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
