'use client';

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "./auth-provider";

const navItems = [
  { href: "/wiki", label: "~/Wiki", cmd: "~/wiki" },
  { href: "/clips", label: "~/Clipes", cmd: "~/clips" },
  { href: "/membros", label: "~/Membros", cmd: "~/membros"},
  { href: "/awards", label: "~/Awards", cmd: "~/awards" },
];

function UserIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
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

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

function UserDropdown({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    await logout();
  };

  if (!user) {
    return (
      <>
        <Link
          href="/login"
          className="font-mono block px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground rounded-t-lg"
          onClick={onClose}
        >
          Entrar
        </Link>
        <Link
          href="/register"
          className="font-mono block px-4 py-2.5 text-sm text-primary transition-colors hover:bg-accent rounded-b-lg"
          onClick={onClose}
        >
          Cadastrar
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="px-4 py-3 border-b border-border">
        <p className="font-mono text-sm text-foreground truncate">{user.name}</p>
        <p className="font-mono text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
      <Link
        href="/awards"
        className="font-mono block px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        onClick={onClose}
      >
        ~/Awards
      </Link>
      <button
        onClick={handleLogout}
        className="font-mono flex w-full items-center gap-2 px-4 py-2.5 text-sm text-destructive transition-colors hover:bg-accent rounded-b-lg"
      >
        <LogOutIcon className="h-4 w-4" />
        Sair
      </button>
    </>
  );
}

export function SiteHeader() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(target)) {
        setDesktopMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-baseline gap-1">
          <span className="font-favela text-2xl text-foreground">Favela</span>
          <span className="font-archive text-sm text-primary">Archive</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <div className="relative" ref={desktopMenuRef}>
            <button
              onClick={() => setDesktopMenuOpen(!desktopMenuOpen)}
              className="font-mono flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Menu do usuario"
            >
              {user ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs text-primary font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <UserIcon className="h-5 w-5" />
              )}
            </button>
            {desktopMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-card shadow-lg">
                <UserDropdown onClose={() => setDesktopMenuOpen(false)} />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <div className="relative" ref={mobileMenuRef}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Menu do usuario"
            >
              {user ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs text-primary font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <UserIcon className="h-5 w-5" />
              )}
            </button>
            {mobileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-card shadow-lg z-50">
                <UserDropdown onClose={() => setMobileMenuOpen(false)} />
              </div>
            )}
          </div>
          <button
            className="p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-mono rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
