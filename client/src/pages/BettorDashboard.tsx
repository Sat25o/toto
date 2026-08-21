import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { BookOpen, CheckCircle2, ChevronDown, Clock, Trophy, AlertCircle, Megaphone, Pin, ShieldCheck, Globe2, KeyRound, Medal, Coins, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { clearSelectedPrediction, selectPrediction, type PredictionChoice } from "@/lib/predictionSelection";
import { toggleRoundSelection } from "@/lib/roundSelection";
import { getPredictionProgress } from "@/lib/predictionProgress";
import { getDashboardMessages } from "@/lib/dashboardMessages";
import { getRoundPrizeLabel } from "@/lib/roundPrize";
import { orderRoundsMostRecentFirst } from "@/lib/roundOrdering";
import { getBettingCountdown } from "@/lib/bettingCountdown";
import { filterDashboardRounds, getNextOpenRound, type DashboardRoundFilter } from "@/lib/dashboardRoundFilter";
import { shouldAutoCollapseInitiallyOpenRound } from "@/lib/roundAutoCollapse";
import { toggleExpandedMessage } from "@/lib/expandableMessages";
import { SITE_EMBLEM_URL } from "@/lib/brandAssets";
import { hasSevenConfirmedPredictions } from "@/lib/roundCompletion";
import { InstallAppButton } from "@/components/InstallAppButton";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function BettorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [optimisticPredictions, setOptimisticPredictions] = useState<Record<number, PredictionChoice>>({});
  const [pendingMatchId, setPendingMatchId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [roundFilter, setRoundFilter] = useState<DashboardRoundFilter>("open");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [expandedMessageIds, setExpandedMessageIds] = useState<number[]>([]);
  const hasSelectedInitialOpenRound = useRef(false);
  const autoOpenedRoundId = useRef<number | null>(null);

  // Fetch rounds
  const { data: rounds, isLoading: roundsLoading } = trpc.rounds.list.useQuery();
  
  // Fetch current round with matches
  const { data: roundData, isLoading: roundDataLoading } = trpc.rounds.getWithMatches.useQuery(
    { roundId: selectedRoundId || 0 },
    { enabled: selectedRoundId !== null }
  );

  // Fetch user's predictions for the selected round
  const { data: predictions } = trpc.predictions.getByRound.useQuery(
    { roundId: selectedRoundId || 0 },
    { enabled: selectedRoundId !== null }
  );
  const { data: predictionProgressByRound } = trpc.predictions.getProgressByRound.useQuery(undefined, { enabled: Boolean(user) });
  const { data: adminMessages } = trpc.messages.list.useQuery(undefined, { enabled: Boolean(user) });

  const changeTemporaryPasswordMutation = trpc.auth.changeTemporaryPassword.useMutation({
    onSuccess: async () => {
      setNewPassword("");
      setConfirmNewPassword("");
      toast.success("Palavra-passe alterada com sucesso.");
      await utils.auth.me.invalidate();
    },
    onError: error => toast.error(error.message || "Não foi possível alterar a palavra-passe"),
  });

  // Submit prediction mutation
  const submitPredictionMutation = trpc.predictions.submit.useMutation({
    onSuccess: () => {
      toast.success("Palpite registado com sucesso!");
      if (selectedRoundId !== null) {
        void utils.predictions.getByRound.invalidate({ roundId: selectedRoundId });
      }
      void utils.predictions.getProgressByRound.invalidate();
    },
    onError: (error, variables) => {
      setOptimisticPredictions(current => clearSelectedPrediction(current, variables.matchId));
      toast.error(error.message || "Erro ao registar palpite");
    },
    onSettled: () => setPendingMatchId(null),
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [authLoading, setLocation, user]);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!rounds || hasSelectedInitialOpenRound.current) return;

    const initialOpenRound = getNextOpenRound(rounds, new Date());
    if (initialOpenRound) {
      autoOpenedRoundId.current = initialOpenRound.id;
      setSelectedRoundId(initialOpenRound.id);
    }
    hasSelectedInitialOpenRound.current = true;
  }, [rounds]);

  useEffect(() => {
    if (
      !shouldAutoCollapseInitiallyOpenRound({
        autoOpenedRoundId: autoOpenedRoundId.current,
        selectedRoundId,
        predictionCount: predictions?.length ?? 0,
        matchCount: roundData?.matches.length ?? 0,
      })
    ) {
      return;
    }

    autoOpenedRoundId.current = null;
    setSelectedRoundId(null);
  }, [predictions?.length, roundData?.matches.length, selectedRoundId]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    return null;
  }

  if (user.mustChangePassword) {
    const handlePasswordChange = (event: React.FormEvent) => {
      event.preventDefault();
      if (newPassword.length < 8) {
        toast.error("A nova palavra-passe deve ter pelo menos 8 caracteres.");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        toast.error("As palavras-passe não coincidem.");
        return;
      }
      changeTemporaryPasswordMutation.mutate({ password: newPassword });
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
        <Card className="mx-auto mt-12 max-w-md border-amber-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900"><KeyRound className="h-5 w-5 text-amber-700" /> Atualize a palavra-passe</CardTitle>
            <CardDescription>O administrador definiu uma palavra-passe provisória. Para continuar, escolha uma palavra-passe pessoal com pelo menos 8 caracteres.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handlePasswordChange}>
              <div>
                <Label htmlFor="new-password">Nova palavra-passe</Label>
                <Input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} className="mt-1" required />
              </div>
              <div>
                <Label htmlFor="confirm-new-password">Confirmar nova palavra-passe</Label>
                <Input id="confirm-new-password" type="password" autoComplete="new-password" value={confirmNewPassword} onChange={event => setConfirmNewPassword(event.target.value)} className="mt-1" required />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={changeTemporaryPasswordMutation.isPending}>
                {changeTemporaryPasswordMutation.isPending ? "A guardar…" : "Guardar nova palavra-passe"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleRoundSelection = (roundId: number) => {
    autoOpenedRoundId.current = null;
    const nextRoundId = toggleRoundSelection(selectedRoundId, roundId);
    // Reset synchronously while changing or closing a round, never after a prediction click.
    setOptimisticPredictions({});
    setPendingMatchId(null);
    setSelectedRoundId(nextRoundId);
  };

  const handleRoundFilter = (filter: Exclude<DashboardRoundFilter, "all">) => {
    setRoundFilter(filter);
    setSelectedRoundId(null);
  };

  const handlePredictionSubmit = (matchId: number, prediction: "1" | "X" | "2") => {
    if (isDeadlinePassed) return;
    setOptimisticPredictions(current => selectPrediction(current, matchId, prediction));
    setPendingMatchId(matchId);
    submitPredictionMutation.mutate({ matchId, prediction });
  };

  const isDeadlinePassed = roundData?.round && currentTime > new Date(roundData.round.bettingDeadline);
  const formatDeadline = (deadline: Date | string) =>
    new Intl.DateTimeFormat("pt-PT", { dateStyle: "full", timeStyle: "short" }).format(new Date(deadline));
  const predictionProgress = getPredictionProgress(
    predictions?.map(entry => entry.match.id) ?? [],
    optimisticPredictions,
    roundData?.matches.length ?? 6,
  );
  const dashboardMessages = getDashboardMessages(adminMessages ?? []);
  const orderedRounds = rounds ? orderRoundsMostRecentFirst(rounds) : [];
  const nextOpenRound = rounds ? getNextOpenRound(rounds, currentTime) : undefined;
  const dashboardCountdown = nextOpenRound ? getBettingCountdown(nextOpenRound.bettingDeadline, currentTime) : null;
  const visibleRounds = filterDashboardRounds(orderedRounds, roundFilter, currentTime);
  const progressByRoundId = new Map((predictionProgressByRound ?? []).map(progress => [progress.roundId, progress]));

  return (
    <div className="league-page p-3 sm:p-5 lg:p-8">
      {/* Header */}
      <div className="league-header mx-auto mb-6 max-w-6xl sm:mb-8">
        <div className="league-header-content flex flex-col items-start justify-between gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <img src={SITE_EMBLEM_URL} alt="Emblema da Liga Toto Talho" className="h-16 w-16 shrink-0 rounded-2xl border border-white/20 bg-slate-950 object-cover shadow-xl sm:h-20 sm:w-20" />
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-red-200">Liga Toto Talho</p>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">O teu boletim</h1>
              <p className="text-sm text-slate-200">Bem-vindo, {user.name}</p>
            </div>
          </div>
          <div className="league-nav hidden w-full max-w-full items-center gap-2 overflow-x-auto pb-1 lg:flex lg:w-auto lg:pb-0">
            {nextOpenRound && dashboardCountdown && (
              <div
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-white/15 bg-black/25 px-2.5 text-xs font-medium text-white"
                title={`Jornada ${nextOpenRound.roundNumber}: tempo até ao fecho das apostas`}
              >
                <Clock className="h-3.5 w-3.5 text-red-200" />
                <span className="text-slate-300">J{nextOpenRound.roundNumber}</span>
                <span className="font-mono font-bold tracking-wide">{dashboardCountdown.days}d {dashboardCountdown.hours}:{dashboardCountdown.minutes}:{dashboardCountdown.seconds}</span>
              </div>
            )}
            {user.role === "admin" && (
            <Button
              variant="outline"
              onClick={() => setLocation("/admin")}
              className="h-9 shrink-0 border-white/20 bg-white/10 px-3 text-xs text-white hover:bg-white/20 hover:text-white"
              title="Voltar ao painel de gestão da competição"
            >
                <ShieldCheck className="mr-2 h-4 w-4" /> Administração
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setLocation("/public-predictions")}
              className="h-9 shrink-0 border-white/20 bg-white/10 px-3 text-xs text-white hover:bg-white/20 hover:text-white"
              title="Consultar as apostas de todos os participantes após o fecho do prazo"
            >
              <Globe2 className="mr-2 h-4 w-4" /> Apostas Públicas
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/standings")}
              className="h-9 shrink-0 border-white/20 bg-white/10 px-3 text-xs text-white hover:bg-white/20 hover:text-white"
            >
              <Trophy className="mr-2 h-4 w-4" /> Classificação
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/champions-league")}
              className="h-9 shrink-0 border-white/20 bg-white/10 px-3 text-xs text-white hover:bg-white/20 hover:text-white"
              title="Consultar o formato e o calendário da Liga dos Campeões"
            >
              <Medal className="mr-2 h-4 w-4" /> Liga dos Campeões
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/rules")}
              className="h-9 shrink-0 border-white/20 bg-white/10 px-3 text-xs text-white hover:bg-white/20 hover:text-white"
              title="Consultar regras e avisos da Liga Toto Talho"
            >
              <BookOpen className="mr-2 h-4 w-4" /> Regras
            </Button>
            <InstallAppButton />
          </div>
          <div className="flex w-full flex-row-reverse items-center justify-between gap-2 lg:hidden">
            {nextOpenRound && dashboardCountdown ? (
              <div
                className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-white/15 bg-black/25 px-2.5 py-2 text-xs font-medium text-white"
                title={`Jornada ${nextOpenRound.roundNumber}: tempo até ao fecho das apostas`}
              >
                <Clock className="h-3.5 w-3.5 shrink-0 text-red-200" />
                <span className="shrink-0 text-slate-300">J{nextOpenRound.roundNumber}</span>
                <span className="truncate font-mono font-bold tracking-wide">{dashboardCountdown.days}d {dashboardCountdown.hours}:{dashboardCountdown.minutes}:{dashboardCountdown.seconds}</span>
              </div>
            ) : <div />}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0 border-white/25 bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/20 hover:text-white"
                  aria-label="Abrir menu de navegação"
                  title="Abrir menu"
                >
                  <Menu className="mr-1.5 h-5 w-5" /> Menu
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[86%] border-0 bg-slate-950 p-0 text-white sm:max-w-sm">
                <SheetHeader className="border-b border-white/10 bg-gradient-to-br from-red-700 to-red-900 px-5 py-6 text-left">
                  <SheetTitle className="text-lg text-white">Menu da Liga</SheetTitle>
                  <SheetDescription className="text-red-100">Atalhos para consultar e gerir a competição.</SheetDescription>
                </SheetHeader>
                <nav className="flex flex-1 flex-col gap-2 p-4" aria-label="Navegação do dashboard">
                  {user.role === "admin" && (
                    <SheetClose asChild>
                      <Button variant="outline" onClick={() => setLocation("/admin")} className="justify-start border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white" title="Abrir administração">
                        <ShieldCheck className="mr-3 h-4 w-4 text-red-200" /> Administração
                      </Button>
                    </SheetClose>
                  )}
                  <SheetClose asChild>
                    <Button variant="outline" onClick={() => setLocation("/public-predictions")} className="justify-start border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white" title="Consultar apostas públicas">
                      <Globe2 className="mr-3 h-4 w-4 text-red-200" /> Apostas Públicas
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button variant="outline" onClick={() => setLocation("/standings")} className="justify-start border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white" title="Consultar classificação">
                      <Trophy className="mr-3 h-4 w-4 text-red-200" /> Classificação
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button variant="outline" onClick={() => setLocation("/champions-league")} className="justify-start border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white" title="Consultar Liga dos Campeões">
                      <Medal className="mr-3 h-4 w-4 text-red-200" /> Liga dos Campeões
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button variant="outline" onClick={() => setLocation("/rules")} className="justify-start border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white" title="Consultar regras e avisos">
                      <BookOpen className="mr-3 h-4 w-4 text-red-200" /> Regras e avisos
                    </Button>
                  </SheetClose>
                  <div className="mt-2 border-t border-white/10 pt-4"><InstallAppButton /></div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Rounds List */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {dashboardMessages.length > 0 && (
          <section className="lg:col-span-3">
            <div className="mb-3 flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" /><h2 className="font-semibold text-slate-900">Avisos da administração</h2></div>
            <div className="grid gap-3">
              {dashboardMessages.map(message => {
                const isExpanded = expandedMessageIds.includes(message.id);
                return (
                  <Card key={message.id} className={message.isPinned ? "league-soft-red" : "league-panel"}>
                    <CardContent className="p-0 sm:p-4">
                      <button
                        type="button"
                        onClick={() => setExpandedMessageIds(current => toggleExpandedMessage(current, message.id))}
                        className="w-full p-4 text-left sm:hidden"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? "Fechar" : "Ler"} aviso: ${message.title}`}
                      >
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <p className="font-semibold text-slate-900">{message.title}</p>
                          <div className="flex shrink-0 items-center gap-2">
                            {message.isPinned && <Badge className="bg-amber-200 text-amber-900"><Pin className="mr-1 h-3 w-3" /> Fixado</Badge>}
                            <ChevronDown className={`h-4 w-4 text-primary transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </div>
                        </div>
                        <p className={`whitespace-pre-wrap text-sm leading-6 text-slate-700 ${isExpanded ? "" : "line-clamp-2"}`}>{message.content}</p>
                        <span className="mt-2 inline-flex items-center text-xs font-bold uppercase tracking-wide text-primary">{isExpanded ? "Fechar aviso" : "Ler aviso"}</span>
                      </button>
                      <div className="hidden sm:block">
                        <div className="mb-2 flex items-start justify-between gap-3"><p className="font-semibold text-slate-900">{message.title}</p>{message.isPinned && <Badge className="bg-amber-200 text-amber-900"><Pin className="mr-1 h-3 w-3" /> Fixado</Badge>}</div>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.content}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Rounds Sidebar */}
        <div className="lg:col-span-1">
          <Card className="league-panel sticky top-4">
            <CardHeader>
              <p className="league-label">Acompanha a época</p>
              <CardTitle className="text-slate-900">Jornadas</CardTitle>
              <CardDescription>Selecione uma jornada para apostar ou consultar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1" aria-label="Filtrar jornadas">
                {([
                  ["open", "Abertas"],
                  ["settled", "Finalizadas"],
                ] as const).map(([filter, label]) => (
                  <Button
                    key={filter}
                    type="button"
                    size="sm"
                    variant={roundFilter === filter ? "default" : "ghost"}
                    onClick={() => handleRoundFilter(filter)}
                    className={roundFilter === filter ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-slate-600 hover:bg-white"}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              {roundsLoading ? (
                <>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </>
              ) : visibleRounds.length > 0 ? (
                visibleRounds.map(round => {
                  const hasCompleteBet = !round.isSettled && hasSevenConfirmedPredictions(progressByRoundId.get(round.id));
                  return (
                    <button
                      key={round.id}
                      onClick={() => handleRoundSelection(round.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        hasCompleteBet
                          ? "border-emerald-400 bg-emerald-50 text-emerald-950 shadow-sm ring-1 ring-emerald-100 hover:border-emerald-500 hover:bg-emerald-100"
                          : selectedRoundId === round.id
                            ? "border-red-300 bg-red-50 text-red-950 shadow-sm"
                            : "border-slate-200 text-slate-700 hover:border-red-200 hover:bg-red-50/40"
                      }`}
                    >
                    {/** O montante usa prizeAmount e recupera a acumulação por carriedPrizeAmount se necessário. */}
                    {(() => {
                      const prizeLabel = getRoundPrizeLabel(round);
                      return (
                        <>
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold">Jornada {round.roundNumber}</div>
                      <Badge className="shrink-0 border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50">
                        <Coins className="mr-1 h-3.5 w-3.5" /> {prizeLabel}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-600">
                      Limite: {formatDeadline(round.bettingDeadline)}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-700">
                      <Coins className="h-3.5 w-3.5" /> Prémio acumulado: {prizeLabel}
                    </div>
                    {round.isSettled && (
                      <Badge className="mt-2 bg-green-100 text-green-800">Finalizada</Badge>
                    )}
                    {!round.isSettled && new Date(round.bettingDeadline) <= currentTime && (
                      <Badge className="mt-2 bg-red-100 text-red-800">Apostas encerradas</Badge>
                    )}
                    {hasCompleteBet && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-100 px-2 py-1.5 text-xs font-bold text-emerald-900">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>7 palpites confirmados</span>
                      </div>
                    )}
                        </>
                      );
                    })()}
                    </button>
                  );
                })
              ) : (
                <p className="text-slate-500 text-sm">Não existem jornadas neste filtro</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Matches & Predictions */}
        <div className="lg:col-span-2">
          {selectedRoundId === null ? (
            <Card className="league-panel">
              <CardContent className="pt-12 pb-12 text-center">
                <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Selecione uma jornada para começar</p>
              </CardContent>
            </Card>
          ) : roundDataLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : roundData ? (
            <div className="space-y-4">
              {/* Round Info */}
              {(() => {
                const prizeLabel = getRoundPrizeLabel(roundData.round);
                return (
              <Card className="league-soft-red">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-slate-900">Jornada {roundData.round.roundNumber}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-1 font-semibold text-emerald-700">
                        <Coins className="h-4 w-4" /> Prémio acumulado: {prizeLabel}
                      </CardDescription>
                    </div>
                    {isDeadlinePassed ? (
                      <Badge className="bg-red-100 text-red-800">Prazo Encerrado</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">Aberto</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4" />
                    Limite de aposta: {formatDeadline(roundData.round.bettingDeadline)}
                  </div>
                  <div className="mt-4 rounded-xl border border-red-100 bg-white/80 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">Os meus palpites</p>
                      <Badge className={predictionProgress.completed === predictionProgress.total ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                        {predictionProgress.completed}/{predictionProgress.total}
                      </Badge>
                    </div>
                    <Progress value={predictionProgress.percentage} className="h-2" />
                    <p className="mt-2 text-xs text-slate-600">
                      {predictionProgress.completed === predictionProgress.total ? "Palpites completos." : `Faltam ${predictionProgress.total - predictionProgress.completed} palpite(s) para concluir a jornada.`}
                    </p>
                  </div>
                </CardContent>
              </Card>
                );
              })()}

              {/* Deadline Warning */}
              {isDeadlinePassed && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-800">O prazo para apostas nesta jornada já passou.</p>
                  </CardContent>
                </Card>
              )}

              {/* Matches */}
              <div className="space-y-3">
                {roundData.matches.map((match) => {
                  const savedPrediction = predictions?.find(
                    (p) => p.match.id === match.id
                  )?.prediction.prediction;
                  const userPrediction = optimisticPredictions[match.id] ?? savedPrediction;

                  const backupIsActive = match.isBackup && roundData.matches.some(item => !item.isBackup && item.isPostponed);

                  return (
                    <Card key={match.id} className={`transition-all ${match.isBackup ? "border-amber-200 bg-amber-50/40 hover:border-amber-300" : "league-panel hover:border-red-200"}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-semibold ${match.isBackup ? "text-amber-800" : "text-slate-500"}`}>
                                {match.isBackup ? "Jogo suplente" : `Jogo ${match.matchOrder}`}
                              </span>
                              <div className="flex-1">
                                <p className="font-semibold text-slate-900">
                                  {match.homeTeam} vs {match.awayTeam}
                                </p>
                              </div>
                            </div>
                            {match.isBackup && (
                              <Badge className={backupIsActive ? "bg-amber-200 text-amber-950" : "bg-amber-100 text-amber-900"}>
                                {backupIsActive ? "Em uso" : "Reserva"}
                              </Badge>
                            )}
                          </div>
                          {match.isBackup && <p className="mb-3 text-xs text-amber-900">{backupIsActive ? "Há jogos principais adiados: este palpite passa a contar." : "Faça o palpite: só conta se houver jogos principais adiados."}</p>}
                          {match.result && (
                            <Badge className="bg-blue-100 text-blue-800 ml-2">
                              Resultado: {match.result}
                            </Badge>
                          )}
                        </div>

                        {/* Prediction Buttons */}
                        {!isDeadlinePassed && !match.result ? (
                          <div className="flex gap-2">
                            {["1", "X", "2"].map((pred) => (
                              <button
                                key={pred}
                                onClick={() => handlePredictionSubmit(match.id, pred as "1" | "X" | "2")}
                                disabled={pendingMatchId === match.id}
                                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                                  userPrediction === pred
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                              >
                                {pred}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-slate-100 rounded-lg p-3 text-center">
                            <p className="text-slate-600 text-sm">
                              Seu palpite: <span className="font-bold text-slate-900">{userPrediction || "—"}</span>
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
