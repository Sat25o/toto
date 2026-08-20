import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CheckCircle2, Info, Medal, Swords, Trophy } from "lucide-react";
import { CHAMPIONS_LEAGUE_FORMAT, CHAMPIONS_LEAGUE_STAGES, getChampionsPairing } from "@/lib/championsLeagueFormat";
import { trpc } from "@/lib/trpc";

const BRACKET_STAGES = [
  { id: "round_of_16", title: "Oitavos", subtitle: "Jornada 14" },
  { id: "quarter_final", title: "Quartos", subtitle: "Jornada 15" },
  { id: "semi_final", title: "Meias", subtitle: "Jornada 16" },
  { id: "final", title: "Final", subtitle: "Jornada 17" },
] as const;

export default function ChampionsLeague() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: bracket, isLoading: bracketLoading } = trpc.championsLeague.getBracket.useQuery(undefined, { enabled: Boolean(user) });
  const isBracketGenerated = Boolean(bracket?.entries.length);

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [loading, setLocation, user]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-slate-600">A carregar…</div>;
  }

  return (
    <div className="league-page p-3 sm:p-5 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="league-header mb-6 flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
          <div>
            <div className="mb-2 flex items-center gap-2"><Medal className="h-6 w-6 text-red-200" /><Badge className="border border-white/20 bg-white/10 text-white">Competição especial</Badge></div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Liga dos Campeões</h1>
            <p className="mt-1 text-slate-200">Eliminatórias entre os 16 melhores da Liga Toto Talho.</p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/dashboard")} title="Voltar ao Dashboard" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">Voltar ao Dashboard</Button>
        </div>

        <Card className="mb-6 overflow-hidden border-amber-200 bg-gradient-to-r from-amber-50 to-white shadow-sm">
          <CardContent className="grid gap-5 p-5 sm:grid-cols-3 sm:p-6">
            <div><p className="text-sm font-medium text-amber-800">Apuramento</p><p className="mt-1 text-2xl font-bold text-slate-900">Top {CHAMPIONS_LEAGUE_FORMAT.qualifiedParticipants}</p><p className="text-sm text-slate-600">Após a Jornada {CHAMPIONS_LEAGUE_FORMAT.qualificationEndRound}</p></div>
            <div><p className="text-sm font-medium text-amber-800">Primeiro confronto</p><p className="mt-1 text-2xl font-bold text-slate-900">Jornada 14</p><p className="text-sm text-slate-600">Oitavos de final</p></div>
            <div><p className="text-sm font-medium text-amber-800">Objetivo</p><p className="mt-1 text-2xl font-bold text-slate-900">Jornada {CHAMPIONS_LEAGUE_FORMAT.finalRound}</p><p className="text-sm text-slate-600">Final perto do Natal</p></div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-amber-200/90 shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-900"><Trophy className="h-5 w-5 text-amber-600" /> Quadro da Liga dos Campeões</CardTitle>
                <CardDescription>{isBracketGenerated ? "Os 16 qualificados e os confrontos foram gerados automaticamente após a Jornada 13." : "O quadro será criado automaticamente quando a Jornada 13 for finalizada."}</CardDescription>
              </div>
              <Badge className={isBracketGenerated ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}>{isBracketGenerated ? "Quadro oficial" : "A aguardar apuramento"}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {bracketLoading ? (
              <p className="text-sm text-slate-600">A carregar o quadro…</p>
            ) : isBracketGenerated ? (
              <>
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                  <p className="mb-3 text-sm font-semibold text-amber-900">16 qualificados da Classificação Geral</p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {bracket?.entries.map(entry => <div key={entry.id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">{entry.seed}</span><span className="min-w-0 truncate font-medium text-slate-800">{entry.userName}</span><span className="ml-auto text-xs text-slate-500">{entry.qualificationScore}</span></div>)}
                  </div>
                </div>
                <div className="grid gap-4 xl:grid-cols-4">
                  {BRACKET_STAGES.map(stage => {
                    const fixtures = bracket?.matches.filter(match => match.stage === stage.id) ?? [];
                    return <div key={stage.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"><div className="mb-3"><p className="font-semibold text-slate-900">{stage.title}</p><p className="text-xs text-slate-500">{stage.subtitle}</p></div><div className="space-y-3">{fixtures.map(fixture => <div key={fixture.id} className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm"><div className="flex items-center justify-between gap-2 text-sm"><span className="truncate font-medium text-slate-800">{fixture.homeEntry ? `${fixture.homeEntry.seed}. ${fixture.homeEntry.userName}` : "A definir"}</span><span className="text-xs text-slate-400">vs</span></div><div className="my-1.5 border-t border-slate-100" /><div className="flex items-center justify-between gap-2 text-sm"><span className="truncate font-medium text-slate-800">{fixture.awayEntry ? `${fixture.awayEntry.seed}. ${fixture.awayEntry.userName}` : "A definir"}</span><span className="text-xs text-slate-400">J{fixture.roundNumber}</span></div></div>)}</div></div>;
                  })}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600"><p className="font-semibold text-slate-800">Apuramento ainda em curso</p><p className="mt-1">Quando os resultados da Jornada {CHAMPIONS_LEAGUE_FORMAT.qualificationEndRound} forem fechados, a aplicação guarda automaticamente os 16 melhores e gera os oito confrontos dos oitavos de final.</p></div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-slate-200/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900"><Swords className="h-5 w-5 text-amber-600" /> Como funciona</CardTitle>
              <CardDescription>A Classificação Geral continua independente desta competição especial.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 text-sm leading-6 text-slate-700">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="font-semibold text-slate-900">1. Apuramento</p><p className="mt-1">No fim da Jornada {CHAMPIONS_LEAGUE_FORMAT.qualificationEndRound}, os {CHAMPIONS_LEAGUE_FORMAT.qualifiedParticipants} melhores da Classificação Geral, que começou na Jornada {CHAMPIONS_LEAGUE_FORMAT.qualificationStartRound}, garantem entrada na Liga dos Campeões.</p></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="font-semibold text-slate-900">2. Confrontos</p><p className="mt-1">Os emparelhamentos respeitam o ranking: {getChampionsPairing(1)}, {getChampionsPairing(2)} e assim sucessivamente até {getChampionsPairing(8)}.</p></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="font-semibold text-slate-900">3. Quem avança</p><p className="mt-1">Em cada eliminatória, passa quem tiver mais acertos nos seis jogos da jornada correspondente. Se houver empate, avança quem tinha melhor posição na Classificação Geral no início dessa eliminatória.</p></div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="flex items-center gap-2 font-semibold text-amber-900"><Info className="h-4 w-4" /> Transparência</p><p className="mt-1 text-amber-900/80">O quadro será criado uma única vez a partir da Classificação Geral fechada na Jornada 13. Assim, os participantes e emparelhamentos iniciais ficam registados e consultáveis por todos.</p></div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900"><CalendarDays className="h-5 w-5 text-amber-600" /> Calendário proposto</CardTitle>
              <CardDescription>Quatro jornadas de eliminatórias para chegar ao campeão perto do Natal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {CHAMPIONS_LEAGUE_STAGES.map((stage, index) => (
                <div key={stage.roundNumber} className="flex gap-3 rounded-xl border border-slate-200 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800">{index + 1}</div>
                  <div className="min-w-0"><p className="font-semibold text-slate-900">Jornada {stage.roundNumber} · {stage.title}</p><p className="text-sm text-slate-600">{stage.participants} participantes · {stage.ties} {stage.ties === 1 ? "confronto" : "confrontos"}</p></div>
                  {stage.ties === 1 && <Trophy className="ml-auto h-5 w-5 shrink-0 text-amber-500" />}
                </div>
              ))}
              <div className="flex items-start gap-2 pt-2 text-xs leading-5 text-slate-500"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> As jornadas poderão ser reajustadas se o calendário oficial da Liga Portugal alterar as datas previstas.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
