import React from 'react';
import { JobStatusType, JobSortOption } from '../../types';

interface StatusCounts {
  all: number;
  active: number;
  draft: number;
  closed: number;
  archived: number;
}

interface JobFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  departmentFilter: string;
  onDepartmentFilterChange: (dept: string) => void;
  locationFilter: string;
  onLocationFilterChange: (loc: string) => void;
  sortBy: JobSortOption;
  onSortByChange: (sort: JobSortOption) => void;
  onClearAll: () => void;
  departments: string[];
  locations: string[];
  activeCount?: number;
  statusCounts?: StatusCounts;
}

export const JobFilters: React.FC<JobFiltersProps> = ({
  statusFilter,
  onStatusFilterChange,
  departmentFilter,
  onDepartmentFilterChange,
  locationFilter,
  onLocationFilterChange,
  sortBy,
  onSortByChange,
  onClearAll,
  departments,
  locations,
  statusCounts
}) => {
  const statuses: { id: string; label: string; count?: number }[] = [
    { id: 'all', label: 'All', count: statusCounts?.all },
    { id: 'Active', label: 'Active', count: statusCounts?.active },
    { id: 'Draft', label: 'Draft', count: statusCounts?.draft },
    { id: 'Closed', label: 'Closed', count: statusCounts?.closed },
    { id: 'Archived', label: 'Archived', count: statusCounts?.archived }
  ];

  const hasActiveFilters = statusFilter !== 'all' || departmentFilter !== 'all' || locationFilter !== 'all';

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#181815] dark:bg-[#181815] light:bg-[#FAF8F2] p-4 rounded-lg border border-[#2A2A28] dark:border-[#2A2A28] light:border-[#E2DEC5]">
      {/* STATUS TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
        {statuses.map(st => {
          const isActive = statusFilter.toLowerCase() === st.id.toLowerCase();
          return (
            <button
              key={st.id}
              onClick={() => onStatusFilterChange(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#D6A85F]/20 text-[#F4C377] font-semibold border border-[#D6A85F]/40'
                  : 'text-[#A1A19A] hover:text-[#F4F1E9] hover:bg-[#20201C] border border-transparent'
              }`}
            >
              <span>{st.label}</span>
              {st.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-[#D6A85F]/30 text-[#F4C377]' : 'bg-[#20201C] text-[#A1A19A]'
                }`}>
                  {st.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* DROPDOWN FILTERS & SORT SELECTOR */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {/* DEPARTMENT SELECTOR */}
        <select
          value={departmentFilter}
          onChange={(e) => onDepartmentFilterChange(e.target.value)}
          className="bg-[#11110F] border border-[#2A2A28] rounded px-3 py-1.5 text-[#E5E2DE] focus:outline-none focus:border-[#D6A85F]"
          aria-label="Filter by department"
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        {/* LOCATION SELECTOR */}
        <select
          value={locationFilter}
          onChange={(e) => onLocationFilterChange(e.target.value)}
          className="bg-[#11110F] border border-[#2A2A28] rounded px-3 py-1.5 text-[#E5E2DE] focus:outline-none focus:border-[#D6A85F]"
          aria-label="Filter by location"
        >
          <option value="all">All Locations</option>
          {locations.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>

        {/* SORT BY SELECTOR */}
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as JobSortOption)}
          className="bg-[#11110F] border border-[#2A2A28] rounded px-3 py-1.5 text-[#D6A85F] font-mono focus:outline-none focus:border-[#D6A85F]"
          aria-label="Sort jobs by"
        >
          <option value="recently_posted">Sort: Recently Posted</option>
          <option value="applicants">Sort: Applicants (High to Low)</option>
          <option value="shortlisted">Sort: AI Shortlisted</option>
          <option value="interviews">Sort: Interviews</option>
          <option value="time_to_hire">Sort: Time to Hire</option>
        </select>

        {/* CLEAR ALL BUTTON */}
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-xs font-mono text-[#C97C5D] hover:underline flex items-center gap-1"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
};
