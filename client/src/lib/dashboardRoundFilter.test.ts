import { describe, expect, it } from "vitest";
import { filterDashboardRounds, getNextOpenRound } from "./dashboardRoundFilter";

const now = new Date("2026-08-20T12:00:00Z");
const rounds = [
  { id: 1, roundNumber: 1, bettingDeadline: "2026-08-08T14:00:00Z", isSettled: true },
  { id: 2, roundNumber: 2, bettingDeadline: "2026-08-15T14:00:00Z", isSettled: false },
  { id: 3, roundNumber: 3, bettingDeadline: "2026-08-22T14:30:00Z", isSettled: false },
  { id: 4, roundNumber: 4, bettingDeadline: "2026-08-29T14:30:00Z", isSettled: false },
];

describe("dashboard round filtering", () => {
  it("uses the nearest open round for the independent countdown", () => {
    expect(getNextOpenRound(rounds, now)?.roundNumber).toBe(3);
  });

  it("filters open and settled rounds while keeping closed rounds only in all", () => {
    expect(filterDashboardRounds(rounds, "open", now).map(round => round.roundNumber)).toEqual([3, 4]);
    expect(filterDashboardRounds(rounds, "settled", now).map(round => round.roundNumber)).toEqual([1]);
    expect(filterDashboardRounds(rounds, "all", now).map(round => round.roundNumber)).toEqual([1, 2, 3, 4]);
  });
});
