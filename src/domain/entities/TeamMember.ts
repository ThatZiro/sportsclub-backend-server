import { MemberRole, MemberStatus } from '../enums';

/**
 * TeamMember entity interface
 * Represents a user's membership in a team
 */
export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: MemberRole;
  status: MemberStatus;
  createdAt: Date;
}

/**
 * TeamMember creation data (without generated fields)
 */
export interface CreateTeamMemberData {
  teamId: string;
  userId: string;
  role?: MemberRole;
  status?: MemberStatus;
}

/**
 * TeamMember update data (partial fields that can be updated)
 */
export interface UpdateTeamMemberData {
  role?: MemberRole;
  status?: MemberStatus;
}

/**
 * TeamMember with user details for display
 */
export interface TeamMemberWithUser {
  id: string;
  teamId: string;
  userId: string;
  role: MemberRole;
  status: MemberStatus;
  createdAt: Date;
  userName: string;
  userEmail: string;
}

/**
 * TeamMember domain validation rules and business logic
 */
export class TeamMemberDomain {
  /**
   * Validates CUID format for IDs
   */
  static isValidId(id: string): boolean {
    // CUID format validation (starts with 'c' followed by 24 characters)
    const cuidRegex = /^c[a-z0-9]{24}$/;
    return cuidRegex.test(id);
  }

  /**
   * Validates complete team member creation data
   */
  static validateCreateData(data: CreateTeamMemberData): string[] {
    const errors: string[] = [];

    if (!data.teamId || !this.isValidId(data.teamId)) {
      errors.push('Valid team ID is required');
    }

    if (!data.userId || !this.isValidId(data.userId)) {
      errors.push('Valid user ID is required');
    }

    return errors;
  }

  /**
   * Validates team member update data
   */
  static validateUpdateData(_data: UpdateTeamMemberData): string[] {
    const errors: string[] = [];

    // Role and status validation is handled by enum type checking
    // No additional validation needed for these fields

    return errors;
  }

  /**
   * Checks if member is a captain
   */
  static isCaptain(member: TeamMember): boolean {
    return member.role === MemberRole.CAPTAIN;
  }

  /**
   * Checks if member is approved
   */
  static isApproved(member: TeamMember): boolean {
    return member.status === MemberStatus.APPROVED;
  }

  /**
   * Checks if member is pending approval
   */
  static isPending(member: TeamMember): boolean {
    return member.status === MemberStatus.PENDING;
  }

  /**
   * Checks if member is active (approved and not rejected)
   */
  static isActiveMember(member: TeamMember): boolean {
    return this.isApproved(member);
  }

  /**
   * Checks if member can be approved (is currently pending)
   */
  static canBeApproved(member: TeamMember): boolean {
    return this.isPending(member);
  }

  /**
   * Checks if member can be rejected (is currently pending or approved)
   */
  static canBeRejected(member: TeamMember): boolean {
    return (
      member.status === MemberStatus.PENDING ||
      member.status === MemberStatus.APPROVED
    );
  }

  /**
   * Creates team member data for a new captain
   */
  static createCaptainMemberData(
    teamId: string,
    userId: string
  ): CreateTeamMemberData {
    return {
      teamId,
      userId,
      role: MemberRole.CAPTAIN,
      status: MemberStatus.APPROVED,
    };
  }

  /**
   * Creates team member data for a new regular member
   */
  static createRegularMemberData(
    teamId: string,
    userId: string,
    autoApprove = false
  ): CreateTeamMemberData {
    return {
      teamId,
      userId,
      role: MemberRole.MEMBER,
      status: autoApprove ? MemberStatus.APPROVED : MemberStatus.PENDING,
    };
  }

  /**
   * Prepares team member creation data with defaults
   */
  static prepareCreateData(data: CreateTeamMemberData): CreateTeamMemberData {
    return {
      ...data,
      role: data.role ?? MemberRole.MEMBER,
      status: data.status ?? MemberStatus.PENDING,
    };
  }

  /**
   * Creates approval update data
   */
  static createApprovalData(): UpdateTeamMemberData {
    return {
      status: MemberStatus.APPROVED,
    };
  }

  /**
   * Creates rejection update data
   */
  static createRejectionData(): UpdateTeamMemberData {
    return {
      status: MemberStatus.REJECTED,
    };
  }

  /**
   * Checks if user can approve/reject members (business rule)
   * This would typically be used with user role and team captain status
   */
  static canManageMembers(
    memberRole: MemberRole,
    userIsOrganizer: boolean
  ): boolean {
    return memberRole === MemberRole.CAPTAIN || userIsOrganizer;
  }
}
