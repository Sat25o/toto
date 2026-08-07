import { describe, expect, it } from "vitest";
import { clearSelectedPrediction, selectPrediction } from "./predictionSelection";

describe("seleção imediata de palpites", () => {
  it("atualiza apenas o jogo selecionado sem alterar os restantes", () => {
    const current = { 10: "1" as const, 11: "X" as const };
    const updated = selectPrediction(current, 11, "2");

    expect(updated).toEqual({ 10: "1", 11: "2" });
    expect(current).toEqual({ 10: "1", 11: "X" });
  });

  it("remove a seleção temporária quando o servidor rejeita o palpite", () => {
    expect(clearSelectedPrediction({ 10: "1", 11: "X" }, 11)).toEqual({ 10: "1" });
  });
});
