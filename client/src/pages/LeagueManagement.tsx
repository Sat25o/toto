import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BookOpen, ChevronLeft, Megaphone, Pencil, Pin, Plus, Save, Trash2 } from "lucide-react";

type EditingRule = { id: number; content: string; isActive: boolean } | null;
type EditingMessage = { id: number; title: string; content: string; isPinned: boolean; isActive: boolean } | null;

export default function LeagueManagement() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [newRule, setNewRule] = useState("");
  const [editingRule, setEditingRule] = useState<EditingRule>(null);
  const [newMessage, setNewMessage] = useState({ title: "", content: "", isPinned: false });
  const [editingMessage, setEditingMessage] = useState<EditingMessage>(null);

  const { data: rules, refetch: refetchRules } = trpc.rules.listAdmin.useQuery(undefined, { enabled: Boolean(user?.role === "admin") });
  const { data: messages, refetch: refetchMessages } = trpc.messages.listAdmin.useQuery(undefined, { enabled: Boolean(user?.role === "admin") });
  const refresh = () => { void refetchRules(); void refetchMessages(); };

  const createRule = trpc.rules.create.useMutation({ onSuccess: () => { setNewRule(""); refresh(); toast.success("Regra adicionada."); }, onError: error => toast.error(error.message) });
  const updateRule = trpc.rules.update.useMutation({ onSuccess: () => { setEditingRule(null); refresh(); toast.success("Regra atualizada."); }, onError: error => toast.error(error.message) });
  const deleteRule = trpc.rules.delete.useMutation({ onSuccess: () => { refresh(); toast.success("Regra removida."); }, onError: error => toast.error(error.message) });
  const createMessage = trpc.messages.create.useMutation({ onSuccess: () => { setNewMessage({ title: "", content: "", isPinned: false }); refresh(); toast.success("Mensagem publicada no Dashboard."); }, onError: error => toast.error(error.message) });
  const updateMessage = trpc.messages.update.useMutation({ onSuccess: () => { setEditingMessage(null); refresh(); toast.success("Mensagem atualizada."); }, onError: error => toast.error(error.message) });
  const deleteMessage = trpc.messages.delete.useMutation({ onSuccess: () => { refresh(); toast.success("Mensagem removida."); }, onError: error => toast.error(error.message) });

  useEffect(() => { if (!authLoading && (!user || user.role !== "admin")) setLocation("/login"); }, [authLoading, setLocation, user]);
  if (authLoading || !user || user.role !== "admin") return <div className="flex min-h-screen items-center justify-center text-slate-600">A carregar…</div>;

  return (
    <div className="league-page p-3 sm:p-5 lg:p-8">
      <header className="league-header mx-auto mb-6 flex max-w-6xl flex-col gap-4 p-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div><p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-red-200">Comunicação da Liga</p><h1 className="flex items-center gap-2 text-2xl font-bold text-white sm:text-3xl"><Megaphone className="h-7 w-7 text-red-200" /> Regras e mensagens</h1><p className="mt-1 text-slate-200">Edite regras e publique avisos no Dashboard dos apostadores.</p></div>
        <Button variant="outline" onClick={() => setLocation("/admin")} className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"><ChevronLeft className="mr-2 h-4 w-4" /> Painel</Button>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
        <section className="space-y-6">
          <Card className="league-panel"><CardHeader><CardTitle className="flex items-center gap-2 text-slate-900"><BookOpen className="h-5 w-5 text-primary" /> Regras da Liga</CardTitle><CardDescription>As regras ativas aparecem na página Regras e avisos.</CardDescription></CardHeader><CardContent className="space-y-4">
            <Textarea value={newRule} onChange={event => setNewRule(event.target.value)} placeholder="Escreva uma nova regra…" className="min-h-24" />
            <Button disabled={newRule.trim().length < 3 || createRule.isPending} onClick={() => createRule.mutate({ content: newRule })} className="w-full bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="mr-2 h-4 w-4" /> Adicionar regra</Button>
          </CardContent></Card>
          <div className="space-y-3">{rules?.map((rule, index) => editingRule?.id === rule.id ? (
            <Card key={rule.id} className="border-blue-200"><CardContent className="space-y-3 pt-5"><Textarea value={editingRule.content} onChange={event => setEditingRule({ ...editingRule, content: event.target.value })} /><label className="flex items-center justify-between text-sm text-slate-700">Regra visível <Switch checked={editingRule.isActive} onCheckedChange={isActive => setEditingRule({ ...editingRule, isActive })} /></label><div className="flex gap-2"><Button size="sm" onClick={() => updateRule.mutate(editingRule)}><Save className="mr-1 h-4 w-4" /> Guardar</Button><Button size="sm" variant="outline" onClick={() => setEditingRule(null)}>Cancelar</Button></div></CardContent></Card>
          ) : <Card key={rule.id} className={!rule.isActive ? "opacity-60" : ""}><CardContent className="flex gap-3 pt-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{index + 1}</span><p className="flex-1 text-sm leading-6 text-slate-700">{rule.content}</p><div className="flex h-fit gap-1"><Button size="icon" variant="ghost" title="Editar regra" onClick={() => setEditingRule({ id: rule.id, content: rule.content, isActive: rule.isActive })}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" title="Apagar regra" onClick={() => window.confirm("Apagar esta regra?") && deleteRule.mutate({ id: rule.id })}><Trash2 className="h-4 w-4" /></Button></div></CardContent></Card>)}</div>
        </section>

        <section className="space-y-6">
          <Card className="border-amber-100"><CardHeader><CardTitle className="flex items-center gap-2 text-slate-900"><Megaphone className="h-5 w-5 text-amber-600" /> Publicar aviso</CardTitle><CardDescription>Os avisos ficam visíveis diretamente no Dashboard dos apostadores.</CardDescription></CardHeader><CardContent className="space-y-4"><div><Label htmlFor="message-title">Título</Label><Input id="message-title" value={newMessage.title} onChange={event => setNewMessage({ ...newMessage, title: event.target.value })} placeholder="Ex.: Pagamento da Jornada 2" className="mt-1" /></div><div><Label htmlFor="message-content">Mensagem</Label><Textarea id="message-content" value={newMessage.content} onChange={event => setNewMessage({ ...newMessage, content: event.target.value })} placeholder="Escreva o aviso para os apostadores…" className="mt-1 min-h-28" /></div><label className="flex items-center justify-between text-sm text-slate-700">Fixar no topo do Dashboard <Switch checked={newMessage.isPinned} onCheckedChange={isPinned => setNewMessage({ ...newMessage, isPinned })} /></label><Button className="w-full bg-amber-600 hover:bg-amber-700" disabled={newMessage.title.trim().length < 3 || newMessage.content.trim().length < 3 || createMessage.isPending} onClick={() => createMessage.mutate(newMessage)}><Megaphone className="mr-2 h-4 w-4" /> Publicar mensagem</Button></CardContent></Card>
          <div className="space-y-3">{messages?.map(message => editingMessage?.id === message.id ? (
            <Card key={message.id} className="border-amber-200"><CardContent className="space-y-3 pt-5"><Input value={editingMessage.title} onChange={event => setEditingMessage({ ...editingMessage, title: event.target.value })} /><Textarea value={editingMessage.content} onChange={event => setEditingMessage({ ...editingMessage, content: event.target.value })} /><label className="flex items-center justify-between text-sm text-slate-700">Fixada <Switch checked={editingMessage.isPinned} onCheckedChange={isPinned => setEditingMessage({ ...editingMessage, isPinned })} /></label><label className="flex items-center justify-between text-sm text-slate-700">Visível <Switch checked={editingMessage.isActive} onCheckedChange={isActive => setEditingMessage({ ...editingMessage, isActive })} /></label><div className="flex gap-2"><Button size="sm" onClick={() => updateMessage.mutate(editingMessage)}><Save className="mr-1 h-4 w-4" /> Guardar</Button><Button size="sm" variant="outline" onClick={() => setEditingMessage(null)}>Cancelar</Button></div></CardContent></Card>
          ) : <Card key={message.id} className={!message.isActive ? "opacity-60" : message.isPinned ? "border-amber-200 bg-amber-50" : ""}><CardContent className="pt-4"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-900">{message.title}</p>{message.isPinned && <Badge className="bg-amber-200 text-amber-900"><Pin className="mr-1 h-3 w-3" /> Fixada</Badge>}{!message.isActive && <Badge className="bg-slate-200 text-slate-700">Oculta</Badge>}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.content}</p></div><div className="flex gap-1"><Button size="icon" variant="ghost" title="Editar mensagem" onClick={() => setEditingMessage({ id: message.id, title: message.title, content: message.content, isPinned: message.isPinned, isActive: message.isActive })}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" title="Apagar mensagem" onClick={() => window.confirm("Apagar esta mensagem?") && deleteMessage.mutate({ id: message.id })}><Trash2 className="h-4 w-4" /></Button></div></div></CardContent></Card>)}</div>
        </section>
      </main>
    </div>
  );
}
