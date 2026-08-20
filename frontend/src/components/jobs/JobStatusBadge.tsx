import React from 'react';
import { JobStatusType } from '../../types';

interface JobStatusBadgeProps {
  status: JobStatusType;
}

export const JobStatusBadge: React.FC<JobStatusBadgeProps> = ({ status }) => {
  const getBadgeStyle = (status: JobStatusType) => {
    const s = String(status || 'OPEN').toUpperCase();
    if (s === 'ACTIVE' || s === 'OPEN') {
      return {
        colorClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 light:text-emerald-700 light:bg-emerald-100 light:border-emerald-400',
        dotClass: 'bg-emerald-400 animate-pulse light:bg-emerald-600',
        icon: 'play_arrow'
      };
    }
    if (s === 'DRAFT') {
      return {
        colorClass: 'bg-neutral-700/30 text-neutral-300 border-neutral-600/40 light:text-neutral-600 light:bg-neutral-200 light:border-neutral-400',
        dotClass: 'bg-neutral-400 light:bg-neutral-500',
        icon: 'edit_note'
      };
    }
    if (s === 'PAUSED') {
      return {
        colorClass: 'bg-[#C97C5D]/20 text-[#C97C5D] border-[#C97C5D]/40 light:text-[#8B4A2D] light:bg-[#C97C5D]/15 light:border-[#C97C5D]/50',
        dotClass: 'bg-[#C97C5D]',
        icon: 'pause'
      };
    }
    if (s === 'CLOSED') {
      return {
        colorClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 light:text-rose-700 light:bg-rose-100 light:border-rose-300',
        dotClass: 'bg-rose-400',
        icon: 'lock'
      };
    }
    if (s === 'ARCHIVED') {
      return {
        colorClass: 'bg-zinc-800 text-zinc-400 border-zinc-700',
        dotClass: 'bg-zinc-500',
        icon: 'archive'
      };
    }
    return {
      colorClass: 'bg-neutral-800 text-neutral-300 border-neutral-700 light:text-neutral-600 light:bg-neutral-200',
      dotClass: 'bg-neutral-400',
      icon: 'circle'
    };
  };

  const style = getBadgeStyle(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium border ${style.colorClass}`}
      role="status"
      aria-label={`Status: ${status}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dotClass}`} aria-hidden="true"></span>
      <span>{status}</span>
    </span>
  );
};
