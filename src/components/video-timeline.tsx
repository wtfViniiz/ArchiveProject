"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface VideoTimelineProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  duration: number;
  trimStart: number;
  trimEnd: number;
  onTrimChange: (start: number, end: number) => void;
  maxDuration?: number;
}

function ScissorsIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="6" cy="6" r="3" /><path d="M8.12 8.12 12 12" /><path d="M20 4 8.12 15.88" /><circle cx="6" cy="18" r="3" /><path d="M14.8 14.8 20 20" />
    </svg>
  );
}

export function VideoTimeline({
  videoRef,
  duration,
  trimStart,
  trimEnd,
  onTrimChange,
  maxDuration = 30,
}: VideoTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<"start" | "end" | "playhead" | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  const getTimeFromPosition = useCallback(
    (clientX: number) => {
      if (!timelineRef.current) return 0;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      return percentage * duration;
    },
    [duration]
  );

  const getPositionFromTime = useCallback(
    (time: number) => {
      return (time / duration) * 100;
    },
    [duration]
  );

  const handleMouseDown = useCallback(
    (type: "start" | "end" | "playhead", e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(type);

      if (type === "playhead" && videoRef.current) {
        const time = getTimeFromPosition(e.clientX);
        videoRef.current.currentTime = time;
        setCurrentTime(time);
      }
    },
    [getTimeFromPosition, videoRef]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !timelineRef.current) return;

      const time = getTimeFromPosition(e.clientX);

      if (isDragging === "start") {
        const newStart = Math.max(0, Math.min(time, trimEnd - 0.1));
        onTrimChange(newStart, trimEnd);
        if (videoRef.current) {
          videoRef.current.currentTime = newStart;
          setCurrentTime(newStart);
        }
      } else if (isDragging === "end") {
        const maxEnd = Math.min(duration, trimStart + maxDuration);
        const newEnd = Math.max(trimStart + 0.1, Math.min(time, maxEnd));
        onTrimChange(trimStart, newEnd);
        if (videoRef.current) {
          videoRef.current.currentTime = newEnd;
          setCurrentTime(newEnd);
        }
      } else if (isDragging === "playhead") {
        const newTime = Math.max(trimStart, Math.min(time, trimEnd));
        if (videoRef.current) {
          videoRef.current.currentTime = newTime;
          setCurrentTime(newTime);
        }
      }
    },
    [isDragging, trimStart, trimEnd, duration, maxDuration, getTimeFromPosition, onTrimChange, videoRef]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.currentTime >= trimEnd) {
        video.currentTime = trimStart;
        setCurrentTime(trimStart);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [videoRef, trimStart, trimEnd]);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    const time = getTimeFromPosition(e.clientX);
    const clampedTime = Math.max(trimStart, Math.min(time, trimEnd));
    if (videoRef.current) {
      videoRef.current.currentTime = clampedTime;
      setCurrentTime(clampedTime);
    }
  };

  const startPercent = getPositionFromTime(trimStart);
  const endPercent = getPositionFromTime(trimEnd);
  const playheadPercent = getPositionFromTime(currentTime);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <ScissorsIcon className="h-4 w-4 text-primary" />
        <span className="font-mono text-sm text-foreground">Timeline</span>
        <span className="font-mono text-xs text-muted-foreground ml-auto">
          {formatTime(trimStart)} — {formatTime(trimEnd)} ({formatTime(trimEnd - trimStart)})
        </span>
      </div>

      {/* Timeline */}
      <div
        ref={timelineRef}
        className="relative h-16 bg-secondary rounded cursor-pointer select-none"
        onClick={handleTimelineClick}
      >
        {/* Background track */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: Math.ceil(duration) }).map((_, i) => (
            <div
              key={i}
              className="flex-1 border-r border-border/30"
              style={{ width: `${100 / duration}%` }}
            />
          ))}
        </div>

        {/* Selected region */}
        <div
          className="absolute top-0 h-full bg-primary/20 border-y-2 border-primary"
          style={{
            left: `${startPercent}%`,
            width: `${endPercent - startPercent}%`,
          }}
        />

        {/* Excluded regions (before start) */}
        {trimStart > 0 && (
          <div
            className="absolute top-0 h-full bg-background/60"
            style={{ left: 0, width: `${startPercent}%` }}
          />
        )}

        {/* Excluded regions (after end) */}
        {trimEnd < duration && (
          <div
            className="absolute top-0 h-full bg-background/60"
            style={{ left: `${endPercent}%`, right: 0 }}
          />
        )}

        {/* Start handle */}
        <div
          className="absolute top-0 h-full w-3 bg-primary cursor-ew-resize hover:bg-primary/80 z-10 flex items-center justify-center"
          style={{ left: `calc(${startPercent}% - 6px)` }}
          onMouseDown={(e) => handleMouseDown("start", e)}
        >
          <div className="w-0.5 h-6 bg-primary-foreground rounded" />
        </div>

        {/* End handle */}
        <div
          className="absolute top-0 h-full w-3 bg-primary cursor-ew-resize hover:bg-primary/80 z-10 flex items-center justify-center"
          style={{ left: `calc(${endPercent}% - 6px)` }}
          onMouseDown={(e) => handleMouseDown("end", e)}
        >
          <div className="w-0.5 h-6 bg-primary-foreground rounded" />
        </div>

        {/* Playhead */}
        <div
          className="absolute top-0 h-full w-0.5 bg-foreground z-20 cursor-ew-resize"
          style={{ left: `${playheadPercent}%` }}
          onMouseDown={(e) => handleMouseDown("playhead", e)}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-foreground rounded-full" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-foreground rounded-full" />
        </div>
      </div>

      {/* Time labels */}
      <div className="flex justify-between mt-2">
        <span className="font-mono text-[10px] text-muted-foreground">0:00</span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {formatTime(duration)}
        </span>
      </div>

      {/* Trim controls */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">Inicio:</span>
          <span className="font-mono text-xs text-primary">{formatTime(trimStart)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">Fim:</span>
          <span className="font-mono text-xs text-primary">{formatTime(trimEnd)}</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="font-mono text-xs text-muted-foreground">Duracao:</span>
          <span className="font-mono text-xs text-foreground">{formatTime(trimEnd - trimStart)}</span>
        </div>
      </div>
    </div>
  );
}
