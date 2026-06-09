"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/page-shell";
import { useAuth } from "@/components/auth-provider";

const RichTextEditor = dynamic(() => import("@/components/rich-text-editor").then(mod => ({ default: mod.RichTextEditor })), { ssr: false });

interface Tag {
  id: string;
  name: string;
  slug: string;
}

function TerminalIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" x2="20" y1="19" y2="19" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

export default function NewArticlePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isDraft, setIsDraft] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useState(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then((data) => setTags(data))
      .catch(() => {});
  });

  if (!user) {
    return (
      <PageShell>
        <section className="mx-auto max-w-4xl px-4 py-16">
          <div className="text-center">
            <p className="font-mono text-muted-foreground">
              Voce precisa estar logado para criar artigos.
            </p>
            <Link
              href="/login"
              className="font-mono mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              $ ./login.sh
            </Link>
          </div>
        </section>
      </PageShell>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (content.length < 50 && !isDraft) {
      setError("Conteudo deve ter pelo menos 50 caracteres para publicar");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          excerpt: excerpt || undefined,
          imageUrl: imageUrl || undefined,
          isDraft,
          tagIds: selectedTags,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Erro ao criar artigo");
        setLoading(false);
        return;
      }

      router.push(`/wiki/${data.slug}`);
      router.refresh();
    } catch {
      setError("Erro ao criar artigo");
      setLoading(false);
    }
  };

  const toggleTag = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  return (
    <PageShell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="font-mono text-xs text-primary">$ touch ~/wiki/novo-artigo.md</p>
          <h1 className="font-display mt-2 text-5xl sm:text-6xl">Novo Artigo</h1>
          <p className="font-mono mt-3 max-w-2xl text-sm text-muted-foreground">
            <span className="text-primary">&gt;</span> escreva e compartilhe conhecimento com a comunidade.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="font-mono rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div>
            <label className="font-mono text-xs text-muted-foreground">
              <span className="text-primary">&gt;</span> titulo
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titulo do meu artigo"
              required
              className="font-mono mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="font-mono text-xs text-muted-foreground">
              <span className="text-primary">&gt;</span> resumo (opcional)
            </label>
            <input
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Uma breve descricao do artigo"
              className="font-mono mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="font-mono text-xs text-muted-foreground">
              <span className="text-primary">&gt;</span> imagem de capa (opcional)
            </label>
            <div className="mt-2">
              {imageUrl ? (
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="h-48 w-full rounded-md object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground hover:bg-background"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="URL da imagem"
                    className="font-mono flex-1 rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="font-mono text-xs text-muted-foreground">
              <span className="text-primary">&gt;</span> conteudo
            </label>
            <div className="mt-2">
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Escreva seu conteudo aqui..."
              />
            </div>
            <p className="font-mono mt-1 text-[10px] text-muted-foreground">
              {content.replace(/<[^>]*>/g, "").length} caracteres
            </p>
          </div>

          {tags.length > 0 && (
            <div>
              <label className="font-mono text-xs text-muted-foreground">
                <span className="text-primary">&gt;</span> tags
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`font-mono rounded border px-3 py-1.5 text-xs transition-colors ${
                      selectedTags.includes(tag.id)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDraft}
                onChange={(e) => setIsDraft(e.target.checked)}
                className="rounded border-border"
              />
              <span className="font-mono text-sm text-muted-foreground">salvar como rascunho</span>
            </label>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="font-mono rounded-md bg-primary px-6 py-2.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "$ salvando..." : isDraft ? "$ salvar rascunho" : "$ publicar artigo"}
            </button>
            <Link
              href="/wiki"
              className="font-mono text-sm text-muted-foreground hover:text-primary"
            >
              cancelar
            </Link>
          </div>
        </form>
      </section>
    </PageShell>
  );
}
