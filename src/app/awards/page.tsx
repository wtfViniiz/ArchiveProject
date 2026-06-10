"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";

interface Ranking {
  id: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
  awardsReceived: number;
  awardsGiven: number;
  score: number;
  _count: {
    articles: number;
    posts: number;
    clips: number;
  };
}

const RANK_ICONS: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function MedalIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" /><path d="M11 12 5.12 2.2" /><path d="m13 12 5.88-9.8" /><path d="M8 7h8" /><circle cx="12" cy="17" r="5" /><path d="M12 18v-2h-.5" />
    </svg>
  );
}

export default function AwardsPage() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/awards/rankings")
      .then((res) => res.json())
      .then((data) => setRankings(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="font-mono text-xs text-primary">$ cd ~/awards</p>
          <h1 className="font-display mt-2 text-5xl sm:text-6xl">Premios</h1>
          <p className="font-mono mt-3 max-w-2xl text-sm text-muted-foreground">
            <span className="text-primary">&gt;</span> reconhecimento por contribuicoes excepcionais.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-lg border border-border bg-card">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <TrophyIcon className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl text-foreground">Ranking Geral</h2>
            </div>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              Score = awards recebidos + (awards dados x 1.5)
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : rankings.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-mono text-sm text-muted-foreground">
                Nenhum membro encontrado.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {rankings.map((member, index) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="w-8 text-center">
                    {RANK_ICONS[index + 1] ? (
                      <span className="text-2xl">{RANK_ICONS[index + 1]}</span>
                    ) : (
                      <span className="font-mono text-sm text-muted-foreground">{index + 1}</span>
                    )}
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold shrink-0">
                    {member.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-foreground truncate">{member.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {member._count.articles} artigos · {member._count.posts} posts · {member._count.clips} clips
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div className="text-center">
                      <p className="font-mono text-xs text-muted-foreground">recebidos</p>
                      <p className="font-mono text-sm text-foreground">{member.awardsReceived}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-mono text-xs text-muted-foreground">dados</p>
                      <p className="font-mono text-sm text-primary">{member.awardsGiven}</p>
                    </div>
                    <div className="text-center w-16">
                      <p className="font-mono text-xs text-muted-foreground">score</p>
                      <p className="font-mono text-lg font-bold text-foreground">{member.score}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-lg border border-border bg-card p-4">
          <h3 className="font-mono text-sm text-foreground mb-2">Como funciona o ranking?</h3>
          <ul className="font-mono text-xs text-muted-foreground space-y-1">
            <li>- Cada award <strong>recebido</strong> conta <strong>1 ponto</strong></li>
            <li>- Cada award <strong>dado</strong> conta <strong>1.5 pontos</strong></li>
            <li>- Quanto mais voce colabora, maior seu ranking</li>
            <li>- Cooldown: 24h por tipo de award (88: 7 dias)</li>
          </ul>
        </div>
      </section>
    </PageShell>
  );
}
