import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

function appWith(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'rig-digest-'));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  return createApp({ adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: dir });
}

const line = (o: object) => JSON.stringify(o);

describe('digest page', () => {
  it('renders rows, marks warnings, dashes missing data, reports bad lines', async () => {
    const lines = [
      line({ at: '2026-10-28T01:00:00+01:00', job: 'a', status: 'ok', owner: null }),
      ...[1, 2, 3].map((i) => line({ at: `2026-10-28T02:0${i}:00+01:00`, job: 'b', status: 'retry', owner: 'sam', error: 'boom' })),
      line({ at: '2026-10-28T03:00:00+01:00', job: 'c', status: 'fail', owner: 'kim' }),
      'not json',
    ].join('\n');
    const res = await appWith({ '2026-10-28.jsonl': lines }).request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('<td>—</td>');
    expect(html).toContain('2026-10-28T01:00:00+01:00');
    expect((html.match(/<tr class="warn">/g) ?? []).length).toBe(2);
    expect(html).toMatch(/1 line didn(&#39;|')t parse/);
  });

  it('404 for a night with no file', async () => {
    const res = await appWith({}).request('/digest/2026-10-01');
    expect(res.status).toBe(404);
  });

  it('says nothing ran for an empty night', async () => {
    const res = await appWith({ '2026-10-02.jsonl': '' }).request('/digest/2026-10-02');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });
});
