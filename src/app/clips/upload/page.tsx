"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { VideoTimeline } from "@/components/video-timeline";
import { TagSelector } from "@/components/tag-selector";

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface UploadState {
  file: File | null;
  preview: string | null;
  duration: number | null;
  trimStart: number;
  trimEnd: number;
  title: string;
  selectedTags: string[];
  uploading: boolean;
  progress: number;
  processing: boolean;
  success: boolean;
  clipId: string | null;
  error: string | null;
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

export default function UploadClipPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tags, setTags] = useState<Tag[]>([]);

  const [state, setState] = useState<UploadState>({
    file: null,
    preview: null,
    duration: null,
    trimStart: 0,
    trimEnd: 30,
    title: "",
    selectedTags: [],
    uploading: false,
    progress: 0,
    processing: false,
    success: false,
    clipId: null,
    error: null,
  });

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then((data) => setTags(data))
      .catch(() => {});
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) {
      setState((s) => ({ ...s, error: "Selecione um arquivo de video" }));
      return;
    }

    if (file.size > 300 * 1024 * 1024) {
      setState((s) => ({ ...s, error: "Arquivo muito grande. Maximo 300MB" }));
      return;
    }

    const url = URL.createObjectURL(file);
    setState((s) => ({
      ...s,
      file,
      preview: url,
      title: file.name.replace(/\.[^/.]+$/, ""),
      selectedTags: [],
      error: null,
      success: false,
      clipId: null,
    }));
  }, []);

  const handleVideoLoaded = useCallback(() => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      const maxDur = Math.min(dur, 30);
      setState((s) => ({
        ...s,
        duration: dur,
        trimEnd: maxDur,
      }));
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleTrimChange = useCallback((start: number, end: number) => {
    setState((s) => ({ ...s, trimStart: start, trimEnd: end }));
  }, []);

  const handleUpload = async () => {
    if (!state.file || !state.title) return;

    setState((s) => ({ ...s, uploading: true, progress: 0, error: null, success: false }));

    try {
      // Step 1: Get presigned URL
      const presignedResponse = await fetch("/api/clips/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: state.file.name,
          fileSize: state.file.size,
          contentType: state.file.type,
        }),
      });

      if (!presignedResponse.ok) {
        const error = await presignedResponse.json();
        throw new Error(error.message);
      }

      const { uploadId, presignedUrl, r2Key } = await presignedResponse.json();

      // Step 2: Upload directly to R2
      const xhr = new XMLHttpRequest();

      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setState((s) => ({ ...s, progress }));
          }
        });

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("Erro ao fazer upload pro R2"));
          }
        };

        xhr.onerror = () => reject(new Error("Erro de conexao"));
        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", state.file!.type);
        xhr.send(state.file);
      });

      setState((s) => ({ ...s, uploading: false, progress: 100 }));

      // Step 3: Notify server upload is complete
      const selectedTagNames = tags
        .filter((t) => state.selectedTags.includes(t.id))
        .map((t) => t.name);

      const completeResponse = await fetch("/api/clips/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadId,
          r2Key,
          title: state.title,
          tags: selectedTagNames,
          duration: state.trimEnd - state.trimStart,
        }),
      });

      if (!completeResponse.ok) {
        const error = await completeResponse.json();
        throw new Error(error.message);
      }

      const clip = await completeResponse.json();
      setState((s) => ({
        ...s,
        uploading: false,
        processing: false,
        success: true,
        clipId: clip.id,
      }));
    } catch (error) {
      setState((s) => ({
        ...s,
        uploading: false,
        processing: false,
        success: false,
        error: error instanceof Error ? error.message : "Erro ao fazer upload",
      }));
    }
  };

  return (
    <PageShell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="font-mono text-xs text-primary">$ ffmpeg -i upload.mp4</p>
          <h1 className="font-display mt-2 text-5xl sm:text-6xl">Enviar Clip</h1>
          <p className="font-mono mt-3 max-w-2xl text-sm text-muted-foreground">
            <span className="text-primary">&gt;</span> arraste um video ou clique para selecionar.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        {/* Success State */}
        {state.success && state.clipId && (
          <div className="rounded-lg border border-primary/50 bg-primary/10 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <CheckIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg text-foreground">Clip enviado com sucesso!</h3>
                <p className="font-mono text-sm text-muted-foreground">
                  Seu clip esta sendo processado e aparecera na biblioteca em breve.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/clips/${state.clipId}`}
                className="font-mono flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              >
                Ver clip <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/clips"
                className="font-mono text-sm text-muted-foreground hover:text-primary"
              >
                Ver todos os clips
              </Link>
              <button
                onClick={() => {
                  if (state.preview) URL.revokeObjectURL(state.preview);
                  setState({
                    file: null,
                    preview: null,
                    duration: null,
                    trimStart: 0,
                    trimEnd: 30,
                    title: "",
                    selectedTags: [],
                    uploading: false,
                    progress: 0,
                    processing: false,
                    success: false,
                    clipId: null,
                    error: null,
                  });
                }}
                className="font-mono text-sm text-muted-foreground hover:text-primary"
              >
                Enviar outro
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {state.error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertIcon className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-mono text-sm text-destructive">{state.error}</p>
                <button
                  onClick={() => setState((s) => ({ ...s, error: null }))}
                  className="font-mono text-xs text-destructive/70 hover:text-destructive mt-1"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Video Drop Zone or Preview */}
          {!state.file && !state.success ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card p-12 transition-colors hover:border-primary hover:bg-card/50 cursor-pointer"
            >
              <UploadIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="font-mono text-lg text-foreground mb-2">
                Arraste o video aqui
              </p>
              <p className="font-mono text-sm text-muted-foreground mb-4">
                ou clique para selecionar
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                MP4, WebM ou MOV • Maximo 300MB • Maximo 30 segundos
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          ) : state.file && !state.success ? (
            <>
              {/* Video Preview */}
              <div className="relative rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  src={state.preview || undefined}
                  controls
                  className="w-full max-h-[400px] object-contain"
                  onLoadedMetadata={handleVideoLoaded}
                />
                <button
                  onClick={() => {
                    URL.revokeObjectURL(state.preview!);
                    setState({
                      file: null,
                      preview: null,
                      duration: null,
                      trimStart: 0,
                      trimEnd: 30,
                      title: "",
                      selectedTags: [],
                      uploading: false,
                      progress: 0,
                      processing: false,
                      success: false,
                      clipId: null,
                      error: null,
                    });
                  }}
                  className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground hover:bg-background"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Video Timeline */}
              {state.duration !== null && (
                <VideoTimeline
                  videoRef={videoRef}
                  duration={state.duration}
                  trimStart={state.trimStart}
                  trimEnd={state.trimEnd}
                  onTrimChange={handleTrimChange}
                  maxDuration={30}
                />
              )}

              {/* Title */}
              <div>
                <label className="font-mono text-xs text-muted-foreground">
                  <span className="text-primary">&gt;</span> titulo
                </label>
                <input
                  type="text"
                  value={state.title}
                  onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))}
                  placeholder="Titulo do clip"
                  className="font-mono mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="font-mono text-xs text-muted-foreground">
                  <span className="text-primary">&gt;</span> tags
                </label>
                <div className="mt-1">
                  <TagSelector
                    tags={tags}
                    selected={state.selectedTags}
                    onChange={(selected) => setState((s) => ({ ...s, selectedTags: selected }))}
                  />
                </div>
              </div>

              {/* Upload Progress */}
              {state.uploading && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-foreground">Enviando...</span>
                    <span className="font-mono text-sm text-primary">{state.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${state.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Processing */}
              {state.processing && (
                <div className="rounded-lg border border-primary/50 bg-primary/10 p-4">
                  <p className="font-mono text-sm text-primary">
                    Processando video... O clip aparecera na biblioteca em breve.
                  </p>
                </div>
              )}

              {/* Submit */}
              {!state.uploading && !state.processing && (
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleUpload}
                    disabled={!state.title}
                    className="font-mono rounded-md bg-primary px-6 py-2.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    $ ffmpeg -i upload.mp4 -crf 23
                  </button>
                  <button
                    onClick={() => {
                      if (state.preview) URL.revokeObjectURL(state.preview);
                      setState({
                        file: null,
                        preview: null,
                        duration: null,
                        trimStart: 0,
                        trimEnd: 30,
                        title: "",
                        selectedTags: [],
                        uploading: false,
                        progress: 0,
                        processing: false,
                        success: false,
                        clipId: null,
                        error: null,
                      });
                    }}
                    className="font-mono text-sm text-muted-foreground hover:text-primary"
                  >
                    cancelar
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </section>
    </PageShell>
  );
}
