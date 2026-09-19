import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/appRouter";
import { createContext } from "@/server/trpc/context";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    responseMeta({ ctx }) {
      if (!ctx?.responseHeaders) {
        return {};
      }
      return {
        headers: ctx.responseHeaders,
      };
    },
    onError({ error, path }) {
      if (process.env.NODE_ENV === "development") {
        console.error(`[tRPC Error on '${path}']:`, error);
      }
    },
  });

export { handler as GET, handler as POST };
