import { describe, expect, it } from "vitest";
import { toggleSummaryFilter } from "./summaryFilter";

describe("filtros do resumo da jornada", () => {
  it("ativa o estado selecionado e limpa o filtro ao tocar novamente", () => {
    expect(toggleSummaryFilter("all", "eligible")).toBe("eligible");
    expect(toggleSummaryFilter("eligible", "eligible")).toBe("all");
  });
});
