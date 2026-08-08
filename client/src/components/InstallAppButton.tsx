import { useEffect, useState } from "react";
import { Download, Plus, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { detectInstallBrowser, shouldShowInstallInstructions } from "@/lib/pwaInstall";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function InstallAppButton({ className = "" }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [installed, setInstalled] = useState(false);
  const browser = detectInstallBrowser(window.navigator.userAgent);
  const samsungInternet = browser === "samsung";
  const iosDevice = browser === "ios";

  useEffect(() => {
    setInstalled(isStandalone());
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const prompt = deferredPrompt;
    if (shouldShowInstallInstructions(iosDevice, Boolean(prompt), samsungInternet)) {
      setShowInstallHelp(true);
      return;
    }
    if (!prompt) {
      setShowInstallHelp(true);
      return;
    }
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  if (installed) return null;

  return (
    <>
      <Button variant="outline" className={className} onClick={handleInstall} title="Adicionar a Liga Toto Talho como app web segura, sem descarregar APK">
        <Download className="mr-2 h-4 w-4" /> {samsungInternet ? "Adicionar ao ecrã inicial" : "Instalar app web"}
      </Button>
      <Dialog open={showInstallHelp} onOpenChange={setShowInstallHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Instalar a Liga Toto Talho</DialogTitle>
            <DialogDescription>Esta é uma app web segura. Não descarrega nem instala ficheiros APK.</DialogDescription>
          </DialogHeader>
          {samsungInternet ? (
            <ol className="space-y-3 text-sm text-slate-700">
              <li className="flex items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">1</span><span>No Samsung Internet, procure o ícone <strong>+</strong> junto à barra de endereço e toque nele.</span></li>
              <li className="flex items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">2</span><span>Escolha <strong>Ecrã inicial</strong>. Se não houver o ícone +, abra o menu do navegador e escolha <strong>Adicionar ao ecrã inicial</strong>.</span></li>
              <li className="flex items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">3</span><span>Não use <strong>Instalar mesmo assim</strong> no aviso do Play Protect; este atalho abre o site com segurança.</span></li>
            </ol>
          ) : iosDevice ? (
            <ol className="space-y-3 text-sm text-slate-700">
              <li className="flex items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">1</span><span>No Safari, toque em <strong className="inline-flex items-center gap-1"><Share className="h-4 w-4" /> Partilhar</strong>.</span></li>
              <li className="flex items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">2</span><span>Escolha <strong className="inline-flex items-center gap-1"><Plus className="h-4 w-4" /> Adicionar ao ecrã principal</strong>.</span></li>
              <li className="flex items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">3</span><span>Confirme em <strong>Adicionar</strong>.</span></li>
            </ol>
          ) : (
            <ol className="space-y-3 text-sm text-slate-700">
              <li className="flex items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">1</span><span>Abra a Liga Toto Talho no <strong>Chrome</strong>.</span></li>
              <li className="flex items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">2</span><span>Abra o menu <strong>⋮</strong> e escolha <strong>Instalar app</strong> ou <strong>Adicionar ao ecrã principal</strong>.</span></li>
              <li className="flex items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">3</span><span>Não descarregue nem aceite instalar aplicações APK.</span></li>
            </ol>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
