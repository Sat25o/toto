import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toggleRoundSelection } from "@/lib/roundSelection";
import { getHistoryPredictionTone } from "@/lib/historyPredictionTone";
import { orderRoundsMostRecentFirst } from "@/lib/roundOrdering";

export default function RoundHistory() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);

  const { data: rounds, isLoading: roundsLoading } = trpc.rounds.list.useQuery();
  const { data: roundData, isLoading: roundDataLoading } = trpc.rounds.getWithMatches.useQuery(
    { roundId: selectedRoundId || 0 },
    { enabled: selectedRoundId !== null },
  );
  const { data: allPredictions, isLoading: predictionsLoading } = trpc.predictions.getHistoryByRound.useQuery(
    { roundId: selectedRoundId || 0 },
    { enabled: selectedRoundId !== null },
  );

  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
  }, [authLoading, setLocation, user]);

  const completedRounds = rounds ? orderRoundsMostRecentFirst(rounds.filter(round => round.isSettled)) : [];
  const participants = useMemo(() => {
    const byId = new Map<number, string>();
    (allPredictions ?? []).forEach(entry => byId.set(entry.user.id, entry.user.name));
    return Array.from(byId, ([id, name]) => ({ id, name })).sort((first, second) => first.name.localeCompare(second.name, "pt-PT"));
  }, [allPredictions]);
  const predictionByParticipantAndMatch = useMemo(
    () =>
      new Map(
        (allPredictions ?? []).map(entry => [
          `${entry.user.id}:${entry.match.id}`,
          entry.prediction.prediction,
        ]),
      ),
    [allPredictions],
  );

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto mb-8 max-w-6xl">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Histórico de Jornadas</h1>
            <p className="text-slate-600">Palpites e resultados de todas as jornadas finalizadas</p>
          </div>
          <Button variant="outline" onClick={() => setLocation(user.role === "admin" ? "/admin" : "/dashboard")} className="border-slate-300">
            Voltar
          </Button>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Card className="sticky top-4 border-slate-200/50">
            <CardHeader><CardTitle className="text-slate-900">Jornadas Finalizadas</CardTitle><CardDescription>Selecione para ver os palpites</CardDescription></CardHeader>
            <CardContent className="max-h-96 space-y-2 overflow-y-auto">
              {roundsLoading ? <><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></> : completedRounds.length > 0 ? completedRounds.map(round => (
                <button key={round.id} onClick={() => setSelectedRoundId(currentRoundId => toggleRoundSelection(currentRoundId, round.id))} className={`w-full rounded-lg border p-3 text-left transition-all ${selectedRoundId === round.id ? "border-blue-300 bg-blue-50 text-blue-900" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}>
                  <div className="font-semibold">Jornada {round.roundNumber}</div>
                  <div className="text-sm text-slate-600">{new Date(round.bettingDeadline).toLocaleDateString("pt-PT")}</div>
                  <Badge className="mt-2 bg-yellow-100 text-xs text-yellow-800"><Trophy className="mr-1 h-3 w-3" /> Finalizada</Badge>
                </button>
              )) : <p className="text-sm text-slate-500">Nenhuma jornada finalizada</p>}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {selectedRoundId === null ? (
            <Card className="border-slate-200/50"><CardContent className="py-12 text-center"><Trophy className="mx-auto mb-4 h-12 w-12 text-slate-300" /><p className="text-slate-600">Selecione uma jornada para ver os palpites de todos os participantes</p></CardContent></Card>
          ) : roundDataLoading || predictionsLoading ? (
            <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-48 w-full" /></div>
          ) : roundData ? (
            <div className="space-y-4">
              <Card className="border-slate-200/50 bg-gradient-to-r from-blue-50 to-blue-100/50"><CardHeader><div className="flex items-center justify-between"><div><CardTitle className="text-slate-900">Jornada {roundData.round.roundNumber}</CardTitle>{roundData.round.prize && <CardDescription className="mt-1 font-semibold text-blue-700">Prémio: {roundData.round.prize}</CardDescription>}</div><Badge className="bg-yellow-100 text-yellow-800"><Trophy className="mr-1 h-4 w-4" /> Finalizada</Badge></div></CardHeader></Card>

              <Card className="border-yellow-200 bg-yellow-50"><CardContent className="pt-4">
                {roundData.winners.length > 0 ? <div className="space-y-1"><p className="flex items-center gap-2 font-semibold text-yellow-900"><Trophy className="h-4 w-4" /> Vencedores: {roundData.winners.map(winner => winner.userName).join(", ")}</p><p className="text-sm text-yellow-800">{roundData.winners.length} participante(s) acertaram todos os jogos válidos.</p>{roundData.winners[0]?.prizeShare && <p className="text-sm font-semibold text-yellow-900">Parte do prémio por vencedor: €{Number(roundData.winners[0].prizeShare).toFixed(2)}</p>}</div> : <p className="font-semibold text-yellow-900">Não houve vencedores nesta jornada.</p>}
              </CardContent></Card>

              <Card className="border-slate-200/50"><CardHeader><CardTitle className="text-base text-slate-900">Palpites dos apostadores</CardTitle><CardDescription>O resultado final aparece por baixo de cada jogo. Verde indica acerto e vermelho indica falha.</CardDescription></CardHeader><CardContent>
                {participants.length > 0 ? <div className="overflow-x-auto overscroll-x-contain"><table className="w-full min-w-[640px] text-sm"><thead><tr className="border-b border-slate-200 bg-slate-50"><th className="sticky left-0 z-20 w-44 min-w-44 border-r border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-600 shadow-[3px_0_8px_-6px_rgba(15,23,42,0.45)]">Jogo</th>{participants.map(participant => <th key={participant.id} className="px-3 py-3 text-center font-semibold text-slate-600">{participant.name}</th>)}</tr></thead><tbody>{roundData.matches.map(match => <tr key={match.id} className="border-b border-slate-100"><td className="sticky left-0 z-10 w-44 min-w-44 border-r border-slate-100 bg-white px-4 py-3 shadow-[3px_0_8px_-6px_rgba(15,23,42,0.45)]"><p className="font-medium text-slate-900">{match.homeTeam} vs {match.awayTeam}</p><p className="mt-1 text-xs text-slate-600">{match.isPostponed ? <span className="font-bold text-amber-800">Jogo adiado — não conta</span> : <>Resultado final: <span className="font-bold text-slate-900">{match.result ?? "—"}</span></>}</p></td>{participants.map(participant => { const prediction = predictionByParticipantAndMatch.get(`${participant.id}:${match.id}`); const tone = getHistoryPredictionTone(prediction, match.result, match.isPostponed); const toneClass = tone === "correct" ? "bg-green-100 text-green-800 ring-1 ring-green-200" : tone === "incorrect" ? "bg-red-100 text-red-800 ring-1 ring-red-200" : tone === "postponed" ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200" : "bg-slate-100 text-slate-500"; return <td key={participant.id} className="px-3 py-3 text-center"><span className={`inline-flex min-w-8 justify-center rounded-md px-2 py-1 font-semibold ${toneClass}`}>{tone === "postponed" ? "Adiado" : prediction ?? "—"}</span></td>; })}</tr>)}</tbody></table></div> : <p className="text-sm text-slate-600">Não existem palpites registados nesta jornada.</p>}
              </CardContent></Card>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
