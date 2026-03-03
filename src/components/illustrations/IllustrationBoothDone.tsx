export default function IllustrationBoothDone({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* ── confetti ── */}
      <rect x="44"  y="16"  width="14" height="7"  rx="2" fill="#2EE6A6" transform="rotate(-28 44 16)"  fillOpacity="0.9" />
      <rect x="220" y="11"  width="12" height="6"  rx="2" fill="#2EE6A6" transform="rotate(22 220 11)"  />
      <rect x="140" y="6"   width="10" height="10" rx="2" fill="#20c98d" transform="rotate(45 140 6)"   fillOpacity="0.6" />
      <circle cx="76"  cy="26" r="5" fill="#2EE6A6" fillOpacity="0.7" />
      <circle cx="226" cy="30" r="6" fill="#2EE6A6" />
      <rect x="24"  y="60"  width="10" height="5"  rx="1.5" fill="#2EE6A6" transform="rotate(-18 24 60)" />
      <rect x="262" y="52"  width="10" height="5"  rx="1.5" fill="#2EE6A6" transform="rotate(32 262 52)" fillOpacity="0.8" />
      <rect x="36"  y="216" width="12" height="6"  rx="2" fill="#2EE6A6" transform="rotate(17 36 216)"  fillOpacity="0.8" />
      <rect x="244" y="210" width="14" height="7"  rx="2" fill="#2EE6A6" transform="rotate(-22 244 210)" />
      <circle cx="60"  cy="222" r="4" fill="#2EE6A6" fillOpacity="0.5" />
      <circle cx="240" cy="226" r="5" fill="#2EE6A6" fillOpacity="0.35" />
      {/* extra confetti bits */}
      <rect x="16"  y="108" width="8"  height="4"  rx="1.5" fill="#2EE6A6" transform="rotate(-10 16 108)"  fillOpacity="0.5" />
      <rect x="272" y="100" width="8"  height="4"  rx="1.5" fill="#2EE6A6" transform="rotate(15 272 100)"   fillOpacity="0.5" />
      <circle cx="28"  cy="148" r="3" fill="#2EE6A6" fillOpacity="0.4" />
      <circle cx="272" cy="152" r="3" fill="#2EE6A6" fillOpacity="0.4" />

      {/* ── sparkles ── */}
      <path d="M32 42 L35 30 L38 42 L50 45 L38 48 L35 60 L32 48 L20 45Z" fill="#2EE6A6" className="sparkle-a" />
      <path d="M248 34 L251 23 L254 34 L266 37 L254 40 L251 51 L248 40 L236 37Z" fill="#2EE6A6" className="sparkle-b" />
      <path d="M12 126 L14 119 L16 126 L23 128 L16 130 L14 137 L12 130 L5 128Z" fill="#2EE6A6" fillOpacity="0.65" className="sparkle-c" />
      <path d="M278 126 L280 119 L282 126 L289 128 L282 130 L280 137 L278 130 L271 128Z" fill="#2EE6A6" fillOpacity="0.65" className="sparkle-b" />

      {/* ── checkmark badge ── */}
      {/* outer glow ring */}
      <circle cx="150" cy="52" r="36" fill="#2EE6A6" fillOpacity="0.18" />
      {/* badge circle */}
      <circle cx="150" cy="52" r="28" fill="#2EE6A6" />
      {/* inner shadow ring */}
      <circle cx="150" cy="52" r="28" fill="none" stroke="#20c98d" strokeWidth="3" />
      {/* checkmark */}
      <polyline points="136,52 147,64 166,40" stroke="#121212" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* ── character — celebrating ── */}
      {/* body — green shirt, no outline */}
      <path d="M68 260 L71 196 Q75 178 93 170 Q110 163 132 161 L150 160 Q168 163 187 171 Q205 179 208 197 L212 260Z" fill="#2EE6A6" />
      {/* collar V */}
      <path d="M130 161 Q144 173 150 161" stroke="#121212" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeOpacity="0.35" />

      {/* left arm — raised high */}
      <path d="M74 186 Q55 162 60 136" stroke="#2EE6A6" strokeWidth="17" strokeLinecap="round" />
      <ellipse cx="60" cy="135" rx="12" ry="9" fill="#FFD4AF" transform="rotate(-22 60 135)" />
      {/* fingers */}
      <path d="M54 128 L51 122 M60 126 L58 120 M66 128 L64 121" stroke="#FFD4AF" strokeWidth="4" strokeLinecap="round" />

      {/* right arm — raised high */}
      <path d="M206 186 Q225 162 220 136" stroke="#2EE6A6" strokeWidth="17" strokeLinecap="round" />
      <ellipse cx="220" cy="135" rx="12" ry="9" fill="#FFD4AF" transform="rotate(22 220 135)" />
      {/* fingers */}
      <path d="M214 128 L211 122 M220 126 L218 120 M226 128 L224 121" stroke="#FFD4AF" strokeWidth="4" strokeLinecap="round" />

      {/* neck */}
      <rect x="136" y="147" width="22" height="17" rx="8" fill="#FFD4AF" />

      {/* head */}
      <ellipse cx="147" cy="114" rx="40" ry="44" fill="#FFD4AF" />

      {/* hair — clean dark cap */}
      <path d="M107 102 Q109 58 147 60 Q185 58 187 102 Q183 72 147 74 Q111 72 107 102Z" fill="#121212" />
      <path d="M107 98 Q100 113 103 131" stroke="#121212" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M187 98 Q194 113 191 131" stroke="#121212" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* ears */}
      <ellipse cx="107" cy="118" rx="8" ry="11" fill="#FFD4AF" />
      <ellipse cx="187" cy="118" rx="8" ry="11" fill="#FFD4AF" />

      {/* eyes — happy crescents */}
      <path d="M126 114 Q134 106 142 114" stroke="#121212" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M152 114 Q160 106 168 114" stroke="#121212" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* big open smile */}
      <path d="M124 136 Q147 156 170 136" stroke="#121212" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M124 136 Q147 158 170 136 L170 141 Q147 163 124 141Z" fill="white" fillOpacity="0.9" />
      {/* center tooth line */}
      <path d="M147 136 L147 156" stroke="#EAEAEA" strokeWidth="1" strokeOpacity="0.6" />

      {/* cheeks */}
      <circle cx="116" cy="128" r="9" fill="#FFB3B3" fillOpacity="0.3" />
      <circle cx="178" cy="128" r="9" fill="#FFB3B3" fillOpacity="0.3" />
    </svg>
  );
}
