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
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ ROUNDS ============
  rounds: router({
    // Get all rounds
    list: publicProcedure.query(async () => {
      return await db.getAllRounds();
    }),

    // Get a specific round with its matches
    getWithMatches: publicProcedure
      .input(z.object({ roundId: z.number() }))
      .query(async ({ input }) => {
        const round = await db.getRound(input.roundId);
        if (!round) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Round not found" });
        }

        const roundMatches = await db.getMatchesByRound(input.roundId);

        return {
          round,
          matches: roundMatches,
        };
      }),

    // Create a new round (admin only)
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
        // Check if round already exists
        const existing = await db.getRoundByNumber(input.roundNumber);
        if (existing) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Round already exists" });
        }

        // Create round
        await db.createRound({
          roundNumber: input.roundNumber,
          prize: input.prize,
          bettingDeadline: input.bettingDeadline,
        });

        // Get the created round
        const round = await db.getRoundByNumber(input.roundNumber);
        if (!round) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create round" });
        }

        // Create matches
        await db.createMatches(round.id, input.matches);

        return round;
      }),
  }),

  // ============ MATCHES ============
  matches: router({
    // Get matches for a round
    getByRound: publicProcedure
      .input(z.object({ roundId: z.number() }))
      .query(async ({ input }) => {
        return await db.getMatchesByRound(input.roundId);
      }),

    // Update match result (admin only)
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

  // ============ PREDICTIONS ============
  predictions: router({
    // Get user's predictions for a round
    getByRound: protectedProcedure
      .input(z.object({ roundId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.getPredictionsByRoundAndUser(input.roundId, ctx.user.id);
      }),

    // Submit or update a prediction
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
          throw new TRPCError({ 
            code: "INTERNAL_SERVER_ERROR", 
            message: "Failed to submit prediction" 
          });
        }
      }),

    // Get all predictions for a round (admin only)
    getByRoundAdmin: adminProcedure
      .input(z.object({ roundId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPredictionsByRound(input.roundId);
      }),
  }),

  // ============ STANDINGS ============
  standings: router({
    // Get season standings
    list: publicProcedure.query(async () => {
      return await db.getStandings();
    }),
  }),

  // ============ WINNER CALCULATION ============
  winner: router({
    // Calculate and set round winner (admin only)
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

  // ============ EMAIL NOTIFICATIONS ============
  notifications: router({
    // Send email notification (admin only)
    send: adminProcedure
      .input(z.object({
        userId: z.number(),
        roundId: z.number().optional(),
        type: z.enum(["round_created", "deadline_reminder", "results_published"]),
        subject: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          // Create notification record
          await db.createEmailNotification({
            userId: input.userId,
            roundId: input.roundId,
            type: input.type,
            subject: input.subject,
          });

          // In production, integrate with email service (SendGrid, Mailgun, etc.)
          // For now, we just log it
          console.log(`[Email] Notification queued for user ${input.userId}: ${input.subject}`);

          return { success: true, message: "Notificação criada" };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao criar notificação",
          });
        }
      }),

    // Notify all users about a new round
    notifyRoundCreated: adminProcedure
      .input(z.object({
        roundId: z.number(),
        roundNumber: z.number(),
      }))
      .mutation(async ({ input }) => {
        try {
          console.log(`[Email] Round created notification for round ${input.roundNumber}`);
          return { success: true, message: "Notificações enviadas" };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao enviar notificações",
          });
        }
      }),

    // Notify all users about deadline reminder
    notifyDeadlineReminder: adminProcedure
      .input(z.object({
        roundId: z.number(),
        roundNumber: z.number(),
      }))
      .mutation(async ({ input }) => {
        try {
          console.log(`[Email] Deadline reminder for round ${input.roundNumber}`);
          return { success: true, message: "Lembretes enviados" };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao enviar lembretes",
          });
        }
      }),

    // Notify all users about results
    notifyResultsPublished: adminProcedure
      .input(z.object({
        roundId: z.number(),
        roundNumber: z.number(),
      }))
      .mutation(async ({ input }) => {
        try {
          console.log(`[Email] Results published for round ${input.roundNumber}`);
          return { success: true, message: "Notificações de resultados enviadas" };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao enviar notificações de resultados",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
