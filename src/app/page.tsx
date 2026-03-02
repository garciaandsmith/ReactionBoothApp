import Link from "next/link";
import Image from "next/image";
import AnimatedLogo from "@/components/AnimatedLogo";
import HeroBackground from "@/components/HeroBackground";
import IllustrationHero from "@/components/illustrations/IllustrationHero";
import IllustrationStepLink from "@/components/illustrations/IllustrationStepLink";
import IllustrationStepRecord from "@/components/illustrations/IllustrationStepRecord";
import IllustrationStepWatch from "@/components/illustrations/IllustrationStepWatch";
import { isMaintenanceMode } from "@/lib/maintenance";

export default async function Home() {
  const maintenance = await isMaintenanceMode();

  if (maintenance) {
    return (
      <div className="min-h-screen bg-off-white flex flex-col items-center justify-center px-6 text-center">
        <Image
          src="/assets/mascotooh.svg"
          alt="Mascot"
          width={96}
          height={96}
          className="mb-8"
        />
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          We&apos;ll be right back
        </h1>
        <p className="text-gray-500 max-w-md mb-2">
          ReactionBooth is temporarily paused. We&apos;re doing some behind-the-scenes work.
        </p>
        <p className="text-gray-400 text-sm">Check back soon!</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative w-full overflow-hidden bg-off-white" style={{ minHeight: "560px" }}>
        <HeroBackground />

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-10 text-center">
          <div id="hero-wordmark" className="flex justify-center mb-10">
            <AnimatedLogo width={900} height={160} className="w-full max-w-3xl h-auto" />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 text-balance leading-tight">
            See their face when
            <br />
            they watch it
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 text-balance">
            ReactionBooth turns any YouTube link into a private reaction
            experience. Paste a link, share it, and capture their genuine
            reaction.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/signin"
              className="bg-brand text-soft-black px-8 py-3.5 rounded-xl font-medium hover:bg-brand-600 transition-colors text-lg"
            >
              Create a Reaction
            </Link>
            <a
              href="#how-it-works"
              className="text-gray-500 px-8 py-3.5 rounded-xl font-medium hover:text-gray-700 transition-colors text-lg"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* ── Hero illustration ── */}
      <section className="bg-brand-50/40 border-b border-brand-100/60">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <IllustrationHero className="w-full h-auto drop-shadow-sm" />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section
        id="how-it-works"
        className="max-w-5xl mx-auto px-4 py-20 border-t border-gray-100"
      >
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-soft-black px-4 py-1.5 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-brand-400 rounded-full" />
            No editing skills required
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
          Three steps. That&apos;s it.
        </h2>
        <p className="text-gray-500 text-center mb-16 max-w-xl mx-auto">
          No software to install, no editing required. Anyone can use it.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="text-center">
            <div className="bg-brand-50/70 rounded-2xl overflow-hidden mb-5 mx-auto max-w-[260px]">
              <IllustrationStepLink className="w-full h-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              1. Paste a YouTube link
            </h3>
            <p className="text-gray-500 text-sm">
              Any video — a wedding clip, music video, big announcement, or
              something funny you found at 2am.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="bg-brand-50/70 rounded-2xl overflow-hidden mb-5 mx-auto max-w-[260px]">
              <IllustrationStepRecord className="w-full h-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              2. Share the link
            </h3>
            <p className="text-gray-500 text-sm">
              We&apos;ll give you a private booth link. Share it however you
              want — text, DM, email, you name it.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="bg-brand-50/70 rounded-2xl overflow-hidden mb-5 mx-auto max-w-[260px]">
              <IllustrationStepWatch className="w-full h-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              3. Watch the reaction
            </h3>
            <p className="text-gray-500 text-sm">
              They press play, we record their face and voice. When done, the
              reaction video is ready to watch.
            </p>
          </div>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            Perfect for real moments
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Family surprises */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-4">
                <rect width="48" height="48" rx="12" fill="#E8FDF5" />
                {/* house */}
                <path d="M10 28 L24 14 L38 28 L38 40 L10 40Z" fill="#2EE6A6" stroke="#121212" strokeWidth="1.5" strokeLinejoin="round" />
                <rect x="18" y="31" width="12" height="9" rx="2" fill="#F7F9F8" stroke="#121212" strokeWidth="1.2" />
                {/* sparkle */}
                <path d="M35 12 L36 8 L37 12 L41 13 L37 14 L36 18 L35 14 L31 13Z" fill="#2EE6A6" />
              </svg>
              <h3 className="font-semibold text-gray-900 mb-1">Family surprises</h3>
              <p className="text-sm text-gray-500">
                Send a pregnancy announcement, wedding video, or family reunion clip
              </p>
            </div>

            {/* Creative testing */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-4">
                <rect width="48" height="48" rx="12" fill="#E8FDF5" />
                {/* film strip */}
                <rect x="8" y="16" width="32" height="20" rx="3" fill="#121212" stroke="#121212" strokeWidth="1.5" />
                <rect x="11" y="19" width="6" height="6" rx="1" fill="#F7F9F8" fillOpacity="0.3" />
                <rect x="21" y="19" width="6" height="6" rx="1" fill="#F7F9F8" fillOpacity="0.3" />
                <rect x="31" y="19" width="6" height="6" rx="1" fill="#F7F9F8" fillOpacity="0.3" />
                {/* play button */}
                <circle cx="24" cy="29" r="5" fill="#2EE6A6" />
                <polygon points="22,27 22,31 27,29" fill="#121212" />
              </svg>
              <h3 className="font-semibold text-gray-900 mb-1">Creative testing</h3>
              <p className="text-sm text-gray-500">
                Share a music video, short film, or project and get unfiltered feedback
              </p>
            </div>

            {/* Friend moments */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-4">
                <rect width="48" height="48" rx="12" fill="#E8FDF5" />
                {/* two chat bubbles */}
                <path d="M8 12 Q8 8 12 8 L30 8 Q34 8 34 12 L34 22 Q34 26 30 26 L20 26 L14 32 L14 26 L12 26 Q8 26 8 22Z" fill="#2EE6A6" stroke="#121212" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M18 28 Q18 24 22 24 L36 24 Q40 24 40 28 L40 36 Q40 40 36 40 L30 40 L26 44 L26 40 L22 40 Q18 40 18 36Z" fill="#F7F9F8" stroke="#121212" strokeWidth="1.5" strokeLinejoin="round" />
                {/* dots in bubbles */}
                <circle cx="16" cy="17" r="2" fill="white" />
                <circle cx="21" cy="17" r="2" fill="white" />
                <circle cx="26" cy="17" r="2" fill="white" />
              </svg>
              <h3 className="font-semibold text-gray-900 mb-1">Friend moments</h3>
              <p className="text-sm text-gray-500">
                Send a meme, throwback video, or inside joke and capture the laugh
              </p>
            </div>

            {/* Big reveals */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-4">
                <rect width="48" height="48" rx="12" fill="#E8FDF5" />
                {/* envelope */}
                <rect x="6" y="16" width="36" height="24" rx="4" fill="#F7F9F8" stroke="#121212" strokeWidth="1.5" />
                <path d="M6 18 L24 30 L42 18" stroke="#121212" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                {/* star bursting from envelope */}
                <path d="M28 12 L30 6 L32 12 L38 14 L32 16 L30 22 L28 16 L22 14Z" fill="#2EE6A6" stroke="#121212" strokeWidth="1" />
              </svg>
              <h3 className="font-semibold text-gray-900 mb-1">Big reveals</h3>
              <p className="text-sm text-gray-500">
                Gender reveals, gift unboxings, acceptance letters — the real stuff
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
          Simple pricing
        </h2>
        <p className="text-gray-500 text-center mb-16 max-w-xl mx-auto">
          Start for free. Upgrade when you need more control.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Free</h3>
            <p className="text-gray-500 text-sm mb-6">For casual use</p>
            <p className="text-3xl font-bold text-gray-900 mb-6">
              $0
              <span className="text-base font-normal text-gray-400">
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
                <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
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
              href="/auth/signin"
              className="block w-full text-center bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Get Started
            </Link>
          </div>
          <div className="bg-brand rounded-2xl p-8 relative overflow-hidden">
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
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          {/* mascot with sparkle decorations */}
          <div className="relative w-24 mx-auto mb-6">
            {/* glow ring behind mascot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-brand/25 rounded-full blur-2xl" />
            <Image
              src="/assets/mascotjoy.svg"
              alt="Celebrating mascot"
              width={96}
              height={96}
              className="relative mascot-joy"
            />
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
              <path d="M14 1 L16 12 L14 27 L12 12Z M1 14 L12 16 L27 14 L12 12Z" fill="#121212" fillOpacity="0.4" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            &ldquo;I wish I could see your face when you watch this.&rdquo;
          </h2>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto">
            Now you can. Create your first reaction in under a minute.
          </p>
          <Link
            href="/auth/signin"
            className="inline-block bg-brand text-soft-black px-8 py-3.5 rounded-xl font-medium hover:bg-brand-600 transition-colors text-lg"
          >
            Create a Reaction
          </Link>
        </div>
      </section>
    </div>
  );
}
