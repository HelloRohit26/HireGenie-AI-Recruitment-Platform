import React, { useState } from 'react';
import { RecruiterShell } from '../components/layout/RecruiterShell';
import { mockHelpArticles, mockFAQs } from '../data/mockData';

interface HelpPageProps {
  onNavigate?: (route: string) => void;
}

export const HelpPage: React.FC<HelpPageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const filteredArticles = mockHelpArticles.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFAQs = mockFAQs.filter(f =>
    f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RecruiterShell activeRoute="/help" onNavigate={onNavigate}>
      <div className="space-y-6 animate-fadeIn">
        {/* Page Header */}
        <div className="border-b border-[#2A2A28] dark:border-[#2A2A28] light:border-[#E2DEC5] pb-4">
          <h1 className="text-xl font-bold text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#D6A85F]">help_outline</span>
            Help & Documentation
          </h1>
          <p className="text-xs text-[#A1A19A] dark:text-[#A1A19A] light:text-[#587C6D] mt-0.5 font-mono">
            Learn how to use HireGenie AI and get answers to common questions.
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-[#181815] dark:bg-[#181815] light:bg-[#FAF8F2] border border-[#2A2A28] dark:border-[#2A2A28] light:border-[#E2DEC5] rounded-lg px-3 py-2.5">
          <span className="material-symbols-outlined text-[#A1A19A] text-lg">search</span>
          <input
            type="text"
            placeholder="Search help articles, FAQs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714] placeholder-[#A1A19A] outline-none"
          />
        </div>

        {/* Help Articles */}
        <div>
          <h2 className="text-sm font-bold text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714] mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#D6A85F] text-lg">library_books</span>
            Getting Started
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredArticles.map(article => (
              <div
                key={article.id}
                className="group bg-[#181815] dark:bg-[#181815] light:bg-[#FAF8F2] border border-[#2A2A28] dark:border-[#2A2A28] light:border-[#E2DEC5] hover:border-[#D6A85F] rounded-lg p-4 transition-all cursor-pointer hover:shadow-lg hover:shadow-[#D6A85F]/5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D6A85F]/15 border border-[#D6A85F]/30 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#F4C377] text-lg">{article.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714] group-hover:text-[#F4C377] transition-colors">{article.title}</h3>
                    <p className="text-[10px] text-[#A1A19A] mt-1 leading-relaxed">{article.description}</p>
                    <span className="text-[9px] font-mono text-[#D6A85F] mt-2 inline-block">{article.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-sm font-bold text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714] mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#D6A85F] text-lg">quiz</span>
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {filteredFAQs.map(faq => (
              <div
                key={faq.id}
                className="bg-[#181815] dark:bg-[#181815] light:bg-[#FAF8F2] border border-[#2A2A28] dark:border-[#2A2A28] light:border-[#E2DEC5] rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[#20201C] dark:hover:bg-[#20201C] light:hover:bg-[#F0EDE0] transition-colors"
                >
                  <span className="text-xs font-semibold text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714] pr-4">{faq.question}</span>
                  <span className="material-symbols-outlined text-[#A1A19A] text-lg shrink-0">
                    {expandedFAQ === faq.id ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {expandedFAQ === faq.id && (
                  <div className="px-4 pb-4 pt-0 border-t border-[#2A2A28]/50">
                    <p className="text-[11px] text-[#E5E2DE] dark:text-[#E5E2DE] light:text-[#171714] leading-relaxed mt-3">{faq.answer}</p>
                    <span className="text-[9px] font-mono text-[#A1A19A] mt-2 inline-block">{faq.category}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-[#181815] dark:bg-[#181815] light:bg-[#FAF8F2] border border-[#D6A85F]/30 rounded-xl p-6 text-center">
          <span className="material-symbols-outlined text-3xl text-[#D6A85F] mb-2 block">support_agent</span>
          <h3 className="text-sm font-bold text-[#F4F1E9] dark:text-[#F4F1E9] light:text-[#171714] mb-1">Need more help?</h3>
          <p className="text-xs text-[#A1A19A] mb-3">Contact our support team for personalized assistance.</p>
          <button
            disabled
            className="px-4 py-2 rounded-md bg-[#D6A85F]/20 text-[#F4C377] text-xs font-bold border border-[#D6A85F]/40 opacity-70 cursor-not-allowed"
            title="Support chat requires backend connection"
          >
            Contact Support
          </button>
        </div>
      </div>
    </RecruiterShell>
  );
};
