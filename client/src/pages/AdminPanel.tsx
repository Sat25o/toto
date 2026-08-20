import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Clock3, Pencil, Plus, Save, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { createEmptyMatches, LIGA_BETCLIC_TEAMS, updateDraftMatch } from "@/lib/roundForm";
import { toggleRoundSelection } from "@/lib/roundSelection";
import { orderRoundsMostRecentFirst } from "@/lib/roundOrdering";
import { splitRoundParticipation } from "@/lib/roundParticipation";
import { InstallAppButton } from "@/components/InstallAppButton";

type MatchEditDraft = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  matchOrder: number;
};

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);

  // Fetch rounds
  const { data: rounds, isLoading: roundsLoading } = trpc.rounds.list.useQuery();

  // Fetch current round with matches
  const { data: roundData, isLoading: roundDataLoading, refetch: refetchRoundData } = trpc.rounds.getWithMatches.useQuery(
    { roundId: selectedRoundId || 0 },
    { enabled: selectedRoundId !== null }
  );
  const { data: participation } = trpc.rounds.getParticipation.useQuery(
    { roundId: selectedRoundId || 0 },
    { enabled: selectedRoundId !== null },
  );

  // Form states
  const [newRoundForm, setNewRoundForm] = useState({
    roundNumber: "",
    basePrizeAmount: "170",
    deadline: "",
    matches: createEmptyMatches(),
  });

  const [resultForm, setResultForm] = useState<Record<number, "1" | "X" | "2">>({});
  const [deadlineDraft, setDeadlineDraft] = useState("");
  const [matchDraft, setMatchDraft] = useState<MatchEditDraft[]>([]);

  // Create round mutation
  const createRoundMutation = trpc.rounds.create.useMutation({
    onSuccess: () => {
      toast.success("Jornada criada com sucesso!");
      setNewRoundForm({
        roundNumber: "",
        basePrizeAmount: "170",
        deadline: "",
        matches: createEmptyMatches(),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar jornada");
    },
  });

  // Update result mutation
  const updateResultMutation = trpc.matches.updateResult.useMutation({
    onSuccess: () => {
      toast.success("Resultado atualizado!");
      void refetchRoundData();
    },
    onError: (error) => {
      setResultForm({});
      toast.error(error.message || "Erro ao atualizar resultado");
    },
  });

  const updatePostponedMutation = trpc.matches.setPostponed.useMutation({
    onSuccess: (_, variables) => {
      toast.success(variables.isPostponed ? "Jogo marcado como adiado/anulado nesta jornada." : "Jogo voltou a contar para a jornada.");
      void refetchRoundData();
    },
    onError: error => toast.error(error.message || "Não foi possível atualizar o estado do jogo"),
  });

  const updateDeadlineMutation = trpc.rounds.updateDeadline.useMutation({
    onSuccess: () => {
      toast.success("Data e hora limite atualizadas.");
      void refetchRoundData();
      void utils.rounds.list.invalidate();
    },
    onError: error => toast.error(error.message || "Não foi possível atualizar o prazo"),
  });

  const updateMatchesMutation = trpc.rounds.updateMatches.useMutation({
    onSuccess: () => {
      toast.success("Jogos da jornada atualizados.");
      void refetchRoundData();
    },
    onError: error => toast.error(error.message || "Não foi possível atualizar os jogos"),
  });

  // Calculate winner mutation
  const calculateWinnerMutation = trpc.winner.calculate.useMutation({
    onSuccess: (data) => {
      if (data.winnerCount === 0) {
        toast.success(`Jornada fechada sem vencedores nos ${data.validMatchCount} jogo(s) válido(s). O prémio acumula para a próxima jornada.`);
      } else {
        const shareMessage = data.prizeShare === null ? "" : ` €${data.prizeShare.toFixed(2)} para cada vencedor.`;
        toast.success(`${data.winnerCount} vencedor(es) identificado(s).${shareMessage}`);
      }
      void refetchRoundData();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao calcular vencedor");
    },
  });

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const roundNumber = parseInt(newRoundForm.roundNumber);
      const basePrizeAmount = Number(newRoundForm.basePrizeAmount);
      const deadline = new Date(newRoundForm.deadline);

      if (isNaN(roundNumber) || roundNumber < 1 || roundNumber > 34) {
        toast.error("Número da jornada deve estar entre 1 e 34");
        return;
      }

      if (deadline <= new Date()) {
        toast.error("Prazo deve ser no futuro");
        return;
      }

      if (!Number.isFinite(basePrizeAmount) || basePrizeAmount <= 0 || basePrizeAmount > 10_000) {
        toast.error("Indique um valor base de prémio válido.");
        return;
      }

      const matches = newRoundForm.matches.map((m, i) => ({
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        matchOrder: i + 1,
      }));

      if (matches.some(m => !m.homeTeam || !m.awayTeam)) {
        toast.error("Todos os jogos devem ter equipa da casa e visitante");
        return;
      }

      createRoundMutation.mutate({
        roundNumber,
        basePrizeAmount,
        bettingDeadline: deadline,
        matches,
      });
    } catch (error) {
      toast.error("Erro ao processar formulário");
    }
  };

  const handleUpdateResult = (matchId: number, result: "1" | "X" | "2") => {
    updateResultMutation.mutate({ matchId, result });
    setResultForm(prev => ({ ...prev, [matchId]: result }));
  };

  const handlePostponedMatch = (matchId: number, isPostponed: boolean) => {
    updatePostponedMutation.mutate({ matchId, isPostponed });
  };

  const handleCalculateWinner = () => {
    if (!selectedRoundId) return;
    calculateWinnerMutation.mutate({ roundId: selectedRoundId });
  };

  useEffect(() => {
    if (!roundData?.round) {
      setDeadlineDraft("");
      setMatchDraft([]);
      return;
    }
    const deadline = new Date(roundData.round.bettingDeadline);
    const localDeadline = new Date(deadline.getTime() - deadline.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16);
    setDeadlineDraft(localDeadline);
    setMatchDraft(
      roundData.matches.map(match => ({
        id: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        matchOrder: match.matchOrder,
      })),
    );
  }, [roundData?.matches, roundData?.round?.bettingDeadline, selectedRoundId]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      setLocation("/");
    }
  }, [authLoading, setLocation, user]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const activeMatchesForSettlement = (() => {
    if (!roundData) return [];
    const mainMatches = roundData.matches.filter(match => !match.isBackup);
    const backupMatch = roundData.matches.find(match => match.isBackup);
    const activeMainMatches = mainMatches.filter(match => !match.isPostponed);
    const postponedMainCount = mainMatches.length - activeMainMatches.length;
    return postponedMainCount > 0 && backupMatch && !backupMatch.isPostponed ? [...activeMainMatches, backupMatch] : activeMainMatches;
  })();
  const resultsAreAvailable = Boolean(roundData && new Date() >= new Date(roundData.round.bettingDeadline));
  const resultsAvailableAt = roundData
    ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "full", timeStyle: "short" }).format(new Date(roundData.round.bettingDeadline))
    : "";

  const handleDeadlineUpdate = () => {
    if (!selectedRoundId || !deadlineDraft) return;
    const nextDeadline = new Date(deadlineDraft);
    if (Number.isNaN(nextDeadline.getTime()) || nextDeadline <= new Date()) {
      toast.error("Indique uma data e hora futuras.");
      return;
    }
    updateDeadlineMutation.mutate({ roundId: selectedRoundId, bettingDeadline: nextDeadline });
  };

  const handleMatchFieldChange = (matchId: number, field: "homeTeam" | "awayTeam", value: string) => {
    setMatchDraft(current => current.map(match => (match.id === matchId ? { ...match, [field]: value } : match)));
  };

  const handleMatchesUpdate = () => {
    const expectedMatchCount = roundData?.matches.length ?? 6;
    if (!selectedRoundId || matchDraft.length !== expectedMatchCount) return;
    if (matchDraft.some(match => !match.homeTeam.trim() || !match.awayTeam.trim())) {
      toast.error("Indique a equipa da casa e a equipa visitante em todos os jogos.");
      return;
    }
    updateMatchesMutation.mutate({
      roundId: selectedRoundId,
      matches: matchDraft.map(match => ({
        id: match.id,
        homeTeam: match.homeTeam.trim(),
        awayTeam: match.awayTeam.trim(),
      })),
    });
  };

  const totalMatches = roundData?.matches.length ?? 6;
  const orderedRounds = rounds ? orderRoundsMostRecentFirst(rounds) : [];
  const { completed: completedParticipants, pending: pendingParticipants } = splitRoundParticipation(participation ?? [], totalMatches);
  const totalPredictions = (participation ?? []).reduce((total, participant) => total + participant.predictionCount, 0);
  const matchEditingBlockedReason = !roundData
    ? null
    : roundData.round.isSettled
      ? "A jornada já foi fechada."
      : new Date(roundData.round.bettingDeadline) <= new Date()
        ? "O prazo de apostas já terminou."
        : totalPredictions > 0
          ? "Já existem palpites nesta jornada."
          : roundData.matches.some(match => match.result)
            ? "Já existem resultados oficiais nesta jornada."
            : null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Painel de Administração</h1>
            <p className="text-sm text-slate-600 sm:text-base">Gerencie jornadas, resultados e vencedores</p>
          </div>
          <nav aria-label="Ações de administração" className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setLocation("/dashboard")}
              className="h-11 w-full justify-center whitespace-normal border-slate-300 px-3 text-xs sm:h-10 sm:w-auto sm:text-sm"
              title="Submeter os seus próprios palpites como participante"
            >
              Os meus palpites
            </Button>
            <InstallAppButton className="h-11 w-full justify-center whitespace-normal border-slate-300 px-3 text-xs sm:h-10 sm:w-auto sm:text-sm" />
            <Button
              variant="outline"
              onClick={() => setLocation("/users")}
              className="h-11 w-full justify-center whitespace-normal border-slate-300 px-3 text-xs sm:h-10 sm:w-auto sm:text-sm"
              title="Gerir apostadores, estados de conta e convites"
            >
              Utilizadores
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/public-predictions")}
              className="h-11 w-full justify-center whitespace-normal border-slate-300 px-3 text-xs sm:h-10 sm:w-auto sm:text-sm"
              title="Consultar as apostas publicadas depois do fim do prazo"
            >
              Apostas públicas
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/league-management")}
              className="h-11 w-full justify-center whitespace-normal border-slate-300 px-3 text-xs sm:h-10 sm:w-auto sm:text-sm"
              title="Editar regras e publicar avisos no Dashboard"
            >
              Regras e avisos
            </Button>
          </nav>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white border border-slate-200">
            <TabsTrigger value="create">Criar Jornada</TabsTrigger>
            <TabsTrigger value="manage">Gerir Resultados</TabsTrigger>
          </TabsList>

          {/* Create Round Tab */}
          <TabsContent value="create" className="mt-6">
            <Card className="border-slate-200/50">
              <CardHeader>
                <CardTitle className="text-slate-900">Criar Nova Jornada</CardTitle>
                <CardDescription>Defina os seis jogos principais, o jogo suplente, prémio e prazo de apostas</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateRound} className="space-y-6">
                  {/* Round Number and Base Prize */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="roundNumber" className="text-slate-700">
                        Número da Jornada (1-34)
                      </Label>
                      <Input
                        id="roundNumber"
                        type="number"
                        min="1"
                        max="34"
                        value={newRoundForm.roundNumber}
                        onChange={(e) =>
                          setNewRoundForm({ ...newRoundForm, roundNumber: e.target.value })
                        }
                        className="mt-1 border-slate-300"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="basePrizeAmount" className="text-slate-700">
                        Valor base desta jornada (€)
                      </Label>
                      <Input
                        id="basePrizeAmount"
                        type="number"
                        min="0.01"
                        max="10000"
                        step="0.01"
                        inputMode="decimal"
                        value={newRoundForm.basePrizeAmount}
                        onChange={(e) =>
                          setNewRoundForm({ ...newRoundForm, basePrizeAmount: e.target.value })
                        }
                        className="mt-1 border-slate-300"
                        required
                      />
                      <p className="mt-1 text-xs text-slate-500">Sugestão: 170 €. Qualquer acumulado anterior é somado automaticamente.</p>
                    </div>
                  </div>

                  {/* Deadline */}
                  <div>
                    <Label htmlFor="deadline" className="text-slate-700">
                      Prazo de Apostas
                    </Label>
                    <Input
                      id="deadline"
                      type="datetime-local"
                      value={newRoundForm.deadline}
                      onChange={(e) =>
                        setNewRoundForm({ ...newRoundForm, deadline: e.target.value })
                      }
                      className="mt-1 border-slate-300"
                      required
                    />
                  </div>

                  {/* Matches */}
                  <div className="space-y-4">
                    <Label className="text-slate-700 font-semibold">6 jogos principais + 1 jogo suplente</Label>
                    <p className="text-sm text-slate-600">Nos seis jogos principais, escolha as equipas da Liga Betclic. O suplente aceita equipas de qualquer liga.</p>
                    {newRoundForm.matches.map((match, i) => (
                      <div key={i} className={`grid grid-cols-1 gap-3 rounded-lg border p-4 md:grid-cols-3 ${i === 6 ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
                        <div>
                          <Label className={`text-sm ${i === 6 ? "font-semibold text-amber-900" : "text-slate-600"}`}>{i === 6 ? "Jogo suplente - Casa" : `Jogo ${i + 1} - Casa`}</Label>
                          {i === 6 ? (
                            <Input
                              type="text"
                              placeholder="ex: Benfica"
                              value={match.homeTeam}
                              onChange={(e) =>
                                setNewRoundForm(current => ({
                                  ...current,
                                  matches: updateDraftMatch(current.matches, i, "homeTeam", e.target.value),
                                }))
                              }
                              className="mt-1 border-slate-300"
                              required
                            />
                          ) : (
                            <select
                              aria-label={`Jogo ${i + 1} - equipa da casa`}
                              value={match.homeTeam}
                              onChange={(e) => setNewRoundForm(current => ({ ...current, matches: updateDraftMatch(current.matches, i, "homeTeam", e.target.value) }))}
                              className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                              required
                            >
                              <option value="">Selecionar equipa</option>
                              {LIGA_BETCLIC_TEAMS.map(team => <option key={team} value={team}>{team}</option>)}
                            </select>
                          )}
                        </div>
                        <div className="flex items-end justify-center">
                          <span className="text-slate-600 font-semibold">vs</span>
                        </div>
                        <div>
                          <Label className={`text-sm ${i === 6 ? "font-semibold text-amber-900" : "text-slate-600"}`}>{i === 6 ? "Jogo suplente - Visitante" : "Visitante"}</Label>
                          {i === 6 ? (
                            <Input
                              type="text"
                              placeholder="ex: Porto"
                              value={match.awayTeam}
                              onChange={(e) =>
                                setNewRoundForm(current => ({
                                  ...current,
                                  matches: updateDraftMatch(current.matches, i, "awayTeam", e.target.value),
                                }))
                              }
                              className="mt-1 border-slate-300"
                              required
                            />
                          ) : (
                            <select
                              aria-label={`Jogo ${i + 1} - equipa visitante`}
                              value={match.awayTeam}
                              onChange={(e) => setNewRoundForm(current => ({ ...current, matches: updateDraftMatch(current.matches, i, "awayTeam", e.target.value) }))}
                              className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                              required
                            >
                              <option value="">Selecionar equipa</option>
                              {LIGA_BETCLIC_TEAMS.map(team => <option key={team} value={team}>{team}</option>)}
                            </select>
                          )}
                        </div>
                      </div>
                    ))}
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">O jogo suplente passa a contar se existir pelo menos um jogo principal adiado/anulado. Se houver mais adiamentos, a jornada fecha pelos restantes jogos válidos.</p>
                  </div>

                  <Button
                    type="submit"
                    disabled={createRoundMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Jornada
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Results Tab */}
          <TabsContent value="manage" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Rounds List */}
              <div className="lg:col-span-1">
                <Card className="border-slate-200/50 sticky top-4">
                  <CardHeader>
                    <CardTitle className="text-slate-900">Jornadas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                    {roundsLoading ? (
                      <>
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </>
                    ) : orderedRounds.length > 0 ? (
                      orderedRounds.map((round) => (
                        <button
                          key={round.id}
                          onClick={() => setSelectedRoundId(currentRoundId => toggleRoundSelection(currentRoundId, round.id))}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            selectedRoundId === round.id
                              ? "bg-blue-50 border-blue-300"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="font-semibold text-slate-900">Jornada {round.roundNumber}</div>
                          {round.isSettled && (
                            <div className="text-xs text-green-600 font-semibold mt-1">
                              ✓ Finalizada
                            </div>
                          )}
                        </button>
                      ))
                    ) : (
                      <p className="text-slate-500 text-sm">Nenhuma jornada criada</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Results Form */}
              <div className="lg:col-span-2">
                {selectedRoundId === null ? (
                  <Card className="border-slate-200/50">
                    <CardContent className="pt-12 pb-12 text-center">
                      <p className="text-slate-600">Selecione uma jornada para gerir resultados</p>
                    </CardContent>
                  </Card>
                ) : roundDataLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : roundData ? (
                  <div className="space-y-4">
                    <Card className="border-slate-200/50 bg-gradient-to-r from-blue-50 to-blue-100/50">
                      <CardHeader>
                        <CardTitle className="text-slate-900">Jornada {roundData.round.roundNumber}</CardTitle>
                      </CardHeader>
                    </Card>

                    <Card className="border-blue-200">
                      <CardHeader>
                        <CardTitle className="text-base text-slate-900">Data e hora limite das apostas</CardTitle>
                        <CardDescription>Altere o prazo enquanto a jornada estiver aberta. Os palpites passam a respeitar o novo limite imediatamente.</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="w-full flex-1">
                          <Label htmlFor="deadline-update">Novo prazo</Label>
                          <Input id="deadline-update" type="datetime-local" value={deadlineDraft} disabled={roundData.round.isSettled} onChange={event => setDeadlineDraft(event.target.value)} className="mt-1" />
                        </div>
                        <Button className="bg-blue-600 hover:bg-blue-700" disabled={roundData.round.isSettled || !deadlineDraft || updateDeadlineMutation.isPending} onClick={handleDeadlineUpdate} title="Guardar a nova data e hora limite">
                          {roundData.round.isSettled ? "Jornada fechada" : updateDeadlineMutation.isPending ? "A guardar…" : "Atualizar prazo"}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base text-slate-900"><Pencil className="h-4 w-4" /> Corrigir jogos da jornada</CardTitle>
                        <CardDescription>Corrija as equipas antes do prazo, desde que ainda não existam palpites nem resultados oficiais.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {matchEditingBlockedReason ? (
                          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Não é possível editar os jogos: {matchEditingBlockedReason}</p>
                        ) : (
                          <div className="space-y-4">
                            <div className="space-y-3">
                              {matchDraft.map(match => (
                                <div key={match.id} className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
                                  <div>
                                    <Label htmlFor={`edit-home-${match.id}`}>Jogo {match.matchOrder} · Casa</Label>
                                    <Input id={`edit-home-${match.id}`} value={match.homeTeam} onChange={event => handleMatchFieldChange(match.id, "homeTeam", event.target.value)} className="mt-1" />
                                  </div>
                                  <div>
                                    <Label htmlFor={`edit-away-${match.id}`}>Jogo {match.matchOrder} · Visitante</Label>
                                    <Input id={`edit-away-${match.id}`} value={match.awayTeam} onChange={event => handleMatchFieldChange(match.id, "awayTeam", event.target.value)} className="mt-1" />
                                  </div>
                                </div>
                              ))}
                            </div>
                            <Button type="button" onClick={handleMatchesUpdate} disabled={matchDraft.length !== totalMatches || updateMatchesMutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto">
                              <Save className="mr-2 h-4 w-4" />
                              {updateMatchesMutation.isPending ? "A guardar…" : "Guardar jogos"}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200/70">
                      <CardHeader>
                        <CardTitle className="text-base text-slate-900">Estado dos palpites</CardTitle>
                        <CardDescription>Participantes ativos: {participation?.length ?? 0}</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                          <p className="font-semibold text-emerald-900">Concluíram os {totalMatches}/{totalMatches} ({completedParticipants.length})</p>
                          {completedParticipants.length > 0 ? <div className="mt-2 space-y-1 text-sm text-emerald-800">{completedParticipants.map(participant => <p key={participant.userId}>{participant.userName} <span className="font-semibold">({participant.predictionCount}/{totalMatches})</span></p>)}</div> : <p className="mt-2 text-sm text-emerald-800">Ainda ninguém completou todos os palpites.</p>}
                        </div>
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <p className="font-semibold text-amber-900">Faltam completar ({pendingParticipants.length})</p>
                          {pendingParticipants.length > 0 ? <div className="mt-2 space-y-1 text-sm text-amber-800">{pendingParticipants.map(participant => <p key={participant.userId}>{participant.userName} <span className="font-semibold">({participant.predictionCount}/{totalMatches})</span></p>)}</div> : <p className="mt-2 text-sm text-amber-800">Todos os participantes completaram a jornada.</p>}
                        </div>
                      </CardContent>
                    </Card>

                    {resultsAreAvailable ? (
                      <>
                        {/* Matches Results */}
                        <div className="space-y-3">
                      {roundData.matches.map((match) => (
                        <Card key={match.id} className="border-slate-200/50">
                          <CardContent className="pt-4">
                            <div className="mb-4">
                              <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900">
                                {match.homeTeam} vs {match.awayTeam}
                              </p>
                              {match.isBackup && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">Jogo suplente</span>}
                              </div>
                              <p className="text-sm text-slate-600">{match.isBackup ? "Conta se houver jogos principais adiados" : `Jogo principal ${match.matchOrder}`}</p>
                            </div>

                            {roundData.round.isSettled && match.isPostponed ? (
                              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                <p className="font-semibold text-amber-900">Jogo adiado/anulado — não conta para esta jornada.</p>
                              </div>
                            ) : roundData.round.isSettled && match.result ? (
                              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                <p className="text-green-800 font-semibold">
                                  Resultado: <span className="text-lg">{match.result}</span>
                                </p>
                              </div>
                            ) : match.isPostponed ? (
                              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <p className="font-semibold text-amber-900">Jogo adiado/anulado nesta jornada</p>
                                    <p className="mt-1 text-sm text-amber-800">Não contará para acertos, vencedores nem classificação.</p>
                                  </div>
                                  <Button type="button" variant="outline" className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100" onClick={() => handlePostponedMatch(match.id, false)} disabled={updatePostponedMutation.isPending}>
                                    <Undo2 className="mr-2 h-4 w-4" /> Voltar a considerar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p className="mb-2 text-sm font-medium text-slate-700">{match.result ? `Resultado atual: ${match.result}. Toque numa opção para corrigir.` : "Selecione o resultado oficial."}</p>
                                <div className="flex gap-2">
                                  {["1", "X", "2"].map((result) => {
                                    const selectedResult = resultForm[match.id] ?? match.result;
                                    return <button
                                      key={result}
                                      onClick={() => handleUpdateResult(match.id, result as "1" | "X" | "2")}
                                      disabled={updateResultMutation.isPending}
                                      className={`flex-1 rounded-lg border-2 px-4 py-2 font-semibold transition-all ${selectedResult === result ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 hover:border-blue-400 hover:bg-blue-50"}`}
                                    >
                                      {result}
                                    </button>;
                                  })}
                                </div>
                                <Button type="button" variant="outline" className="mt-3 border-amber-300 text-amber-900 hover:bg-amber-50" onClick={() => handlePostponedMatch(match.id, true)} disabled={updatePostponedMutation.isPending}>
                                  <Clock3 className="mr-2 h-4 w-4" /> Marcar como adiado/anulado
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                        </div>

                        {/* Calculate Winner Button */}
                        {activeMatchesForSettlement.length > 0 && activeMatchesForSettlement.every(match => match.result) && !roundData.round.isSettled && (
                          <Button
                            onClick={handleCalculateWinner}
                            disabled={calculateWinnerMutation.isPending}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                          >
                            Calcular Vencedor
                          </Button>
                        )}
                      </>
                    ) : (
                      <Card className="border-blue-200 bg-blue-50/60">
                        <CardHeader>
                          <CardTitle className="text-base text-slate-900">Resultados bloqueados</CardTitle>
                          <CardDescription>Os jogos e os controlos 1 / X / 2 ficarão disponíveis quando fechar o prazo de apostas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm font-medium text-blue-900">Disponível a partir de {resultsAvailableAt}.</p>
                        </CardContent>
                      </Card>
                    )}

                    {roundData.round.isSettled && (
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="pt-4">
                          {roundData.winners.length > 0 ? (
                            <div className="space-y-1 text-green-800">
                              <p className="font-semibold">✓ {roundData.winners.length} vencedor(es) com todos os jogos válidos acertados</p>
                              <p className="text-sm">{roundData.winners.map(winner => winner.userName).join(", ")}</p>
                              {roundData.winners[0]?.prizeShare && (
                                <p className="text-sm font-semibold">Prémio por vencedor: €{Number(roundData.winners[0].prizeShare).toFixed(2)}</p>
                              )}
                            </div>
                          ) : (
                            <p className="font-semibold text-green-800">Jornada fechada sem vencedores. O prémio acumula para a jornada seguinte.</p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
