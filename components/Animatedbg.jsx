"use client";

import { useEffect, useRef } from "react";

const COLORS = [
  { r: 201, g: 152, b: 106 },
  { r: 168, g: 118, b: 90  },
  { r: 220, g: 180, b: 130 },
  { r: 110, g:  90, b: 160 },
  { r:  80, g: 100, b: 180 },
  { r: 180, g: 120, b: 160 },
];

export default function AnimatedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Floating memory particles ──
    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x       = Math.random() * canvas.width;
        this.y       = canvas.height + 20;
        this.r       = 1 + Math.random() * 2;
        this.vx      = (Math.random() - 0.5) * 0.4;
        this.vy      = -(0.15 + Math.random() * 0.35);
        this.life    = 0;
        this.maxLife = 300 + Math.random() * 400;
        this.color   = COLORS[Math.floor(Math.random() * COLORS.length)];
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx += (Math.random() - 0.5) * 0.02;
        this.life++;
        if (this.life > this.maxLife) this.reset();
      }
      draw() {
        const prog  = this.life / this.maxLife;
        const alpha = prog < 0.1 ? prog / 0.1 : prog > 0.8 ? (1 - prog) / 0.2 : 1;
        const { r, g, b } = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.7})`;
        ctx.fill();
        const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 6);
        grd.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.15})`);
        grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * 6, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }
    }

    // ── Neural net overlay ──
    class NeuralNet {
      constructor() {
        this.nodes = Array.from({ length: 28 }, () => ({
          x:  Math.random() * canvas.width,
          y:  Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
        }));
      }
      update() {
        this.nodes.forEach(n => {
          n.x += n.vx; n.y += n.vy;
          if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
          if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
        });
      }
      draw() {
        const DIST = 180;
        for (let i = 0; i < this.nodes.length; i++) {
          for (let j = i + 1; j < this.nodes.length; j++) {
            const a = this.nodes[i], b = this.nodes[j];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < DIST) {
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = `rgba(201,152,106,${(1 - d / DIST) * 0.08})`;
              ctx.lineWidth   = 0.5;
              ctx.stroke();
            }
          }
        }
        this.nodes.forEach(n => {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(201,152,106,0.2)";
          ctx.fill();
        });
      }
    }

    const particles = Array.from({ length: 60 }, () => {
      const p = new Particle();
      p.life = Math.random() * p.maxLife;
      p.y    = Math.random() * canvas.height;
      return p;
    });
    const net = new NeuralNet();

    const render = (t) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep background
      const bg = ctx.createRadialGradient(
        canvas.width * 0.4, canvas.height * 0.45, 0,
        canvas.width * 0.5, canvas.height * 0.5,  canvas.width * 0.9
      );
      bg.addColorStop(0,   "rgba(22,15,35,1)");
      bg.addColorStop(0.5, "rgba(12,9,22,1)");
      bg.addColorStop(1,   "rgba(6,4,12,1)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Vignette
      const vig = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width * 0.2,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.9
      );
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.65)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      net.update(); net.draw();
      particles.forEach(p => { p.update(); p.draw(); });

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      {/* Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />

      {/* Noise grain */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Scanlines */}
      <div
        className="fixed inset-0 z-[2] pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.04) 3px,rgba(0,0,0,0.04) 4px)",
        }}
      />
    </>
  );
}