import Link from "next/link";
import Image from "next/image";
import AnimatedLogo from "@/components/AnimatedLogo";
import HeroBackground from "@/components/HeroBackground";

export default function Home() {
  return (
    <div>
      {/* Hero — full viewport width so background fills edge-to-edge */}
      <section className="relative w-full overflow-hidden bg-off-white" style={{ minHeight: "520px" }}>
        {/* Cursor-reactive geometric circles */}
        <HeroBackground />

        {/* Content — centred, width-constrained */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-20 text-center">
          {/* Large animated wordmark */}
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

      {/* How It Works */}
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
          <div className="text-center">
            <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2EE6A6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              1. Paste a YouTube link
            </h3>
            <p className="text-gray-500 text-sm">
              Any video — a wedding clip, music video, big announcement, or
              something funny you found at 2am.
            </p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2EE6A6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              2. Share the link
            </h3>
            <p className="text-gray-500 text-sm">
              We&apos;ll give you a private booth link. Share it however you
              want — text, DM, email, you name it.
            </p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2EE6A6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
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

      {/* Use Cases */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            Perfect for real moments
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Family surprises",
                desc: "Send a pregnancy announcement, wedding video, or family reunion clip",
                icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z",
              },
              {
                title: "Creative testing",
                desc: "Share a music video, short film, or project and get unfiltered feedback",
                icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
              },
              {
                title: "Friend moments",
                desc: "Send a meme, throwback video, or inside joke and capture the laugh",
                icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
              },
              {
                title: "Big reveals",
                desc: "Gender reveals, gift unboxings, acceptance letters — the real stuff",
                icon: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
              },
            ].map((item) => (
              <div key={item.title} className="bg-gray-50 rounded-2xl p-6">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2EE6A6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-4"
                >
                  <path d={item.icon} />
                </svg>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
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

      {/* CTA */}
      <section className="bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <Image
            src="/assets/mascotjoy.svg"
            alt="Celebrating mascot"
            width={96}
            height={96}
            className="mx-auto mb-6 mascot-joy"
          />
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
