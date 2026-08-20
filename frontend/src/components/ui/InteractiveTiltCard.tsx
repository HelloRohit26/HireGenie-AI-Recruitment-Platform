import React, { useRef, useState, useEffect } from 'react';

interface InteractiveTiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTiltDeg?: number;
  onClick?: () => void;
  disabled?: boolean;
}

export const InteractiveTiltCard: React.FC<InteractiveTiltCardProps> = ({
  children,
  className = '',
  maxTiltDeg = 3,
  onClick,
  disabled = false
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [transformStyle, setTransformStyle] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchOrReducedMotion, setIsTouchOrReducedMotion] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (prefersReducedMotion || isTouchDevice) {
      setIsTouchOrReducedMotion(true);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || isTouchOrReducedMotion || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (((y - centerY) / centerY) * -maxTiltDeg).toFixed(2);
    const rotateY = (((x - centerX) / centerX) * maxTiltDeg).toFixed(2);

    setTransformStyle(
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px) scale3d(1.01, 1.01, 1.01)`
    );
  };

  const handleMouseEnter = () => {
    if (disabled || isTouchOrReducedMotion) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (disabled || isTouchOrReducedMotion) return;
    setIsHovered(false);
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)');
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: disabled || isTouchOrReducedMotion ? 'none' : transformStyle,
        transition: isHovered
          ? 'transform 0.1s cubic-bezier(0.2, 0, 0.2, 1), box-shadow 0.3s ease, border-color 0.3s ease'
          : 'transform 0.5s cubic-bezier(0.2, 0, 0.2, 1), box-shadow 0.3s ease, border-color 0.3s ease',
        willChange: 'transform'
      }}
      className={`relative rounded-xl border transition-colors theme-transition ${
        isHovered
          ? 'bg-[var(--surface-elevated)] border-[var(--border-strong)] shadow-[var(--shadow-md)]'
          : 'bg-[var(--surface)] border-[var(--border)] shadow-[var(--shadow-sm)]'
      } ${className}`}
    >
      {/* Subtle ambient highlight sheen on hover */}
      {isHovered && !isTouchOrReducedMotion && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none opacity-20 bg-gradient-to-tr from-transparent via-[var(--accent-primary)] to-transparent transition-opacity duration-300"
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
};
