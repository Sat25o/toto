import { describe, expect, it } from "vitest";
import { openAllCopycatsDetails, toggleCopycatsDetail } from "./copycatsDetail";

describe("toggleCopycatsDetail", () => {
  it("abre um grupo quando ainda não está selecionado", () => {
    expect(toggleCopycatsDetail([], "1|X|2|1|X|2")).toEqual(["1|X|2|1|X|2"]);
  });

  it("fecha o grupo quando é selecionado novamente", () => {
    expect(toggleCopycatsDetail(["1|X|2|1|X|2"], "1|X|2|1|X|2")).toEqual([]);
  });

  it("mantém os grupos já abertos ao abrir outro boletim", () => {
    expect(toggleCopycatsDetail(["1|1|1|1|1|1"], "X|X|X|X|X|X")).toEqual(["1|1|1|1|1|1", "X|X|X|X|X|X"]);
  });

  it("abre todos os grupos sem duplicar chaves", () => {
    expect(openAllCopycatsDetails(["1|X|2|1|X|2", "X|1|2|X|1|2", "1|X|2|1|X|2"])).toEqual(["1|X|2|1|X|2", "X|1|2|X|1|2"]);
  });
});
