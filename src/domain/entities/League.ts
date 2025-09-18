/**
 * League entity interface
 * Represents a sports league in the system
 */
export interface League {
  id: string;
  name: string;
  slug: string;
  season?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * League creation data (without generated fields)
 */
export interface CreateLeagueData {
  name: string;
  slug: string;
  season?: string;
  isActive?: boolean;
}

/**
 * League update data (partial fields that can be updated)
 */
export interface UpdateLeagueData {
  name?: string;
  slug?: string;
  season?: string;
  isActive?: boolean;
}

/**
 * League domain validation rules and business logic
 */
export class LeagueDomain {
  /**
   * Validates league name
   */
  static isValidName(name: string): boolean {
    return name.trim().length >= 3 && name.trim().length <= 100;
  }

  /**
   * Validates league slug format
   */
  static isValidSlug(slug: string): boolean {
    // Slug should be lowercase, alphanumeric with hyphens, 3-50 characters
    const slugRegex = /^[a-z0-9-]{3,50}$/;
    return slugRegex.test(slug);
  }

  /**
   * Validates season format (optional)
   */
  static isValidSeason(season: string): boolean {
    if (!season) return true; // Season is optional
    return season.trim().length >= 4 && season.trim().length <= 20;
  }

  /**
   * Generates a slug from a league name
   */
  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Validates complete league creation data
   */
  static validateCreateData(data: CreateLeagueData): string[] {
    const errors: string[] = [];

    if (!data.name || !this.isValidName(data.name)) {
      errors.push('League name must be between 3 and 100 characters');
    }

    if (!data.slug || !this.isValidSlug(data.slug)) {
      errors.push('League slug must be 3-50 characters, lowercase alphanumeric with hyphens');
    }

    if (data.season && !this.isValidSeason(data.season)) {
      errors.push('Season must be between 4 and 20 characters');
    }

    return errors;
  }

  /**
   * Validates league update data
   */
  static validateUpdateData(data: UpdateLeagueData): string[] {
    const errors: string[] = [];

    if (data.name !== undefined && !this.isValidName(data.name)) {
      errors.push('League name must be between 3 and 100 characters');
    }

    if (data.slug !== undefined && !this.isValidSlug(data.slug)) {
      errors.push('League slug must be 3-50 characters, lowercase alphanumeric with hyphens');
    }

    if (data.season !== undefined && data.season !== null && !this.isValidSeason(data.season)) {
      errors.push('Season must be between 4 and 20 characters');
    }

    return errors;
  }

  /**
   * Checks if league is currently active
   */
  static isActiveLeague(league: League): boolean {
    return league.isActive;
  }

  /**
   * Creates league data with auto-generated slug if not provided
   */
  static prepareCreateData(data: Omit<CreateLeagueData, 'slug'> & { slug?: string }): CreateLeagueData {
    return {
      ...data,
      slug: data.slug || this.generateSlug(data.name),
      isActive: data.isActive ?? true
    };
  }
}