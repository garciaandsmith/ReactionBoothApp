"use client";

// Inline animated version of mascotjoy.svg.
// Animates individual features (eyes blink, brows lift, smile pulses)
// rather than bouncing the whole image.
export default function MascotJoyAnimated({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 344.85 344.85"
      className={className}
      aria-hidden="true"
    >
      <style>{`
        @keyframes mj-blink {
          0%, 88%, 100% { transform: scaleY(1); }
          91%            { transform: scaleY(0.06); }
          95%            { transform: scaleY(1); }
        }
        @keyframes mj-brow-lift {
          0%, 88%, 100% { transform: translateY(0px); }
          91%            { transform: translateY(-5px); }
          95%            { transform: translateY(0px); }
        }
        @keyframes mj-smile-pulse {
          0%, 100% { transform: scaleX(1) scaleY(1); }
          50%       { transform: scaleX(1.05) scaleY(1.1); }
        }
        .mj-eye-l {
          transform-box: fill-box;
          transform-origin: center;
          animation: mj-blink 4.5s ease-in-out infinite;
        }
        .mj-eye-r {
          transform-box: fill-box;
          transform-origin: center;
          animation: mj-blink 4.5s ease-in-out infinite 0.1s;
        }
        .mj-brow-l {
          transform-box: fill-box;
          transform-origin: center;
          animation: mj-brow-lift 4.5s ease-in-out infinite;
        }
        .mj-brow-r {
          transform-box: fill-box;
          transform-origin: center;
          animation: mj-brow-lift 4.5s ease-in-out infinite 0.1s;
        }
        .mj-smile {
          transform-box: fill-box;
          transform-origin: center;
          animation: mj-smile-pulse 2.6s ease-in-out infinite;
        }
      `}</style>

      {/* Green body */}
      <path
        fill="#2ee6a6"
        fillRule="evenodd"
        d="M0,172.42C0,77.2,77.2,0,172.42,0s172.42,77.2,172.42,172.42-77.2,172.42-172.42,172.42S0,267.65,0,172.42h0Z"
      />

      {/* Left eye white */}
      <path
        className="mj-eye-l"
        fill="#f5f5f5"
        fillRule="evenodd"
        d="M56.92,91.74c0-29.61,24-53.61,53.61-53.61s53.61,24,53.61,53.61-24,53.61-53.61,53.61-53.61-24-53.61-53.61h0Z"
      />

      {/* Left eyebrow */}
      <path
        className="mj-brow-l"
        fill="#2ee6a6"
        d="M135.21,110.85c-4.08,0-8.03-2.17-10.12-6.01-1.82-3.34-4.48-6.21-7.7-8.28-10.97-7.09-25.86-3.89-33.21,7.14-3.53,5.29-10.67,6.72-15.97,3.19-5.29-3.53-6.72-10.67-3.19-15.97,14.29-21.43,43.39-27.58,64.86-13.71,6.44,4.16,11.77,9.91,15.43,16.62,3.04,5.59.98,12.58-4.61,15.62-1.75.95-3.63,1.4-5.49,1.4Z"
      />

      {/* Right eye white */}
      <path
        className="mj-eye-r"
        fill="#f5f5f5"
        fillRule="evenodd"
        d="M185.99,99.33c0-29.61,24-53.61,53.61-53.61s53.61,24,53.61,53.61-24,53.61-53.61,53.61-53.61-24-53.61-53.61h0Z"
      />

      {/* Smile */}
      <path
        className="mj-smile"
        fill="#fff"
        d="M163.6,215.29c-20.6,0-41-8.77-54.92-25.67-3.68-4.47-6.79-9.38-9.25-14.61-3.25-6.9-.28-15.13,6.62-18.38,6.9-3.25,15.13-.28,18.38,6.62,1.48,3.14,3.35,6.11,5.57,8.8,15.03,18.25,42.47,20.93,61.16,5.98,5.96-4.76,14.65-3.8,19.42,2.17,4.77,5.96,3.8,14.65-2.17,19.42-13.19,10.54-29.07,15.67-44.83,15.67Z"
      />

      {/* Right eyebrow */}
      <path
        className="mj-brow-r"
        fill="#2ee6a6"
        d="M267.33,122.61c-4.46,0-8.7-2.6-10.58-6.96-1.5-3.49-3.89-6.59-6.91-8.95-10.27-8.05-25.4-6.23-33.72,4.07-4,4.94-11.24,5.71-16.19,1.72-4.94-4-5.72-11.25-1.72-16.19,16.18-20.04,45.72-23.5,65.84-7.72,6.04,4.73,10.82,10.94,13.85,17.96,2.52,5.84-.18,12.61-6.02,15.13-1.48.64-3.03.94-4.55.94Z"
      />
    </svg>
  );
}
