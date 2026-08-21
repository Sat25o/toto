import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { APP_ICON_URL, SITE_EMBLEM_URL } from "./brandAssets";

describe("active brand assets", () => {
  it("keeps the approved emblem and Cristal app icon configured", async () => {
    expect(SITE_EMBLEM_URL).toBe("/manus-storage/liga-toto-talho-emblema_53687115.png");
    expect(APP_ICON_URL).toBe("/manus-storage/liga-toto-talho-app-icon-cristal-android-v3-512_15ac75f7.png?v=pwa-cristal-v3");

    const manifestPath = fileURLToPath(new URL("../../public/manifest.webmanifest", import.meta.url));
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    expect(manifest.id).toBe("/liga-toto-talho-cristal-v3");
    expect(manifest.icons).toEqual([
      expect.objectContaining({
        src: "/manus-storage/liga-toto-talho-app-icon-cristal-android-v3-192_6d7d92d7.png?v=pwa-cristal-v3",
        sizes: "192x192",
        purpose: "any",
      }),
      expect.objectContaining({ src: APP_ICON_URL, sizes: "512x512", purpose: "any" }),
      expect.objectContaining({ src: APP_ICON_URL, sizes: "512x512", purpose: "maskable" }),
    ]);

    const indexPath = fileURLToPath(new URL("../../index.html", import.meta.url));
    const indexHtml = await readFile(indexPath, "utf8");
    expect(indexHtml).toContain('rel="apple-touch-icon" sizes="180x180" href="/manus-storage/liga-toto-talho-app-icon-cristal-android-v3-180_f1b29039.png?v=apple-cristal-v4"');
  });
});
