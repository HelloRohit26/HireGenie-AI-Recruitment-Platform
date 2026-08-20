import React from 'react';
import { VoiceCore3D } from '../3d/VoiceCore3D';

interface VoiceCoreVisualizerProps {
  isSpeaking?: boolean;
  speakerRole?: 'ai' | 'candidate';
}

export const VoiceCoreVisualizer: React.FC<VoiceCoreVisualizerProps> = ({
  isSpeaking = true,
  speakerRole = 'ai'
}) => {
  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center rounded-full bg-[#1F201E]/40 backdrop-blur-md border border-[#9B8F7F]/10 shadow-[0_0_80px_rgba(244,195,119,0.05)]">
      {/* 3D Voice Core WebGL Engine */}
      <VoiceCore3D isSpeaking={isSpeaking} size={280} />

      {/* Central Role Badge Indicator */}
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center border transition-all shadow-2xl z-20 ${
          speakerRole === 'ai'
            ? 'bg-[#D6A85F]/20 border-[#D6A85F] text-[#F4C377] shadow-[#D6A85F]/20'
            : 'bg-[#79A89A]/20 border-[#79A89A] text-[#79A89A] shadow-[#79A89A]/20'
        }`}
      >
        <span className="material-symbols-outlined text-3xl animate-pulse">
          {speakerRole === 'ai' ? 'graphic_eq' : 'mic'}
        </span>
      </div>
    </div>
  );
};
