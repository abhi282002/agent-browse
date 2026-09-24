import { z } from 'zod';
import { router, protectedProcedure } from '@/server/trpc/trpc';
import { OrganizationService } from '@/server/services/organizationService';

export const organizationRouter = router({
  /**
   * List all organizations for the current authenticated user.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return OrganizationService.getUserOrganizations(ctx.user.id);
  }),

  /**
   * Retrieve the active organization for the current user.
   */
  getActive: protectedProcedure.query(async ({ ctx }) => {
    return OrganizationService.getActiveOrganization(ctx.user.id);
  }),

  /**
   * Retrieve full details of a specific organization including members and pending invites.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return OrganizationService.getOrganizationById(input.id, ctx.user.id);
    }),

  /**
   * Create a new organization and make current user the Owner.
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Organization name is required'),
        description: z.string().optional(),
        aiInstructions: z.string().optional(),
        defaultAiModel: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return OrganizationService.createOrganization(input, ctx.user.id);
    }),

  /**
   * Switch current active organization for the user.
   */
  switchActive: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return OrganizationService.switchActiveOrganization(
        input.organizationId,
        ctx.user.id,
      );
    }),

  /**
   * Add a user directly (if existing account) or generate an email invitation.
   */
  addOrInviteMember: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        email: z.string().email('Invalid email address'),
        role: z.enum(['owner', 'admin', 'member']).default('member'),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return OrganizationService.addOrInviteMember(input, ctx.user.id);
    }),

  // list my pending invitation
  getMyPendingInvitations: protectedProcedure.query(async ({ ctx }) => {
    return OrganizationService.listMyPendingInvitation(ctx.user.email);
  }),

  getOrgMembers: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return OrganizationService.getOrganizationMembers(input.organizationId);
    }),

  acceptPendingInvitation: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return OrganizationService.acceptPendingInvitation(input.id, ctx.user.id);
    }),

  declinePendingInvitation: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return OrganizationService.declinePendingInvitation(
        input.id,
        ctx.user.id,
      );
    }),

  /**
   * Remove a member from the organization.
   */
  removeMember: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        targetUserId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return OrganizationService.removeMember(
        input.organizationId,
        input.targetUserId,
        ctx.user.id,
      );
    }),

  /**
   * Change a member's role (owner, admin, member).
   */
  updateMemberRole: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        targetUserId: z.string(),
        role: z.enum(['owner', 'admin', 'member']),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return OrganizationService.updateMemberRole(
        input.organizationId,
        input.targetUserId,
        input.role,
        ctx.user.id,
      );
    }),

  /**
   * Update organization metadata and custom AI directives.
   */
  updateSettings: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        aiInstructions: z.string().optional(),
        defaultAiModel: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return OrganizationService.updateSettings(input, ctx.user.id);
    }),
});
