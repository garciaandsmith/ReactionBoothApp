export default function IllustrationStepLink({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* ── decorative background dots ── */}
      <circle cx="22"  cy="30"  r="4" fill="#2EE6A6" fillOpacity="0.5" />
      <circle cx="240" cy="48"  r="3" fill="#2EE6A6" fillOpacity="0.4" />
      <circle cx="14"  cy="168" r="3" fill="#2EE6A6" fillOpacity="0.3" />
      <path d="M240 20 L242 13 L244 20 L251 22 L244 24 L242 31 L240 24 L233 22Z" fill="#2EE6A6" fillOpacity="0.6" className="sparkle-b" />

      {/* ── phone ── */}
      {/* phone frame */}
      <rect x="60" y="36" width="82" height="144" rx="12" fill="#1a1a1a" />
      {/* screen */}
      <rect x="66" y="46" width="70" height="124" rx="8" fill="#F7F9F8" />
      {/* home indicator */}
      <rect x="88" y="164" width="26" height="4" rx="2" fill="#DDDDE0" />

      {/* screen content — YouTube URL input + share UI */}
      <rect x="70" y="54" width="62" height="38" rx="5" fill="#E8FDF5" />
      {/* URL bar */}
      <rect x="74" y="59" width="54" height="12" rx="4" fill="white" />
      <rect x="77" y="63" width="7" height="4" rx="2" fill="#2EE6A6" />
      <rect x="86" y="63" width="30" height="4" rx="2" fill="#BFBFBF" fillOpacity="0.7" />
      {/* create button */}
      <rect x="74" y="76" width="54" height="12" rx="6" fill="#2EE6A6" />
      <rect x="82" y="80" width="24" height="4" rx="2" fill="white" fillOpacity="0.75" />

      {/* divider */}
      <rect x="70" y="97" width="62" height="1" fill="#EAEAEA" />

      {/* link preview card */}
      <rect x="70" y="102" width="62" height="44" rx="4" fill="white" />
      <rect x="70" y="102" width="62" height="14" rx="4" fill="#E8FDF5" />
      <rect x="75" y="106" width="20" height="5" rx="2.5" fill="#2EE6A6" fillOpacity="0.6" />
      <rect x="75" y="120" width="50" height="5" rx="2.5" fill="#D0D0D0" fillOpacity="0.7" />
      <rect x="75" y="129" width="36" height="5" rx="2.5" fill="#D0D0D0" fillOpacity="0.5" />
      {/* copy icon */}
      <rect x="112" y="118" width="14" height="14" rx="3" fill="#2EE6A6" fillOpacity="0.2" />
      <rect x="115" y="121" width="8" height="8" rx="2" fill="#2EE6A6" />

      {/* ── paper plane ── */}
      <path d="M168 60 L142 76 L152 84 L168 60Z" fill="#2EE6A6" />
      <path d="M142 76 L148 96 L152 84 L142 76Z" fill="#20c98d" />
      {/* dotted trail */}
      <circle cx="134" cy="102" r="2" fill="#2EE6A6" fillOpacity="0.5" />
      <circle cx="127" cy="113" r="1.5" fill="#2EE6A6" fillOpacity="0.35" />
      <circle cx="122" cy="124" r="1.5" fill="#2EE6A6" fillOpacity="0.2" />

      {/* ── character ── */}
      {/* body — dark shirt, no outline */}
      <path d="M158 220 L160 172 Q162 158 174 152 Q184 148 198 146 L210 145 Q222 148 230 154 Q240 160 241 172 L244 220Z" fill="#121212" />
      {/* green collar accent */}
      <path d="M196 146 Q204 155 210 146" stroke="#2EE6A6" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* left arm — relaxed at side */}
      <path d="M163 168 Q156 188 154 208" stroke="#121212" strokeWidth="13" strokeLinecap="round" />
      <ellipse cx="153" cy="207" rx="10" ry="7" fill="#FFD4AF" transform="rotate(10 153 207)" />

      {/* right arm — raised, holding phone up */}
      <path d="M238 165 Q246 148 244 130" stroke="#121212" strokeWidth="13" strokeLinecap="round" />
      <ellipse cx="243" cy="130" rx="10" ry="7" fill="#FFD4AF" transform="rotate(-12 243 130)" />

      {/* neck */}
      <rect x="199" y="132" width="18" height="16" rx="7" fill="#FFD4AF" />

      {/* head */}
      <ellipse cx="208" cy="104" rx="30" ry="34" fill="#FFD4AF" />

      {/* hair — clean cap, no outline */}
      <path d="M178 94 Q180 62 208 64 Q236 62 238 94 Q234 72 208 74 Q182 72 178 94Z" fill="#2D2020" />
      {/* side hair left */}
      <path d="M178 91 Q172 104 175 118" stroke="#2D2020" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* ears */}
      <ellipse cx="178" cy="108" rx="7" ry="9" fill="#FFD4AF" />
      <ellipse cx="238" cy="108" rx="7" ry="9" fill="#FFD4AF" />

      {/* eyes — happy squint arcs */}
      <path d="M194 105 Q200 98 206 105" stroke="#2D2020" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M210 105 Q216 98 222 105" stroke="#2D2020" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* smile */}
      <path d="M196 118 Q208 129 220 118" stroke="#2D2020" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M196 118 Q208 131 220 118 L220 122 Q208 135 196 122Z" fill="white" fillOpacity="0.9" />

      {/* cheek blush */}
      <circle cx="190" cy="112" r="8" fill="#FFB3B3" fillOpacity="0.28" />
      <circle cx="226" cy="112" r="8" fill="#FFB3B3" fillOpacity="0.28" />
    </svg>
  );
}
