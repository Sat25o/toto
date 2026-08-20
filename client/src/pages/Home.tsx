import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { SITE_EMBLEM_URL } from "@/lib/brandAssets";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      setLocation(user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [isAuthenticated, loading, setLocation, user]);

  if (loading || isAuthenticated) return <div className="league-page" />;

  return (
    <main className="league-page flex min-h-screen items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6 rounded-[2rem] border border-white/70 bg-white/70 p-7 shadow-[0_24px_55px_rgba(30,41,59,0.12)] backdrop-blur sm:p-9">
        <img
          src={SITE_EMBLEM_URL}
          alt="Emblema Liga Toto Talho"
          className="h-28 w-28 rounded-[1.75rem] border border-white/60 object-cover shadow-xl sm:h-32 sm:w-32"
        />
        <Button onClick={() => startLogin()} size="lg" className="bg-primary px-10 py-6 text-base text-primary-foreground shadow-lg shadow-red-900/20 hover:bg-primary/90">
          Entrar
        </Button>
      </div>
    </main>
  );
}
