import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getParticipantProgress } from "@/lib/publicProgress";
import { putCurrentParticipantFirst } from "@/lib/participantOrder";
import { shouldShowParticipant, type PublicParticipantStatus } from "@/lib/participantFilters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, CircleDotDashed, Search, Trophy, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

const statusAppearance = {
  eligible: {
    card: "border-amber-300 bg-amber-50",
    badge: "bg-amber-200 text-amber-950",
    label: "Em jogo",
    description: "Continua elegível para acertar os 6 jogos",
    icon: CircleDotDashed,
  },
  eliminated: {
    card: "border-red-300 bg-red-50",
    badge: "bg-red-200 text-red-950",
    label: "Eliminado",
    description: "Falhou pelo menos um resultado oficial",
    icon: XCircle,
  },
  winner: {
    card: "border-emerald-400 bg-emerald-50",
    badge: "bg-emerald-200 text-emerald-950",
    label: "Vencedor",
    description: "Acertou os 6 resultados",
    icon: Trophy,
  },
} as const;

function formatDeadline(deadline: Date | string) {
  return new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(deadline));
}

export default function PublicPredictions() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PublicParticipantStatus>("all");

  const { data: rounds, isLoading: roundsLoading } = trpc.rounds.list.useQuery();
  const { data: publicRound, isLoading: predictionsLoading } = trpc.predictions.getPublic.useQuery(
    { roundId: selectedRoundId || 0 },
    { enabled: selectedRoundId !== null },
  );

  useEffect(() => {
    if (!authLoading && !user) setLocation("/login");
  }, [authLoading, setLocation, user]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">A carregar...</div>;
  }

  if (!user) return null;

  const closedRounds = rounds?.filter(round => new Date(round.bettingDeadline) < new Date()) || [];
  const orderedParticipants = publicRound
    ? putCurrentParticipantFirst(publicRound.participants, user.id)
    : [];
  const participantCards = publicRound
    ? orderedParticipants.map(participant => ({ participant, progress: getParticipantProgress(publicRound.matches, participant.predictions) }))
    : [];
  const visibleParticipantCards = participantCards.filter(({ participant, progress }) => shouldShowParticipant(participant.name, progress.status, searchQuery, statusFilter));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-6 lg:p-8">
      <header className="max-w-7xl mx-auto mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Apostas Públicas</h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600">Acompanhamento acumulado após o fecho das apostas</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setLocation(user.role === "admin" ? "/admin" : "/dashboard")}
          className="border-slate-300 self-start sm:self-auto"
        >
          Voltar
        </Button>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-5 sm:gap-6">
        <aside>
          <Card className="border-slate-200/50 lg:sticky lg:top-4">
            <CardHeader>
              <CardTitle className="text-slate-900">Jornadas Fechadas</CardTitle>
              <CardDescription>Selecione uma jornada para acompanhar os palpites</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-72 overflow-y-auto">
              {roundsLoading ? (
                <>
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </>
              ) : closedRounds.length > 0 ? (
                closedRounds.map(round => (
                  <button
                    key={round.id}
                    onClick={() => setSelectedRoundId(round.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedRoundId === round.id
                        ? "border-blue-300 bg-blue-50 text-blue-900"
                        : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-semibold">Jornada {round.roundNumber}</div>
                    <div className="mt-1 text-xs text-slate-600">Prazo: {formatDeadline(round.bettingDeadline)}</div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-500">Nenhuma jornada fechada.</p>
              )}
            </CardContent>
          </Card>
        </aside>

        <section>
          {selectedRoundId === null ? (
            <Card className="border-slate-200/50">
              <CardContent className="py-16 text-center">
                <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Selecione uma jornada para ver o estado de cada apostador.</p>
              </CardContent>
            </Card>
          ) : predictionsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : publicRound ? (
            <div className="space-y-5">
              <Card className="border-slate-200/50">
                <CardHeader>
                  <CardTitle className="text-slate-900">Estado dos apostadores</CardTitle>
                  <CardDescription>
                    <span className="font-semibold text-amber-800">Amarelo</span> = continua em jogo; {" "}
                    <span className="font-semibold text-red-800">vermelho</span> = falhou um resultado; {" "}
                    <span className="font-semibold text-emerald-800">verde</span> = acertou os seis jogos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Procurar apostador" className="pl-9" /></div>
                  <div className="flex flex-wrap gap-2" aria-label="Filtrar apostadores por estado">
                    {(["all", "eligible", "eliminated", "winner"] as const).map(filter => {
                      const labels = { all: "Todos", eligible: "Em jogo", eliminated: "Eliminado", winner: "Vencedor" };
                      return <Button key={filter} size="sm" variant={statusFilter === filter ? "default" : "outline"} onClick={() => setStatusFilter(filter)} title={`Mostrar ${labels[filter].toLocaleLowerCase()}`}>{labels[filter]}</Button>;
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibleParticipantCards.map(({ participant, progress }) => {
                  const appearance = statusAppearance[progress.status];
                  const StatusIcon = appearance.icon;
                  const isCurrentParticipant = participant.id === user.id;

                  return (
                    <article key={participant.id} className={`rounded-xl border p-4 shadow-sm ${appearance.card} ${isCurrentParticipant ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-bold text-slate-900">{participant.name}</h2>{isCurrentParticipant && <Badge className="bg-blue-600 text-white" title="Este é o seu cartão de palpites">Os meus palpites</Badge>}</div>
                          <p className="mt-1 text-xs text-slate-600">{appearance.description}</p>
                        </div>
                        <Badge title={appearance.description} className={`shrink-0 ${appearance.badge}`}>
                          <StatusIcon className="mr-1 h-3.5 w-3.5" />
                          {appearance.label}
                        </Badge>
                      </div>

                      <div className="mt-4 grid gap-2">
                        {publicRound.matches.map(match => {
                          const prediction = participant.predictions.find(item => item.matchId === match.id)?.prediction ?? null;
                          const resultKnown = match.result !== null;
                          const correct = resultKnown && prediction === match.result;
                          const failed = resultKnown && !correct;
                          const cellClass = !resultKnown
                            ? "border-slate-200 bg-white/70 text-slate-600"
                            : correct
                              ? "border-emerald-200 bg-emerald-100 text-emerald-950"
                              : "border-red-200 bg-red-100 text-red-950";

                          return (
                            <div key={match.id} className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm ${cellClass}`}>
                              <span className="truncate">J{match.matchOrder}: {match.homeTeam} vs {match.awayTeam}</span>
                              <span className="shrink-0 font-bold" title={resultKnown ? `Resultado: ${match.result}` : "Resultado por confirmar"}>
                                {prediction ?? "—"}{resultKnown ? ` / ${match.result}` : ""}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 text-xs font-medium text-slate-700">
                        {progress.correctCount} acerto(s) em {progress.evaluatedCount} resultado(s) oficial(is)
                      </div>
                    </article>
                  );
                })}
              </div>

              {publicRound.participants.length === 0 && (
                <Card><CardContent className="py-10 text-center text-slate-600">Ainda não há participantes ativos.</CardContent></Card>
              )}
              {publicRound.participants.length > 0 && visibleParticipantCards.length === 0 && (
                <Card><CardContent className="py-10 text-center text-slate-600">Nenhum apostador encontrado com estes filtros.</CardContent></Card>
              )}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
