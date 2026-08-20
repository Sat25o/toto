import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, ChevronLeft, Megaphone, Pin } from "lucide-react";

export default function LeagueInfo() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: rules, isLoading: rulesLoading } = trpc.rules.list.useQuery(undefined, { enabled: Boolean(user) });
  const { data: messages, isLoading: messagesLoading } = trpc.messages.list.useQuery(undefined, { enabled: Boolean(user) });

  useEffect(() => {
    if (!authLoading && !user) setLocation("/login");
  }, [authLoading, setLocation, user]);

  if (authLoading || !user) return <div className="flex min-h-screen items-center justify-center text-slate-600">A carregar…</div>;

  return (
    <div className="league-page p-3 sm:p-5 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900"><BookOpen className="h-8 w-8 text-blue-600" /> Regras e avisos</h1>
            <p className="mt-1 text-slate-600">Informações importantes da Liga Toto Talho.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.role === "admin" && <Button variant="outline" onClick={() => setLocation("/league-management")} title="Gerir regras e mensagens"><Megaphone className="mr-2 h-4 w-4" /> Gerir</Button>}
            <Button variant="outline" onClick={() => setLocation("/dashboard")}><ChevronLeft className="mr-2 h-4 w-4" /> Dashboard</Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="border-blue-100 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-slate-900">Regras da Liga</CardTitle>
              <CardDescription>O cumprimento destas regras assegura uma competição justa para todos.</CardDescription>
            </CardHeader>
            <CardContent>
              {rulesLoading ? <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div> : rules && rules.length > 0 ? (
                <ol className="space-y-3">
                  {rules.map((rule, index) => (
                    <li key={rule.id} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{index + 1}</span>
                      <p className="pt-0.5 text-sm leading-6 text-slate-700">{rule.content}</p>
                    </li>
                  ))}
                </ol>
              ) : <p className="py-8 text-center text-slate-500">Ainda não foram publicadas regras.</p>}
            </CardContent>
          </Card>

          <Card className="border-amber-100 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900"><Megaphone className="h-5 w-5 text-amber-600" /> Avisos</CardTitle>
              <CardDescription>Mensagens publicadas pela administração.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {messagesLoading ? <><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></> : messages && messages.length > 0 ? messages.map(message => (
                <article key={message.id} className={`rounded-xl border p-4 ${message.isPinned ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
                  <div className="mb-2 flex items-start justify-between gap-2"><h2 className="font-semibold text-slate-900">{message.title}</h2>{message.isPinned && <Badge className="bg-amber-200 text-amber-900"><Pin className="mr-1 h-3 w-3" /> Fixado</Badge>}</div>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.content}</p>
                  <p className="mt-3 text-xs text-slate-500">{new Date(message.createdAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })}</p>
                </article>
              )) : <p className="py-8 text-center text-sm text-slate-500">Não existem avisos ativos.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
