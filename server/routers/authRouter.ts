import { z } from "zod";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { AuthService } from "@/server/services/authService";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth/session";

export const authRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  signUp: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid work email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        workspaceName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await AuthService.signUp({
        name: input.name,
        email: input.email,
        password: input.password,
        workspaceName: input.workspaceName,
      });

      // Set session cookie
      const cookieValue = `${SESSION_COOKIE_NAME}=${result.sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`;
      ctx.responseHeaders.append("Set-Cookie", cookieValue);

      return result.user;
    }),

  signIn: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid work email address"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await AuthService.signIn({
        email: input.email,
        password: input.password,
      });

      const cookieValue = `${SESSION_COOKIE_NAME}=${result.sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`;
      
      ctx.responseHeaders.append("Set-Cookie", cookieValue);

      return result.user;
    }),

  signOut: publicProcedure.mutation(async ({ ctx }) => {
    if (ctx.sessionToken) {
      await AuthService.signOut(ctx.sessionToken);
    }

    // Clear session cookie
    const expiredCookie = `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
    ctx.responseHeaders.append("Set-Cookie", expiredCookie);

    return { success: true };
  }),
});
