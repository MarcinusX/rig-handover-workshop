import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { countLines, nightCounts } from './counts.js';

const line = (status: string) => JSON.stringify({ at: '2026-10-28T01:00:00+01:00', job: 'j', status, owner: null });

describe('countLines', () => {
  it('counts by status and skips bad and blank lines', () => {
    const c = countLines([line('ok'), line('ok'), line('retry'), line('fail'), 'nope', '', line('weird')]);
    expect(c).toEqual({ ok: 2, retry: 1, fail: 1 });
  });
});

describe('nightCounts', () => {
  it('reads a night from disk, null when unreadable', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-'));
    writeFileSync(join(dir, '2026-01-01.jsonl'), [line('ok'), line('fail')].join('\n') + '\n');
    expect(nightCounts(dir, '2026-01-01')).toEqual({ ok: 1, retry: 0, fail: 1 });
    expect(nightCounts(dir, '2026-01-02')).toBeNull();
    expect(nightCounts(dir, '../x')).toBeNull();
  });
});
