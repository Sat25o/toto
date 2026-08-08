export function shouldShowInstallInstructions(isIos: boolean, hasInstallPrompt: boolean, isSamsungInternet = false) {
  return isIos || isSamsungInternet || !hasInstallPrompt;
}
