import React from 'react';
import { Candidate } from '../../types';

interface CandidateComparisonDrawerProps {
  candidates: Candidate[];
  isOpen: boolean;
  onClose: () => void;
  onSelectFinalist?: (candidate: Candidate) => void;
}

export const CandidateComparisonDrawer: React.FC<CandidateComparisonDrawerProps> = ({
  candidates,
  isOpen,
  onClose,
  onSelectFinalist
}) => {
  if (!isOpen || candidates.length === 0) return null;

  // Find top score candidate
  const highestScore = Math.max(...candidates.map(c => c.aiScore));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />

      {/* Drawer Card */}
      <div
        className="relative w-full max-w-5xl max-h-[90vh] bg-[#181815] border border-[#2A2A28] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2A2A28] shrink-0 bg-[#11110F]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#D6A85F]/20 text-[#F4C377] border border-[#D6A85F]/30">
                Decision Intelligence
              </span>
              <span className="text-xs text-[#A1A19A] font-mono">Comparing {candidates.length} Candidates</span>
            </div>
            <h2 className="text-lg font-bold text-[#F4F1E9] mt-1">Side-by-Side Candidate Comparison Matrix</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#A1A19A] hover:text-[#F4F1E9] hover:bg-[#20201C] transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Comparison Matrix Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Candidates Top Summary Cards */}
          <div className={`grid grid-cols-1 sm:grid-cols-${candidates.length} gap-4`}>
            {candidates.map(c => {
              const isWinner = c.aiScore === highestScore;
              return (
                <div
                  key={c.id}
                  className={`bg-[#11110F] border rounded-xl p-4 space-y-3 relative ${
                    isWinner ? 'border-[#D6A85F] ring-1 ring-[#D6A85F]/30' : 'border-[#2A2A28]'
                  }`}
                >
                  {isWinner && (
                    <span className="absolute -top-3 right-3 px-2 py-0.5 rounded-full bg-[#D6A85F] text-[#11110F] text-[9px] font-mono font-bold uppercase tracking-wider shadow-md">
                      Highest Match
                    </span>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#D6A85F]/20 border border-[#D6A85F]/40 flex items-center justify-center font-bold text-sm text-[#F4C377] shrink-0">
                      {c.avatar}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#F4F1E9]">{c.name}</h3>
                      <p className="text-[10px] text-[#A1A19A] font-mono">{c.title}</p>
                      <p className="text-[9px] text-[#A1A19A] font-mono mt-0.5">{c.experience} • {c.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#2A2A28]">
                    <div className="text-left">
                      <div className="text-xs font-mono font-bold text-[#79A89A]">{c.aiScore}% AI Vector Score</div>
                      <div className="text-[9px] text-[#A1A19A] font-mono">Status: {c.status}</div>
                    </div>
                    {onSelectFinalist && (
                      <button
                        onClick={() => onSelectFinalist(c)}
                        className="px-2.5 py-1 rounded bg-[#D6A85F]/20 text-[#F4C377] border border-[#D6A85F]/40 text-[10px] font-mono font-bold hover:bg-[#D6A85F]/30 transition-all"
                      >
                        Select →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Metric Comparison Breakdown */}
          <div className="bg-[#11110F] border border-[#2A2A28] rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-[#F4F1E9] uppercase tracking-wider border-b border-[#2A2A28] pb-2 font-mono">
              Competency & Score Comparison
            </h4>

            <div className="space-y-3 font-mono text-xs">
              
              {/* Row 1: AI Vector Match */}
              <div className="space-y-1">
                <div className="text-[10px] text-[#A1A19A] uppercase tracking-wider">AI Vector Match Score</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {candidates.map(c => (
                    <div key={c.id} className="p-2.5 rounded bg-[#181815] border border-[#2A2A28] flex justify-between items-center">
                      <span className="text-[#A1A19A] text-[11px] truncate">{c.name}</span>
                      <span className="font-bold text-[#F4C377]">{c.aiScore}/100</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 2: Interview Scorecard */}
              <div className="space-y-1 pt-2 border-t border-[#2A2A28]">
                <div className="text-[10px] text-[#A1A19A] uppercase tracking-wider">Interview Scorecard Result</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {candidates.map(c => (
                    <div key={c.id} className="p-2.5 rounded bg-[#181815] border border-[#2A2A28] flex justify-between items-center">
                      <span className="text-[#A1A19A] text-[11px] truncate">{c.name}</span>
                      <span className="font-bold text-emerald-400">{c.interviewScore ? `${c.interviewScore}/100` : 'Pending'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 3: Key Skills Overlay */}
              <div className="space-y-1 pt-2 border-t border-[#2A2A28]">
                <div className="text-[10px] text-[#A1A19A] uppercase tracking-wider">Matched Skill Stack</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {candidates.map(c => (
                    <div key={c.id} className="p-2.5 rounded bg-[#181815] border border-[#2A2A28] space-y-1.5">
                      <div className="text-[10px] text-[#F4F1E9] font-bold">{c.name}</div>
                      <div className="flex flex-wrap gap-1">
                        {c.skills.map((s, i) => (
                          <span
                            key={i}
                            className={`text-[9px] px-1.5 py-0.5 rounded border ${
                              s.matched ? 'bg-[#79A89A]/15 text-[#79A89A] border-[#79A89A]/30' : 'bg-[#C97C5D]/15 text-[#C97C5D] border-[#C97C5D]/30'
                            }`}
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2A2A28] bg-[#11110F] flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#A1A19A]">
            HireGenie AI Multi-Candidate Decision Matrix
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#20201C] text-[#A1A19A] text-xs font-bold font-mono hover:bg-[#2A2A28]"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
