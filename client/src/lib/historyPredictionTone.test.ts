import { describe, expect, it } from "vitest";
import { getHistoryPredictionTone } from "./historyPredictionTone";

describe("getHistoryPredictionTone", () => {
  it("identifica um palpite igual ao resultado final como acerto", () => {
    expect(getHistoryPredictionTone("X", "X")).toBe("correct");
  });

  it("identifica um palpite diferente do resultado final como falha", () => {
    expect(getHistoryPredictionTone("1", "2")).toBe("incorrect");
  });

  it("mantém neutro um palpite em falta", () => {
    expect(getHistoryPredictionTone(undefined, "1")).toBe("missing");
  });
});
