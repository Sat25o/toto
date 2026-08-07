import { describe, expect, it } from "vitest";
import { getPredictionProgress } from "./predictionProgress";

describe("progresso de palpites", () => {
  it("conta palpites guardados e escolhas locais sem duplicar jogos", () => {
    expect(getPredictionProgress([1, 2], { 2: "X", 3: "1" }, 6)).toEqual({ completed: 3, total: 6, percentage: 50 });
  });

  it("indica 6/6 quando todos os jogos foram preenchidos", () => {
    expect(getPredictionProgress([1, 2, 3, 4, 5, 6], {}, 6)).toEqual({ completed: 6, total: 6, percentage: 100 });
  });
});
