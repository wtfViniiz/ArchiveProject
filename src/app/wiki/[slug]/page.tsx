import { notFound } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { DeleteArticleButton } from "@/components/delete-article-button";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug },
    select: { title: true, excerpt: true },
  });

  if (!article) return { title: "Artigo nao encontrado" };

  return {
    title: `${article.title} — Favela Archive`,
    description: article.excerpt || article.title,
  };
}

async function getArticle(slug: string) {
  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      tags: { select: { name: true, slug: true } },
      revisions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  if (!article) return null;

  await prisma.article.update({
    where: { id: article.id },
    data: { viewCount: { increment: 1 } },
  });

  return article;
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  return (
    <PageShell>
      <article className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <Link
            href="/wiki"
            className="font-mono text-sm text-muted-foreground hover:text-primary"
          >
            ← ~/wiki
          </Link>
        </div>

        {article.imageUrl && (
          <div className="mb-8 overflow-hidden rounded-lg">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="h-64 w-full object-cover sm:h-80"
            />
          </div>
        )}

        <header className="mb-8 border-b border-border pb-8">
          <h1 className="font-display text-4xl sm:text-5xl mb-4">
            {article.title}
          </h1>

          <div className="font-mono flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>@{article.author.name}</span>
            <span>·</span>
            <span>{formatDate(article.createdAt)}</span>
            {article.revisions[0] && (
              <>
                <span>·</span>
                <span>atualizado {formatDate(article.revisions[0].createdAt)}</span>
              </>
            )}
            <span>·</span>
            <span>{article.viewCount} views</span>
          </div>

          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {article.tags.map((tag) => (
                <span
                  key={tag.slug}
                  className="font-mono rounded border border-border px-2 py-1 text-xs text-muted-foreground"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </header>

        {article.excerpt && (
          <div className="mb-8 rounded-lg border border-border bg-card p-4">
            <p className="font-mono text-sm text-muted-foreground">{article.excerpt}</p>
          </div>
        )}

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <div
            className="text-sm leading-relaxed [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-4 [&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4 [&_li]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-4 [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded [&_pre]:font-mono [&_pre]:text-xs [&_pre]:my-4 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-4 [&_hr]:border-border [&_hr]:my-8 [&_strong]:font-bold"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>

        <footer className="mt-12 border-t border-border pt-8">
          <div className="flex items-center justify-between">
            <DeleteArticleButton articleId={article.id} articleSlug={article.slug} authorId={article.author.id} />
            {/* <Link
              href={`/wiki/${article.slug}/history`}
              className="font-mono text-sm text-muted-foreground hover:text-primary"
            >
              ver historico →
            </Link> */}
          </div>
        </footer>
      </article>
    </PageShell>
  );
}
