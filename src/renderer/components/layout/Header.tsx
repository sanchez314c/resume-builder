/**
 * Header Component
 * Resume Builder - CashCommand Style
 *
 * Application header with title, subtitle, and quick stats.
 */

import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { useAppStore } from '../../stores/app-store';
import { ThemeToggle } from '../ThemeToggle';

const pageNames: Record<string, { title: string; subtitle: string }> = {
  projects: { title: 'Projects', subtitle: 'Manage your resume projects' },
  import: { title: 'Import Data', subtitle: 'Load your AI conversation exports' },
  analysis: { title: 'Analysis Dashboard', subtitle: 'Skills and experience insights' },
  jobs: { title: 'Job Matching', subtitle: 'Find your ideal positions' },
  resume: { title: 'Resume Builder', subtitle: 'Craft your professional story' },
  export: { title: 'Export', subtitle: 'Download your documents' },
};

export const Header: React.FC = () => {
  const { currentPage, errors } = useAppStore();
  const unreadErrors = errors.filter((e) => !e.dismissed).length;

  const pageInfo = pageNames[currentPage] || {
    title: 'Resume Builder',
    subtitle: 'AI-Powered Career Tools',
  };

  // Format current date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="flex h-16 items-center justify-between border-b border-[rgba(0,210,190,0.15)] bg-[rgba(10,10,15,0.9)] px-6 backdrop-blur-xl">
      {/* Left Section - Page Title */}
      <div>
        <h1 className="text-xl font-semibold text-[--color-text-primary]">{pageInfo.title}</h1>
        <p className="text-sm text-[--color-text-muted]">{formattedDate}</p>
      </div>

      {/* Right Section - Quick Stats & Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Stats Badges - Glass Style */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="rounded-lg border border-[rgba(0,210,190,0.15)] bg-[rgba(26,29,36,0.6)] px-4 py-2 backdrop-blur-sm">
            <span className="text-sm text-[--color-text-muted]">Skills Found</span>
            <span className="ml-2 text-base font-semibold text-[#00d2be]">--</span>
          </div>
          <div className="rounded-lg border border-[rgba(0,210,190,0.15)] bg-[rgba(26,29,36,0.6)] px-4 py-2 backdrop-blur-sm">
            <span className="text-sm text-[--color-text-muted]">Job Matches</span>
            <span className="ml-2 text-base font-semibold text-[#00d2be]">--</span>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden h-8 w-px bg-[rgba(0,210,190,0.15)] md:block" />

        {/* Theme Toggle */}
        <ThemeToggle showDropdown size="sm" />

        {/* Search — not yet implemented */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#94a3b8] opacity-40 cursor-not-allowed"
          disabled
          title="Search (coming soon)"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Notifications */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#94a3b8] transition-all duration-200 hover:bg-white/5 hover:text-[#f1f5f9]"
          title="Notifications"
          onClick={() => {/* Error badges shown inline via store */}}
        >
          <Bell className="h-5 w-5" />
          {unreadErrors > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#ef4444] text-[10px] font-bold text-white">
              {unreadErrors > 9 ? '9+' : unreadErrors}
            </span>
          )}
        </button>

        {/* User Avatar — not yet implemented */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(0,210,190,0.1)] text-[#00d2be] opacity-40 cursor-not-allowed"
          disabled
          title="User profile (coming soon)"
        >
          <User className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};
