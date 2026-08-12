import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import { useAuth } from "./_core/hooks/useAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BettorDashboard from "./pages/BettorDashboard";
import AdminPanel from "./pages/AdminPanel";
import Standings from "./pages/Standings";
import RoundHistory from "./pages/RoundHistory";
import UsersManagement from "./pages/UsersManagement";
import PublicPredictions from "./pages/PublicPredictions";
import LeagueInfo from "./pages/LeagueInfo";
import LeagueManagement from "./pages/LeagueManagement";
import Help from "./pages/Help";

function Router() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user?.mustChangePassword && location !== "/dashboard") {
      setLocation("/dashboard");
    }
  }, [loading, location, setLocation, user?.mustChangePassword]);

  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
      <Route path={"/dashboard"} component={BettorDashboard} />
      <Route path={"/admin"} component={AdminPanel} />
      <Route path={"/standings"} component={Standings} />
      <Route path={"/history"} component={RoundHistory} />
      <Route path={"/users"} component={UsersManagement} />
      <Route path={"/public-predictions"} component={PublicPredictions} />
      <Route path={"/rules"} component={LeagueInfo} />
      <Route path={"/league-management"} component={LeagueManagement} />
      <Route path={"/help"} component={Help} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
