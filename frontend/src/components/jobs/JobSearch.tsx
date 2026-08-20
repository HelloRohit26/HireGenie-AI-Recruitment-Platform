import React from 'react';

interface JobSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const JobSearch: React.FC<JobSearchProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <div className="relative flex-1">
      <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#A1A19A] text-lg">search</span>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search jobs by title, department, location..."
        className="w-full bg-[#11110F] border border-[#2A2A28] dark:border-[#2A2A28] light:border-[#E2DEC5] rounded-md pl-10 pr-4 py-2 text-xs text-[#E5E2DE] dark:text-[#E5E2DE] light:text-[#171714] placeholder-[#A1A19A] focus:outline-none focus:border-[#D6A85F] focus:ring-1 focus:ring-[#D6A85F] transition-all"
        aria-label="Search jobs"
      />
      {searchQuery && (
        <button
          onClick={() => onSearchChange('')}
          className="absolute right-3 top-2.5 text-[#A1A19A] hover:text-[#F4F1E9] text-xs font-mono"
          aria-label="Clear search query"
        >
          ✕
        </button>
      )}
    </div>
  );
};
