import { useState, useRef, useEffect, useCallback } from 'react';
import { useChangelog, type ChangelogArea, type ChangelogEntryType } from '../hooks/useChangelog';

const TYPE_COLORS: Record<ChangelogEntryType, string> = {
  feature: '#22c55e',
  enhancement: '#3b82f6',
  fix: '#f59e0b',
  change: '#a78bfa',
};

const TYPE_LABELS: Record<ChangelogEntryType, string> = {
  feature: 'New',
  enhancement: 'Improved',
  fix: 'Fixed',
  change: 'Changed',
};

interface WhatsNewProps {
  area: ChangelogArea;
  className?: string;
}

export default function WhatsNew({ area, className = '' }: WhatsNewProps) {
  const {
    entriesForArea,
    hasUnseenForArea,
    markSeen,
    isEntrySeen,
    loading,
  } = useChangelog();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const areaVersions = entriesForArea(area);
  const hasUnseen = hasUnseenForArea(area);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Clean up hover timers
  useEffect(() => {
    return () => {
      Object.values(hoverTimers.current).forEach(clearTimeout);
    };
  }, []);

  const handleEntryHover = useCallback((id: string) => {
    if (hoverTimers.current[id]) return;
    hoverTimers.current[id] = setTimeout(() => {
      markSeen(id);
      delete hoverTimers.current[id];
    }, 1000);
  }, [markSeen]);

  const handleEntryLeave = useCallback((id: string) => {
    if (hoverTimers.current[id]) {
      clearTimeout(hoverTimers.current[id]);
      delete hoverTimers.current[id];
    }
  }, []);

  // Return null if no entries exist for this area
  if (loading || areaVersions.length === 0) return null;

  return (
    <div className={`whats-new ${className}`} ref={containerRef}>
      <button
        className={`whats-new-btn ${className.includes('apple') ? 'whats-new-btn-apple' : ''}`}
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        title="What's new here"
      >
        {className.includes('apple') ? (
          <>
            <span className="whats-new-btn-label">What's New</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            {hasUnseen && <span className="whats-new-dot" />}
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            {hasUnseen && <span className="whats-new-dot" />}
          </>
        )}
      </button>

      {isOpen && (
        <div className="whats-new-dropdown" onClick={(e) => e.stopPropagation()}>
          <div className="whats-new-dropdown-header">
            <span className="whats-new-dropdown-title">What's new</span>
          </div>
          <div className="whats-new-dropdown-list">
            {areaVersions.map(v => (
              <div key={v.version} className="whats-new-group">
                <div className="whats-new-group-label">
                  v{v.version} <span className="whats-new-group-date">{v.date}</span>
                </div>
                {v.entries.map(entry => {
                  const seen = isEntrySeen(entry.id);
                  return (
                    <div
                      key={entry.id}
                      className={`whats-new-entry ${seen ? 'seen' : 'unseen'}`}
                      onMouseEnter={() => !seen && handleEntryHover(entry.id)}
                      onMouseLeave={() => handleEntryLeave(entry.id)}
                    >
                      <span
                        className="whats-new-entry-type"
                        style={{ background: TYPE_COLORS[entry.type] }}
                      >
                        {TYPE_LABELS[entry.type]}
                      </span>
                      <div className="whats-new-entry-content">
                        <span className="whats-new-entry-title">
                          {entry.title}
                          {!seen && <span className="whats-new-entry-dot" />}
                        </span>
                        <span className="whats-new-entry-desc">{entry.description}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .whats-new {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .whats-new-btn {
          background: transparent;
          border: none;
          padding: 3px;
          cursor: pointer;
          color: #6b7280;
          display: flex;
          align-items: center;
          position: relative;
          transition: color 0.2s;
        }

        .whats-new-btn:hover {
          color: #9ca3af;
        }

        .whats-new-btn-apple {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 3px 8px;
          gap: 4px;
          font-size: 11px;
          font-weight: 500;
          color: #9ca3af;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .whats-new-btn-apple:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #d1d5db;
          border-color: rgba(255, 255, 255, 0.15);
        }

        .whats-new-btn-label {
          white-space: nowrap;
        }

        [data-theme="light"] .whats-new-btn-apple {
          background: rgba(0, 0, 0, 0.03);
          border-color: rgba(0, 0, 0, 0.1);
          color: #6e6e73;
        }

        [data-theme="light"] .whats-new-btn-apple:hover {
          background: rgba(0, 0, 0, 0.06);
          color: #1d1d1f;
          border-color: rgba(0, 0, 0, 0.15);
        }

        .whats-new-dot {
          position: absolute;
          top: 0;
          right: -1px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3b82f6;
        }

        .whats-new-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          width: 300px;
          max-height: 360px;
          background: #1a1a1f;
          border: 1px solid #2a2a35;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          z-index: 1000;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .whats-new-dropdown-header {
          padding: 10px 14px;
          border-bottom: 1px solid #2a2a35;
        }

        .whats-new-dropdown-title {
          font-weight: 600;
          color: #e5e7eb;
          font-size: 13px;
        }

        .whats-new-dropdown-list {
          overflow-y: auto;
          flex: 1;
          padding: 6px;
        }

        .whats-new-group {
          margin-bottom: 4px;
        }

        .whats-new-group-label {
          font-family: 'SF Mono', 'Fira Code', 'Fira Mono', monospace;
          font-size: 11px;
          color: #6b7280;
          padding: 4px 8px;
          font-weight: 600;
        }

        .whats-new-group-date {
          font-weight: 400;
          margin-left: 6px;
        }

        .whats-new-entry {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 6px 8px;
          border-radius: 5px;
          transition: background 0.15s;
        }

        .whats-new-entry:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .whats-new-entry.unseen {
          background: rgba(59, 130, 246, 0.04);
        }

        .whats-new-entry-type {
          font-size: 9px;
          font-weight: 600;
          color: #fff;
          padding: 1px 5px;
          border-radius: 3px;
          white-space: nowrap;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .whats-new-entry-content {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }

        .whats-new-entry-title {
          color: #e5e7eb;
          font-size: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .whats-new-entry-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #3b82f6;
          flex-shrink: 0;
        }

        .whats-new-entry-desc {
          color: #9ca3af;
          font-size: 11px;
          line-height: 1.4;
        }

        /* --- Light Theme --- */
        [data-theme="light"] .whats-new-btn {
          color: #aeaeb2;
        }

        [data-theme="light"] .whats-new-btn:hover {
          color: #6e6e73;
        }

        [data-theme="light"] .whats-new-dot {
          background: #007aff;
        }

        [data-theme="light"] .whats-new-dropdown {
          background: #ffffff;
          border-color: #d1d1d6;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        [data-theme="light"] .whats-new-dropdown-header {
          border-bottom-color: #e5e5ea;
        }

        [data-theme="light"] .whats-new-dropdown-title {
          color: #1d1d1f;
        }

        [data-theme="light"] .whats-new-group-label {
          color: #86868b;
        }

        [data-theme="light"] .whats-new-entry:hover {
          background: #f5f5f7;
        }

        [data-theme="light"] .whats-new-entry.unseen {
          background: rgba(0, 122, 255, 0.04);
        }

        [data-theme="light"] .whats-new-entry-title {
          color: #1d1d1f;
        }

        [data-theme="light"] .whats-new-entry-dot {
          background: #007aff;
        }

        [data-theme="light"] .whats-new-entry-desc {
          color: #6e6e73;
        }

        [data-theme="light"] .whats-new-dropdown-list::-webkit-scrollbar {
          width: 4px;
        }
        [data-theme="light"] .whats-new-dropdown-list::-webkit-scrollbar-track {
          background: transparent;
        }
        [data-theme="light"] .whats-new-dropdown-list::-webkit-scrollbar-thumb {
          background: #d1d1d6;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
