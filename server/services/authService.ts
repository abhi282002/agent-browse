import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateSessionToken, SESSION_MAX_AGE } from "@/lib/auth/session";

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

    return {
      sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        workspaceName: user.workspaceName ?? "Default Workspace",
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

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      workspaceName: session.user.workspaceName ?? "Default Workspace",
      createdAt: session.user.createdAt,
    };
  }
}
