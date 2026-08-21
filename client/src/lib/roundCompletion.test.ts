import { describe, expect, it } from "vitest";
import { hasSevenConfirmedPredictions } from "./roundCompletion";

describe("hasSevenConfirmedPredictions", () => {
  it("identifies a seven-game round with every prediction confirmed", () => {
    expect(hasSevenConfirmedPredictions({ predictionCount: 7, matchCount: 7 })).toBe(true);
  });

  it("keeps the complete state off while a prediction is missing or the round differs from seven games", () => {
    expect(hasSevenConfirmedPredictions({ predictionCount: 6, matchCount: 7 })).toBe(false);
    expect(hasSevenConfirmedPredictions({ predictionCount: 7, matchCount: 6 })).toBe(false);
    expect(hasSevenConfirmedPredictions(undefined)).toBe(false);
  });
});
