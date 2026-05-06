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
    <header className="-mx-4 px-4 pt-1 pb-3 mb-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-display font-bold text-text-primary truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-text-secondary truncate">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">{actions}</div>
      </div>

      {showSearch && (
        <div className="relative mt-3">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
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
            className="input pl-10 w-full bg-bg-tertiary border-0"
          />
        </div>
      )}
    </header>
  );
}
