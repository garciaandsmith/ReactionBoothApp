export default function IllustrationStepRecord({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* ── decorative elements ── */}
      <circle cx="16"  cy="44"  r="4" fill="#2EE6A6" fillOpacity="0.5" />
      <circle cx="246" cy="58"  r="3" fill="#2EE6A6" fillOpacity="0.4" />
      <path d="M18 168 L20 161 L22 168 L29 170 L22 172 L20 179 L18 172 L11 170Z" fill="#2EE6A6" fillOpacity="0.55" className="sparkle-c" />
      <path d="M236 188 L238 182 L240 188 L246 190 L240 192 L238 198 L236 192 L230 190Z" fill="#2EE6A6" fillOpacity="0.4" className="sparkle-b" />

      {/* ── webcam ── */}
      {/* stand base */}
      <rect x="117" y="84" width="26" height="8"  rx="3" fill="#2D2D2D" />
      <rect x="108" y="90" width="44" height="6"  rx="3" fill="#2D2D2D" />
      {/* body */}
      <rect x="108" y="24" width="44" height="62" rx="9" fill="#1a1a1a" />
      {/* lens ring */}
      <circle cx="130" cy="50" r="17" fill="#2D2D2D" />
      <circle cx="130" cy="50" r="11" fill="#111827" />
      <circle cx="130" cy="50" r="5"  fill="#2EE6A6" fillOpacity="0.35" />
      <circle cx="126" cy="46" r="2.5" fill="white" fillOpacity="0.5" />
      {/* accent ring */}
      <circle cx="130" cy="50" r="17" stroke="#2EE6A6" strokeWidth="2" fill="none" />

      {/* REC badge — pulsing via CSS class */}
      <rect x="111" y="27" width="42" height="16" rx="8" fill="#FF5F5F" className="sparkle-a" />
      <circle cx="122" cy="35" r="4.5" fill="white" />
      <rect x="129" y="31" width="18" height="7" rx="3.5" fill="white" fillOpacity="0.8" />

      {/* signal arc lines */}
      <path d="M130 103 L130 116" stroke="#2EE6A6" strokeWidth="2" strokeDasharray="3,3" strokeLinecap="round" />

      {/* ── character ── */}
      {/* body — green shirt, no outline */}
      <path d="M36 220 L38 172 Q40 158 55 150 Q68 144 86 142 L100 141 Q114 144 128 150 Q140 157 141 171 L145 220Z" fill="#2EE6A6" />
      {/* collar V */}
      <path d="M85 142 Q92 152 100 142" stroke="#121212" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeOpacity="0.4" />

      {/* left arm — raised in wave */}
      <path d="M42 164 Q30 142 34 120" stroke="#2EE6A6" strokeWidth="14" strokeLinecap="round" />
      <ellipse cx="34" cy="120" rx="10" ry="8" fill="#FFD4AF" transform="rotate(-15 34 120)" />
      {/* fingers suggestion */}
      <path d="M29 114 L27 109 M34 112 L32 107 M39 114 L37 108" stroke="#FFD4AF" strokeWidth="3.5" strokeLinecap="round" />

      {/* right arm — relaxed down */}
      <path d="M138 164 Q148 182 148 200" stroke="#2EE6A6" strokeWidth="14" strokeLinecap="round" />
      <ellipse cx="148" cy="199" rx="10" ry="7" fill="#FFD4AF" />

      {/* neck */}
      <rect x="83" y="128" width="18" height="16" rx="7" fill="#FFD4AF" />

      {/* head */}
      <ellipse cx="92" cy="100" rx="30" ry="34" fill="#FFD4AF" />

      {/* hair — darker warm brown */}
      <path d="M62 88 Q64 56 92 58 Q120 56 122 88 Q118 66 92 68 Q66 66 62 88Z" fill="#2D2020" />
      <path d="M62 85 Q56 98 59 116" stroke="#2D2020" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M122 85 Q128 98 125 116" stroke="#2D2020" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* ears */}
      <ellipse cx="62"  cy="104" rx="7" ry="9" fill="#FFD4AF" />
      <ellipse cx="122" cy="104" rx="7" ry="9" fill="#FFD4AF" />

      {/* eyes — wide open, surprised */}
      <ellipse cx="80"  cy="100" rx="8.5" ry="10" fill="white" />
      <circle  cx="82"  cy="102" r="6"   fill="#2D2020" />
      <circle  cx="84"  cy="99"  r="2"   fill="white" />
      <ellipse cx="104" cy="100" rx="8.5" ry="10" fill="white" />
      <circle  cx="106" cy="102" r="6"   fill="#2D2020" />
      <circle  cx="108" cy="99"  r="2"   fill="white" />

      {/* eyebrows — raised with surprise */}
      <path d="M71 86 Q80 78 89 84" stroke="#2D2020" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M95 84 Q104 78 113 86" stroke="#2D2020" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* surprised O mouth */}
      <ellipse cx="92" cy="118" rx="7" ry="9" fill="#2D2020" />
      <ellipse cx="92" cy="118" rx="4" ry="6" fill="#111827" />
    </svg>
  );
}
