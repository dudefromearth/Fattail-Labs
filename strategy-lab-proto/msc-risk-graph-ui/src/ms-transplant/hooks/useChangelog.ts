/**
 * useChangelog — Stub for transplant compilation
 */

export type ChangelogEntryType = 'feature' | 'enhancement' | 'fix' | 'change';
export type ChangelogArea = 'risk-graph' | 'heatmap' | 'dealer-gravity' | 'general';

export interface ChangelogEntry {
  id: string;
  type: ChangelogEntryType;
  title: string;
  description: string;
  area: ChangelogArea;
}

export interface ChangelogVersion {
  version: string;
  date: string;
  entries: ChangelogEntry[];
}

export function useChangelog() {
  return {
    entriesForArea: (_area: ChangelogArea): ChangelogVersion[] => [],
    hasUnseenForArea: (_area: ChangelogArea): boolean => false,
    markSeen: (_id: string) => {},
    isEntrySeen: (_id: string): boolean => true,
    loading: false,
  };
}
