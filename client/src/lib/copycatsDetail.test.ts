import { describe, expect, it } from "vitest";
import { toggleCopycatsDetail } from "./copycatsDetail";

describe("toggleCopycatsDetail", () => {
  it("abre um grupo quando ainda não está selecionado", () => {
    expect(toggleCopycatsDetail(null, "1|X|2|1|X|2")).toBe("1|X|2|1|X|2");
  });

  it("fecha o grupo quando é selecionado novamente", () => {
    expect(toggleCopycatsDetail("1|X|2|1|X|2", "1|X|2|1|X|2")).toBeNull();
  });

  it("muda para o novo grupo quando é selecionado outro boletim", () => {
    expect(toggleCopycatsDetail("1|1|1|1|1|1", "X|X|X|X|X|X")).toBe("X|X|X|X|X|X");
  });
});
