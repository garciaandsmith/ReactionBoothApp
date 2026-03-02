export default function IllustrationStepRecord({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* decorative shapes */}
      <path d="M15 50 L18 40 L21 50 L31 53 L21 56 L18 66 L15 56 L5 53Z" fill="#2EE6A6" />
      <path d="M238 42 L240 35 L242 42 L249 44 L242 46 L240 53 L238 46 L231 44Z" fill="#2EE6A6" fillOpacity="0.7" />
      <circle cx="14" cy="168" r="4" fill="#2EE6A6" fillOpacity="0.6" />
      <circle cx="248" cy="165" r="4" fill="#121212" fillOpacity="0.18" />
      <path d="M241 188 L243 181 L245 188 L252 190 L245 192 L243 199 L241 192 L234 190Z" fill="#2EE6A6" fillOpacity="0.5" />

      {/* webcam body */}
      <rect x="170" y="28" width="62" height="46" rx="8" fill="#121212" stroke="#121212" strokeWidth="2" />
      {/* lens */}
      <circle cx="201" cy="51" r="14" fill="#2D2D2D" stroke="#2EE6A6" strokeWidth="2.5" />
      <circle cx="201" cy="51" r="8" fill="#1A1A2E" />
      <circle cx="201" cy="51" r="4" fill="#2EE6A6" fillOpacity="0.4" />
      <circle cx="198" cy="48" r="2" fill="white" fillOpacity="0.5" />
      {/* mount */}
      <rect x="195" y="74" width="12" height="10" rx="3" fill="#121212" />
      {/* REC badge */}
      <rect x="172" y="32" width="36" height="14" rx="7" fill="#FF5F5F" />
      <circle cx="181" cy="39" r="4" fill="white" />
      <rect x="188" y="36" width="14" height="6" rx="3" fill="white" fillOpacity="0.7" />
      {/* dashed signal line */}
      <path d="M201 84 L201 112" stroke="#2EE6A6" strokeWidth="1.5" strokeDasharray="3,4" />

      {/* person */}
      {/* left arm — raised/waving */}
      <path d="M63 148 Q52 128 58 104" stroke="#2EE6A6" strokeWidth="15" strokeLinecap="round" />
      <path d="M63 148 Q52 128 58 104" stroke="#121212" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="58" cy="105" rx="11" ry="9" fill="#FFD4AF" stroke="#121212" strokeWidth="1.5" transform="rotate(-15 58 105)" />
      <path d="M53 99 L50 94 M58 97 L56 91 M64 99 L62 93" stroke="#FFD4AF" strokeWidth="4" strokeLinecap="round" />
      <path d="M53 99 L50 94 M58 97 L56 91 M64 99 L62 93" stroke="#121212" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* right arm — relaxed */}
      <path d="M147 150 Q158 170 158 192" stroke="#2EE6A6" strokeWidth="15" strokeLinecap="round" />
      <path d="M147 150 Q158 170 158 192" stroke="#121212" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="158" cy="191" rx="11" ry="8" fill="#FFD4AF" stroke="#121212" strokeWidth="1.5" />

      {/* torso — green shirt */}
      <path d="M40 220 L43 168 Q46 152 62 145 Q78 140 98 138 L112 137 Q128 140 142 147 Q152 154 152 168 L156 220Z" fill="#2EE6A6" stroke="#121212" strokeWidth="2" />
      <path d="M95 138 Q105 148 112 138" stroke="#121212" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* neck */}
      <rect x="96" y="124" width="22" height="18" rx="7" fill="#FFD4AF" stroke="#121212" strokeWidth="1.5" />

      {/* head */}
      <ellipse cx="107" cy="93" rx="35" ry="40" fill="#FFD4AF" stroke="#121212" strokeWidth="2" />
      {/* hair — dark wavy */}
      <path d="M72 81 Q74 44 107 46 Q140 44 142 81 Q138 55 107 57 Q76 55 72 81Z" fill="#2D2020" />
      <path d="M72 78 Q65 93 68 113" stroke="#2D2020" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M142 78 Q149 93 146 113" stroke="#2D2020" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* ear */}
      <path d="M72 93 Q60 90 60 103 Q60 116 72 113 L72 93Z" fill="#FFD4AF" stroke="#121212" strokeWidth="1.5" />

      {/* eyes — surprised wide open */}
      <ellipse cx="93" cy="92" rx="8" ry="9.5" fill="white" stroke="#121212" strokeWidth="1.5" />
      <circle cx="95" cy="94" r="5" fill="#121212" />
      <circle cx="96.5" cy="92" r="1.5" fill="white" />
      <ellipse cx="121" cy="92" rx="8" ry="9.5" fill="white" stroke="#121212" strokeWidth="1.5" />
      <circle cx="123" cy="94" r="5" fill="#121212" />
      <circle cx="124.5" cy="92" r="1.5" fill="white" />

      {/* eyebrows raised high */}
      <path d="M84 79 Q93 71 102 78" stroke="#2D2020" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M112 78 Q121 71 130 79" stroke="#2D2020" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* surprised O mouth */}
      <ellipse cx="107" cy="113" rx="8" ry="10" fill="#121212" />
      <ellipse cx="107" cy="113" rx="5" ry="7" fill="#1A1A2E" />
    </svg>
  );
}
