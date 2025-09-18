/**
 * Team membership status
 * Defines the different states of a team membership
 */
export enum MemberStatus {
  /** Membership request is pending approval */
  PENDING = 'PENDING',
  
  /** Membership has been approved */
  APPROVED = 'APPROVED',
  
  /** Membership has been rejected */
  REJECTED = 'REJECTED'
}

/**
 * Type guard to check if a string is a valid MemberStatus
 */
export function isValidMemberStatus(status: string): status is MemberStatus {
  return Object.values(MemberStatus).includes(status as MemberStatus);
}

/**
 * Get all available member statuses
 */
export function getAllMemberStatuses(): MemberStatus[] {
  return Object.values(MemberStatus);
}

/**
 * Check if a member status allows participation
 */
export function isActiveMemberStatus(status: MemberStatus): boolean {
  return status === MemberStatus.APPROVED;
}