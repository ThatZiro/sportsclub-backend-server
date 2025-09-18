/**
 * League Controller
 * Handles league management endpoints for organizers
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import { Response, NextFunction } from 'express';
import { LeagueService } from '../../application/services/LeagueService';
import { AuthenticatedRequest } from '../middleware/auth';
import { CreateLeagueRequest, UpdateLeagueRequest } from '../validators/league';

export class LeagueController {
  constructor(private leagueService: LeagueService) {}

  /**
   * POST /leagues
   * Create a new league (organizer only)
   * Requirements: 7.1
   */
  createLeague = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { body } = req as CreateLeagueRequest;
      
      const league = await this.leagueService.createLeague(body, req.user.id);

      res.status(201).json({
        success: true,
        message: 'League created successfully',
        data: {
          league
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /leagues
   * Get all leagues (organizer only)
   * Requirements: 7.2
   */
  getAllLeagues = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const leagues = await this.leagueService.getAllLeagues(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Leagues retrieved successfully',
        data: {
          leagues
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /leagues/:id
   * Get league by ID (organizer only)
   * Requirements: 7.2
   */
  getLeagueById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const leagueId = req.params['id'];
      if (!leagueId) {
        res.status(400).json({
          success: false,
          message: 'League ID is required'
        });
        return;
      }
      
      const league = await this.leagueService.getLeagueById(leagueId, req.user.id);

      res.status(200).json({
        success: true,
        message: 'League retrieved successfully',
        data: {
          league
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /leagues/:id
   * Update league (organizer only)
   * Requirements: 7.3
   */
  updateLeague = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const leagueId = req.params['id'];
      if (!leagueId) {
        res.status(400).json({
          success: false,
          message: 'League ID is required'
        });
        return;
      }

      const { body } = req as UpdateLeagueRequest;
      
      const updatedLeague = await this.leagueService.updateLeague(leagueId, body, req.user.id);

      res.status(200).json({
        success: true,
        message: 'League updated successfully',
        data: {
          league: updatedLeague
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /leagues/:id
   * Delete league (organizer only)
   * Requirements: 7.3
   */
  deleteLeague = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const leagueId = req.params['id'];
      if (!leagueId) {
        res.status(400).json({
          success: false,
          message: 'League ID is required'
        });
        return;
      }
      
      await this.leagueService.deleteLeague(leagueId, req.user.id);

      res.status(200).json({
        success: true,
        message: 'League deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}