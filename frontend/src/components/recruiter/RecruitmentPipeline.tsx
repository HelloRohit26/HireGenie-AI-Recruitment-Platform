import React, { useState } from 'react';
import { PipelineStage } from '../../types';

interface RecruitmentPipelineProps {
  stages: PipelineStage[];
  title?: string;
  subtitle?: string;
}

export const RecruitmentPipeline: React.FC<RecruitmentPipelineProps> = ({
  stages,
  title = "Live Recruitment Pipeline",
  subtitle = "Real-time candidate conversion & autonomous AI filter funnel"
}) => {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  const maxCount = stages.length > 0 ? stages[0].count : 1;

  return (
    <div className="bg-[#181815] dark:bg-[#181815] light:bg-[#FAF8F2] border border-[#2A2A28] dark:border-[#2A2A28] light:border-[#E2DEC5] rounded-lg p-6 transition-all duration-200">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#D6A85F] text-lg">filter_alt</span>
            {title}
          </h2>
          <p className="text-xs text-[#A1A19A] dark:text-[#A1A19A] light:text-[#587C6D] mt-0.5 font-mono">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#D6A85F]">
          <span className="w-2 h-2 rounded-full bg-[#D6A85F] animate-ping"></span>
          <span>Live Funnel Stream</span>
        </div>
      </div>

      {/* PIPELINE VISUALIZATION GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 relative">
        {stages.map((stage, idx) => {
          const isHovered = hoveredStage === stage.id;
          const heightPercent = Math.max(15, Math.min(100, (stage.count / maxCount) * 100));

          return (
            <div
              key={stage.id}
              onMouseEnter={() => setHoveredStage(stage.id)}
              onMouseLeave={() => setHoveredStage(null)}
              className={`relative bg-[#11110F] p-4 rounded-lg border transition-all duration-200 cursor-pointer flex flex-col justify-between h-44 ${
                isHovered
                  ? 'border-[#D6A85F] bg-[#1C1C19] shadow-lg shadow-[#D6A85F]/10 scale-[1.02]'
                  : 'border-[#2A2A28] hover:border-[#4A4A42]'
              }`}
              tabIndex={0}
              role="button"
              aria-label={`${stage.name}: ${stage.count.toLocaleString()} candidates. ${stage.conversionRate}`}
            >
              {/* TOP STAGE STEP NUMBER */}
              <div className="flex items-center justify-between text-[11px] font-mono text-[#A1A19A]">
                <span>0{idx + 1}</span>
                <span className="text-[10px] uppercase font-semibold text-[#D6A85F]">
                  {stage.percentage}%
                </span>
              </div>

              {/* CENTER CANDIDATE COUNT */}
              <div className="my-2">
                <p className="text-2xl font-bold tracking-tight text-[#F4F1E9]">
                  {stage.count.toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-[#E5E2DE] mt-0.5 truncate">
                  {stage.name}
                </p>
              </div>

              {/* BOTTOM CONVERSION BAR GRAPH */}
              <div className="w-full">
                <div className="h-1.5 w-full bg-[#20201C] rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-gradient-to-r from-[#D6A85F] to-[#79A89A] rounded-full transition-all duration-500"
                    style={{ width: `${heightPercent}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-[#A1A19A] line-clamp-1 font-mono">
                  {stage.conversionRate}
                </p>
              </div>

              {/* HOVER TOOLTIP DETAIL */}
              {isHovered && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#1C1C1A] text-[#F4F1E9] text-[10px] font-mono py-1.5 px-3 rounded-md border border-[#D6A85F] whitespace-nowrap shadow-xl z-20 pointer-events-none">
                  Stage: {stage.name} • {stage.count.toLocaleString()} candidates ({stage.percentage}%)
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
