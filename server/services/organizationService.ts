import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export interface CreateOrganizationInput {
  name: string;
  description?: string;
  aiInstructions?: string;
  defaultAiModel?: string;
}

export interface UpdateOrganizationInput {
  organizationId: string;
  name?: string;
  description?: string;
  aiInstructions?: string;
  defaultAiModel?: string;
}

export interface AddOrInviteMemberInput {
  organizationId: string;
  email: string;
  role?: 'owner' | 'admin' | 'member';
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${base || 'org'}-${randomSuffix}`;
}

export class OrganizationService {
  /**
   * Create a new organization and assign the creator as the Owner.
   */
  static async createOrganization(
    input: CreateOrganizationInput,
    userId: string,
  ) {
    const slug = generateSlug(input.name);

    const organization = await prisma.organization.create({
      data: {
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        aiInstructions: input.aiInstructions?.trim() || null,
        defaultAiModel: input.defaultAiModel?.trim() || 'Gemini 2.5 Pro Vision',
        members: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
      },
    });

    // Update user's active organization
    await prisma.user.update({
      where: { id: userId },
      data: { activeOrgId: organization.id },
    });

    return organization;
  }

  /**
   * List all organizations where the given user is a member.
   */
  static async getUserOrganizations(userId: string) {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                members: true,
                workflows: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      description: m.organization.description,
      aiInstructions: m.organization.aiInstructions,
      defaultAiModel: m.organization.defaultAiModel,
      role: m.role,
      memberCount: m.organization._count.members,
      workflowCount: m.organization._count.workflows,
      createdAt: m.organization.createdAt,
    }));
  }

  /**
   * Retrieve an organization with its full member roster and pending invites.
   */
  static async getOrganizationById(organizationId: string, userId: string) {
    const memberRecord = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!memberRecord) {
      throw new Error('You do not have access to this organization.');
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                plan: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        invitations: {
          where: { status: 'pending' },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            workflows: true,
            members: true,
          },
        },
      },
    });

    if (!org) {
      throw new Error('Organization not found.');
    }

    return {
      ...org,
      userRole: memberRecord.role,
    };
  }

  /**
   * Get the active organization for a user, auto-provisioning one if none exists.
   */
  static async getActiveOrganization(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        activeOrgId: true,
        workspaceName: true,
      },
    });

    if (!user) {
      throw new Error('User not found.');
    }

    const activeOrgId = user.activeOrgId;

    if (activeOrgId) {
      const membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: activeOrgId,
            userId,
          },
        },
        include: {
          organization: {
            include: {
              _count: {
                select: { members: true, workflows: true },
              },
            },
          },
        },
      });

      if (membership) {
        return {
          ...membership.organization,
          userRole: membership.role,
          memberCount: membership.organization._count.members,
          workflowCount: membership.organization._count.workflows,
        };
      }
    }

    // Fallback: check if user has any organization membership
    const firstMembership = await prisma.organizationMember.findFirst({
      where: { userId },
      include: {
        organization: {
          include: {
            _count: {
              select: { members: true, workflows: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (firstMembership) {
      await prisma.user.update({
        where: { id: userId },
        data: { activeOrgId: firstMembership.organization.id },
      });

      return {
        ...firstMembership.organization,
        userRole: firstMembership.role,
        memberCount: firstMembership.organization._count.members,
        workflowCount: firstMembership.organization._count.workflows,
      };
    }

    // If no organization exists at all for this user, auto-provision a default one
    const newOrg = await this.createOrganization(
      {
        name: user.workspaceName || `${user.name.split(' ')[0]}'s Organization`,
        description:
          'Primary workspace for autonomous workflows and browser agents.',
        defaultAiModel: 'Gemini 2.5 Pro Vision',
      },
      userId,
    );

    // Adopt any unlinked workflows created by this user
    await prisma.workflow.updateMany({
      where: {
        userId,
        organizationId: null,
      },
      data: {
        organizationId: newOrg.id,
      },
    });

    return {
      id: newOrg.id,
      name: newOrg.name,
      slug: newOrg.slug,
      description: newOrg.description,
      aiInstructions: newOrg.aiInstructions,
      defaultAiModel: newOrg.defaultAiModel,
      userRole: 'owner',
      memberCount: 1,
      workflowCount: 0,
      createdAt: newOrg.createdAt,
      updatedAt: newOrg.updatedAt,
    };
  }

  // get member with in organization

  static async getOrganizationMembers(organizationId: string) {
    const membership = await prisma.organizationMember.findMany({
      where: {
        organizationId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return membership;
  }

  /**
   * Switch user's active organization
   */
  static async switchActiveOrganization(
    organizationId: string,
    userId: string,
  ) {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new Error('You are not a member of this organization.');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { activeOrgId: organizationId },
    });

    return this.getActiveOrganization(userId);
  }

  /**
   * Add a person directly if they already have an account, or create an invitation if not.
   */
  static async addOrInviteMember(
    input: AddOrInviteMemberInput,
    requesterUserId: string,
  ) {
    const requesterMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: input.organizationId,
          userId: requesterUserId,
        },
      },
    });

    if (
      !requesterMembership ||
      (requesterMembership.role !== 'owner' &&
        requesterMembership.role !== 'admin')
    ) {
      throw new Error(
        'Only organization owners and admins can add or invite members.',
      );
    }

    const normalizedEmail = input.email.trim().toLowerCase();
    const role = input.role || 'member';

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // Check if user is already in the organization
      const alreadyMember = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId: existingUser.id,
          },
        },
      });

      if (alreadyMember) {
        throw new Error('This user is already a member of this organization.');
      }

      // Add directly as member
      const member = await prisma.organizationMember.create({
        data: {
          organizationId: input.organizationId,
          userId: existingUser.id,
          role,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      // If existing user has no active org, set it
      if (!existingUser.activeOrgId) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { activeOrgId: input.organizationId },
        });
      }

      // Clean up any pending invitation
      await prisma.organizationInvitation.deleteMany({
        where: {
          organizationId: input.organizationId,
          email: normalizedEmail,
        },
      });

      return {
        type: 'added' as const,
        message: `${existingUser.name} (${existingUser.email}) was added as ${role}.`,
        member,
      };
    }

    // 2. User doesn't exist yet: create or refresh an invitation
    const token = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.organizationInvitation.upsert({
      where: {
        organizationId_email: {
          organizationId: input.organizationId,
          email: normalizedEmail,
        },
      },
      update: {
        role,
        token,
        status: 'pending',
        expiresAt,
        invitedById: requesterUserId,
      },
      create: {
        organizationId: input.organizationId,
        email: normalizedEmail,
        role,
        token,
        status: 'pending',
        expiresAt,
        invitedById: requesterUserId,
      },
    });

    return {
      type: 'invited' as const,
      message: `Invitation generated for ${normalizedEmail} as ${role}.`,
      invitation,
    };
  }

  /**
   List My Pending Invitation
   */
  static async listMyPendingInvitation(email: string) {
    const invitations = await prisma.organizationInvitation.findMany({
      where: {
        email,
        status: 'pending',
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return invitations;
  }

  // accept pending invitation
  static async acceptPendingInvitation(invitationId: string, userId: string) {
    const invitation = await prisma.organizationInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new Error('Invitation not found.');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Invitation is not pending.');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found.');
    }

    if (invitation.email !== user.email) {
      throw new Error('Invitation does not belong to this user.');
    }

    const membership = await prisma.organizationMember.create({
      data: {
        organizationId: invitation.organizationId,
        userId: user.id,
        role: invitation.role,
      },
    });

    await prisma.organizationInvitation.update({
      where: { id: invitationId },
      data: { status: 'accepted' },
    });

    return membership;
  }

  // decline pending invitation
  static async declinePendingInvitation(invitationId: string, userId: string) {
    const invitation = await prisma.organizationInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new Error('Invitation not found.');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Invitation is not pending.');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found.');
    }

    if (invitation.email !== user.email) {
      throw new Error('Invitation does not belong to this user.');
    }

    await prisma.organizationInvitation.update({
      where: { id: invitationId },
      data: { status: 'declined' },
    });

    return true;
  }

  /**
   * Remove a member from the organization.
   */
  static async removeMember(
    organizationId: string,
    targetUserId: string,
    requesterUserId: string,
  ) {
    const requesterMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: requesterUserId,
        },
      },
    });

    if (
      !requesterMembership ||
      (requesterMembership.role !== 'owner' &&
        requesterMembership.role !== 'admin')
    ) {
      throw new Error(
        'Only organization owners and admins can remove members.',
      );
    }

    const targetMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMembership) {
      throw new Error('Target user is not a member of this organization.');
    }

    // Cannot remove the owner unless requester is another owner
    if (targetMembership.role === 'owner') {
      const ownerCount = await prisma.organizationMember.count({
        where: {
          organizationId,
          role: 'owner',
        },
      });

      if (ownerCount <= 1) {
        throw new Error('Cannot remove the sole owner of an organization.');
      }
    }

    await prisma.organizationMember.delete({
      where: {
        organizationId_userId: {
          organizationId,
          userId: targetUserId,
        },
      },
    });

    return { success: true };
  }

  /**
   * Update a member's role (owner, admin, member).
   */
  static async updateMemberRole(
    organizationId: string,
    targetUserId: string,
    newRole: 'owner' | 'admin' | 'member',
    requesterUserId: string,
  ) {
    const requesterMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: requesterUserId,
        },
      },
    });

    if (!requesterMembership || requesterMembership.role !== 'owner') {
      throw new Error('Only organization owners can change member roles.');
    }

    const updated = await prisma.organizationMember.update({
      where: {
        organizationId_userId: {
          organizationId,
          userId: targetUserId,
        },
      },
      data: { role: newRole },
    });

    return updated;
  }

  /**
   * Update organization metadata and AI intelligence directives.
   */
  static async updateSettings(
    input: UpdateOrganizationInput,
    requesterUserId: string,
  ) {
    const requesterMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: input.organizationId,
          userId: requesterUserId,
        },
      },
    });

    if (
      !requesterMembership ||
      (requesterMembership.role !== 'owner' &&
        requesterMembership.role !== 'admin')
    ) {
      throw new Error(
        'Only organization owners and admins can update settings.',
      );
    }

    const data: Prisma.OrganizationUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.description !== undefined)
      data.description = input.description.trim();
    if (input.aiInstructions !== undefined)
      data.aiInstructions = input.aiInstructions.trim();
    if (input.defaultAiModel !== undefined)
      data.defaultAiModel = input.defaultAiModel.trim();

    const updated = await prisma.organization.update({
      where: { id: input.organizationId },
      data,
    });

    return updated;
  }
}
