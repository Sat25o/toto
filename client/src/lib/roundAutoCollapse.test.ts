import { describe, expect, it } from "vitest";
import { shouldAutoCollapseInitiallyOpenRound } from "./roundAutoCollapse";

describe("shouldAutoCollapseInitiallyOpenRound", () => {
  it("closes an automatically opened round after every match has a prediction", () => {
    expect(
      shouldAutoCollapseInitiallyOpenRound({
        autoOpenedRoundId: 3,
        selectedRoundId: 3,
        predictionCount: 7,
        matchCount: 7,
      }),
    ).toBe(true);
  });

  it("keeps the initial round open while predictions are still missing", () => {
    expect(
      shouldAutoCollapseInitiallyOpenRound({
        autoOpenedRoundId: 3,
        selectedRoundId: 3,
        predictionCount: 6,
        matchCount: 7,
      }),
    ).toBe(false);
  });

  it("never closes a round that the participant opened manually", () => {
    expect(
      shouldAutoCollapseInitiallyOpenRound({
        autoOpenedRoundId: null,
        selectedRoundId: 3,
        predictionCount: 7,
        matchCount: 7,
      }),
    ).toBe(false);
  });
});
