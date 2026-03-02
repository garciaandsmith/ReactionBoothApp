export default function IllustrationStepWatch({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* decorative shapes */}
      <path d="M12 32 L15 22 L18 32 L28 35 L18 38 L15 48 L12 38 L2 35Z" fill="#2EE6A6" />
      <path d="M240 25 L242 18 L244 25 L251 27 L244 29 L242 36 L240 29 L233 27Z" fill="#2EE6A6" />
      <circle cx="250" cy="105" r="4" fill="#2EE6A6" />
      <circle cx="10" cy="165" r="3" fill="#2EE6A6" fillOpacity="0.5" />
      <path d="M243 170 L245 163 L247 170 L254 172 L247 174 L245 181 L243 174 L236 172Z" fill="#121212" fillOpacity="0.18" />

      {/* monitor stand */}
      <rect x="115" y="105" width="30" height="15" rx="2" fill="#EAEAEA" stroke="#121212" strokeWidth="1.5" />
      <rect x="100" y="118" width="60" height="8" rx="4" fill="#EAEAEA" stroke="#121212" strokeWidth="1.5" />

      {/* monitor frame */}
      <rect x="58" y="18" width="144" height="92" rx="8" fill="#121212" stroke="#121212" strokeWidth="2" />
      <rect x="65" y="25" width="130" height="76" rx="5" fill="#F7F9F8" />

      {/* left video panel */}
      <rect x="68" y="28" width="61" height="66" rx="3" fill="#1A1A2E" />
      <polygon points="89,55 89,72 106,63" fill="#2EE6A6" />

      {/* divider */}
      <rect x="132" y="28" width="2" height="66" fill="#EAEAEA" />

      {/* right reaction panel */}
      <rect x="136" y="28" width="56" height="66" rx="3" fill="#E8FDF5" />
      {/* mini reaction face */}
      <ellipse cx="164" cy="56" rx="16" ry="18" fill="#FFD4AF" stroke="#121212" strokeWidth="1" />
      <path d="M148 49 Q150 36 164 37 Q178 36 180 49 Q177 42 164 43 Q151 42 148 49Z" fill="#121212" />
      <ellipse cx="158" cy="55" rx="3" ry="4" fill="#121212" />
      <circle cx="159.5" cy="53.5" r="1" fill="white" />
      <ellipse cx="170" cy="55" rx="3" ry="4" fill="#121212" />
      <circle cx="171.5" cy="53.5" r="1" fill="white" />
      <path d="M158 66 Q164 73 170 66" stroke="#121212" strokeWidth="1" fill="white" strokeLinecap="round" />

      {/* sparkle on screen */}
      <path d="M183 32 L185 25 L187 32 L194 34 L187 36 L185 43 L183 36 L176 34Z" fill="#2EE6A6" />

      {/* person */}
      {/* both arms raised in excitement */}
      <path d="M57 168 Q42 148 45 128" stroke="#121212" strokeWidth="14" strokeLinecap="round" />
      <path d="M57 168 Q42 148 45 128" stroke="#121212" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="45" cy="127" rx="11" ry="9" fill="#FFD4AF" stroke="#121212" strokeWidth="1.5" transform="rotate(-20 45 127)" />

      <path d="M203 168 Q218 148 215 128" stroke="#121212" strokeWidth="14" strokeLinecap="round" />
      <path d="M203 168 Q218 148 215 128" stroke="#121212" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="215" cy="127" rx="11" ry="9" fill="#FFD4AF" stroke="#121212" strokeWidth="1.5" transform="rotate(20 215 127)" />

      {/* torso — dark shirt */}
      <path d="M55 220 L57 170 Q60 154 76 148 Q92 143 112 141 L130 140 Q148 143 166 149 Q182 155 183 171 L185 220Z" fill="#121212" stroke="#121212" strokeWidth="2" />
      <path d="M108 141 Q120 152 130 141" stroke="#2EE6A6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="112" y="141" width="16" height="8" rx="4" fill="#2EE6A6" fillOpacity="0.5" />

      {/* neck */}
      <rect x="110" y="127" width="22" height="17" rx="7" fill="#FFD4AF" stroke="#121212" strokeWidth="1.5" />

      {/* head */}
      <ellipse cx="121" cy="100" rx="35" ry="39" fill="#FFD4AF" stroke="#121212" strokeWidth="2" />
      <path d="M86 88 Q88 52 121 54 Q154 52 156 88 Q152 62 121 64 Q90 62 86 88Z" fill="#121212" />
      <path d="M86 85 Q79 99 82 116" stroke="#121212" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* ear */}
      <path d="M156 100 Q168 97 168 110 Q168 123 156 120 L156 100Z" fill="#FFD4AF" stroke="#121212" strokeWidth="1.5" />

      {/* eyes — happy squint crescents */}
      <path d="M108 101 Q114 94 120 101" stroke="#121212" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M122 101 Q128 94 134 101" stroke="#121212" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M106 93 Q114 87 121 92" stroke="#121212" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M121 92 Q128 87 136 93" stroke="#121212" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* big open laugh */}
      <path d="M107 115 Q121 128 135 115" stroke="#121212" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M107 115 Q121 130 135 115 L135 119 Q121 134 107 119Z" fill="white" />
      <path d="M107 115 Q121 128 135 115" stroke="#121212" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* cheek blush */}
      <circle cx="100" cy="111" r="7" fill="#FFB3B3" fillOpacity="0.3" />
      <circle cx="142" cy="111" r="7" fill="#FFB3B3" fillOpacity="0.3" />
    </svg>
  );
}
