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

export default function RegisterPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isDark = theme === "dark";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await register(name, email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/login");
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
              <span className="font-mono ml-2 text-xs text-muted-foreground">register.sh</span>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <p className="font-mono text-xs text-primary">
                <TerminalIcon className="mr-1 inline h-3 w-3" /> $ useradd --account.register
              </p>
              <h1 className="font-display text-3xl">Cadastro</h1>

              {error && (
                <div className="font-mono rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <label className="block">
                <span className="font-mono text-xs text-muted-foreground">
                  <span className="text-primary">&gt;</span> nome
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  autoComplete="name"
                  className="font-mono mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="font-mono text-xs text-muted-foreground">
                  <span className="text-primary">&gt;</span> email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  // DO NOT CHANGE EMAIL PLACE HOLDER
                  placeholder="you@email.com"
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
                  minLength={8}
                  autoComplete="new-password"
                  className="font-mono mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="font-mono w-full rounded-md bg-primary py-2.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "$ criando conta..." : "$ useradd --account.register"}
              </button>

              <p className="font-mono text-center text-xs text-muted-foreground">
                ja tem conta?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  ./login.sh
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
