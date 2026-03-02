export default function IllustrationStepLink({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* decorative shapes */}
      <path d="M18 38 L21 28 L24 38 L34 41 L24 44 L21 54 L18 44 L8 41Z" fill="#2EE6A6" />
      <path d="M236 30 L238 23 L240 30 L247 32 L240 34 L238 41 L236 34 L229 32Z" fill="#2EE6A6" fillOpacity="0.6" />
      <circle cx="246" cy="115" r="4" fill="#2EE6A6" />
      <circle cx="14" cy="150" r="3" fill="#2EE6A6" fillOpacity="0.6" />
      <path d="M22 185 L25 178 L28 185 L35 187 L28 189 L25 196 L22 189 L15 187Z" fill="#121212" fillOpacity="0.18" />

      {/* phone */}
      <rect x="158" y="58" width="74" height="120" rx="10" fill="#121212" stroke="#121212" strokeWidth="2" />
      <rect x="164" y="66" width="62" height="102" rx="6" fill="#F7F9F8" />
      <rect x="183" y="172" width="24" height="5" rx="2.5" fill="#EAEAEA" />

      {/* phone screen — link-share UI */}
      <rect x="168" y="70" width="54" height="42" rx="4" fill="#E8FDF5" />
      {/* link chain icon */}
      <path d="M183 86 Q186 80 192 80 Q198 80 201 86 Q204 92 198 96 L194 92 Q198 89 196 86 Q193 83 190 83 Q186 83 184 87Z" stroke="#2EE6A6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M189 90 Q186 96 180 97 Q174 97 171 91 Q168 85 174 81 L178 85 Q174 88 176 91 Q178 95 182 95 Q186 95 188 91Z" stroke="#2EE6A6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="168" y="116" width="54" height="16" rx="8" fill="#2EE6A6" />
      <rect x="173" y="120" width="28" height="5" rx="2.5" fill="white" fillOpacity="0.7" />
      <rect x="168" y="137" width="54" height="6" rx="3" fill="#EAEAEA" />
      <rect x="168" y="148" width="38" height="6" rx="3" fill="#EAEAEA" />

      {/* paper plane / send icon */}
      <path d="M140 68 L110 83 L123 90 L140 68Z" fill="#2EE6A6" stroke="#121212" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M110 83 L117 102 L123 90 L110 83Z" fill="#2EE6A6" stroke="#121212" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M140 68 L117 102" stroke="#121212" strokeWidth="1.5" strokeDasharray="3,3" />

      {/* person */}
      {/* right arm holding phone */}
      <path d="M152 140 Q158 130 162 122" stroke="#FFD4AF" strokeWidth="12" strokeLinecap="round" />
      <path d="M152 140 Q158 130 162 122" stroke="#121212" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* torso — dark shirt */}
      <path d="M40 220 L43 165 Q46 152 60 146 Q75 140 95 138 L108 137 Q125 139 138 145 Q150 152 152 165 L155 220Z" fill="#121212" stroke="#121212" strokeWidth="2" />
      {/* green collar accent */}
      <path d="M90 138 Q100 148 108 138" stroke="#2EE6A6" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* left arm */}
      <path d="M48 160 Q36 182 34 202" stroke="#121212" strokeWidth="14" strokeLinecap="round" />
      <path d="M48 160 Q36 182 34 202" stroke="#121212" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="34" cy="200" rx="11" ry="8" fill="#FFD4AF" stroke="#121212" strokeWidth="1.5" transform="rotate(10 34 200)" />

      {/* neck */}
      <rect x="94" y="124" width="22" height="18" rx="7" fill="#FFD4AF" stroke="#121212" strokeWidth="1.5" />

      {/* head */}
      <ellipse cx="105" cy="94" rx="35" ry="40" fill="#FFD4AF" stroke="#121212" strokeWidth="2" />
      <path d="M70 84 Q72 47 105 49 Q138 47 140 84 Q136 59 105 61 Q74 59 70 84Z" fill="#121212" />
      <path d="M70 81 Q64 95 67 113" stroke="#121212" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* ear */}
      <path d="M140 94 Q152 91 152 104 Q152 117 140 114 L140 94Z" fill="#FFD4AF" stroke="#121212" strokeWidth="1.5" />

      {/* eyes — happy squint */}
      <path d="M90 96 Q96 89 102 96" stroke="#121212" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M108 96 Q114 89 120 96" stroke="#121212" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M87 87 Q96 81 103 87" stroke="#121212" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M107 87 Q114 81 121 88" stroke="#121212" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* smile */}
      <path d="M92 110 Q105 122 118 110" stroke="#121212" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M92 110 Q105 124 118 110" fill="white" />

      {/* cheek blush */}
      <circle cx="85" cy="103" r="7" fill="#FFB3B3" fillOpacity="0.3" />
      <circle cx="125" cy="103" r="7" fill="#FFB3B3" fillOpacity="0.3" />
    </svg>
  );
}
