export function shouldShowInstallInstructions(isIos: boolean, hasInstallPrompt: boolean) {
  return isIos || !hasInstallPrompt;
}
