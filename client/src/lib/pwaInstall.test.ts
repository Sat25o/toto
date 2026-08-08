import { describe, expect, it } from "vitest";
import { shouldShowInstallInstructions } from "./pwaInstall";

describe("instalação da app", () => {
  it("mostra instruções no iPhone e quando o navegador não disponibiliza a instalação direta", () => {
    expect(shouldShowInstallInstructions(true, true)).toBe(true);
    expect(shouldShowInstallInstructions(false, false)).toBe(true);
    expect(shouldShowInstallInstructions(false, true)).toBe(false);
    expect(shouldShowInstallInstructions(false, true, true)).toBe(true);
  });
});
