import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getActivePublicMatches, getParticipantProgress } from "@/lib/publicProgress";
import { putCurrentParticipantFirst } from "@/lib/participantOrder";
import { shouldShowParticipant, type PublicParticipantStatus } from "@/lib/participantFilters";
import { summarizePublicRound } from "@/lib/publicRoundSummary";
import { toggleSummaryFilter } from "@/lib/summaryFilter";
import { findIdenticalPredictionGroups } from "@/lib/identicalPredictions";
import { openAllCopycatsDetails, toggleCopycatsDetail } from "@/lib/copycatsDetail";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, ChevronDown, ChevronUp, CircleDotDashed, Copy, Search, Trophy, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

const statusAppearance = {
  eligible: {
    card: "border-amber-300 bg-amber-50",
    badge: "bg-amber-200 text-amber-950",
    label: "Em jogo",
    description: "Continua elegível nos jogos válidos",
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
    description: "Acertou todos os jogos válidos",
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
  const [activeTab, setActiveTab] = useState<"apostadores" | "copycats">("apostadores");
  const [openCopycatsGroupKeys, setOpenCopycatsGroupKeys] = useState<string[]>([]);

  const { data: rounds, isLoading: roundsLoading } = trpc.rounds.list.useQuery();
  const { data: publicRound, isLoading: predictionsLoading } = trpc.predictions.getPublic.useQuery(
    { roundId: selectedRoundId || 0 },
    { enabled: selectedRoundId !== null },
  );

  useEffect(() => {
    if (!authLoading && !user) setLocation("/login");
  }, [authLoading, setLocation, user]);

  useEffect(() => {
    setOpenCopycatsGroupKeys([]);
  }, [selectedRoundId]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">A carregar...</div>;
  }

  if (!user) return null;

  const closedRounds = rounds?.filter(round => new Date(round.bettingDeadline) < new Date()) || [];
  const orderedParticipants = publicRound
    ? putCurrentParticipantFirst(publicRound.participants, user.id)
    : [];
  const participantCards = publicRound
    ? orderedParticipants.map(participant => ({ participant, progress: getParticipantProgress(publicRound.matches, participant.predictions, Number.POSITIVE_INFINITY, true) }))
    : [];
  const visibleParticipantCards = participantCards.filter(({ participant, progress }) => shouldShowParticipant(participant.name, progress.status, searchQuery, statusFilter));
  const publicSummary = summarizePublicRound(participantCards);
  const activeMatchIds = new Set(publicRound ? getActivePublicMatches(publicRound.matches).map(match => match.id) : []);
  const validMatchCount = publicRound ? activeMatchIds.size : 6;
  const identicalPredictionGroups = publicRound
    ? findIdenticalPredictionGroups(publicRound.matches, publicRound.participants)
    : [];

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
                    onClick={() => setSelectedRoundId(current => current === round.id ? null : round.id)}
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
            <Tabs value={activeTab} onValueChange={value => setActiveTab(value as "apostadores" | "copycats")} className="space-y-5">
              <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:min-w-96">
                <TabsTrigger value="apostadores">Apostadores</TabsTrigger>
                <TabsTrigger value="copycats"><Copy className="mr-2 h-4 w-4" />Copiaços</TabsTrigger>
              </TabsList>

              <TabsContent value="apostadores" className="mt-0 space-y-5">
              <Card className="border-slate-200/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-slate-900">Resumo da jornada</CardTitle>
                  <CardDescription>Toque num cartão para filtrar. Amarelo = em jogo; vermelho = eliminado; verde = vencedor.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Procurar apostador" className="pl-9" /></div>
                    <Button size="sm" variant="outline" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }} title="Limpar pesquisa e filtro">Todos</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setStatusFilter(current => toggleSummaryFilter(current, "eligible"))}
                    aria-pressed={statusFilter === "eligible"}
                    title="Filtrar participantes que continuam em jogo"
                    className={`rounded-lg border border-amber-200 bg-amber-50 p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${statusFilter === "eligible" ? "ring-2 ring-amber-500 ring-offset-2" : "hover:bg-amber-100"}`}
                  >
                    <div className="text-xs font-medium text-amber-800">Em jogo</div>
                    <div className="mt-1 text-2xl font-bold text-amber-950">{publicSummary.eligibleCount}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter(current => toggleSummaryFilter(current, "eliminated"))}
                    aria-pressed={statusFilter === "eliminated"}
                    title="Filtrar participantes eliminados"
                    className={`rounded-lg border border-red-200 bg-red-50 p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${statusFilter === "eliminated" ? "ring-2 ring-red-500 ring-offset-2" : "hover:bg-red-100"}`}
                  >
                    <div className="text-xs font-medium text-red-800">Eliminados</div>
                    <div className="mt-1 text-2xl font-bold text-red-950">{publicSummary.eliminatedCount}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter(current => toggleSummaryFilter(current, "winner"))}
                    aria-pressed={statusFilter === "winner"}
                    title="Filtrar participantes vencedores"
                    className={`col-span-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:col-span-1 ${statusFilter === "winner" ? "ring-2 ring-emerald-500 ring-offset-2" : "hover:bg-emerald-100"}`}
                  >
                    <div className="text-xs font-medium text-emerald-800">{publicSummary.winnerCount === 1 ? "Vencedor" : "Vencedores"}</div>
                    {publicSummary.winnerCount > 0 ? (
                      <div className="mt-1 text-sm font-bold text-emerald-950">{publicSummary.winnerNames.join(", ")}</div>
                    ) : (
                      <div className="mt-1 text-sm text-emerald-900">Ainda não há vencedor apurado</div>
                    )}
                  </button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibleParticipantCards.map(({ participant, progress }) => {
                  const appearance = statusAppearance[progress.status];
                  const StatusIcon = appearance.icon;
                  const isCurrentParticipant = participant.id === user.id;
                  const description = progress.eliminationReason === "incomplete_predictions"
                    ? `Não completou os ${validMatchCount} palpites válidos (${validMatchCount - progress.missingMatchIds.length}/${validMatchCount} preenchidos)`
                    : appearance.description;

                  return (
                    <article key={participant.id} className={`rounded-xl border p-4 shadow-sm ${appearance.card} ${isCurrentParticipant ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-bold text-slate-900">{participant.name}</h2>{isCurrentParticipant && <Badge className="bg-blue-600 text-white" title="Este é o seu cartão de palpites">Os meus palpites</Badge>}</div>
                          <p className="mt-1 text-xs text-slate-600">{description}</p>
                        </div>
                        <Badge title={description} className={`shrink-0 ${appearance.badge}`}>
                          <StatusIcon className="mr-1 h-3.5 w-3.5" />
                          {appearance.label}
                        </Badge>
                      </div>

                      <div className="mt-4 grid gap-2">
                        {publicRound.matches.map(match => {
                          const prediction = participant.predictions.find(item => item.matchId === match.id)?.prediction ?? null;
                          const isPostponed = match.isPostponed;
                          const isInactiveBackup = match.isBackup && !activeMatchIds.has(match.id);
                          const resultKnown = match.result !== null && !isPostponed;
                          const correct = resultKnown && prediction === match.result;
                          const failed = resultKnown && !correct;
                          const cellClass = isInactiveBackup
                            ? "border-amber-100 bg-amber-50/60 text-amber-900"
                            : isPostponed
                            ? "border-amber-200 bg-amber-50 text-amber-950"
                            : !resultKnown
                            ? "border-slate-200 bg-white/70 text-slate-600"
                            : correct
                              ? "border-emerald-200 bg-emerald-100 text-emerald-950"
                              : "border-red-200 bg-red-100 text-red-950";

                          return (
                            <div key={match.id} className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm ${cellClass}`}>
                              <span className="truncate">J{match.matchOrder}: {match.homeTeam} vs {match.awayTeam}</span>
                              <span className="shrink-0 font-bold" title={isPostponed ? "Jogo adiado/anulado — não conta para esta jornada" : resultKnown ? `Resultado: ${match.result}` : "Resultado por confirmar"}>
                                {isInactiveBackup ? "Suplente" : isPostponed ? "Adiado" : `${prediction ?? "—"}${resultKnown ? ` / ${match.result}` : ""}`}
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
              </TabsContent>

              <TabsContent value="copycats" className="mt-0">
                <Card className="border-violet-200 bg-violet-50/40">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-900"><Copy className="h-5 w-5 text-violet-700" /> Copiaços</CardTitle>
                    <CardDescription>Mostra apenas grupos com os mesmos palpites 1/X/2 nos seis jogos desta jornada.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {identicalPredictionGroups.length > 0 ? (
                      <>
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-slate-600">Pode manter vários grupos abertos para comparar os palpites.</p>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              title="Abrir os detalhes de todos os grupos de Copiaços"
                              onClick={() => setOpenCopycatsGroupKeys(openAllCopycatsDetails(identicalPredictionGroups.map(group => group.predictions.join("|"))))}
                            >
                              Abrir todos
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              title="Fechar os detalhes de todos os grupos de Copiaços"
                              onClick={() => setOpenCopycatsGroupKeys([])}
                              disabled={openCopycatsGroupKeys.length === 0}
                            >
                              Fechar todos
                            </Button>
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          {identicalPredictionGroups.map((group, index) => {
                            const groupKey = group.predictions.join("|");
                            const isOpen = openCopycatsGroupKeys.includes(groupKey);

                            return (
                              <article key={`${groupKey}-${index}`} className={`overflow-hidden rounded-xl border bg-white shadow-sm transition ${isOpen ? "border-violet-400 ring-2 ring-violet-200" : "border-violet-200"}`}>
                                <button
                                  type="button"
                                  onClick={() => setOpenCopycatsGroupKeys(current => toggleCopycatsDetail(current, groupKey))}
                                  aria-expanded={isOpen}
                                  className="flex w-full items-start justify-between gap-3 p-4 text-left transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-600"
                                >
                                  <div>
                                    <h2 className="font-bold text-slate-900">{group.participants.length} apostadores com o mesmo boletim</h2>
                                    <p className="mt-1 text-sm text-slate-600">{group.participants.map(participant => participant.name).join(", ")}</p>
                                    <p className="mt-2 text-xs font-medium text-violet-700">Toque para {isOpen ? "fechar" : "ver a aposta"}</p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                    <Badge className="bg-violet-100 text-violet-800">Iguais</Badge>
                                    {isOpen ? <ChevronUp className="h-5 w-5 text-violet-700" /> : <ChevronDown className="h-5 w-5 text-violet-700" />}
                                  </div>
                                </button>
                                {isOpen && (
                                  <div className="border-t border-violet-200 bg-violet-50/40 p-4">
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                      <div>
                                        <h3 className="font-bold text-slate-900">Aposta comum</h3>
                                        <p className="text-sm text-slate-600">{group.participants.map(participant => participant.name).join(", ")}</p>
                                      </div>
                                      <Badge className="w-fit bg-violet-100 text-violet-800">6 palpites iguais</Badge>
                                    </div>
                                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                      {publicRound.matches.map((match, matchIndex) => (
                                        <div key={match.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                                          <span className="min-w-0 text-sm font-medium text-slate-800">J{match.matchOrder}: {match.homeTeam} vs {match.awayTeam}</span>
                                          <span className="shrink-0 rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-sm font-bold text-violet-900">{group.predictions[matchIndex]}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </article>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="py-10 text-center">
                        <Copy className="mx-auto mb-3 h-10 w-10 text-violet-300" />
                        <p className="font-semibold text-slate-800">Não há boletins totalmente iguais nesta jornada.</p>
                        <p className="mt-1 text-sm text-slate-600">Só aparecem aqui participantes que tenham os seis palpites exatamente iguais.</p>
                      </div>
                    )}

                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : null}
        </section>
      </main>
    </div>
  );
}
