"use client";

import Link from "next/link";
import { useState, useCallback, useRef, useEffect } from "react";
import { ClipViewer } from "@/components/clip-viewer";

interface Clip {
  id: string;
  title: string | null;
  thumbnailUrl: string | null;
  videoUrl: string;
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

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function VideoThumbnail({ videoUrl, alt }: { videoUrl: string; alt: string }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
      <div className="text-center">
        <PlayIcon className="h-12 w-12 text-primary/60 mx-auto" />
        <p className="font-mono text-[10px] text-muted-foreground mt-2">Video disponivel</p>
      </div>
    </div>
  );
}

function UploadIconGrid({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}

function FilterIconGrid({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

interface ClipsGridProps {
  clips: Clip[];
  storageInfo: { remainingFormatted: string };
}

export function ClipsGrid({ clips, storageInfo }: ClipsGridProps) {
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [favoriteStates, setFavoriteStates] = useState<Record<string, boolean>>({});

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const clipIds = clips.map((c) => c.id);

  const handleFavoriteChange = useCallback((clipId: string, favorited: boolean) => {
    setFavoriteStates((prev) => ({ ...prev, [clipId]: favorited }));
  }, []);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <Link
          href="/clips/upload"
          className="font-mono flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary"
        >
          <UploadIconGrid className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">$ ffmpeg -i upload.mp4 -c:v libx264</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <FilterIconGrid className="h-4 w-4" />
            <span>{clips.length} clips</span>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] text-muted-foreground">espaco</p>
            <p className="font-mono text-xs text-foreground">{storageInfo.remainingFormatted}</p>
          </div>
        </div>
      </div>

      {clips.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-mono text-muted-foreground">
            Nenhum clip encontrado. Envie um clip!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {clips.map((clip) => {
            const isNew = new Date(clip.createdAt) > twentyFourHoursAgo;
            const isFav = favoriteStates[clip.id] ?? false;
            return (
              <button
                key={clip.id}
                onClick={() => setSelectedClipId(clip.id)}
                className="group overflow-hidden rounded-lg border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary text-left"
              >
                <div className="relative aspect-video overflow-hidden bg-secondary">
                  <VideoThumbnail videoUrl={clip.videoUrl} alt={clip.title || "Clip"} />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground transition-transform group-hover:scale-110">
                      <PlayIcon className="h-6 w-6" />
                    </div>
                  </div>
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
                  <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md bg-background/80 transition-colors hover:text-primary opacity-0 group-hover:opacity-100 z-10 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 ${isFav ? "text-primary" : ""}`}>
                      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                    </svg>
                  </div>
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
              </button>
            );
          })}
        </div>
      )}

      {selectedClipId && (
        <ClipViewer
          clipId={selectedClipId}
          clipIds={clipIds}
          onClose={() => setSelectedClipId(null)}
          onFavoriteChange={handleFavoriteChange}
        />
      )}
    </>
  );
}
