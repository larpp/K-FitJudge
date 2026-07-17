import type { TpoOption } from './tpoOptions';
import type { StyleIntent } from '../components/evaluate/IntentStep';

export interface HistoryEntry {
  id: string;
  date: string;
  tpoKey: TpoOption['key'];
  intent: StyleIntent;
  score: number;
}

export const mockHistory: HistoryEntry[] = [
  { id: '1', date: '2026-07-10', tpoKey: 'work', intent: 'classic', score: 78 },
  { id: '2', date: '2026-07-05', tpoKey: 'date', intent: 'classic', score: 85 },
  { id: '3', date: '2026-06-28', tpoKey: 'street', intent: 'experimental', score: 91 },
];
