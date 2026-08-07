import { describe, expect, it } from "vitest";
import { calculateEqualPrizeShare } from "./settlement";

describe("divisão de prémios", () => {
  it("divide o prémio de forma igual por todos os vencedores", () => {
    expect(calculateEqualPrizeShare(100, 2)).toBe(50);
    expect(calculateEqualPrizeShare(90, 3)).toBe(30);
  });

  it("não calcula parte de prémio quando não há vencedor ou valor definido", () => {
    expect(calculateEqualPrizeShare(100, 0)).toBeNull();
    expect(calculateEqualPrizeShare(null, 2)).toBeNull();
  });
});
