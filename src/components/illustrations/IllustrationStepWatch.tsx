export default function IllustrationStepWatch({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* ── decorative elements ── */}
      <path d="M14 30 L16 22 L18 30 L26 32 L18 34 L16 42 L14 34 L6 32Z" fill="#2EE6A6" fillOpacity="0.6" className="sparkle-a" />
      <circle cx="248" cy="54" r="4" fill="#2EE6A6" fillOpacity="0.4" />
      <circle cx="12"  cy="168" r="3" fill="#2EE6A6" fillOpacity="0.3" />
      <path d="M240 168 L242 162 L244 168 L250 170 L244 172 L242 178 L240 172 L234 170Z" fill="#2EE6A6" fillOpacity="0.45" className="sparkle-c" />

      {/* ── monitor ── */}
      {/* stand neck */}
      <rect x="121" y="110" width="18" height="14" rx="3" fill="#CFCFCF" />
      {/* stand base */}
      <rect x="106" y="122" width="48" height="8"  rx="4" fill="#CFCFCF" />

      {/* monitor frame */}
      <rect x="48" y="16" width="164" height="98" rx="10" fill="#1a1a1a" />
      {/* bezel top */}
      <rect x="56" y="24" width="148" height="82" rx="6" fill="#F7F9F8" />

      {/* left video panel — dark */}
      <rect x="58" y="26" width="70" height="78" rx="4" fill="#111827" />
      {/* video thumbnail blocks */}
      <rect x="64" y="32" width="30" height="20" rx="2" fill="#1e3a5f" fillOpacity="0.8" />
      <rect x="98" y="32" width="24" height="10" rx="2" fill="#1a4a3a" fillOpacity="0.7" />
      <rect x="98" y="44" width="24" height="10" rx="2" fill="#2a1a4a" fillOpacity="0.6" />
      {/* play button */}
      <circle cx="93" cy="65" r="13" fill="white" fillOpacity="0.1" />
      <polygon points="88,59 88,71 100,65" fill="#2EE6A6" />
      {/* mini progress bar */}
      <rect x="64" y="91" width="58" height="4" rx="2" fill="white" fillOpacity="0.12" />
      <rect x="64" y="91" width="22" height="4" rx="2" fill="#2EE6A6" />

      {/* divider */}
      <rect x="130" y="26" width="1.5" height="78" fill="#DDDDDD" fillOpacity="0.6" />

      {/* right reaction panel — light */}
      <rect x="132" y="26" width="70" height="78" rx="4" fill="#E8FDF5" />
      {/* mini reaction face */}
      <ellipse cx="167" cy="58" rx="20" ry="22" fill="#FFD4AF" />
      {/* hair */}
      <path d="M147 50 Q148 32 167 33 Q186 32 187 50 Q184 38 167 39 Q150 38 147 50Z" fill="#2D2020" />
      {/* eyes happy squint */}
      <path d="M155 58 Q159 53 163 58" stroke="#2D2020" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M171 58 Q175 53 179 58" stroke="#2D2020" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* big smile */}
      <path d="M155 68 Q167 78 179 68" stroke="#2D2020" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M155 68 Q167 80 179 68 L179 72 Q167 84 155 72Z" fill="white" fillOpacity="0.9" />
      {/* cheeks */}
      <circle cx="150" cy="64" r="7" fill="#FFB3B3" fillOpacity="0.28" />
      <circle cx="184" cy="64" r="7" fill="#FFB3B3" fillOpacity="0.28" />
      {/* sparkle tag on screen */}
      <path d="M190 30 L191.5 24 L193 30 L199 31.5 L193 33 L191.5 39 L190 33 L184 31.5Z" fill="#2EE6A6" className="sparkle-b" />

      {/* ── character ── */}
      {/* body — dark shirt, no outline */}
      <path d="M48 220 L50 174 Q52 160 66 152 Q78 146 96 144 L112 143 Q128 146 144 153 Q156 160 157 174 L160 220Z" fill="#121212" />
      {/* green collar accent */}
      <path d="M94 144 Q104 154 112 144" stroke="#2EE6A6" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* left arm — raised in excitement */}
      <path d="M54 168 Q40 148 42 128" stroke="#121212" strokeWidth="14" strokeLinecap="round" />
      <ellipse cx="42" cy="128" rx="10" ry="8" fill="#FFD4AF" transform="rotate(-20 42 128)" />

      {/* right arm — raised in excitement */}
      <path d="M155 168 Q169 148 167 128" stroke="#121212" strokeWidth="14" strokeLinecap="round" />
      <ellipse cx="167" cy="128" rx="10" ry="8" fill="#FFD4AF" transform="rotate(20 167 128)" />

      {/* neck */}
      <rect x="95" y="130" width="18" height="16" rx="7" fill="#FFD4AF" />

      {/* head */}
      <ellipse cx="104" cy="102" rx="30" ry="34" fill="#FFD4AF" />

      {/* hair */}
      <path d="M74 90 Q76 58 104 60 Q132 58 134 90 Q130 68 104 70 Q78 68 74 90Z" fill="#121212" />
      <path d="M74 87 Q68 100 71 117" stroke="#121212" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* ears */}
      <ellipse cx="74"  cy="106" rx="7" ry="9" fill="#FFD4AF" />
      <ellipse cx="134" cy="106" rx="7" ry="9" fill="#FFD4AF" />

      {/* eyes — happy crescents */}
      <path d="M90 102 Q96 95 102 102" stroke="#121212" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M106 102 Q112 95 118 102" stroke="#121212" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* big laugh */}
      <path d="M90 116 Q104 130 118 116" stroke="#121212" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M90 116 Q104 132 118 116 L118 120 Q104 136 90 120Z" fill="white" fillOpacity="0.9" />

      {/* cheeks */}
      <circle cx="84"  cy="113" r="8" fill="#FFB3B3" fillOpacity="0.28" />
      <circle cx="124" cy="113" r="8" fill="#FFB3B3" fillOpacity="0.28" />
    </svg>
  );
}
