"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface SpritePreviewProps {
  videoUrl: string;
  children: React.ReactNode;
}

const spriteCache = new Map<string, string[]>();

export function SpritePreview({ videoUrl, children }: SpritePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sprites, setSprites] = useState<string[]>([]);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate sprites client-side when in viewport
  useEffect(() => {
    if (!containerRef.current || spriteCache.has(videoUrl)) {
      if (spriteCache.has(videoUrl)) {
        setSprites(spriteCache.get(videoUrl)!);
      }
      return;
    }

    let cancelled = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !cancelled) {
          generateSprites(videoUrl).then((frames) => {
            if (!cancelled && frames.length > 0) {
              spriteCache.set(videoUrl, frames);
              setSprites(frames);
            }
          });
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );

    observer.observe(containerRef.current);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [videoUrl]);

  const startAnimation = useCallback(() => {
    if (sprites.length === 0) return;
    setCurrentIndex(0);
    let idx = 0;
    animationRef.current = setInterval(() => {
      idx = (idx + 1) % sprites.length;
      setCurrentIndex(idx);
    }, 100);
  }, [sprites.length]);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
    setCurrentIndex(0);
  }, []);

  const handleMouseEnter = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovering(true);
      startAnimation();
    }, 250);
  }, [startAnimation]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovering(false);
    stopAnimation();
  }, [stopAnimation]);

  useEffect(() => {
    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const hasSprites = sprites.length > 0;
  const currentFrame = hasSprites ? sprites[currentIndex] : null;

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {hasSprites && isHovering && currentFrame && (
        <div className="absolute inset-0 z-20 overflow-hidden rounded-lg">
          <img src={currentFrame} alt="" className="w-full h-full object-cover" draggable={false} />
        </div>
      )}
    </div>
  );
}

async function generateSprites(videoUrl: string): Promise<string[]> {
  const frameCount = 10;
  const sprites: string[] = [];

  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      const duration = Math.min(video.duration, 5);
      const interval = duration / frameCount;
      let currentFrame = 0;

      const captureNext = () => {
        if (currentFrame >= frameCount) {
          video.src = "";
          resolve(sprites);
          return;
        }

        video.currentTime = currentFrame * interval;
      };

      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          sprites.push(canvas.toDataURL("image/jpeg", 0.5));
        }
        currentFrame++;
        captureNext();
      };

      captureNext();
    };

    video.onerror = () => resolve([]);
    video.src = videoUrl;
  });
}
