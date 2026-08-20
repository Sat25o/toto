import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowUp, Minus, Trophy, Medal, Radio } from "lucide-react";
import { sortCumulativeStandings } from "@/lib/standingsRanking";
import { STANDINGS_START_ROUND } from "@shared/league";

export default function Standings() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: standings, isLoading } = trpc.standings.list.useQuery();
  const { data: liveStandings, isLoading: isLiveLoading } = trpc.standings.live.useQuery(undefined, {
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  });
  const sortedStandings = sortCumulativeStandings(standings ?? []);
  const sortedLiveStandings = sortCumulativeStandings(liveStandings?.standings ?? []);
  const hasLiveResults = (liveStandings?.completedMatchCount ?? 0) > 0;

  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
  }, [authLoading, user, setLocation]);

  if (authLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  }

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-slate-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-orange-600" />;
      default:
        return <span className="font-semibold text-slate-400">{position + 1}º</span>;
    }
  };

  const getMovementIndicator = (entry: (typeof sortedStandings)[number]) => {
    if (entry.movement === "up") {
      return <span className="inline-flex items-center gap-1 font-semibold text-emerald-700" title={`Subiu ${entry.positionChange} posição(ões) desde a jornada anterior`}><ArrowUp className="h-4 w-4" />{entry.positionChange}</span>;
    }
    if (entry.movement === "down") {
      return <span className="inline-flex items-center gap-1 font-semibold text-red-700" title={`Desceu ${Math.abs(entry.positionChange)} posição(ões) desde a jornada anterior`}><ArrowDown className="h-4 w-4" />{Math.abs(entry.positionChange)}</span>;
    }
    return <span className="inline-flex items-center gap-1 text-slate-500" title={entry.previousPosition === null ? "Ainda não existe jornada anterior para comparar" : "Manteve a mesma posição"}><Minus className="h-4 w-4" />{entry.previousPosition === null ? "—" : "0"}</span>;
  };

  const renderMobileCards = (entries: typeof sortedStandings, isLive: boolean) => (
    <div className="divide-y divide-slate-100 md:hidden">
      {entries.map((entry, index) => {
        const isCurrentUser = user.id === entry.userId;
        return (
          <article key={entry.userId} className={`grid grid-cols-[2.5rem_minmax(0,1fr)_3.7rem] items-center gap-3 p-4 ${isCurrentUser ? "bg-red-50" : "bg-white"}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-sm">
              {getMedalIcon(index)}
            </div>
            <div className="min-w-0">
              <p className="break-words font-semibold leading-snug text-slate-900">
                {entry.userName || "Utilizador"}
                {isCurrentUser && <Badge className="ml-2 align-middle bg-primary/15 text-primary">Você</Badge>}
              </p>
              <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <span>Movimento</span>{getMovementIndicator(entry)}
              </div>
            </div>
            <div className="text-right">
              <div className={`ml-auto inline-flex h-10 min-w-10 items-center justify-center rounded-full px-2 font-bold ${isLive ? "bg-emerald-100 text-emerald-700" : "bg-primary/15 text-primary"}`}>
                {entry.correctCount}
              </div>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">Acertos</p>
            </div>
          </article>
        );
      })}
    </div>
  );

  const renderDesktopTable = (entries: typeof sortedStandings, isLive: boolean) => (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full">
        <thead>
          <tr className={`border-b ${isLive ? "border-emerald-100 bg-emerald-50/50" : "border-slate-200 bg-slate-50"}`}>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Posição</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Apostador</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Movimento</th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-slate-600">Acertos</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const isCurrentUser = user.id === entry.userId;
            return (
              <tr key={entry.userId} className={`border-b ${isLive ? "border-emerald-50" : "border-slate-100"} transition-colors ${isCurrentUser ? "bg-red-50" : isLive ? "hover:bg-emerald-50/50" : "hover:bg-red-50/30"}`}>
                <td className="px-6 py-4"><div className="flex items-center gap-3">{getMedalIcon(index)}</div></td>
                <td className="px-6 py-4"><div className="font-semibold text-slate-900">{entry.userName || "Utilizador"}{isCurrentUser && <Badge className="ml-2 bg-primary/15 text-primary">Você</Badge>}</div></td>
                <td className="px-4 py-4 text-center">{getMovementIndicator(entry)}</td>
                <td className="px-6 py-4 text-right"><div className={`inline-flex h-10 w-10 items-center justify-center rounded-full font-bold ${isLive ? "bg-emerald-100 text-emerald-700" : "bg-primary/15 text-primary"}`}>{entry.correctCount}</div></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="league-page p-3 sm:p-5 lg:p-8">
      <div className="league-header mx-auto mb-6 max-w-4xl sm:mb-8">
        <div className="league-header-content flex flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-red-200">Liga Toto Talho</p>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Classificação geral</h1>
            <p className="mt-1 text-sm text-slate-200 sm:text-base">Ranking de apostadores por acertos desde a Jornada {STANDINGS_START_ROUND}</p>
          </div>
          <Button variant="outline" onClick={() => setLocation(user.role === "admin" ? "/admin" : "/dashboard")} className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">Voltar</Button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="overflow-hidden border-emerald-200">
          <CardHeader className="border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-cyan-50">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="flex items-center gap-2 text-slate-900"><Radio className="h-5 w-5 text-emerald-600" /> Classificação em direto</CardTitle>
              <Badge className="bg-emerald-600 text-white">Provisória</Badge>
            </div>
            <CardDescription>
              {hasLiveResults
                ? `${liveStandings?.completedMatchCount} jogo(s) com resultado registado${liveStandings?.liveRoundNumbers?.length ? ` · Jornada${liveStandings.liveRoundNumbers.length > 1 ? "s" : ""} ${liveStandings.liveRoundNumbers.join(", ")}` : ""}`
                : "Aguarda os primeiros resultados das jornadas em curso. Atualiza automaticamente a cada 10 segundos."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLiveLoading ? <div className="space-y-2 p-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
              : hasLiveResults ? <>{renderMobileCards(sortedLiveStandings, true)}{renderDesktopTable(sortedLiveStandings, true)}</>
                : <div className="p-6 text-center text-sm text-slate-600">Quando o primeiro resultado for registado, o ranking provisório aparece aqui.</div>}
          </CardContent>
        </Card>

        <Card className="league-panel overflow-hidden">
          <CardHeader className="border-b border-red-100 bg-gradient-to-r from-red-50 to-rose-100/60">
            <CardTitle className="text-slate-900">Classificação oficial</CardTitle>
            <CardDescription>Total de acertos confirmados desde a Jornada {STANDINGS_START_ROUND}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? <div className="space-y-2 p-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
              : sortedStandings.length > 0 ? <>{renderMobileCards(sortedStandings, false)}{renderDesktopTable(sortedStandings, false)}</>
                : <div className="p-8 text-center"><Trophy className="mx-auto mb-4 h-12 w-12 text-slate-300" /><p className="text-slate-600">Nenhum dado de classificação disponível ainda</p></div>}
          </CardContent>
        </Card>

        <Card className="league-soft-red">
          <CardContent className="pt-6">
            <p className="text-sm text-red-950"><span className="font-semibold">Como funciona:</span> A classificação começa na Jornada {STANDINGS_START_ROUND}. A área em direto soma os resultados já registados, mas só a classificação oficial é confirmada no fecho da jornada. As setas comparam a posição com o ranking oficial antes da jornada em curso. Os acertos da Jornada 1 ficam apenas no Histórico.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
