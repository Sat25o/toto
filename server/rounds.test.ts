import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Rounds and Predictions", () => {
  let roundId: number;
  let matchId: number;
  const testUserId = 1;

  beforeAll(async () => {
    // Create a test round
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 2);

    await db.createRound({
      roundNumber: 1,
      prize: "Test Prize",
      bettingDeadline: deadline,
    });

    const round = await db.getRoundByNumber(1);
    if (!round) throw new Error("Failed to create round");
    roundId = round.id;

    // Create test matches
    await db.createMatches(roundId, [
      { homeTeam: "Team A", awayTeam: "Team B", matchOrder: 1 },
      { homeTeam: "Team C", awayTeam: "Team D", matchOrder: 2 },
      { homeTeam: "Team E", awayTeam: "Team F", matchOrder: 3 },
      { homeTeam: "Team G", awayTeam: "Team H", matchOrder: 4 },
      { homeTeam: "Team I", awayTeam: "Team J", matchOrder: 5 },
      { homeTeam: "Team K", awayTeam: "Team L", matchOrder: 6 },
    ]);

    const matches = await db.getMatchesByRound(roundId);
    if (matches.length === 0) throw new Error("Failed to create matches");
    matchId = matches[0].id;
  });

  it("should create a round", async () => {
    const round = await db.getRound(roundId);
    expect(round).toBeDefined();
    expect(round?.roundNumber).toBe(1);
    expect(round?.prize).toBe("Test Prize");
  });

  it("should get matches by round", async () => {
    const matches = await db.getMatchesByRound(roundId);
    expect(matches).toHaveLength(6);
    expect(matches[0].homeTeam).toBe("Team A");
  });

  it("should create a prediction", async () => {
    await db.createOrUpdatePrediction(matchId, testUserId, "1");
    const prediction = await db.getPrediction(matchId, testUserId);
    expect(prediction).toBeDefined();
    expect(prediction?.prediction).toBe("1");
  });

  it("should update a prediction", async () => {
    await db.createOrUpdatePrediction(matchId, testUserId, "X");
    const prediction = await db.getPrediction(matchId, testUserId);
    expect(prediction?.prediction).toBe("X");
  });

  it("should update match result", async () => {
    await db.updateMatchResult(matchId, "1");
    const match = await db.getMatchesByRound(roundId);
    const updatedMatch = match.find(m => m.id === matchId);
    expect(updatedMatch?.result).toBe("1");
  });

  it("should get standings", async () => {
    const standings = await db.getStandings();
    expect(Array.isArray(standings)).toBe(true);
  });
});
