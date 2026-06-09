import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "~/wiki — Favela Archive",
  description: "Artigos arquivados da Favela Archive.",
};

async function getArticles() {
  const articles = await prisma.article.findMany({
    where: { isDraft: false },
    include: {
      author: { select: { name: true } },
      tags: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return articles;
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" /><path d="M12 5v14" />
    </svg>
  );
}

export default async function WikiPage() {
  const articles = await getArticles();

  return (
    <PageShell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="font-mono text-xs text-primary">$ ls ~/wiki</p>
          <h1 className="font-display mt-2 text-5xl sm:text-6xl">Wiki</h1>
          <p className="font-mono mt-3 max-w-2xl text-sm text-muted-foreground">
            <span className="text-primary">&gt;</span> Favela artigos.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <Link
          href="/wiki/new"
          className="font-mono mb-8 flex items-center gap-2 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
        >
          <PlusIcon className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">$ touch ~/wiki/novo-artigo.md</span>
        </Link>

        {articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-mono text-muted-foreground">
              Nenhum artigo encontrado. Seja o primeiro a criar!
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/wiki/${article.slug}`}
                className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary"
              >
                {article.imageUrl && (
                  <div className="mb-2 overflow-hidden rounded-md">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="h-32 w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                )}
                <p className="font-mono text-[11px] text-muted-foreground">
                  <span className="text-primary">
                    {new Date(article.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>{" "}
                  · @{article.author.name}
                </p>
                <h3 className="font-display text-2xl text-foreground transition-colors group-hover:text-primary">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="font-mono text-xs text-muted-foreground line-clamp-2">
                    {article.excerpt}
                  </p>
                )}
                <p className="font-mono mt-1 text-xs text-muted-foreground">
                  ./{article.slug}.md
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
