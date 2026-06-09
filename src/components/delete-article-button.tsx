"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./auth-provider";

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

interface DeleteArticleButtonProps {
  articleId: string;
  articleSlug: string;
  authorId: string;
}

export function DeleteArticleButton({ articleId, articleSlug, authorId }: DeleteArticleButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const canDelete = user && (user.id === authorId || user.role === "ADMIN");

  if (!canDelete) return null;

  const handleDelete = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/wiki");
        router.refresh();
      }
    } catch {
      setLoading(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-destructive">tem certeza?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="font-mono rounded bg-destructive px-3 py-1 text-xs text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
        >
          {loading ? "$ deletando..." : "$ sim"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="font-mono rounded px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="font-mono flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive"
    >
      <TrashIcon className="h-4 w-4" />
      $ rm ./{articleSlug}.md
    </button>
  );
}
