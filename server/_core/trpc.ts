import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const passwordRecoveryProcedure = t.procedure.use(requireUser);
export const protectedProcedure = passwordRecoveryProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.mustChangePassword) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Atualize a palavra-passe provisória para continuar" });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const adminProcedure = passwordRecoveryProcedure.use(
  async ({ ctx, next }) => {
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    if (ctx.user.mustChangePassword) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Atualize a palavra-passe provisória para continuar" });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  },
);
