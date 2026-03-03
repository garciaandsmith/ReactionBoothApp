export default function IllustrationHero({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* ── drop shadow ── */}
      <ellipse cx="320" cy="372" rx="230" ry="10" fill="#121212" fillOpacity="0.08" />

      {/* ── browser window ── */}
      <rect x="40" y="16" width="560" height="344" rx="14" fill="#F7F9F8" />

      {/* chrome bar */}
      <rect x="40" y="16" width="560" height="44" rx="14" fill="#EAEAEA" />
      <rect x="40" y="44" width="560" height="16" fill="#EAEAEA" />

      {/* traffic lights */}
      <circle cx="72"  cy="38" r="7" fill="#FF6B6B" />
      <circle cx="96"  cy="38" r="7" fill="#FFBD2E" />
      <circle cx="120" cy="38" r="7" fill="#2EE6A6" />

      {/* address bar */}
      <rect x="144" y="26" width="352" height="24" rx="12" fill="white" fillOpacity="0.85" />
      <circle cx="160" cy="38" r="5" fill="#2EE6A6" fillOpacity="0.6" />
      <rect x="172" y="34" width="112" height="8" rx="4" fill="#BFBFBF" fillOpacity="0.5" />

      {/* tab/reload icon right */}
      <circle cx="516" cy="38" r="6" fill="white" fillOpacity="0.5" />
      <circle cx="536" cy="38" r="6" fill="white" fillOpacity="0.5" />

      {/* ── content area ── */}

      {/* left panel — video player */}
      <rect x="40" y="60" width="310" height="300" fill="#111827" />

      {/* video thumbnail — abstract colored blocks */}
      <rect x="40"  y="60"  width="310" height="300" fill="#0f1629" />
      <rect x="60"  y="88"  width="140" height="90"  rx="4" fill="#1e3a5f" fillOpacity="0.8" />
      <rect x="210" y="88"  width="120" height="42"  rx="4" fill="#1a4a3a" fillOpacity="0.7" />
      <rect x="210" y="136" width="120" height="42"  rx="4" fill="#2a1a4a" fillOpacity="0.7" />
      <rect x="60"  y="188" width="270" height="16"  rx="3" fill="#ffffff" fillOpacity="0.06" />
      <rect x="60"  y="210" width="200" height="12"  rx="3" fill="#ffffff" fillOpacity="0.04" />

      {/* centered play button */}
      <circle cx="195" cy="188" r="30" fill="white" fillOpacity="0.12" />
      <circle cx="195" cy="188" r="22" fill="white" fillOpacity="0.18" />
      <polygon points="187,178 187,198 210,188" fill="#2EE6A6" />

      {/* progress bar */}
      <rect x="40"  y="322" width="310" height="24" fill="#000000" fillOpacity="0.4" />
      <rect x="55"  y="330" width="280" height="4"  rx="2" fill="white" fillOpacity="0.15" />
      <rect x="55"  y="330" width="110" height="4"  rx="2" fill="#2EE6A6" />
      <circle cx="165" cy="332" r="5" fill="white" />

      {/* time / controls row */}
      <rect x="55"  y="340" width="28" height="6" rx="3" fill="white" fillOpacity="0.3" />
      <rect x="270" y="340" width="28" height="6" rx="3" fill="white" fillOpacity="0.3" />

      {/* ── divider ── */}
      <rect x="350" y="60" width="2" height="300" fill="#DDDDDD" fillOpacity="0.5" />

      {/* right panel — webcam reaction */}
      <rect x="352" y="60" width="248" height="300" fill="#E8FDF5" />

      {/* REC badge */}
      <rect x="484" y="72" width="52" height="20" rx="10" fill="#FF5F5F" />
      <circle cx="495" cy="82" r="5" fill="white" />
      <rect x="503" y="78" width="26" height="8" rx="4" fill="white" fillOpacity="0.85" />

      {/* webcam frame within panel */}
      <rect x="368" y="96" width="216" height="180" rx="8" fill="#c8f5e5" />

      {/* reaction face — clean flat style */}
      {/* head */}
      <ellipse cx="476" cy="176" rx="52" ry="58" fill="#FFD4AF" />
      {/* hair — clean cap shape */}
      <path d="M424 164 Q426 114 476 116 Q526 114 528 164 Q522 132 476 134 Q430 132 424 164Z" fill="#2D2020" />
      {/* ear left */}
      <ellipse cx="424" cy="180" rx="8" ry="11" fill="#FFD4AF" />
      {/* ear right */}
      <ellipse cx="528" cy="180" rx="8" ry="11" fill="#FFD4AF" />
      {/* eyebrow left — raised arch */}
      <path d="M450 156 Q460 148 470 154" stroke="#2D2020" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* eyebrow right */}
      <path d="M482 154 Q492 148 502 156" stroke="#2D2020" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* eyes — wide open circles */}
      <ellipse cx="460" cy="172" rx="10" ry="11" fill="white" />
      <circle cx="462" cy="174" r="6" fill="#2D2020" />
      <circle cx="464" cy="171" r="2" fill="white" />
      <ellipse cx="492" cy="172" rx="10" ry="11" fill="white" />
      <circle cx="494" cy="174" r="6" fill="#2D2020" />
      <circle cx="496" cy="171" r="2" fill="white" />
      {/* mouth — big smile */}
      <path d="M456 200 Q476 220 496 200" fill="none" stroke="#2D2020" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M456 200 Q476 222 496 200 L496 206 Q476 228 456 206Z" fill="white" />
      {/* cheeks */}
      <circle cx="444" cy="192" r="10" fill="#FFB3B3" fillOpacity="0.28" />
      <circle cx="508" cy="192" r="10" fill="#FFB3B3" fillOpacity="0.28" />

      {/* reaction tags floating right edge */}
      <rect x="490" y="120" width="72" height="26" rx="13" fill="#2EE6A6" />
      <rect x="498" y="130" width="56" height="8" rx="4" fill="white" fillOpacity="0.6" />

      <rect x="492" y="154" width="64" height="22" rx="11" fill="white" fillOpacity="0.85" />
      <rect x="500" y="162" width="48" height="7" rx="3.5" fill="#2EE6A6" fillOpacity="0.7" />

      {/* bottom bar */}
      <rect x="352" y="320" width="248" height="40" fill="#c8f5e5" fillOpacity="0.5" />
      <rect x="368" y="332" width="80" height="10" rx="5" fill="#2EE6A6" fillOpacity="0.6" />
      <rect x="456" y="332" width="60" height="10" rx="5" fill="#2EE6A6" fillOpacity="0.3" />

      {/* ── outer border on window ── */}
      <rect x="40" y="16" width="560" height="344" rx="14" stroke="#E0E0E0" strokeWidth="1.5" fill="none" />

      {/* ── floating decorative elements ── */}
      {/* sparkle top-left */}
      <path d="M18 56 L20.5 46 L23 56 L33 58.5 L23 61 L20.5 71 L18 61 L8 58.5Z" fill="#2EE6A6" className="sparkle-a" />
      {/* small dot */}
      <circle cx="22" cy="128" r="5" fill="#2EE6A6" fillOpacity="0.5" className="sparkle-b" />
      {/* sparkle top-right */}
      <path d="M614 44 L616 36 L618 44 L626 46 L618 48 L616 56 L614 48 L606 46Z" fill="#2EE6A6" className="sparkle-b" />
      {/* small dot right */}
      <circle cx="626" cy="120" r="4" fill="#2EE6A6" fillOpacity="0.4" className="sparkle-c" />
      {/* cross bottom-left */}
      <path d="M16 290 L16 306 M8 298 L24 298" stroke="#2EE6A6" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.5" />
      {/* cross bottom-right */}
      <path d="M618 280 L618 296 M610 288 L626 288" stroke="#121212" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.15" />
    </svg>
  );
}
