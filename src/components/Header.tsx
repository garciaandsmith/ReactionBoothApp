"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AnimatedLogo from "./AnimatedLogo";

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  // Show the face icon when the hero wordmark is visible on screen.
  // Once it scrolls out of view, swap in the full animated wordmark.
  const [heroVisible, setHeroVisible] = useState(isHomepage);

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

  return (
    <header className="border-b border-muted-gray bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {heroVisible ? (
            <Image
              src="/assets/mascotsmile.svg"
              alt="ReactionBooth"
              width={40}
              height={40}
              className="transition-all duration-300"
            />
          ) : (
            <AnimatedLogo width={180} height={32} className="transition-all duration-300" />
          )}
        </Link>

        <nav className="flex items-center gap-6">
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="text-sm bg-brand text-soft-black px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors font-medium"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
