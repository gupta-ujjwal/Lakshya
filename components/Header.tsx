"use client";

import { useState } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, showSearch = false, actions }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-30 bg-bg-primary/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-text-primary">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-text-secondary">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {showSearch && (
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-48 bg-bg-tertiary border-0 focus:w-64 focus:bg-bg-secondary"
              />
            </div>
          )}
          {actions}
        </div>
      </div>
    </header>
  );
}