"use client";

import { useRef, useEffect } from "react";

// Color palette: brand green + four complementary accent colors
const COLORS = [
  "46,230,166",   // brand green   #2EE6A6
  "126,240,203",  // light mint    #7EF0CB
  "155,142,255",  // soft purple   #9B8EFF
  "255,120,98",   // warm coral    #FF7862
  "255,209,102",  // golden yellow #FFD166
];

// Shape pair templates: [w1, h1, w2, h2, arrangement]
// 'H' = side by side, 'V' = stacked vertically
// Pairs represent "huge variety of video/reaction combinations"
const TEMPLATES: Array<[number, number, number, number, "H" | "V"]> = [
  [48, 48, 88, 48, "H"],   // square + wide landscape
  [36, 72, 60, 36, "H"],   // tall portrait + small landscape
  [80, 32, 40, 64, "H"],   // wide bar + tall portrait
  [52, 52, 52, 30, "V"],   // square + wide bar below
  [72, 28, 72, 52, "V"],   // wide bar + rectangle
  [44, 44, 80, 44, "H"],   // square + wide rectangle
  [88, 28, 44, 52, "V"],   // wide bar + square-ish
  [38, 68, 38, 38, "V"],   // tall + square below
  [60, 60, 32, 32, "H"],   // large square + small square
  [32, 32, 70, 55, "H"],   // small square + large rectangle
];

interface ShapePair {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  drot: number;
  opacity: number;
  colorIdx: number;
  strokeOnly: boolean;
  templateIdx: number;
  halfDiag: number; // half diagonal for wrap-around
}

const NUM_PAIRS = 20;
const CURSOR_RADIUS = 180;
const CURSOR_STRENGTH = 0.016;
const DAMPING = 0.97;
const CORNER_R = 10;

export default function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const pairs = useRef<ShapePair[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Deterministic pseudo-random seeder
    const seed = (i: number, lo: number, hi: number) =>
      lo + ((i * 9301 + 49297) % 233280) / 233280 * (hi - lo);

    const init = () => {
      const W = canvas.width;
      const H = canvas.height;
      pairs.current = Array.from({ length: NUM_PAIRS }, (_, i) => {
        const tIdx = i % TEMPLATES.length;
        const [w1, h1, w2, h2, arr] = TEMPLATES[tIdx];
        const totalW = arr === "H" ? w1 + w2 : Math.max(w1, w2);
        const totalH = arr === "V" ? h1 + h2 : Math.max(h1, h2);
        const halfDiag = Math.sqrt(totalW * totalW + totalH * totalH) / 2 + 12;
        return {
          x: seed(i * 3, 0, W),
          y: seed(i * 7, 0, H),
          vx: (seed(i * 13, 0, 1) - 0.5) * 0.28,
          vy: (seed(i * 17, 0, 1) - 0.5) * 0.28,
          rotation: seed(i * 5, -25, 25),
          drot: (seed(i * 23, 0, 1) - 0.5) * 0.018,
          opacity: seed(i * 19, 0.05, 0.14),
          colorIdx: Math.min(Math.floor(seed(i * 29, 0, COLORS.length)), COLORS.length - 1),
          strokeOnly: i % 4 === 0,
          templateIdx: tIdx,
          halfDiag,
        };
      });
    };

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      init();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const drawRect = (x: number, y: number, w: number, h: number, color: string, opacity: number, strokeOnly: boolean) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, CORNER_R);
      if (strokeOnly) {
        ctx.strokeStyle = `rgba(${color},${opacity * 1.6})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(${color},${opacity})`;
        ctx.fill();
      }
    };

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      for (const p of pairs.current) {
        // Cursor attraction
        const dx = mouse.current.x - p.x;
        const dy = mouse.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CURSOR_RADIUS && dist > 1) {
          p.vx += (dx / dist) * CURSOR_STRENGTH;
          p.vy += (dy / dist) * CURSOR_STRENGTH;
        }

        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.drot;

        // Wrap around edges using half-diagonal of bounding box
        if (p.x < -p.halfDiag) p.x = W + p.halfDiag;
        if (p.x > W + p.halfDiag) p.x = -p.halfDiag;
        if (p.y < -p.halfDiag) p.y = H + p.halfDiag;
        if (p.y > H + p.halfDiag) p.y = -p.halfDiag;

        const [w1, h1, w2, h2, arr] = TEMPLATES[p.templateIdx];
        const color = COLORS[p.colorIdx];

        // Draw pair centered on p.x, p.y with rotation
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        if (arr === "H") {
          const totalW = w1 + w2;
          // Rect 1: vertically centered
          drawRect(-totalW / 2, -h1 / 2, w1, h1, color, p.opacity, p.strokeOnly);
          // Rect 2: vertically centered, touching rect 1
          drawRect(-totalW / 2 + w1, -h2 / 2, w2, h2, color, p.opacity * 0.75, p.strokeOnly);
        } else {
          const totalH = h1 + h2;
          // Rect 1: horizontally centered
          drawRect(-w1 / 2, -totalH / 2, w1, h1, color, p.opacity, p.strokeOnly);
          // Rect 2: horizontally centered, touching rect 1
          drawRect(-w2 / 2, -totalH / 2 + h1, w2, h2, color, p.opacity * 0.75, p.strokeOnly);
        }

        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => {
      mouse.current = { x: -9999, y: -9999 };
    };

    window.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
