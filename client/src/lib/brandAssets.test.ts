import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { APP_ICON_URL, SITE_EMBLEM_URL } from "./brandAssets";

describe("active brand assets", () => {
  it("keeps the approved emblem and Cristal app icon configured", async () => {
    expect(SITE_EMBLEM_URL).toBe("/manus-storage/liga-toto-talho-emblema_53687115.png");

    const manifestPath = fileURLToPath(new URL("../../public/manifest.webmanifest", import.meta.url));
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    expect(manifest.icons[0]?.src).toBe(APP_ICON_URL);
  });
});
