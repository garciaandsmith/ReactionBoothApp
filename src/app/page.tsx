import Link from "next/link";
import { getServerSession } from "next-auth";
import AnimatedLogo from "@/components/AnimatedLogo";
import HeroBackground from "@/components/HeroBackground";
import ScrollReveal from "@/components/ScrollReveal";
import MascotJoyAnimated from "@/components/MascotJoyAnimated";
import { isMaintenanceMode } from "@/lib/maintenance";
import { authOptions } from "@/lib/auth";
import Image from "next/image";

export default async function Home() {
  const maintenance = await isMaintenanceMode();

  if (maintenance) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <Image
          src="/assets/mascotooh.svg"
          alt="Mascot"
          width={96}
          height={96}
          className="mb-8"
        />
        <h1 className="text-4xl font-bold text-foreground mb-4">
          We&apos;ll be right back
        </h1>
        <p className="text-[var(--text-muted)] max-w-md mb-2">
          ReactionBooth is temporarily paused. We&apos;re doing some behind-the-scenes work.
        </p>
        <p className="text-[var(--text-muted)] text-sm opacity-70">Check back soon!</p>
      </div>
    );
  }

  const session = await getServerSession(authOptions);
  const createHref = session ? "/create" : "/auth/signin";

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative w-full overflow-hidden bg-background" style={{ minHeight: "560px" }}>
        <HeroBackground />

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-10 text-center">
          <div id="hero-wordmark" className="flex justify-center mb-10">
            <AnimatedLogo width={900} height={160} className="w-full max-w-3xl h-auto" />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance leading-tight">
            See their face when
            <br />
            they watch it
          </h1>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto mb-10 text-balance">
            ReactionBooth turns any YouTube link into a private reaction
            experience. Paste a link, share it, and capture their genuine
            reaction.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={createHref}
              className="bg-brand text-soft-black px-8 py-3.5 rounded-xl font-medium hover:bg-brand-600 transition-colors text-lg"
            >
              Create a Reaction
            </Link>
            <a
              href="#how-it-works"
              className="text-[var(--text-muted)] px-8 py-3.5 rounded-xl font-medium hover:text-foreground transition-colors text-lg"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section
        id="how-it-works"
        className="max-w-5xl mx-auto px-4 py-20 border-t border-[var(--border-subtle)]"
      >
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-700/20 text-soft-black dark:text-brand-200 px-4 py-1.5 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-brand-400 rounded-full" />
            No editing skills required
          </div>
        </div>
        <h2 className="text-3xl font-bold text-foreground text-center mb-4">
          Three steps. That&apos;s it.
        </h2>
        <p className="text-[var(--text-muted)] text-center mb-16 max-w-xl mx-auto">
          No software to install, no editing required. Anyone can use it.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 — create a booth */}
          <ScrollReveal delay={0}>
            <div className="text-center card-lift rounded-2xl p-8 bg-[var(--surface-alt)]">
              <div className="flex justify-center mb-6">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                  <rect width="64" height="64" rx="16" fill="#E8FDF5" />
                  {/* chain link left */}
                  <rect x="10" y="25" width="20" height="14" rx="7" fill="none" stroke="#2EE6A6" strokeWidth="2.5" />
                  {/* chain link right */}
                  <rect x="34" y="25" width="20" height="14" rx="7" fill="none" stroke="#2EE6A6" strokeWidth="2.5" />
                  {/* overlap cover */}
                  <rect x="26" y="29" width="12" height="6" fill="#E8FDF5" />
                  {/* center connector */}
                  <line x1="28" y1="32" x2="36" y2="32" stroke="#2EE6A6" strokeWidth="2.5" strokeLinecap="round" />
                  {/* sparkle */}
                  <path d="M48 12 L49.5 7 L51 12 L56 13.5 L51 15 L49.5 20 L48 15 L43 13.5Z" fill="#2EE6A6" fillOpacity="0.7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                1. Create a booth
              </h3>
              <p className="text-[var(--text-muted)] text-sm">
                Wedding clips, new songs and old memes — just paste a YouTube URL
                to create a Reaction Booth.
              </p>
            </div>
          </ScrollReveal>

          {/* Step 2 — share the link */}
          <ScrollReveal delay={150}>
            <div className="text-center card-lift rounded-2xl p-8 bg-[var(--surface-alt)]">
              <div className="flex justify-center mb-6">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                  <rect width="64" height="64" rx="16" fill="#E8FDF5" />
                  {/* paper plane body */}
                  <path d="M12 32 L52 14 L40 52 L30 38 Z" fill="#2EE6A6" />
                  {/* fold line */}
                  <path d="M30 38 L52 14" stroke="#20c98d" strokeWidth="1.5" fill="none" />
                  {/* dot trail */}
                  <circle cx="24" cy="43" r="2"   fill="#2EE6A6" fillOpacity="0.45" />
                  <circle cx="18" cy="48" r="1.5" fill="#2EE6A6" fillOpacity="0.28" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                2. Share the link
              </h3>
              <p className="text-[var(--text-muted)] text-sm">
                Use text, DM, email, or whatever you want to get a friend to
                enter a booth and record their live reaction.
              </p>
            </div>
          </ScrollReveal>

          {/* Step 3 — watch, download, share */}
          <ScrollReveal delay={300}>
            <div className="text-center card-lift rounded-2xl p-8 bg-[var(--surface-alt)]">
              <div className="flex justify-center mb-6">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                  <rect width="64" height="64" rx="16" fill="#E8FDF5" />
                  {/* monitor frame */}
                  <rect x="8"  y="14" width="48" height="30" rx="5" fill="#121212" />
                  <rect x="12" y="18" width="40" height="22" rx="3" fill="#F7F9F8" />
                  {/* split screen divider */}
                  <rect x="31" y="18" width="1.5" height="22" fill="#EAEAEA" />
                  {/* play triangle — left panel */}
                  <polygon points="19,25 19,35 28,30" fill="#2EE6A6" />
                  {/* reaction face — right panel */}
                  <circle cx="39" cy="27" r="5" fill="#FFD4AF" />
                  <path d="M36 30 Q39 34 42 30" stroke="#121212" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                  {/* stand */}
                  <rect x="28" y="44" width="8"  height="5"  rx="1.5" fill="#121212" />
                  <rect x="23" y="49" width="18" height="4"  rx="2"   fill="#121212" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                3. Watch, download, share
              </h3>
              <p className="text-[var(--text-muted)] text-sm">
                They press play, we record the video and their face. After that,
                you&apos;ll be able to download the combined videos.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section className="bg-[var(--surface)] border-y border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-foreground text-center mb-16">
            Perfect for real moments
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Family surprises */}
            <ScrollReveal delay={0}>
              <div className="bg-[var(--surface-card)] rounded-2xl p-6 card-lift h-full">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-4">
                  <rect width="48" height="48" rx="12" fill="#E8FDF5" />
                  <path d="M10 28 L24 14 L38 28 L38 40 L10 40Z" fill="#2EE6A6" stroke="#121212" strokeWidth="1.5" strokeLinejoin="round" />
                  <rect x="18" y="31" width="12" height="9" rx="2" fill="#F7F9F8" stroke="#121212" strokeWidth="1.2" />
                  <path d="M35 12 L36 8 L37 12 L41 13 L37 14 L36 18 L35 14 L31 13Z" fill="#2EE6A6" />
                </svg>
                <h3 className="font-semibold text-foreground mb-1">Family surprises</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Send a pregnancy announcement, wedding video, or family reunion clip
                </p>
              </div>
            </ScrollReveal>

            {/* Creative testing */}
            <ScrollReveal delay={100}>
              <div className="bg-[var(--surface-card)] rounded-2xl p-6 card-lift h-full">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-4">
                  <rect width="48" height="48" rx="12" fill="#E8FDF5" />
                  <rect x="8" y="16" width="32" height="20" rx="3" fill="#121212" stroke="#121212" strokeWidth="1.5" />
                  <rect x="11" y="19" width="6" height="6" rx="1" fill="#F7F9F8" fillOpacity="0.3" />
                  <rect x="21" y="19" width="6" height="6" rx="1" fill="#F7F9F8" fillOpacity="0.3" />
                  <rect x="31" y="19" width="6" height="6" rx="1" fill="#F7F9F8" fillOpacity="0.3" />
                  <circle cx="24" cy="29" r="5" fill="#2EE6A6" />
                  <polygon points="22,27 22,31 27,29" fill="#121212" />
                </svg>
                <h3 className="font-semibold text-foreground mb-1">Creative testing</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Share a music video, short film, or project and get unfiltered feedback
                </p>
              </div>
            </ScrollReveal>

            {/* Friend moments */}
            <ScrollReveal delay={200}>
              <div className="bg-[var(--surface-card)] rounded-2xl p-6 card-lift h-full">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-4">
                  <rect width="48" height="48" rx="12" fill="#E8FDF5" />
                  <path d="M8 12 Q8 8 12 8 L30 8 Q34 8 34 12 L34 22 Q34 26 30 26 L20 26 L14 32 L14 26 L12 26 Q8 26 8 22Z" fill="#2EE6A6" stroke="#121212" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M18 28 Q18 24 22 24 L36 24 Q40 24 40 28 L40 36 Q40 40 36 40 L30 40 L26 44 L26 40 L22 40 Q18 40 18 36Z" fill="#F7F9F8" stroke="#121212" strokeWidth="1.5" strokeLinejoin="round" />
                  <circle cx="16" cy="17" r="2" fill="white" />
                  <circle cx="21" cy="17" r="2" fill="white" />
                  <circle cx="26" cy="17" r="2" fill="white" />
                </svg>
                <h3 className="font-semibold text-foreground mb-1">Friend moments</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Send a meme, throwback video, or inside joke and capture the laugh
                </p>
              </div>
            </ScrollReveal>

            {/* Big reveals */}
            <ScrollReveal delay={300}>
              <div className="bg-[var(--surface-card)] rounded-2xl p-6 card-lift h-full">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-4">
                  <rect width="48" height="48" rx="12" fill="#E8FDF5" />
                  <rect x="6" y="16" width="36" height="24" rx="4" fill="#F7F9F8" stroke="#121212" strokeWidth="1.5" />
                  <path d="M6 18 L24 30 L42 18" stroke="#121212" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M28 12 L30 6 L32 12 L38 14 L32 16 L30 22 L28 16 L22 14Z" fill="#2EE6A6" stroke="#121212" strokeWidth="1" />
                </svg>
                <h3 className="font-semibold text-foreground mb-1">Big reveals</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Gender reveals, gift unboxings, acceptance letters — the real stuff
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-foreground text-center mb-4">
          Simple pricing
        </h2>
        <p className="text-[var(--text-muted)] text-center mb-16 max-w-xl mx-auto">
          Start for free. Upgrade when you need more control.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <ScrollReveal delay={0}>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 card-lift h-full">
              <h3 className="text-lg font-semibold text-foreground mb-1">Free</h3>
              <p className="text-[var(--text-muted)] text-sm mb-6">For casual use</p>
              <p className="text-3xl font-bold text-foreground mb-6">
                $0
                <span className="text-base font-normal text-[var(--text-muted)]">
                  /forever
                </span>
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "3 reactions per day",
                  "5-minute max video length",
                  "7-day link lifespan",
                  "ReactionBooth watermark",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#2EE6A6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={createHref}
                className="block w-full text-center bg-[var(--surface-card)] text-foreground py-3 rounded-xl font-medium hover:bg-[var(--surface-alt)] transition-colors"
              >
                Get Started
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <div className="bg-brand rounded-2xl p-8 relative overflow-hidden card-lift h-full">
              <div className="absolute top-4 right-4 bg-soft-black/20 backdrop-blur-sm text-xs font-medium px-3 py-1 rounded-full text-soft-black">
                Popular
              </div>
              <h3 className="text-lg font-semibold text-soft-black mb-1">Pro</h3>
              <p className="text-soft-black/60 text-sm mb-6">For power users</p>
              <p className="text-3xl font-bold text-soft-black mb-6">
                $9
                <span className="text-base font-normal text-soft-black/60">
                  /month
                </span>
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited reactions",
                  "30-minute max video length",
                  "30-day link lifespan",
                  "No watermark",
                  "Project dashboard",
                  "Custom branding & layouts",
                  "Multiple download formats",
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-3 text-sm text-soft-black/80"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#121212"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                disabled
                className="block w-full text-center bg-soft-black/50 text-white/70 py-3 rounded-xl font-medium cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[var(--surface)] border-t border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          {/* mascot with sparkle decorations */}
          <div className="relative w-24 mx-auto mb-6">
            {/* glow ring behind mascot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-brand/25 rounded-full blur-2xl" />
            <MascotJoyAnimated className="relative w-24 h-24" />
            {/* sparkle top-right */}
            <svg className="absolute -top-3 -right-7 w-7 h-7 sparkle-a" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <path d="M14 1 L16 12 L14 27 L12 12Z M1 14 L12 16 L27 14 L12 12Z" fill="#2EE6A6" />
            </svg>
            {/* sparkle top-left */}
            <svg className="absolute -top-1 -left-8 w-5 h-5 sparkle-b" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <path d="M14 1 L16 12 L14 27 L12 12Z M1 14 L12 16 L27 14 L12 12Z" fill="#2EE6A6" />
            </svg>
            {/* sparkle bottom-right */}
            <svg className="absolute -bottom-2 -right-3 w-4 h-4 sparkle-c" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <path d="M14 1 L16 12 L14 27 L12 12Z M1 14 L12 16 L27 14 L12 12Z" fill="#2EE6A6" fillOpacity="0.5" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            &ldquo;I wish I could see your face when you watch this.&rdquo;
          </h2>
          <p className="text-[var(--text-muted)] mb-8 max-w-lg mx-auto">
            Now you can. Create your first reaction in under a minute.
          </p>
          <Link
            href={createHref}
            className="inline-block bg-brand text-soft-black px-8 py-3.5 rounded-xl font-medium hover:bg-brand-600 transition-colors text-lg"
          >
            Create a Reaction
          </Link>
        </div>
      </section>
    </div>
  );
}
