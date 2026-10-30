import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseLine } from './read.js';
import type { RunStatus } from './types.js';

export type NightCounts = Record<RunStatus, number>;

// Pure: count run lines by status. Lines that don't parse are skipped.
export function countLines(lines: string[]): NightCounts {
  const counts: NightCounts = { ok: 0, retry: 0, fail: 0 };
  for (const text of lines) {
    const l = text.trim() === '' ? null : parseLine(text);
    if (l) counts[l.status]++;
  }
  return counts;
}

// null: the night's file can't be read (renders as —).
export function nightCounts(runsDir: string, night: string): NightCounts | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(night)) return null;
  try {
    return countLines(readFileSync(join(runsDir, `${night}.jsonl`), 'utf8').split('\n'));
  } catch {
    return null;
  }
}
