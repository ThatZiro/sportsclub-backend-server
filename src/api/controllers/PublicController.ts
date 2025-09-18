/**
 * Public Controller
 * Handles public endpoints that don't require authentication
 * Requirements: 3.1, 3.2, 3.4
 */

import { Request, Response, NextFunction } from 'express';
import { LeagueService } from '../../application/services/LeagueService';
import { TeamService } from '../../application/services/TeamService';

export class PublicController {
  constructor(
    private leagueService: LeagueService,
    private teamService: TeamService
  ) {}

  /**
   * GET /public/leagues/:slug
   * Get public league information by slug
   * Requirements: 3.1, 3.4
   */
  getLeagueBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slug = req.params['slug'];
      if (!slug) {
        res.status(400).json({
          success: false,
          message: 'League slug is required'
        });
        return;
      }
      
      const league = await this.leagueService.getLeagueBySlug(slug);

      // Return public league data (excluding sensitive information)
      res.status(200).json({
        success: true,
        message: 'League retrieved successfully',
        data: {
          league: {
            id: league.id,
            name: league.name,
            slug: league.slug,
            season: league.season,
            isActive: league.isActive
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /public/leagues/:slug/teams
   * Get public team listing for a league
   * Requirements: 3.2, 3.4
   */
  getTeamsByLeagueSlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slug = req.params['slug'];
      if (!slug) {
        res.status(400).json({
          success: false,
          message: 'League slug is required'
        });
        return;
      }
      
      // First get the league to validate it exists and get the ID
      const league = await this.leagueService.getLeagueBySlug(slug);
      
      // Get teams for this league
      const teams = await this.teamService.getTeamsByLeague(league.id);

      // Return public team data (excluding sensitive information)
      const publicTeams = teams.map(team => ({
        id: team.id,
        name: team.name,
        color: team.color,
        captainName: team.captainName,
        memberCount: team.approvedMemberCount, // Only show approved members in public view
        createdAt: team.createdAt
      }));

      res.status(200).json({
        success: true,
        message: 'Teams retrieved successfully',
        data: {
          league: {
            id: league.id,
            name: league.name,
            slug: league.slug,
            season: league.season
          },
          teams: publicTeams
        }
      });
    } catch (error) {
      next(error);
    }
  };
}