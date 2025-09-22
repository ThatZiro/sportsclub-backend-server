/**
 * Team entity interface
 * Represents a team within a league
 */
export interface Team {
  id: string;
  name: string;
  color?: string;
  leagueId: string;
  captainId: string;
  createdAt: Date;
}

/**
 * Team creation data (without generated fields)
 */
export interface CreateTeamData {
  name: string;
  color?: string;
  leagueId: string;
  captainId: string;
}

/**
 * Team update data (partial fields that can be updated)
 */
export interface UpdateTeamData {
  name?: string;
  color?: string;
  captainId?: string;
}

/**
 * Team with member count for summary views
 */
export interface TeamSummary {
  id: string;
  name: string;
  color?: string;
  leagueId: string;
  captainId: string;
  captainName: string;
  memberCount: number;
  createdAt: Date;
}

/**
 * Team domain validation rules and business logic
 */
export class TeamDomain {
  /**
   * Validates team name
   */
  static isValidName(name: string): boolean {
    return name.trim().length >= 2 && name.trim().length <= 50;
  }

  /**
   * Validates team color (hex color code)
   */
  static isValidColor(color: string): boolean {
    if (!color) return true; // Color is optional
    // Hex color code validation (3 or 6 digits)
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return colorRegex.test(color);
  }

  /**
   * Validates CUID format for IDs
   */
  static isValidId(id: string): boolean {
    // CUID format validation (starts with 'c' followed by 24 characters)
    const cuidRegex = /^c[a-z0-9]{24}$/;
    return cuidRegex.test(id);
  }

  /**
   * Validates complete team creation data
   */
  static validateCreateData(data: CreateTeamData): string[] {
    const errors: string[] = [];

    if (!data.name || !this.isValidName(data.name)) {
      errors.push('Team name must be between 2 and 50 characters');
    }

    if (data.color && !this.isValidColor(data.color)) {
      errors.push('Team color must be a valid hex color code (e.g., #FF0000)');
    }

    if (!data.leagueId || !this.isValidId(data.leagueId)) {
      errors.push('Valid league ID is required');
    }

    if (!data.captainId || !this.isValidId(data.captainId)) {
      errors.push('Valid captain ID is required');
    }

    return errors;
  }

  /**
   * Validates team update data
   */
  static validateUpdateData(data: UpdateTeamData): string[] {
    const errors: string[] = [];

    if (data.name !== undefined && !this.isValidName(data.name)) {
      errors.push('Team name must be between 2 and 50 characters');
    }

    if (
      data.color !== undefined &&
      data.color !== null &&
      !this.isValidColor(data.color)
    ) {
      errors.push('Team color must be a valid hex color code (e.g., #FF0000)');
    }

    if (data.captainId !== undefined && !this.isValidId(data.captainId)) {
      errors.push('Valid captain ID is required');
    }

    return errors;
  }

  /**
   * Checks if a user is the captain of the team
   */
  static isCaptain(team: Team, userId: string): boolean {
    return team.captainId === userId;
  }

  /**
   * Normalizes team color to uppercase hex format
   */
  static normalizeColor(color?: string): string | undefined {
    if (!color) return undefined;
    return color.toUpperCase();
  }

  /**
   * Prepares team creation data with normalized values
   */
  static prepareCreateData(data: CreateTeamData): CreateTeamData {
    const prepared: CreateTeamData = {
      ...data,
      name: data.name.trim(),
    };

    if (data.color !== undefined) {
      const normalizedColor = this.normalizeColor(data.color);
      if (normalizedColor !== undefined) {
        prepared.color = normalizedColor;
      }
    }

    return prepared;
  }

  /**
   * Prepares team update data with normalized values
   */
  static prepareUpdateData(data: UpdateTeamData): UpdateTeamData {
    const prepared: UpdateTeamData = {};

    if (data.name !== undefined) {
      prepared.name = data.name.trim();
    }

    if (data.color !== undefined) {
      const normalizedColor = this.normalizeColor(data.color);
      if (normalizedColor !== undefined) {
        prepared.color = normalizedColor;
      }
    }

    if (data.captainId !== undefined) {
      prepared.captainId = data.captainId;
    }

    return prepared;
  }
}
