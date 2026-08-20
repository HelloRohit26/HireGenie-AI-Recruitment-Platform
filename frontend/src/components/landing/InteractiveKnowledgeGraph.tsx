import React, { useState } from 'react';
import { InteractiveTiltCard } from '../ui/InteractiveTiltCard';

interface SkillNode {
  id: string;
  name: string;
  category: 'core' | 'ai' | 'infra';
  candidatesCount: number;
  jobsCount: number;
  matchingAgent: string;
  description: string;
}

const SKILL_NODES: SkillNode[] = [
  { id: 'python', name: 'Python', category: 'core', candidatesCount: 842, jobsCount: 6, matchingAgent: 'Skill Matcher', description: 'Primary backend & ML language used across 94% of top shortlist candidates.' },
  { id: 'transformers', name: 'Transformers', category: 'ai', candidatesCount: 312, jobsCount: 4, matchingAgent: 'Ranking Agent', description: 'LLM fine-tuning & sequence model expertise evaluated by Evaluation Agent.' },
  { id: 'fastapi', name: 'FastAPI', category: 'infra', candidatesCount: 520, jobsCount: 5, matchingAgent: 'Skill Matcher', description: 'Async microservices architecture & REST/gRPC API design.' },
  { id: 'system_design', name: 'System Architecture', category: 'core', candidatesCount: 410, jobsCount: 3, matchingAgent: 'Voice Interviewer', description: 'High-scale distributed systems, latency optimization & data pipelines.' },
  { id: 'nlp', name: 'NLP & LLMs', category: 'ai', candidatesCount: 290, jobsCount: 4, matchingAgent: 'Evaluation Agent', description: 'Retrieval augmented generation (RAG), vector databases & prompt engineering.' },
  { id: 'mlops', name: 'MLOps & Kubernetes', category: 'infra', candidatesCount: 380, jobsCount: 3, matchingAgent: 'Candidate Ranker', description: 'Model deployment, CI/CD pipelines, Docker, & GPU cluster orchestration.' }
];

export const InteractiveKnowledgeGraph: React.FC = () => {
  const [activeSkillId, setActiveSkillId] = useState<string>('transformers');

  const selectedSkill = SKILL_NODES.find(s => s.id === activeSkillId) || SKILL_NODES[1];

  return (
    <section className="py-20 px-6 md:px-12 max-w-6xl mx-auto space-y-12">
      {/* SECTION HEADER */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-secondary)]/15 border border-[var(--accent-secondary)]/30 text-[var(--accent-secondary)] text-xs font-mono">
          <span className="material-symbols-outlined text-sm">hub</span>
          RECRUITMENT INTELLIGENCE KNOWLEDGE GRAPH
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
          Connected Skill & Candidate Intelligence
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
          Click any skill domain to see live candidate matching, requisition alignment, and which autonomous AI agent validates technical depth.
        </p>
      </div>

      {/* SKILL PILLS SELECTOR */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {SKILL_NODES.map(skill => {
          const isActive = skill.id === activeSkillId;
          return (
            <button
              key={skill.id}
              onClick={() => setActiveSkillId(skill.id)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-200 active:scale-95 flex items-center gap-2 ${
                isActive
                  ? 'bg-[var(--accent-primary)] text-[#171815] shadow-lg shadow-[var(--accent-primary)]/20 scale-105'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>{skill.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                isActive ? 'bg-[#171815]/20 text-[#171815]' : 'bg-[var(--surface-elevated)] text-[var(--text-muted)]'
              }`}>
                {skill.candidatesCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* INTERACTIVE KNOWLEDGE GRAPH BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* MATCHED CANDIDATES */}
        <InteractiveTiltCard className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <span className="text-xs font-mono text-[var(--accent-primary)] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">groups</span>
              Candidates Matched
            </span>
            <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{selectedSkill.candidatesCount}</span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {selectedSkill.description}
          </p>

          <div className="space-y-2 pt-2">
            {[
              { name: 'Priya Sharma', score: 94, role: 'Senior AI Engineer' },
              { name: 'Alex Chen', score: 91, role: 'ML Researcher' },
              { name: 'Aisha Patel', score: 88, role: 'Backend Engineer' }
            ].map(c => (
              <div key={c.name} className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-xs">
                <div>
                  <div className="font-bold text-[var(--text-primary)]">{c.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono">{c.role}</div>
                </div>
                <span className="text-xs font-mono font-bold text-[var(--accent-primary)]">{c.score}% match</span>
              </div>
            ))}
          </div>
        </InteractiveTiltCard>

        {/* ACTIVE REQUISITIONS */}
        <InteractiveTiltCard className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <span className="text-xs font-mono text-[var(--accent-secondary)] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">work</span>
              Aligned Requisitions
            </span>
            <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{selectedSkill.jobsCount} Open</span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { title: 'AI Engineer', dept: 'AI Research & Engineering', loc: 'San Francisco, CA' },
              { title: 'Data Scientist', dept: 'Analytics & Intelligence', loc: 'New York, NY' },
              { title: 'Machine Learning Architect', dept: 'Core Infrastructure', loc: 'Remote' }
            ].slice(0, selectedSkill.jobsCount).map(j => (
              <div key={j.title} className="p-3 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-xs space-y-1">
                <div className="font-bold text-[var(--text-primary)]">{j.title}</div>
                <div className="text-[10px] text-[var(--text-secondary)] font-mono">{j.dept} • {j.loc}</div>
              </div>
            ))}
          </div>
        </InteractiveTiltCard>

        {/* AI AGENT VALIDATOR */}
        <InteractiveTiltCard className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <span className="text-xs font-mono text-[var(--accent-supporting)] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">smart_toy</span>
              Responsible Agent
            </span>
            <span className="text-xs font-mono text-[var(--status-success)] font-bold">Active</span>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--accent-supporting)]/30 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-supporting)]/20 text-[var(--accent-supporting)] flex items-center justify-center font-bold">
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)]">{selectedSkill.matchingAgent}</h4>
                <span className="text-[10px] font-mono text-[var(--accent-supporting)]">Rubric Evaluation Agent</span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Synthesizes code artifacts, project repositories, and technical interview transcripts for <strong className="text-[var(--text-primary)]">{selectedSkill.name}</strong>.
            </p>
          </div>
        </InteractiveTiltCard>
      </div>
    </section>
  );
};
