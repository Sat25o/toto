import { describe, expect, it } from "vitest";
import { toggleRoundSelection } from "./roundSelection";

describe("seleção de jornada", () => {
  it("abre uma jornada quando ainda não está selecionada", () => {
    expect(toggleRoundSelection(null, 1)).toBe(1);
    expect(toggleRoundSelection(2, 1)).toBe(1);
  });

  it("fecha a jornada ao voltar a clicar no mesmo cartão", () => {
    expect(toggleRoundSelection(1, 1)).toBeNull();
  });
});
