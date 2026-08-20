import React, { useEffect, useRef } from 'react';

export const SharpNavyRainCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let beams: LightBeam[] = [];

    class LightBeam {
      x = 0;
      y = 0;
      length = 0;
      speed = 0;
      thickness = 0;
      alpha = 0;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * -height;
        this.length = Math.random() * 140 + 60;
        this.speed = Math.random() * 2 + 1.2;
        this.thickness = Math.random() * 1.8 + 1;
        this.alpha = Math.random() * 0.6 + 0.4;
      }

      update() {
        this.y += this.speed;
        if (this.y - this.length > height) {
          this.reset();
          this.y = -this.length;
        }
      }

      draw() {
        if (!ctx) return;
        const gradient = ctx.createLinearGradient(
          this.x, this.y, 
          this.x, this.y + this.length
        );

        gradient.addColorStop(0, `rgba(15, 23, 42, 0)`);
        gradient.addColorStop(0.3, `rgba(30, 58, 138, ${this.alpha * 0.7})`);
        gradient.addColorStop(0.7, `rgba(29, 78, 216, ${this.alpha * 0.9})`);
        gradient.addColorStop(1, `rgba(56, 189, 248, ${this.alpha})`);

        ctx.beginPath();
        ctx.moveTo(Math.floor(this.x), Math.floor(this.y));
        ctx.lineTo(Math.floor(this.x), Math.floor(this.y + this.length));
        ctx.strokeStyle = gradient;
        ctx.lineWidth = this.thickness;
        ctx.lineCap = 'butt';
        ctx.stroke();
      }
    }

    const initBeams = () => {
      beams = [];
      const count = Math.min(Math.floor(width / 3.5), 350);
      for (let i = 0; i < count; i++) {
        beams.push(new LightBeam());
      }
    };

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      initBeams();
    };

    const animate = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.45)';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < beams.length; i++) {
        beams[i].update();
        beams[i].draw();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
