import { CirclePlus, Home, LockKeyhole, Menu, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export function SamsungInstallGuide() {
  const [, setLocation] = useLocation();

  return (
    <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 sm:p-8" aria-labelledby="samsung-guide-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <div className="mb-2 flex items-center gap-2 text-blue-700"><Smartphone className="h-5 w-5" /><span className="text-sm font-semibold">Guia Samsung</span></div>
          <h3 id="samsung-guide-title" className="text-xl font-bold text-slate-900 sm:text-2xl">Adicionar com segurança ao ecrã inicial</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">No Samsung Internet, crie um atalho web seguro. Não descarregue APK nem escolha “Instalar mesmo assim” no Play Protect.</p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/help")} className="self-start border-blue-200 text-blue-800 hover:bg-blue-100">Ver ajuda completa</Button>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-blue-100 bg-white p-4"><CirclePlus className="h-6 w-6 text-blue-600" /><div className="mt-3 font-semibold text-slate-900">1. Procure o +</div><p className="mt-1 text-sm text-slate-600">Toque no ícone + junto à barra de endereço.</p></div>
        <div className="rounded-xl border border-blue-100 bg-white p-4"><Home className="h-6 w-6 text-blue-600" /><div className="mt-3 font-semibold text-slate-900">2. Ecrã inicial</div><p className="mt-1 text-sm text-slate-600">Escolha “Ecrã inicial” para criar o atalho.</p></div>
        <div className="rounded-xl border border-blue-100 bg-white p-4"><Menu className="h-6 w-6 text-blue-600" /><div className="mt-3 font-semibold text-slate-900">3. Alternativa</div><p className="mt-1 text-sm text-slate-600">Sem o +, use o menu e “Adicionar ao ecrã inicial”.</p></div>
      </div>
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><div className="flex gap-2 font-semibold"><LockKeyhole className="h-5 w-5 shrink-0 text-amber-700" />Se aparecer “Esquema do ecrã inicial bloqueado”</div><p className="mt-2 leading-6">Abra <strong>Definições → Ecrã inicial</strong> e desative temporariamente <strong>Bloquear esquema do ecrã inicial</strong>. Depois volte ao Samsung Internet e tente adicionar novamente. Pode reativar o bloqueio no fim.</p></div>
      <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-800"><ShieldCheck className="h-4 w-4" />Atalho seguro pelo navegador, sem instalar aplicações Android externas.</div>
    </section>
  );
}
