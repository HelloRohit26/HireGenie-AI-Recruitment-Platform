import React from 'react';
import { InteractiveTiltCard } from './InteractiveTiltCard';
import { useCountUp } from '../../hooks/useCountUp';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend: string;
  subtitle: string;
  icon: string;
  hoverInfo?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  trend,
  subtitle,
  icon,
  hoverInfo,
  onClick
}) => {
  // Extract number if value contains numeric digits
  const rawNum = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, ''));
  const isNumeric = !isNaN(rawNum) && rawNum > 0;
  const suffix = typeof value === 'string' ? String(value).replace(/[0-9.]/g, '') : '';
  const decimals = String(rawNum).includes('.') ? (String(rawNum).split('.')[1] || '').length : 0;

  const { count, elementRef } = useCountUp({
    endValue: isNumeric ? rawNum : 0,
    durationMs: 1000,
    decimals: Math.min(decimals, 2)
  });

  const displayValue = isNumeric
    ? `${count}${suffix}`
    : value;

  return (
    <InteractiveTiltCard
      onClick={onClick}
      className={`p-4 group cursor-pointer ${onClick ? 'hover:border-[var(--accent-primary)]' : ''}`}
    >
      <div ref={elementRef} tabIndex={onClick ? 0 : undefined} role={onClick ? 'button' : undefined} aria-label={`${label}: ${value}, ${trend}`}>
        {/* Top Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-medium">
            {label}
          </span>
          <span className="material-symbols-outlined text-lg text-[var(--accent-primary)] group-hover:scale-110 transition-transform">
            {icon}
          </span>
        </div>

        {/* Main Value */}
        <div className="text-xl sm:text-2xl font-mono font-bold text-[var(--text-primary)] tracking-tight">
          {displayValue}
        </div>

        {/* Trend & Subtitle */}
        <div className="mt-1.5 flex items-baseline justify-between text-[10px] font-mono">
          <span className="text-[var(--accent-primary)] font-semibold truncate">{trend}</span>
          <span className="text-[var(--text-muted)] truncate">{subtitle}</span>
        </div>

        {/* Hover Tooltip / Hint */}
        {hoverInfo && (
          <div className="absolute inset-x-0 bottom-0 py-1 px-3 bg-[var(--surface-elevated)] rounded-b-xl border-t border-[var(--border)] text-[9px] font-mono text-[var(--accent-primary)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between pointer-events-none">
            <span>{hoverInfo}</span>
            <span>View →</span>
          </div>
        )}
      </div>
    </InteractiveTiltCard>
  );
};
