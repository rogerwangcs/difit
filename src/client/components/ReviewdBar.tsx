import { LayoutGrid } from 'lucide-react';
import { useRef, useState } from 'react';

import type { ReviewdSession } from '../hooks/useReviewdSession';
import { useClickOutside } from '../hooks/useClickOutside';

import { ReviewdSubmitButton } from './ReviewdSubmitButton';

interface ReviewdBarProps {
  session: ReviewdSession;
  sessions: ReviewdSession[];
  threadCount: number;
  submitting: boolean;
  onSubmit: () => void;
  onSwitchSession: (session: ReviewdSession) => void;
}

function sessionLabel(row: ReviewdSession): string {
  const comments = row.comment_count ?? 0;
  return `${row.repo_name} · ${row.branch} · ${row.state} · r${row.round} · ${comments} comments`;
}

export function ReviewdBar({
  session,
  sessions,
  threadCount,
  submitting,
  onSubmit,
  onSwitchSession,
}: ReviewdBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setMenuOpen(false));

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-github-text-secondary">
      <div className="flex items-center gap-2 font-medium text-github-text-primary">
        <span>Review</span>
        <span className="text-github-text-muted">·</span>
        <span>{session.repo_name}</span>
        <span className="text-github-text-muted">·</span>
        <span>{session.branch}</span>
        <span className="text-github-text-muted">·</span>
        <span>{session.state}</span>
        <span className="text-github-text-muted">·</span>
        <span>r{session.round}</span>
      </div>

      <ReviewdSubmitButton
        threadCount={threadCount}
        listening={session.state === 'listening'}
        submitting={submitting}
        onSubmit={onSubmit}
      />

      {sessions.length > 1 && (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="p-2 text-github-text-secondary hover:text-github-text-primary hover:bg-github-bg-tertiary rounded transition-colors"
            title="Switch review session"
            aria-label="Switch review session"
          >
            <LayoutGrid size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 min-w-[20rem] z-50 rounded-md border border-github-border bg-github-bg-secondary shadow-lg py-1">
              {sessions.map((row) => (
                <button
                  key={row.session_id}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onSwitchSession(row);
                  }}
                  className={`block w-full text-left px-3 py-2 text-xs hover:bg-github-bg-tertiary ${
                    row.session_id === session.session_id
                      ? 'text-github-accent font-medium'
                      : 'text-github-text-primary'
                  }`}
                >
                  {sessionLabel(row)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
