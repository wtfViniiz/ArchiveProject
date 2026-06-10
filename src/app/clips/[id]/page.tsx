"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { useAuth } from "@/components/auth-provider";

interface Clip {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number | null;
  createdAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
  tags: { name: string; slug: string }[];
  comments: {
    id: string;
    content: string;
    createdAt: string;
    user: { name: string; avatarUrl: string | null };
  }[];
  _count: { likes: number; comments: number; awards: number; favorites: number };
}

const AWARD_LABELS: Record<string, string> = {
  rei: "O Rei",
  true_gooner: "True Gooner",
  gooner: "Gooner",
  sepe: "Sepe",
  "88": "88 (Super)",
};

const AWARD_EMOJIS: Record<string, string> = {
  rei: "👑",
  true_gooner: "🔥",
  gooner: "💀",
  sepe: "⭐",
  "88": "💎",
};

export default function ClipDetailPage() {
  const params = useParams();
  const { user } = useAuth();

  const [clip, setClip] = useState<Clip | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAwardMenu, setShowAwardMenu] = useState(false);

  useEffect(() => {
    fetchClip();
  }, [params.id]);

  const fetchClip = async () => {
    try {
      const response = await fetch(`/api/clips/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setClip(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    const response = await fetch(`/api/clips/${params.id}/like`, { method: "POST" });
    if (response.ok) {
      const data = await response.json();
      setIsLiked(data.liked);
      setClip((c) => c ? { ...c, _count: { ...c._count, likes: c._count.likes + (data.liked ? 1 : -1) } } : c);
    }
  };

  const handleFavorite = async () => {
    if (!user) return;
    const response = await fetch(`/api/clips/${params.id}/favorite`, { method: "POST" });
    if (response.ok) {
      const data = await response.json();
      setIsFavorited(data.favorited);
    }
  };

  const handleAward = async (awardType: string) => {
    if (!user) return;
    const response = await fetch(`/api/clips/${params.id}/award`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ awardType }),
    });
    if (response.ok) {
      setShowAwardMenu(false);
      setClip((c) => c ? { ...c, _count: { ...c._count, awards: c._count.awards + 1 } } : c);
    }
  };

  const handleComment = async () => {
    if (!user || !commentText.trim()) return;
    const response = await fetch(`/api/clips/${params.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText }),
    });
    if (response.ok) {
      setCommentText("");
      fetchClip();
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="font-mono text-muted-foreground">Carregando...</p>
        </div>
      </PageShell>
    );
  }

  if (!clip) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="font-mono text-muted-foreground">Clip nao encontrado</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/clips" className="font-mono text-sm text-muted-foreground hover:text-primary mb-6 inline-block">
          ← ~/clips
        </Link>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Video Player */}
          <div className="flex-1">
            <div className="rounded-lg overflow-hidden bg-black">
              <video
                src={clip.videoUrl}
                poster={clip.thumbnailUrl || undefined}
                controls
                className="w-full max-h-[500px] object-contain"
              />
            </div>

            {/* Title & Meta */}
            <div className="mt-4">
              <h1 className="font-display text-2xl text-foreground mb-2">{clip.title}</h1>
              <div className="flex items-center gap-3 text-sm font-mono text-muted-foreground">
                <span>@{clip.author.name}</span>
                <span>·</span>
                <span>{new Date(clip.createdAt).toLocaleDateString("pt-BR")}</span>
                {clip.duration && (
                  <>
                    <span>·</span>
                    <span>{Math.floor(clip.duration / 60)}:{(clip.duration % 60).toString().padStart(2, "0")}</span>
                  </>
                )}
              </div>
            </div>

            {/* Tags */}
            {clip.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {clip.tags.map((tag) => (
                  <span key={tag.slug} className="font-mono rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 flex flex-col gap-4">
            {/* Action Buttons */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-around">
                <button
                  onClick={handleLike}
                  className="flex flex-col items-center gap-1 transition-colors hover:text-primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-6 w-6 ${isLiked ? "text-primary" : "text-muted-foreground"}`}>
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                  <span className="font-mono text-xs">{clip._count.likes}</span>
                </button>

                <button
                  onClick={handleFavorite}
                  className="flex flex-col items-center gap-1 transition-colors hover:text-primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-6 w-6 ${isFavorited ? "text-primary" : "text-muted-foreground"}`}>
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                  </svg>
                  <span className="font-mono text-xs">Favoritar</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowAwardMenu(!showAwardMenu)}
                    className="flex flex-col items-center gap-1 transition-colors hover:text-primary"
                  >
                    <span className="text-2xl">🏆</span>
                    <span className="font-mono text-xs">{clip._count.awards}</span>
                  </button>
                  {showAwardMenu && (
                    <div className="absolute bottom-full right-0 mb-2 w-48 rounded-lg border border-border bg-card shadow-lg z-10">
                      {Object.entries(AWARD_LABELS).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => handleAward(key)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
                        >
                          <span>{AWARD_EMOJIS[key]}</span>
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="rounded-lg border border-border bg-card p-4 flex-1">
              <h2 className="font-mono text-sm text-muted-foreground mb-3">
                {clip._count.comments} comentarios
              </h2>

              {user && (
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Escreva um comentario..."
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none"
                    onKeyDown={(e) => e.key === "Enter" && handleComment()}
                  />
                  <button
                    onClick={handleComment}
                    disabled={!commentText.trim()}
                    className="rounded-lg bg-primary px-3 py-2 text-sm font-mono text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    Enviar
                  </button>
                </div>
              )}

              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {clip.comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg bg-background p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-medium text-foreground">{comment.user.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{comment.content}</p>
                  </div>
                ))}
                {clip.comments.length === 0 && (
                  <p className="font-mono text-xs text-muted-foreground text-center py-4">
                    Nenhum comentario ainda
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
