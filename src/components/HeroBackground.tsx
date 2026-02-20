"use client";

import { useRef, useEffect } from "react";

interface Circle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  opacity: number;
  strokeOnly: boolean;
}

const NUM_CIRCLES = 28;
const CURSOR_RADIUS = 160; // px — influence zone around cursor
const CURSOR_STRENGTH = 0.022; // how strongly circles drift toward cursor
const DAMPING = 0.96;

export default function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const circles = useRef<Circle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const seed = (i: number, lo: number, hi: number) =>
      lo + ((i * 9301 + 49297) % 233280) / 233280 * (hi - lo);

    const init = () => {
      const W = canvas.width;
      const H = canvas.height;
      circles.current = Array.from({ length: NUM_CIRCLES }, (_, i) => ({
        x: seed(i * 3, 0, W),
        y: seed(i * 7, 0, H),
        r: seed(i * 11, 18, 90),
        vx: (seed(i * 13, 0, 1) - 0.5) * 0.35,
        vy: (seed(i * 17, 0, 1) - 0.5) * 0.35,
        opacity: seed(i * 19, 0.025, 0.085),
        strokeOnly: i % 3 === 0,
      }));
    };

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      init();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      for (const c of circles.current) {
        // Cursor attraction: gentle pull within the influence zone
        const dx = mouse.current.x - c.x;
        const dy = mouse.current.y - c.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CURSOR_RADIUS && dist > 1) {
          c.vx += (dx / dist) * CURSOR_STRENGTH;
          c.vy += (dy / dist) * CURSOR_STRENGTH;
        }

        // Damping
        c.vx *= DAMPING;
        c.vy *= DAMPING;

        // Move
        c.x += c.vx;
        c.y += c.vy;

        // Wrap-around edges (with r padding so circle fades back in)
        if (c.x < -c.r) c.x = W + c.r;
        if (c.x > W + c.r) c.x = -c.r;
        if (c.y < -c.r) c.y = H + c.r;
        if (c.y > H + c.r) c.y = -c.r;

        // Draw
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        if (c.strokeOnly) {
          ctx.strokeStyle = `rgba(46,230,166,${c.opacity * 1.4})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(46,230,166,${c.opacity})`;
          ctx.fill();
        }
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
