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

  if (loading || isAuthenticated) return <div className="min-h-screen bg-slate-50" />;

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6">
        <img
          src={SITE_EMBLEM_URL}
          alt="Emblema Liga Toto Talho"
          className="h-24 w-24 rounded-2xl object-cover shadow-lg sm:h-28 sm:w-28"
        />
        <Button onClick={() => startLogin()} size="lg" className="bg-blue-600 px-10 py-6 text-base text-white hover:bg-blue-700">
          Entrar
        </Button>
      </div>
    </main>
  );
}
