export default function IllustrationHero({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* ── decorative shapes ── */}
      <path d="M32 52 L35 40 L38 52 L50 55 L38 58 L35 70 L32 58 L20 55Z" fill="#2EE6A6" />
      <path d="M483 28 L486 18 L489 28 L499 31 L489 34 L486 44 L483 34 L473 31Z" fill="#2EE6A6" />
      <path d="M498 195 L500 188 L502 195 L509 197 L502 199 L500 206 L498 199 L491 197Z" fill="#121212" fillOpacity="0.25" />
      <circle cx="54" cy="165" r="5" fill="#2EE6A6" fillOpacity="0.7" />
      <circle cx="498" cy="140" r="5" fill="#2EE6A6" />
      <circle cx="200" cy="18" r="4" fill="#2EE6A6" />
      <path d="M63 250 L70 243 L77 250 L70 257Z" fill="none" stroke="#2EE6A6" strokeWidth="2" />
      <path d="M492 316 L492 332 M484 324 L500 324" stroke="#121212" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.25" />

      {/* ── laptop base ── */}
      <path d="M190 302 L200 318 L504 318 L514 302Z" fill="#1A1A1A" strokeLinejoin="round" />
      <rect x="330" y="308" width="55" height="6" rx="3" fill="#2D2D2D" />

      {/* ── laptop lid ── */}
      <rect x="196" y="102" width="318" height="202" rx="12" fill="#121212" />
      <rect x="208" y="114" width="294" height="178" rx="7" fill="#F7F9F8" />

      {/* browser chrome bar */}
      <rect x="208" y="114" width="294" height="32" rx="7" fill="#EAEAEA" />
      <rect x="208" y="130" width="294" height="16" fill="#EAEAEA" />
      <circle cx="230" cy="130" r="5.5" fill="#FF6B6B" />
      <circle cx="248" cy="130" r="5.5" fill="#FFBD2E" />
      <circle cx="266" cy="130" r="5.5" fill="#2EE6A6" />
      <rect x="283" y="123" width="207" height="14" rx="7" fill="white" />
      <circle cx="294" cy="130" r="4" fill="#2EE6A6" fillOpacity="0.5" />

      {/* left video panel */}
      <rect x="214" y="152" width="138" height="108" rx="5" fill="#1A1A2E" />
      <rect x="214" y="233" width="138" height="27" fill="#121212" fillOpacity="0.6" />
      <circle cx="283" cy="206" r="22" fill="white" fillOpacity="0.1" />
      <polygon points="275,197 275,215 296,206" fill="#2EE6A6" />
      <rect x="218" y="156" width="42" height="10" rx="5" fill="#2EE6A6" fillOpacity="0.4" />
      <rect x="218" y="238" width="138" height="3" rx="1.5" fill="#EAEAEA" fillOpacity="0.2" />
      <rect x="218" y="238" width="55" height="3" rx="1.5" fill="#2EE6A6" />

      {/* panel divider */}
      <rect x="355" y="152" width="2" height="108" fill="#EAEAEA" />

      {/* right webcam panel */}
      <rect x="360" y="152" width="136" height="108" rx="5" fill="#E8FDF5" />
      <rect x="443" y="157" width="45" height="16" rx="8" fill="#FF5F5F" fillOpacity="0.9" />
      <circle cx="452" cy="165" r="4" fill="white" />

      {/* reaction face in webcam */}
      <ellipse cx="428" cy="193" rx="30" ry="34" fill="#FFD4AF" stroke="#121212" strokeWidth="1.5" />
      <path d="M398 182 Q400 156 428 158 Q456 156 458 182 Q454 164 428 166 Q402 164 398 182Z" fill="#121212" />
      <ellipse cx="417" cy="190" rx="5.5" ry="7" fill="#121212" />
      <circle cx="419" cy="187" r="2" fill="white" />
      <ellipse cx="439" cy="190" rx="5.5" ry="7" fill="#121212" />
      <circle cx="441" cy="187" r="2" fill="white" />
      <path d="M410 180 Q417 174 424 179" stroke="#121212" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M432 179 Q439 174 446 180" stroke="#121212" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M414 207 Q428 220 442 207" stroke="#121212" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M414 207 Q428 222 442 207" fill="white" />
      <path d="M398 228 Q408 220 428 218 Q448 220 458 228 L458 260 L398 260Z" fill="#2EE6A6" stroke="#121212" strokeWidth="1.5" />

      {/* sparkles near webcam face */}
      <path d="M464 163 L466 156 L468 163 L475 165 L468 167 L466 174 L464 167 L457 165Z" fill="#2EE6A6" />
      <path d="M387 212 L389 206 L391 212 L397 214 L391 216 L389 222 L387 216 L381 214Z" fill="#2EE6A6" fillOpacity="0.6" />

      {/* browser bottom bar */}
      <rect x="214" y="265" width="280" height="22" rx="4" fill="#F0FDF9" />
      <rect x="220" y="270" width="70" height="8" rx="4" fill="#2EE6A6" />
      <rect x="296" y="270" width="50" height="8" rx="4" fill="#EAEAEA" />
      <rect x="352" y="270" width="40" height="8" rx="4" fill="#EAEAEA" />

      {/* ── person ── */}
      {/* right arm pointing at laptop */}
      <path d="M182 268 Q196 260 210 265" stroke="#FFD4AF" strokeWidth="14" strokeLinecap="round" />
      <path d="M182 268 Q196 260 210 265" stroke="#121212" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="208" cy="264" rx="13" ry="9" fill="#FFD4AF" stroke="#121212" strokeWidth="1.5" transform="rotate(-8 208 264)" />
      <path d="M213 258 Q224 252 229 255 Q232 260 228 264 Q220 267 214 262Z" fill="#FFD4AF" stroke="#121212" strokeWidth="1.5" />

      {/* torso — green shirt */}
      <path d="M52 360 L56 270 Q60 248 80 238 Q98 230 128 226 L143 224 Q168 226 185 234 Q205 244 208 266 L212 360Z" fill="#2EE6A6" stroke="#121212" strokeWidth="2" />
      <path d="M124 226 Q135 240 143 226" stroke="#121212" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* left arm */}
      <path d="M63 258 Q48 295 44 330" stroke="#2EE6A6" strokeWidth="17" strokeLinecap="round" />
      <path d="M63 258 Q48 295 44 330" stroke="#121212" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="44" cy="328" rx="13" ry="9" fill="#FFD4AF" stroke="#121212" strokeWidth="1.5" transform="rotate(12 44 328)" />

      {/* neck */}
      <rect x="128" y="210" width="26" height="20" rx="8" fill="#FFD4AF" stroke="#121212" strokeWidth="1.5" />

      {/* head */}
      <ellipse cx="141" cy="170" rx="43" ry="50" fill="#FFD4AF" stroke="#121212" strokeWidth="2.5" />
      <path d="M98 158 Q100 110 141 112 Q182 110 184 158 Q180 126 141 128 Q102 126 98 158Z" fill="#121212" />
      <path d="M100 155 Q92 168 95 190" stroke="#121212" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* ear */}
      <path d="M184 170 Q196 167 196 180 Q196 193 184 190 L184 170Z" fill="#FFD4AF" stroke="#121212" strokeWidth="1.5" />

      {/* eyes — wide & excited */}
      <ellipse cx="126" cy="172" rx="8" ry="9" fill="white" stroke="#121212" strokeWidth="1.5" />
      <circle cx="128" cy="174" r="5" fill="#121212" />
      <circle cx="129.5" cy="172" r="1.5" fill="white" />
      <ellipse cx="156" cy="172" rx="8" ry="9" fill="white" stroke="#121212" strokeWidth="1.5" />
      <circle cx="158" cy="174" r="5" fill="#121212" />
      <circle cx="159.5" cy="172" r="1.5" fill="white" />

      {/* eyebrows raised */}
      <path d="M117 160 Q126 153 135 159" stroke="#121212" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M147 159 Q156 153 165 160" stroke="#121212" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* nose */}
      <path d="M141 184 Q139 189 136 191 Q140 194 146 191 Q143 189 141 184Z" stroke="#121212" strokeWidth="1.5" fill="none" />

      {/* big open smile */}
      <path d="M124 204 Q141 220 158 204" stroke="#121212" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M124 204 Q141 222 158 204 L158 208 Q141 226 124 208Z" fill="white" />
      <path d="M124 204 Q141 220 158 204" stroke="#121212" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* speech bubble */}
      <path d="M168 118 Q162 100 202 92 Q242 84 239 114 Q236 138 200 135 Q176 143 168 118Z" fill="#2EE6A6" stroke="#121212" strokeWidth="2" />
      <path d="M192 113 L194 106 L196 113 L203 115 L196 117 L194 124 L192 117 L185 115Z" fill="white" />
      <path d="M210 107 L212 101 L214 107 L220 109 L214 111 L212 117 L210 111 L204 109Z" fill="white" />
    </svg>
  );
}
