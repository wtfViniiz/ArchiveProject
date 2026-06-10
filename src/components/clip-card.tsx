"use client";

import Link from "next/link";
import { useState } from "react";

interface Clip {
  id: string;
  title: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  createdAt: Date | string;
  author: { name: string } | null;
  tags: { name: string }[];
  _count: { likes: number; comments: number; awards: number };
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function MessageCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

function AwardIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

export function ClipCard({ clip, isNew }: { clip: Clip; isNew: boolean }) {
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <Link
      href={`/clips/${clip.id}`}
      className="group overflow-hidden rounded-lg border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary"
    >
      <div className="relative aspect-video overflow-hidden bg-secondary">
        {clip.thumbnailUrl ? (
          <img
            src={clip.thumbnailUrl}
            alt={clip.title || "Clip"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground transition-transform group-hover:scale-110">
              <PlayIcon className="h-6 w-6" />
            </div>
          </div>
        )}
        {isNew && (
          <span className="absolute left-3 top-3 rounded bg-primary px-2 py-0.5 text-[10px] font-mono font-bold text-primary-foreground z-10">
            NEW
          </span>
        )}
        {!isNew && clip.tags[0] && (
          <span className="font-mono absolute left-3 top-3 rounded bg-background/80 px-2 py-0.5 text-[10px] z-10">
            .{clip.tags[0].name.toLowerCase()}
          </span>
        )}
        {clip.duration && (
          <span className="font-mono absolute right-3 bottom-3 rounded bg-background/80 px-2 py-0.5 text-[10px]">
            {Math.floor(clip.duration / 60)}:{(clip.duration % 60).toString().padStart(2, "0")}
          </span>
        )}
        <button
          aria-label="Favoritar"
          onClick={(e) => {
            e.preventDefault();
            setBookmarked(!bookmarked);
          }}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md bg-background/80 transition-colors hover:text-primary opacity-0 group-hover:opacity-100 z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
          </svg>
        </button>
      </div>
      <div className="p-3">
        <h4 className="font-mono truncate text-sm text-foreground transition-colors group-hover:text-primary">
          {clip.title || "clip"}
        </h4>
        <p className="font-mono mt-1 text-xs text-muted-foreground">
          @{clip.author?.name}
        </p>
        <div className="font-mono mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <HeartIcon className="h-3 w-3" /> {clip._count.likes}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircleIcon className="h-3 w-3" /> {clip._count.comments}
          </span>
          <span className="inline-flex items-center gap-1">
            <AwardIcon className="h-3 w-3" /> {clip._count.awards}
          </span>
        </div>
      </div>
    </Link>
  );
}
