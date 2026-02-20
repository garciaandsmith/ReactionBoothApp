"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import AnimatedLogo from "./AnimatedLogo";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-muted-gray bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <AnimatedLogo width={180} height={32} />
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
