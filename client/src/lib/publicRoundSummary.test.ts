import { describe, expect, it } from "vitest";
import { summarizePublicRound } from "./publicRoundSummary";

describe("resumo público da jornada", () => {
  it("conta apostadores em jogo e eliminados sem anunciar vencedor", () => {
    const summary = summarizePublicRound([
      { participant: { name: "Ana" }, progress: { status: "eligible" as const } },
      { participant: { name: "Bruno" }, progress: { status: "eliminated" as const } },
    ]);

    expect(summary).toEqual({ eligibleCount: 1, eliminatedCount: 1, winnerNames: [], winnerCount: 0 });
  });

  it("lista todos os vencedores quando há empate", () => {
    const summary = summarizePublicRound([
      { participant: { name: "Ana" }, progress: { status: "winner" as const } },
      { participant: { name: "Bruno" }, progress: { status: "winner" as const } },
      { participant: { name: "Carla" }, progress: { status: "eliminated" as const } },
    ]);

    expect(summary.winnerCount).toBe(2);
    expect(summary.winnerNames).toEqual(["Ana", "Bruno"]);
  });
});
