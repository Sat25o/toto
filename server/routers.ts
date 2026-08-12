import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, passwordRecoveryProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { buildInvitationUrl } from "./invitationUrl";
import { assertRoundHistoryIsAvailable } from "./historyAccess";

export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const INVITATION_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000;

function publicUser(user: {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  isActive: boolean;
  isSuperAdmin: boolean;
  mustChangePassword: boolean;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    isSuperAdmin: user.isSuperAdmin,
    mustChangePassword: user.mustChangePassword,
  };
}

function requireSuperAdmin(isSuperAdmin: boolean) {
  if (!isSuperAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Apenas o super administrador pode executar esta ação",
    });
  }
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;

      const token = await sdk.createSessionToken(ctx.user.id);
      ctx.res.cookie(COOKIE_NAME, token, {
        ...getSessionCookieOptions(ctx.req),
        maxAge: SESSION_MAX_AGE_MS,
      });

      return publicUser(ctx.user);
    }),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        const isValidPassword = user && (await db.verifyPassword(input.password, user.passwordHash));

        if (!user || !isValidPassword) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou password inválidos" });
        }
        if (!user.isActive) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Esta conta está desativada" });
        }

        await db.updateLastSignedIn(user.id);
        const token = await sdk.createSessionToken(user.id);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: SESSION_MAX_AGE_MS,
        });

        return { success: true, user: publicUser(user) };
      }),
    register: publicProcedure
      .input(
        z.object({
          name: z.string().trim().min(2).max(255),
          email: z.string().email(),
          password: z.string().min(8).max(128),
          invitationToken: z.string().min(32).max(256),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await db.registerUserFromInvitation(input);
          const token = await sdk.createSessionToken(user.id);
          ctx.res.cookie(COOKIE_NAME, token, {
            ...getSessionCookieOptions(ctx.req),
            maxAge: SESSION_MAX_AGE_MS,
          });
          return { success: true, user: publicUser(user) };
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error instanceof Error ? error.message : "Não foi possível concluir o registo",
          });
        }
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
    changeTemporaryPassword: passwordRecoveryProcedure
      .input(z.object({ password: z.string().min(8).max(128) }))
      .mutation(async ({ input, ctx }) => {
        await db.changeOwnPassword(ctx.user.id, input.password);
        return { success: true };
      }),
  }),

  invitations: router({
    list: adminProcedure.query(async ({ ctx }) => {
      requireSuperAdmin(ctx.user.isSuperAdmin);
      return db.listInvitations();
    }),
    create: adminProcedure
      .input(z.object({ email: z.string().email(), role: z.enum(["user", "admin"]).default("user") }))
      .mutation(async ({ input, ctx }) => {
        requireSuperAdmin(ctx.user.isSuperAdmin);
        const invitationToken = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + INVITATION_VALIDITY_MS);

        try {
          await db.createInvitation({
            email: input.email,
            token: invitationToken,
            role: input.role,
            createdByUserId: ctx.user.id,
            expiresAt,
          });
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error instanceof Error ? error.message : "Não foi possível criar o convite",
          });
        }

        return {
          success: true,
          email: input.email.trim().toLowerCase(),
          expiresAt,
          inviteUrl: buildInvitationUrl(input.email, invitationToken),
        };
      }),
  }),

  users: router({
    list: adminProcedure.query(async () => db.listUsers()),
    updateRole: adminProcedure
      .input(z.object({ userId: z.number().int().positive(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ input }) => {
        try {
          await db.updateUserRole(input.userId, input.role);
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Operação recusada" });
        }
      }),
    deactivate: adminProcedure
      .input(z.object({ userId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        try {
          await db.setUserActive(input.userId, false);
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Operação recusada" });
        }
      }),
    reactivate: adminProcedure
      .input(z.object({ userId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        try {
          await db.setUserActive(input.userId, true);
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Operação recusada" });
        }
      }),
    delete: adminProcedure
      .input(z.object({ userId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        try {
          await db.deleteUser(input.userId, ctx.user.id);
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Operação recusada" });
        }
      }),
    setTemporaryPassword: adminProcedure
      .input(z.object({ userId: z.number().int().positive(), temporaryPassword: z.string().min(8).max(128) }))
      .mutation(async ({ input }) => {
        try {
          await db.setTemporaryPassword(input.userId, input.temporaryPassword);
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Operação recusada" });
        }
      }),
  }),

  rules: router({
    list: protectedProcedure.query(() => db.listLeagueRules()),
    listAdmin: adminProcedure.query(() => db.listLeagueRules(true)),
    create: adminProcedure
      .input(z.object({ content: z.string().trim().min(3).max(2_000) }))
      .mutation(async ({ input }) => {
        await db.createLeagueRule(input.content);
        return { success: true };
      }),
    update: adminProcedure
      .input(z.object({ id: z.number().int().positive(), content: z.string().trim().min(3).max(2_000), isActive: z.boolean() }))
      .mutation(async ({ input }) => {
        await db.updateLeagueRule(input.id, { content: input.content, isActive: input.isActive });
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await db.deleteLeagueRule(input.id);
        return { success: true };
      }),
  }),

  messages: router({
    list: protectedProcedure.query(() => db.listAdminMessages()),
    listAdmin: adminProcedure.query(() => db.listAdminMessages(true)),
    create: adminProcedure
      .input(z.object({ title: z.string().trim().min(3).max(180), content: z.string().trim().min(3).max(5_000), isPinned: z.boolean().default(false) }))
      .mutation(async ({ input, ctx }) => {
        await db.createAdminMessage({ ...input, createdByUserId: ctx.user.id });
        return { success: true };
      }),
    update: adminProcedure
      .input(z.object({ id: z.number().int().positive(), title: z.string().trim().min(3).max(180), content: z.string().trim().min(3).max(5_000), isPinned: z.boolean(), isActive: z.boolean() }))
      .mutation(async ({ input }) => {
        await db.updateAdminMessage(input.id, input);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await db.deleteAdminMessage(input.id);
        return { success: true };
      }),
  }),

  rounds: router({
    list: protectedProcedure.query(async () => db.getAllRounds()),
    getWithMatches: protectedProcedure
      .input(z.object({ roundId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const round = await db.getRound(input.roundId);
        if (!round) throw new TRPCError({ code: "NOT_FOUND", message: "Jornada não encontrada" });
        return {
          round,
          matches: await db.getMatchesByRound(input.roundId),
          winners: await db.getRoundWinners(input.roundId),
        };
      }),
    getParticipation: adminProcedure
      .input(z.object({ roundId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const round = await db.getRound(input.roundId);
        if (!round) throw new TRPCError({ code: "NOT_FOUND", message: "Jornada não encontrada" });
        return db.getRoundParticipation(input.roundId);
      }),
    updateDeadline: adminProcedure
      .input(z.object({ roundId: z.number().int().positive(), bettingDeadline: z.date() }))
      .mutation(async ({ input }) => {
        try {
          const round = await db.updateRoundDeadline(input.roundId, input.bettingDeadline);
          return { success: true, round };
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Não foi possível atualizar o prazo" });
        }
      }),
    updateMatches: adminProcedure
      .input(
        z.object({
          roundId: z.number().int().positive(),
          matches: z
            .array(
              z.object({
                id: z.number().int().positive(),
                homeTeam: z.string().trim().min(1).max(100),
                awayTeam: z.string().trim().min(1).max(100),
              }),
            )
            .length(6),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          const matches = await db.updateRoundMatches(input.roundId, input.matches);
          return { success: true, matches };
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Não foi possível atualizar os jogos" });
        }
      }),
    create: adminProcedure
      .input(
        z.object({
          roundNumber: z.number().int().min(1).max(34),
          prize: z.string().max(500).optional(),
          prizeAmount: z.number().nonnegative().max(99_999_999).optional(),
          bettingDeadline: z.date(),
          matches: z
            .array(
              z.object({
                homeTeam: z.string().trim().min(1).max(100),
                awayTeam: z.string().trim().min(1).max(100),
                matchOrder: z.number().int().min(1).max(6),
              }),
            )
            .length(6),
        }),
      )
      .mutation(async ({ input }) => {
        if (input.bettingDeadline <= new Date()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "O prazo tem de ser futuro" });
        }
        if (await db.getRoundByNumber(input.roundNumber)) {
          throw new TRPCError({ code: "CONFLICT", message: "Esta jornada já existe" });
        }
        await db.createRound({
          roundNumber: input.roundNumber,
          prize: input.prize,
          prizeAmount: input.prizeAmount,
          bettingDeadline: input.bettingDeadline,
        });
        const round = await db.getRoundByNumber(input.roundNumber);
        if (!round) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível criar a jornada" });
        await db.createMatches(round.id, input.matches);
        return round;
      }),
  }),

  matches: router({
    updateResult: adminProcedure
      .input(z.object({ matchId: z.number().int().positive(), result: z.enum(["1", "X", "2"]) }))
      .mutation(async ({ input }) => {
        try {
          await db.updateMatchResult(input.matchId, input.result);
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Não foi possível atualizar o resultado" });
        }
      }),
  }),

  predictions: router({
    getByRound: protectedProcedure
      .input(z.object({ roundId: z.number().int().positive() }))
      .query(({ input, ctx }) => db.getPredictionsByRoundAndUser(input.roundId, ctx.user.id)),
    submit: protectedProcedure
      .input(z.object({ matchId: z.number().int().positive(), prediction: z.enum(["1", "X", "2"]) }))
      .mutation(async ({ input, ctx }) => {
        try {
          await db.createOrUpdatePrediction(input.matchId, ctx.user.id, input.prediction);
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Não foi possível guardar o palpite" });
        }
      }),
    getByRoundAdmin: adminProcedure
      .input(z.object({ roundId: z.number().int().positive() }))
      .query(({ input }) => db.getPredictionsByRound(input.roundId)),
    getHistoryByRound: protectedProcedure
      .input(z.object({ roundId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const round = await db.getRound(input.roundId);
        if (!round) throw new TRPCError({ code: "NOT_FOUND", message: "Jornada não encontrada" });
        try {
          assertRoundHistoryIsAvailable(round.isSettled);
          return db.getPredictionsByRound(input.roundId);
        } catch (error) {
          throw new TRPCError({ code: "FORBIDDEN", message: error instanceof Error ? error.message : "Histórico indisponível" });
        }
      }),
    getPublic: protectedProcedure
      .input(z.object({ roundId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const round = await db.getRound(input.roundId);
        if (!round) throw new TRPCError({ code: "NOT_FOUND", message: "Jornada não encontrada" });
        if (new Date() < round.bettingDeadline) {
          throw new TRPCError({ code: "FORBIDDEN", message: "As apostas só ficam visíveis após o fecho do prazo" });
        }
        return db.getPublicRoundProgress(input.roundId);
      }),
  }),

  standings: router({
    list: protectedProcedure.query(() => db.getStandings()),
  }),

  winner: router({
    calculate: adminProcedure
      .input(z.object({ roundId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        try {
          const settlement = await db.calculateRoundWinner(input.roundId);
          return { success: true, ...settlement };
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Não foi possível calcular o vencedor" });
        }
      }),
  }),

  notifications: router({
    send: adminProcedure
      .input(
        z.object({
          userId: z.number().int().positive(),
          roundId: z.number().int().positive().optional(),
          type: z.enum(["round_created", "deadline_reminder", "results_published"]),
          subject: z.string().min(1).max(255),
        }),
      )
      .mutation(async ({ input }) => {
        await db.createEmailNotification(input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
