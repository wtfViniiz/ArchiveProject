"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

interface ClipViewerProps {
  clipId: string;
  clipIds: string[];
  onClose: () => void;
  onFavoriteChange?: (clipId: string, favorited: boolean) => void;
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

function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function SkeletonLoader() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-pulse">
      <div className="flex-1">
        <div className="rounded-lg bg-secondary aspect-video" />
        <div className="mt-4 space-y-3">
          <div className="h-6 bg-secondary rounded w-3/4" />
          <div className="h-4 bg-secondary rounded w-1/2" />
          <div className="flex gap-2">
            <div className="h-5 bg-secondary rounded w-16" />
            <div className="h-5 bg-secondary rounded w-12" />
          </div>
        </div>
      </div>
      <div className="lg:w-80 space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex justify-around">
            <div className="h-10 w-10 bg-secondary rounded" />
            <div className="h-10 w-10 bg-secondary rounded" />
            <div className="h-10 w-10 bg-secondary rounded" />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 flex-1">
          <div className="h-4 bg-secondary rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg bg-background p-3">
                <div className="h-3 bg-secondary rounded w-1/4 mb-2" />
                <div className="h-3 bg-secondary rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClipViewer({ clipId, clipIds, onClose, onFavoriteChange }: ClipViewerProps) {
  const { user } = useAuth();
  const [clip, setClip] = useState<Clip | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [showAwardMenu, setShowAwardMenu] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [awardCooldowns, setAwardCooldowns] = useState<Record<string, number>>({});
  const currentIndex = clipIds.indexOf(clipId);
  const cooldownTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const stored = localStorage.getItem("awardCooldowns");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        const valid: Record<string, number> = {};
        for (const [key, expiry] of Object.entries(parsed)) {
          if ((expiry as number) > now) {
            valid[key] = expiry as number;
          }
        }
        setAwardCooldowns(valid);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (Object.keys(awardCooldowns).length > 0) {
      localStorage.setItem("awardCooldowns", JSON.stringify(awardCooldowns));
    } else {
      localStorage.removeItem("awardCooldowns");
    }
  }, [awardCooldowns]);

  useEffect(() => {
    setLoading(true);
    setIsLiked(false);
    setIsFavorited(false);
    setCommentText("");
    setShowAwardMenu(false);
    setShareCopied(false);
    fetchClip(clipId);
    fetchUserStates(clipId);

    return () => {
      cooldownTimers.current.forEach((timer) => clearTimeout(timer));
      cooldownTimers.current.clear();
    };
  }, [clipId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAwardCooldowns((prev) => {
        const now = Date.now();
        const updated: Record<string, number> = {};
        let changed = false;
        for (const [key, expiry] of Object.entries(prev)) {
          if (expiry > now) {
            updated[key] = expiry;
          } else {
            changed = true;
          }
        }
        return changed ? updated : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchClip = async (id: string) => {
    try {
      const response = await fetch(`/api/clips/${id}`);
      if (response.ok) {
        const data = await response.json();
        setClip(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStates = async (id: string) => {
    if (!user) return;
    try {
      const [likeRes, favRes] = await Promise.all([
        fetch(`/api/clips/${id}/like/check`),
        fetch(`/api/clips/${id}/favorite/check`),
      ]);
      if (likeRes.ok) {
        const likeData = await likeRes.json();
        setIsLiked(likeData.liked);
      }
      if (favRes.ok) {
        const favData = await favRes.json();
        setIsFavorited(favData.favorited);
      }
    } catch {}
  };

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      window.history.pushState({}, "", `/clips/${clipIds[currentIndex - 1]}`);
      setLoading(true);
      fetchClip(clipIds[currentIndex - 1]);
      fetchUserStates(clipIds[currentIndex - 1]);
    }
  }, [currentIndex, clipIds]);

  const goToNext = useCallback(() => {
    if (currentIndex < clipIds.length - 1) {
      window.history.pushState({}, "", `/clips/${clipIds[currentIndex + 1]}`);
      setLoading(true);
      fetchClip(clipIds[currentIndex + 1]);
      fetchUserStates(clipIds[currentIndex + 1]);
    }
  }, [currentIndex, clipIds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrev, goToNext, onClose]);

  const handleLike = async () => {
    if (!user || !clip) return;
    const response = await fetch(`/api/clips/${clip.id}/like`, { method: "POST" });
    if (response.ok) {
      const data = await response.json();
      setIsLiked(data.liked);
      setClip((c) => c ? { ...c, _count: { ...c._count, likes: c._count.likes + (data.liked ? 1 : -1) } } : c);
    }
  };

  const handleFavorite = async () => {
    if (!user || !clip) return;
    const response = await fetch(`/api/clips/${clip.id}/favorite`, { method: "POST" });
    if (response.ok) {
      const data = await response.json();
      setIsFavorited(data.favorited);
      onFavoriteChange?.(clip.id, data.favorited);
    }
  };

  const handleAward = async (awardType: string) => {
    if (!user || !clip || awardCooldowns[awardType]) return;

    const response = await fetch(`/api/clips/${clip.id}/award`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ awardType }),
    });

    if (response.ok) {
      const data = await response.json();
      setShowAwardMenu(false);
      setClip((c) => c ? { ...c, _count: { ...c._count, awards: c._count.awards + 1 } } : c);

      if (data.nextAvailable) {
        const cooldownMs = new Date(data.nextAvailable).getTime() - Date.now();
        setAwardCooldowns((prev) => ({ ...prev, [awardType]: Date.now() + cooldownMs }));
      }
    } else if (response.status === 429) {
      const data = await response.json();
      const expiry = new Date(data.nextAvailable).getTime();
      setAwardCooldowns((prev) => ({ ...prev, [awardType]: expiry }));
      setShowAwardMenu(false);
    }
  };

  const handleComment = async () => {
    if (!user || !clip || !commentText.trim() || commentLoading) return;

    setCommentLoading(true);
    const content = commentText;
    setCommentText("");

    try {
      const response = await fetch(`/api/clips/${clip.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (response.ok) {
        fetchClip(clip.id);
      }
    } finally {
      setCommentLoading(false);
    }
  };

  const handleShare = async () => {
    if (!clip) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/clips/${clip.id}`);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {}
  };

  const handleDelete = async () => {
    if (!clip || !confirm("Tem certeza que deseja deletar este clip?")) return;

    const response = await fetch(`/api/clips/${clip.id}`, { method: "DELETE" });
    if (response.ok) {
      onClose();
    }
  };

  const isAuthor = user && clip && (user.id === clip.author.id || user.role === "ADMIN");

  const formatCooldown = (expiry: number) => {
    const remaining = Math.max(0, expiry - Date.now());
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border text-foreground hover:bg-accent transition-colors"
      >
        <XIcon className="h-5 w-5" />
      </button>

      {currentIndex > 0 && (
        <button
          onClick={goToPrev}
          className="absolute left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-card border border-border text-foreground hover:bg-accent transition-colors"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
      )}
      {currentIndex < clipIds.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-card border border-border text-foreground hover:bg-accent transition-colors"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      )}

      <div className="w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="p-6">
            <SkeletonLoader />
          </div>
        ) : clip ? (
          <div className="flex flex-col lg:flex-row max-h-[90vh]">
            <div className="flex-1 flex flex-col min-w-0">
              <div className="bg-black aspect-video max-h-[50vh]">
                <video
                  key={clip.id}
                  src={`/api/clips/${clip.id}/video?url=${encodeURIComponent(clip.videoUrl)}`}
                  poster={clip.thumbnailUrl || undefined}
                  controls
                  autoPlay
                  preload="metadata"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-4 border-b border-border">
                <h1 className="font-display text-xl text-foreground mb-1">{clip.title}</h1>
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
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
                {clip.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {clip.tags.map((tag) => (
                      <span key={tag.slug} className="font-mono rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLike}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${isLiked ? "text-primary" : "text-muted-foreground"}`}>
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                    <span className="font-mono text-xs">{clip._count.likes}</span>
                  </button>

                  <button
                    onClick={handleFavorite}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${isFavorited ? "text-primary" : "text-muted-foreground"}`}>
                      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                    </svg>
                    <span className="font-mono text-xs">Favoritar</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
                  >
                    {shareCopied ? (
                      <CheckIcon className="h-5 w-5 text-primary" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-muted-foreground">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                    )}
                    <span className="font-mono text-xs">{shareCopied ? "Copiado!" : "Copiar link"}</span>
                  </button>

                  {isAuthor && (
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-destructive/10 transition-colors text-destructive"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                      <span className="font-mono text-xs">Deletar</span>
                    </button>
                  )}

                  <div className="relative ml-auto">
                    <button
                      onClick={() => setShowAwardMenu(!showAwardMenu)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
                    >
                      <span className="text-lg">🏆</span>
                      <span className="font-mono text-xs">{clip._count.awards}</span>
                    </button>
                    {showAwardMenu && (
                      <div className="absolute bottom-full right-0 mb-2 w-56 rounded-lg border border-border bg-card shadow-lg z-10">
                        {Object.entries(AWARD_LABELS).map(([key, label]) => {
                          const expiry = awardCooldowns[key];
                          const onCooldown = !!expiry && expiry > Date.now();
                          return (
                            <button
                              key={key}
                              onClick={() => handleAward(key)}
                              disabled={onCooldown}
                              className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors ${
                                onCooldown
                                  ? "opacity-40 cursor-not-allowed bg-background"
                                  : "hover:bg-accent"
                              }`}
                            >
                              <span>{AWARD_EMOJIS[key]}</span>
                              <span className="flex-1">{label}</span>
                              {onCooldown && (
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  {formatCooldown(expiry)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-border flex flex-col max-h-[40vh] lg:max-h-none">
              <div className="p-3 border-b border-border">
                <h2 className="font-mono text-xs text-muted-foreground">
                  {clip._count.comments} comentarios
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
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
                  <p className="font-mono text-xs text-muted-foreground text-center py-8">
                    Nenhum comentario ainda
                  </p>
                )}
              </div>

              {user && (
                <div className="p-3 border-t border-border">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Escreva um comentario..."
                      disabled={commentLoading}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none disabled:opacity-50"
                      onKeyDown={(e) => e.key === "Enter" && handleComment()}
                    />
                    <button
                      onClick={handleComment}
                      disabled={!commentText.trim() || commentLoading}
                      className="rounded-lg bg-primary px-3 py-2 text-sm font-mono text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {commentLoading ? "..." : "Enviar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
