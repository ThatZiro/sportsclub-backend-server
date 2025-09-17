/**
 * User roles in the PBSportsClub system
 * Defines the different permission levels for users
 */
export enum UserRole {
  /** Regular user who can join teams and participate in leagues */
  USER = 'USER',
  
  /** Organizer who can manage leagues and teams */
  ORGANIZER = 'ORGANIZER',
  
  /** Administrator with full system access */
  ADMIN = 'ADMIN'
}

/**
 * Type guard to check if a string is a valid UserRole
 */
export function isValidUserRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

/**
 * Get all available user roles
 */
export function getAllUserRoles(): UserRole[] {
  return Object.values(UserRole);
}