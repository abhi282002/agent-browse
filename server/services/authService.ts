import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateSessionToken, SESSION_MAX_AGE } from "@/lib/auth/session";
import { OrganizationService } from "./organizationService";

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  workspaceName?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface UserSessionPayload {
  id: string;
  name: string;
  email: string;
  workspaceName: string;
  activeOrgId?: string | null;
  activeOrganizationName?: string | null;
  activeOrganizationRole?: string | null;
  role: string;
  plan: string;
  createdAt: Date;
}

export class AuthService {
  static async signUp(input: SignUpInput): Promise<{ sessionToken: string; user: UserSessionPayload }> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new Error("An account with this work email already exists.");
    }

    const passwordHash = await hashPassword(input.password);
    const workspace = input.workspaceName?.trim() || `${input.name.trim().split(" ")[0]}'s Workspace`;

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: normalizedEmail,
        passwordHash,
        workspaceName: workspace,
      },
    });

    // Auto-provision initial organization
    const org = await OrganizationService.createOrganization(
      {
        name: workspace,
        description: "Primary workspace for autonomous workflows and browser agents.",
      },
      user.id
    );

    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        workspaceName: user.workspaceName ?? "Default Workspace",
        activeOrgId: org.id,
        activeOrganizationName: org.name,
        activeOrganizationRole: "owner",
        role: user.role,
        plan: user.plan,
        createdAt: user.createdAt,
      },
    };
  }

  static async signIn(input: SignInInput): Promise<{ sessionToken: string; user: UserSessionPayload }> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const isValidPassword = await verifyPassword(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error("Invalid email or password.");
    }

    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Resolve or provision active organization
    let activeOrg: Awaited<ReturnType<typeof OrganizationService.getActiveOrganization>> | null = null;
    try {
      activeOrg = await OrganizationService.getActiveOrganization(user.id);
    } catch {
      activeOrg = null;
    }

    return {
      sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        workspaceName: user.workspaceName ?? "Default Workspace",
        activeOrgId: activeOrg?.id ?? user.activeOrgId ?? null,
        activeOrganizationName: activeOrg?.name ?? user.workspaceName ?? "Default Workspace",
        activeOrganizationRole: activeOrg?.userRole ?? "member",
        role: user.role,
        plan: user.plan,
        createdAt: user.createdAt,
      },
    };
  }

  static async signOut(sessionToken: string): Promise<boolean> {
    if (!sessionToken) return false;
    try {
      await prisma.session.deleteMany({
        where: { sessionToken },
      });
      return true;
    } catch {
      return false;
    }
  }

  static async getCurrentUser(sessionToken: string): Promise<UserSessionPayload | null> {
    if (!sessionToken) return null;

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session) return null;

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    // Resolve or provision active organization
    let activeOrg: Awaited<ReturnType<typeof OrganizationService.getActiveOrganization>> | null = null;
    try {
      activeOrg = await OrganizationService.getActiveOrganization(session.user.id);
    } catch {
      activeOrg = null;
    }

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      workspaceName: session.user.workspaceName ?? "Default Workspace",
      activeOrgId: activeOrg?.id ?? session.user.activeOrgId ?? null,
      activeOrganizationName: activeOrg?.name ?? session.user.workspaceName ?? "Default Workspace",
      activeOrganizationRole: activeOrg?.userRole ?? "member",
      role: session.user.role,
      plan: session.user.plan,
      createdAt: session.user.createdAt,
    };
  }
}
