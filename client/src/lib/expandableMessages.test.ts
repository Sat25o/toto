import { describe, expect, it } from "vitest";
import { toggleExpandedMessage } from "./expandableMessages";

describe("toggleExpandedMessage", () => {
  it("abre um aviso recolhido", () => {
    expect(toggleExpandedMessage([], 8)).toEqual([8]);
  });

  it("fecha apenas o aviso tocado", () => {
    expect(toggleExpandedMessage([3, 8], 8)).toEqual([3]);
  });
});
