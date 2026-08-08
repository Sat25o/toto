export type InstallBrowser = "samsung" | "ios" | "chrome_android" | "other";

export function detectInstallBrowser(userAgent: string): InstallBrowser {
  if (/SamsungBrowser/i.test(userAgent)) return "samsung";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  if (/Android/i.test(userAgent) && /Chrome|CriOS/i.test(userAgent)) return "chrome_android";
  return "other";
}

export function shouldShowInstallInstructions(isIos: boolean, hasInstallPrompt: boolean, isSamsungInternet = false) {
  return isIos || isSamsungInternet || !hasInstallPrompt;
}
