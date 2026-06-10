"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import dynamic from "next/dynamic";
import { SiteHeader } from "@/components/site-header";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth-provider";

const LetterGlitch = dynamic(() => import("@/components/letter-glitch"), { ssr: false });

function TerminalIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" x2="20" y1="19" y2="19" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isDark = theme === "dark";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  const handleDiscordLogin = () => {
    window.location.href = "/api/auth/discord";
  };

  return (
    <div className="relative min-h-screen bg-background">
      <SiteHeader />
      <div className="absolute inset-0 z-0">
        <LetterGlitch
          glitchColors={["#dc2626", "#7f1d1d", "#450a0a"]}
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={true}
          smooth={true}
          backgroundColor={isDark ? "#000000" : "#ffffff"}
        />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 pt-14">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <Link href="/" className="flex items-baseline justify-center gap-1">
              <span className="font-favela text-3xl text-foreground">Favela</span>
              <span className="font-archive text-lg text-primary">Archive</span>
            </Link>
          </div>

          <div className="rounded-lg border border-border/20 bg-background/90 backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b border-border/20 bg-background/40 px-4 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted" />
              <span className="font-mono ml-2 text-xs text-muted-foreground">login.sh</span>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <p className="font-mono text-xs text-primary">
                <TerminalIcon className="mr-1 inline h-3 w-3" /> $ ./login.sh
              </p>
              <h1 className="font-display text-3xl">Entrar</h1>

              {error && (
                <div className="font-mono rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleDiscordLogin}
                className="font-mono flex w-full items-center justify-center gap-2 rounded-md border border-border bg-[#5865F2] py-2.5 text-sm text-white transition-colors hover:bg-[#4752C4]"
              >
                <DiscordIcon className="h-5 w-5" />
                Entrar com Discord
              </button>

              {/* <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background/90 px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <label className="block">
                <span className="font-mono text-xs text-muted-foreground">
                  <span className="text-primary">&gt;</span> email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@quebrada.dev"
                  required
                  autoComplete="email"
                  className="font-mono mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="font-mono text-xs text-muted-foreground">
                  <span className="text-primary">&gt;</span> senha
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="font-mono mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="font-mono w-full rounded-md bg-primary py-2.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "$ autenticando..." : "$ sudo enter"}
              </button>

              <p className="font-mono text-center text-xs text-muted-foreground">
                novo aqui?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  ./register.sh
                </Link>
              </p> */}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
