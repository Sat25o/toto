import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string() }))
      .mutation(async ({ input }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou password invalidos" });
        const valid = await db.verifyPassword(input.password, user.passwordHash);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou password invalidos" });
        await db.updateLastSignedIn(user.id);
        return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),
    register: publicProcedure
      .input(z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(6) }))
      .mutation(async ({ input }) => {
        await db.createUser({ name: input.name, email: input.email, password: input.password });
        return { success: true };
      }),
  }),

  rounds: router({
    list: publicProcedure.query(async () => {
      return await db.getAllRounds();
    }),
    getWithMatches: publicProcedure
      .input(z.object({ roundId: z.number() }))
      .query(async ({ input }) => {
        const round = await db.getRound(input.roundId);
        if (!round) throw new TRPCError({ code: "NOT_FOUND", message: "Round not found" });
        const roundMatches = await db.getMatchesByRound(input.roundId);
        return { round, matches: roundMatches };
      }),
    create: adminProcedure
      .input(z.object({
        roundNumber: z.number().min(1).max(34),
        prize: z.string().optional(),
        bettingDeadline: z.date(),
        matches: z.array(z.object({
          homeTeam: z.string(),
          awayTeam: z.string(),
          matchOrder: z.number().min(1).max(6),
        })).length(6),
      }))
      .mutation(async ({ input }) => {
        const existing = await db.getRoundByNumber(input.roundNumber);
        if (existing) throw new TRPCError({ code: "BAD_REQUEST", message: "Round already exists" });
        await db.createRound({
          roundNumber: input.roundNumber,
          prize: input.prize,
          bettingDeadline: input.bettingDeadline,
        });
        const round = await db.getRoundByNumber(input.roundNumber);
        if (!round) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create round" });
        await db.createMatches(round.id, input.matches);
        return round;
      }),
  }),

  matches: router({
    getByRound: publicProcedure
      .input(z.object({ roundId: z.number() }))
      .query(async ({ input }) => {
        return await db.getMatchesByRound(input.roundId);
      }),
    updateResult: adminProcedure
      .input(z.object({
        matchId: z.number(),
        result: z.enum(["1", "X", "2"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateMatchResult(input.matchId, input.result);
        return { success: true };
      }),
  }),

  predictions: router({
    getByRound: protectedProcedure
      .input(z.object({ roundId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.getPredictionsByRoundAndUser(input.roundId, ctx.user.id);
      }),
    submit: protectedProcedure
      .input(z.object({
        matchId: z.number(),
        prediction: z.enum(["1", "X", "2"]),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          await db.createOrUpdatePrediction(input.matchId, ctx.user.id, input.prediction);
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to submit prediction" });
        }
      }),
    getByRoundAdmin: adminProcedure
      .input(z.object({ roundId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPredictionsByRound(input.roundId);
      }),
  }),

  standings: router({
    list: publicProcedure.query(async () => {
      return await db.getStandings();
    }),
  }),

  winner: router({
    calculate: adminProcedure
      .input(z.object({ roundId: z.number() }))
      .mutation(async ({ input }) => {
        try {
          const winnerId = await db.calculateRoundWinner(input.roundId);
          return { winnerId, success: true };
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error instanceof Error ? error.message : "Failed to calculate winner",
          });
        }
      }),
  }),

  notifications: router({
    send: adminProcedure
      .input(z.object({
        userId: z.number(),
        roundId: z.number().optional(),
        type: z.enum(["round_created", "deadline_reminder", "results_published"]),
        subject: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          await db.createEmailNotification({
            userId: input.userId,
            roundId: input.roundId,
            type: input.type,
            subject: input.subject,
          });
          console.log(`[Email] Notification queued for user ${input.userId}: ${input.subject}`);
          return { success: true, message: "Notificacao criada" };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar notificacao" });
        }
      }),
    notifyRoundCreated: adminProcedure
      .input(z.object({ roundId: z.number(), roundNumber: z.number() }))
      .mutation(async ({ input }) => {
        try {
          console.log(`[Email] Round created notification for round ${input.roundNumber}`);
          return { success: true, message: "Notificacoes enviadas" };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao enviar notificacoes" });
        }
      }),
    notifyDeadlineReminder: adminProcedure
      .input(z.object({ roundId: z.number(), roundNumber: z.number() }))
      .mutation(async ({ input }) => {
        try {
          console.log(`[Email] Deadline reminder for round ${input.roundNumber}`);
          return { success: true, message: "Lembretes enviados" };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao enviar lembretes" });
        }
      }),
    notifyResultsPublished: adminProcedure
      .input(z.object({ roundId: z.number(), roundNumber: z.number() }))
      .mutation(async ({ input }) => {
        try {
          console.log(`[Email] Results published for round ${input.roundNumber}`);
          return { success: true, message: "Notificacoes de resultados enviadas" };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao enviar notificacoes de resultados" });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
