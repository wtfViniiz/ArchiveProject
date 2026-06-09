"use client";

import dynamic from "next/dynamic";
import { useTheme } from "./theme-provider";

const DotField = dynamic(() => import("./dot-field"), { ssr: false });
const DecryptedText = dynamic(() => import("./decrypted-text"), { ssr: false });

function TerminalIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" x2="20" y1="19" y2="19" />
    </svg>
  );
}

export function HeroSection() {
  const { theme } = useTheme();

  const isDark = theme === "dark";

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 z-0">
        <DotField
          dotRadius={2}
          dotSpacing={12}
          bulgeStrength={67}
          glowRadius={180}
          sparkle={false}
          waveAmplitude={0}
          gradientFrom={isDark ? "rgba(239, 68, 68, 0.5)" : "rgba(220, 38, 38, 0.3)"}
          gradientTo={isDark ? "rgba(239, 68, 68, 0.25)" : "rgba(220, 38, 38, 0.15)"}
          glowColor={isDark ? "#0c0c0c" : "#FFFF"}
        />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 scanlines opacity-40" />
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center sm:py-28">
        <div className="mt-6 animate-fade-in-up">
          <h1 className="text-5xl leading-none sm:text-7xl">
            <DecryptedText
              text="Favela Archive"
              speed={40}
              maxIterations={15}
              sequential={true}
              revealDirection="center"
              animateOn="view"
              className="font-favela text-foreground"
              parentClassName="inline-flex"
              encryptedClassName="font-favela text-primary opacity-60"
            />
          </h1>
        </div>
        <p className="font-mono mt-3 text-xs text-muted-foreground sm:text-sm animate-fade-in-up" style={{ animationDelay: "0.3s", opacity: 0 }}>
          <span className="text-primary">$</span> man favela-archive <span className="opacity-50">— Favelagem</span>
        </p>

        <div className="mt-10 w-full max-w-xl animate-fade-in-up" style={{ animationDelay: "0.6s", opacity: 0 }}>
          <label className="group flex items-center gap-3 rounded-md border border-border bg-card/70 px-4 py-3 transition-colors focus-within:border-primary">
            <TerminalIcon className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm text-muted-foreground">$ grep -r</span>
            <input
              type="text"
              placeholder="input.search()."
              className="font-mono flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
            />
            <kbd className="font-mono hidden rounded border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground sm:inline">
              ⌘K
            </kbd>
          </label>
        </div>
      </div>
    </section>
  );
}
