"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AnimatedLogo from "./AnimatedLogo";

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  // Hide mascot once the hero wordmark scrolls out of view
  const [heroVisible, setHeroVisible] = useState(isHomepage);

  // Scroll state: transparent at top → frosted glass on scroll (homepage only)
  const [scrolled, setScrolled] = useState(false);

  // Reading-progress bar percentage (0–100)
  const [progress, setProgress] = useState(0);

  // Sliding pill position
  const navRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0, visible: false });

  /* ── scroll handler ── */
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? (y / total) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── hero wordmark observer ── */
  useEffect(() => {
    if (!isHomepage) {
      setHeroVisible(false);
      return;
    }
    setHeroVisible(true);
    const el = document.getElementById("hero-wordmark");
    if (!el) {
      setHeroVisible(false);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isHomepage]);

  /* ── sliding pill handlers ── */
  const onLinkEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (!navRef.current) return;
    const navRect = navRef.current.getBoundingClientRect();
    const rect = e.currentTarget.getBoundingClientRect();
    setPill({ left: rect.left - navRect.left, width: rect.width, visible: true });
  };
  const onNavLeave = () => setPill((p) => ({ ...p, visible: false }));

  // Homepage: start transparent, solidify on scroll.
  // All other pages: always solid.
  const solid = scrolled || !isHomepage;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        solid
          ? "bg-[var(--surface)]/90 backdrop-blur-lg border-b border-[var(--border-subtle)] shadow-[0_1px_0_var(--border-subtle)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      {/* Reading progress bar */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[2px] bg-brand/70 pointer-events-none"
        style={{ width: `${progress}%`, transition: "width 80ms linear" }}
      />

      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* ── Logo ── */}
        <Link
          href="/"
          className="group relative flex items-center"
          style={{ minWidth: 40, minHeight: 40 }}
        >
          {/* Mascot — shown while hero wordmark is on screen */}
          <span
            className="absolute inset-0 flex items-center transition-all duration-300 ease-out"
            style={{
              opacity:       heroVisible ? 1 : 0,
              transform:     heroVisible ? "scale(1) rotate(0deg)" : "scale(0.7) rotate(-8deg)",
              pointerEvents: heroVisible ? "auto" : "none",
            }}
          >
            <Image
              src="/assets/mascotsmile.svg"
              alt="ReactionBooth"
              width={40}
              height={40}
              className="group-hover:scale-110 group-hover:rotate-12 transition-transform duration-200 ease-out"
            />
          </span>

          {/* AnimatedLogo — shown after hero scrolls away */}
          <span
            className="transition-all duration-300 ease-out"
            style={{
              opacity:       heroVisible ? 0 : 1,
              transform:     heroVisible ? "scale(0.85) translateX(-6px)" : "scale(1) translateX(0)",
              pointerEvents: heroVisible ? "none" : "auto",
            }}
          >
            <AnimatedLogo width={180} height={32} />
          </span>
        </Link>

        {/* ── Nav ── */}
        <nav
          ref={navRef}
          className="flex items-center gap-1 relative"
          onMouseLeave={onNavLeave}
        >
          {/* Sliding highlight pill */}
          <div
            aria-hidden="true"
            className="absolute top-1/2 -translate-y-1/2 h-8 rounded-lg bg-brand-50/80 dark:bg-brand-700/20 pointer-events-none"
            style={{
              left:    pill.left,
              width:   pill.width,
              opacity: pill.visible ? 1 : 0,
              transition:
                "left 0.2s cubic-bezier(0.16,1,0.3,1), width 0.2s cubic-bezier(0.16,1,0.3,1), opacity 0.14s ease",
            }}
          />

          {session ? (
            <>
              {(session.user as { role?: string })?.role === "admin" && (
                <Link
                  href="/admin"
                  onMouseEnter={onLinkEnter}
                  className="relative z-10 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors px-3 py-2 rounded-lg"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard"
                onMouseEnter={onLinkEnter}
                className="relative z-10 text-sm text-[var(--text-muted)] hover:text-foreground transition-colors px-3 py-2 rounded-lg"
              >
                Dashboard
              </Link>
              <button
                onClick={() => signOut()}
                onMouseEnter={onLinkEnter}
                className="relative z-10 text-sm text-[var(--text-muted)] hover:text-foreground transition-colors px-3 py-2 rounded-lg"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="nav-cta text-sm bg-brand text-soft-black px-4 py-2 rounded-lg font-medium"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
