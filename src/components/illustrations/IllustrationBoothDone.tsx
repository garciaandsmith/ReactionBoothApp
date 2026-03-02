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
      <rect x="46" y="18" width="14" height="7" rx="2" fill="#2EE6A6" transform="rotate(-25 46 18)" />
      <rect x="218" y="13" width="12" height="6" rx="2" fill="#2EE6A6" transform="rotate(20 218 13)" />
      <rect x="138" y="8" width="10" height="10" rx="2" fill="#121212" fillOpacity="0.18" transform="rotate(45 138 8)" />
      <circle cx="78" cy="28" r="5" fill="#2EE6A6" fillOpacity="0.6" />
      <circle cx="228" cy="33" r="6" fill="#2EE6A6" />
      <rect x="26" y="63" width="10" height="5" rx="1.5" fill="#2EE6A6" transform="rotate(-15 26 63)" />
      <rect x="262" y="53" width="10" height="5" rx="1.5" fill="#2EE6A6" transform="rotate(30 262 53)" />
      <rect x="38" y="218" width="12" height="6" rx="2" fill="#2EE6A6" transform="rotate(15 38 218)" />
      <rect x="243" y="213" width="14" height="7" rx="2" fill="#2EE6A6" transform="rotate(-20 243 213)" />
      <circle cx="63" cy="223" r="4" fill="#2EE6A6" fillOpacity="0.5" />
      <circle cx="238" cy="228" r="5" fill="#121212" fillOpacity="0.12" />

      {/* ── sparkles ── */}
      <path d="M34 43 L37 31 L40 43 L52 46 L40 49 L37 61 L34 49 L22 46Z" fill="#2EE6A6" />
      <path d="M250 36 L253 25 L256 36 L268 39 L256 42 L253 53 L250 42 L238 39Z" fill="#2EE6A6" />
      <path d="M14 128 L16 121 L18 128 L25 130 L18 132 L16 139 L14 132 L7 130Z" fill="#2EE6A6" fillOpacity="0.7" />
      <path d="M276 128 L278 121 L280 128 L287 130 L280 132 L278 139 L276 132 L269 130Z" fill="#2EE6A6" fillOpacity="0.7" />

      {/* ── checkmark badge ── */}
      <circle cx="150" cy="50" r="30" fill="#2EE6A6" stroke="#121212" strokeWidth="2.5" />
      <polyline points="136,50 146,61 165,38" stroke="#121212" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* ── person celebrating ── */}
      {/* left arm raised */}
      <path d="M75 185 Q56 162 62 137" stroke="#2EE6A6" strokeWidth="18" strokeLinecap="round" />
      <path d="M75 185 Q56 162 62 137" stroke="#121212" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="62" cy="135" rx="13" ry="10" fill="#FFD4AF" stroke="#121212" strokeWidth="1.5" transform="rotate(-20 62 135)" />
      <path d="M56 128 L53 122 M62 126 L60 120 M68 128 L66 121" stroke="#FFD4AF" strokeWidth="5" strokeLinecap="round" />
      <path d="M56 128 L53 122 M62 126 L60 120 M68 128 L66 121" stroke="#121212" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* right arm raised */}
      <path d="M225 185 Q244 162 238 137" stroke="#2EE6A6" strokeWidth="18" strokeLinecap="round" />
      <path d="M225 185 Q244 162 238 137" stroke="#121212" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="238" cy="135" rx="13" ry="10" fill="#FFD4AF" stroke="#121212" strokeWidth="1.5" transform="rotate(20 238 135)" />
      <path d="M232 128 L229 122 M238 126 L236 120 M244 128 L242 121" stroke="#FFD4AF" strokeWidth="5" strokeLinecap="round" />
      <path d="M232 128 L229 122 M238 126 L236 120 M244 128 L242 121" stroke="#121212" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* torso — green shirt */}
      <path d="M70 260 L73 195 Q77 178 95 170 Q112 164 135 162 L150 161 Q167 164 185 171 Q203 179 207 196 L210 260Z" fill="#2EE6A6" stroke="#121212" strokeWidth="2.5" />
      <path d="M132 162 Q146 174 150 162" stroke="#121212" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* neck */}
      <rect x="136" y="147" width="26" height="19" rx="9" fill="#FFD4AF" stroke="#121212" strokeWidth="1.5" />

      {/* head */}
      <ellipse cx="149" cy="112" rx="42" ry="48" fill="#FFD4AF" stroke="#121212" strokeWidth="2.5" />
      <path d="M107 100 Q109 56 149 58 Q189 56 191 100 Q188 70 149 72 Q110 70 107 100Z" fill="#121212" />
      <path d="M107 96 Q99 112 102 132" stroke="#121212" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M191 96 Q199 112 196 132" stroke="#121212" strokeWidth="3.5" fill="none" strokeLinecap="round" />

      {/* ears */}
      <path d="M191 112 Q204 108 204 122 Q204 136 191 132 L191 112Z" fill="#FFD4AF" stroke="#121212" strokeWidth="1.5" />
      <path d="M107 112 Q94 108 94 122 Q94 136 107 132 L107 112Z" fill="#FFD4AF" stroke="#121212" strokeWidth="1.5" />

      {/* eyes — happy crescents */}
      <path d="M128 111 Q136 103 144 111" stroke="#121212" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M154 111 Q162 103 170 111" stroke="#121212" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M125 101 Q135 94 144 100" stroke="#121212" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M154 100 Q163 94 173 101" stroke="#121212" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* big open smile */}
      <path d="M127 133 Q149 152 171 133" stroke="#121212" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M127 133 Q149 154 171 133 L171 138 Q149 159 127 138Z" fill="white" />
      <path d="M127 133 Q149 152 171 133" stroke="#121212" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M149 134 L149 153" stroke="#EAEAEA" strokeWidth="1" strokeOpacity="0.5" />

      {/* cheek blush */}
      <circle cx="118" cy="124" r="8" fill="#FFB3B3" fillOpacity="0.35" />
      <circle cx="180" cy="124" r="8" fill="#FFB3B3" fillOpacity="0.35" />
    </svg>
  );
}
