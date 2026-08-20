import React, { useState, useEffect } from 'react';

interface AudioWaveformPlayerProps {
  title?: string;
  durationSeconds?: number;
}

export const AudioWaveformPlayer: React.FC<AudioWaveformPlayerProps> = ({
  title = "AI Voice Interview Recording — Technical Round",
  durationSeconds = 255 // 4m 15s
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= durationSeconds) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, durationSeconds]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Generate 40 pseudo-waveform bar heights
  const bars = [
    30, 45, 60, 80, 65, 40, 90, 100, 75, 50,
    30, 60, 85, 95, 70, 40, 60, 80, 90, 60,
    40, 75, 85, 100, 90, 65, 50, 70, 85, 60,
    40, 30, 65, 90, 75, 50, 35, 60, 80, 45
  ];

  const progressPercent = (currentTime / durationSeconds) * 100;

  return (
    <div className="bg-[#11110F] border border-[#2A2A28] rounded-xl p-4 space-y-3">
      {/* Title + Time */}
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#D6A85F] text-sm">graphic_eq</span>
          <span className="text-[#F4F1E9] font-bold truncate">{title}</span>
        </div>
        <span className="text-[#A1A19A] text-[10px]">
          {formatTime(currentTime)} / {formatTime(durationSeconds)}
        </span>
      </div>

      {/* Waveform Visualization */}
      <div className="flex items-end justify-between h-10 gap-1 px-1 bg-[#181815] rounded-lg p-2 border border-[#2A2A28]/50">
        {bars.map((height, idx) => {
          const barProgress = (idx / bars.length) * 100;
          const isPlayed = barProgress <= progressPercent;

          return (
            <div
              key={idx}
              className={`flex-1 rounded-full transition-all duration-150 ${
                isPlayed ? 'bg-[#D6A85F]' : 'bg-[#2A2A28]'
              } ${isPlaying && isPlayed ? 'animate-pulse' : ''}`}
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>

      {/* Controls & Scrubber Bar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-8 h-8 rounded-full bg-[#D6A85F] text-[#11110F] flex items-center justify-center font-bold shadow-md hover:bg-[#F4C377] transition-all shrink-0"
          aria-label={isPlaying ? 'Pause interview audio' : 'Play interview audio'}
        >
          <span className="material-symbols-outlined text-base">
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>

        {/* Range Scrubber */}
        <input
          type="range"
          min={0}
          max={durationSeconds}
          value={currentTime}
          onChange={e => setCurrentTime(Number(e.target.value))}
          className="flex-1 h-1.5 bg-[#2A2A28] accent-[#D6A85F] rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );
};
