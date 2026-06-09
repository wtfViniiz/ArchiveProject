import { PageShell } from "@/components/page-shell";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "~/awards — Favela Archive",
  description: "Premiacoes Favela.",
};

async function getAwards() {
  const awards = await prisma.award.findMany({
    include: {
      _count: {
        select: { userAwards: true },
      },
    },
    orderBy: { points: "desc" },
  });

  return awards;
}

async function getTopMembers() {
  const members = await prisma.user.findMany({
    where: { isActive: true, isBanned: false },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      _count: {
        select: {
          articles: true,
          posts: true,
          clips: true,
          likes: true,
          userAwards: true,
        },
      },
    },
    orderBy: {
      userAwards: { _count: "desc" },
    },
    take: 10,
  });

  return members;
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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

const categoryIcons: Record<string, typeof TrophyIcon> = {
  article: StarIcon,
  clip: MedalIcon,
  community: TrophyIcon,
  special: TrophyIcon,
};

const categoryLabels: Record<string, string> = {
  article: "Artigos",
  clip: "Clipes",
  community: "Comunidade",
  special: "Especial",
};

export default async function AwardsPage() {
  const [awards, topMembers] = await Promise.all([getAwards(), getTopMembers()]);

  const awardsByCategory = awards.reduce((acc, award) => {
    if (!acc[award.category]) acc[award.category] = [];
    acc[award.category].push(award);
    return acc;
  }, {} as Record<string, typeof awards>);

  return (
    <PageShell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="font-mono text-xs text-primary">$ cd ~/awards</p>
          <h1 className="font-display mt-2 text-5xl sm:text-6xl">Premios</h1>
          <p className="font-mono mt-3 max-w-2xl text-sm text-muted-foreground">
            <span className="text-primary">&gt;</span> premios
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div>
            {Object.keys(awardsByCategory).length > 0 ? (
              Object.entries(awardsByCategory).map(([category, categoryAwards]) => {
                const Icon = categoryIcons[category] || TrophyIcon;
                return (
                  <div key={category} className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Icon className="h-5 w-5 text-primary" />
                      <h2 className="font-display text-2xl text-foreground">
                        {categoryLabels[category] || category}
                      </h2>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {categoryAwards.map((award) => (
                        <div
                          key={award.id}
                          className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
                        >
                          <div className="flex items-start justify-between">
                            <h3 className="font-display text-lg text-foreground">
                              {award.title}
                            </h3>
                            <span className="font-mono rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                              {award.points} pts
                            </span>
                          </div>
                          <p className="font-mono mt-2 text-xs text-muted-foreground">
                            {award.description}
                          </p>
                          <p className="font-mono mt-2 text-[10px] text-muted-foreground">
                            {award._count.userAwards} membros receberam
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <TrophyIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="font-mono mt-4 text-sm text-muted-foreground">
                  Nenhum premio disponivel ainda.
                </p>
                <p className="font-mono mt-2 text-xs text-muted-foreground">
                  Premios são distribuidos entre usuarios.
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="font-display text-xl text-foreground mb-4">
                Top Membros
              </h2>
              {topMembers.length > 0 ? (
                <div className="space-y-3">
                  {topMembers.map((member, index) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3"
                    >
                      <span className="font-mono w-6 text-center text-sm text-muted-foreground">
                        {index + 1}
                      </span>
                      <div className="font-mono flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm text-foreground truncate">
                          {member.name}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {member._count.userAwards} premios · {member._count.articles + member._count.posts + member._count.clips} contribuicoes
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-mono text-xs text-muted-foreground text-center py-4">
                  Nenhum membro com premios ainda.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
