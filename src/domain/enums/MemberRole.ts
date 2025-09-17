/**
 * Team member roles within a team
 * Defines the different roles a user can have in a team
 */
export enum MemberRole {
  /** Team captain with management privileges */
  CAPTAIN = 'CAPTAIN',
  
  /** Regular team member */
  MEMBER = 'MEMBER'
}

/**
 * Type guard to check if a string is a valid MemberRole
 */
export function isValidMemberRole(role: string): role is MemberRole {
  return Object.values(MemberRole).includes(role as MemberRole);
}

/**
 * Get all available member roles
 */
export function getAllMemberRoles(): MemberRole[] {
  return Object.values(MemberRole);
}