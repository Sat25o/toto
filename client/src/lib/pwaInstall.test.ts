import { describe, expect, it } from "vitest";
import { detectInstallBrowser, shouldShowInstallInstructions } from "./pwaInstall";

describe("instalação da app", () => {
  it("mostra instruções no iPhone e quando o navegador não disponibiliza a instalação direta", () => {
    expect(shouldShowInstallInstructions(true, true)).toBe(true);
    expect(shouldShowInstallInstructions(false, false)).toBe(true);
    expect(shouldShowInstallInstructions(false, true)).toBe(false);
    expect(shouldShowInstallInstructions(false, true, true)).toBe(true);
  });

  it("deteta os principais navegadores móveis para apresentar o guia correto", () => {
    expect(detectInstallBrowser("Mozilla/5.0 SamsungBrowser/25.0")).toBe("samsung");
    expect(detectInstallBrowser("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe("ios");
    expect(detectInstallBrowser("Mozilla/5.0 (Linux; Android 14) Chrome/124.0")).toBe("chrome_android");
    expect(detectInstallBrowser("Mozilla/5.0 Firefox/123.0")).toBe("other");
  });
});
