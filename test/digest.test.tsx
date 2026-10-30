import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { readNight } from '../src/digest/read.js';

type Body = { night: string; rows: { job: string }[]; badLines: number };

let runsDir = '';

const line = (job: string, status: string, owner: string | null) =>
  JSON.stringify({ at: '2026-10-28T02:00:00+01:00', job, status, owner });

function write(night: string, lines: string[]) {
  writeFileSync(join(runsDir, `${night}.jsonl`), lines.length ? lines.join('\n') + '\n' : '');
}

beforeAll(() => {
  runsDir = mkdtempSync(join(tmpdir(), 'rig-digest-'));
  write('2026-01-01', [
    line('zeta', 'ok', 'ann'),
    line('alpha', 'retry', 'bob'),
    line('alpha', 'ok', 'bob'),
    line('mid', 'retry', null),
    line('mid', 'retry', null),
    line('mid', 'retry', null),
    line('mid', 'ok', null),
    line('boom', 'fail', 'cy'),
  ]);
  write('2026-01-02', []);
  write('2026-01-03', [line('b-job', 'ok', 'ann'), 'not json {', line('a-job', 'ok', 'ann')]);
  process.env.LANE_MARKER = 'TEST-MARKER';
});

afterAll(() => {
  rmSync(runsDir, { recursive: true, force: true });
});

const app = () =>
  createApp({ adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir });

// Jobs found in the page, in page order.
const jobsFromHtml = (html: string, jobs: string[]) =>
  jobs
    .map((j) => ({ j, i: html.indexOf(`>${j}<`) }))
    .filter((x) => x.i >= 0)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.j);

describe('GET /digest/:night', () => {
  it('renders 200 with the rows sorted by job in the usual layout', async () => {
    const res = await app().request('/digest/2026-01-01');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('TEST-MARKER');
    expect(html).toContain('<table');
    expect(jobsFromHtml(html, ['alpha', 'boom', 'mid', 'zeta'])).toEqual(['alpha', 'boom', 'mid', 'zeta']);
  });

  it('marks retries >= 3 and fail rows with class warn, and renders null owner as a dash', async () => {
    const html = await (await app().request('/digest/2026-01-01')).text();
    const rows = html.split('<tr').filter((r) => r.includes('<td'));
    const rowOf = (job: string) => rows.find((r) => r.includes(`>${job}<`)) ?? '';
    expect(rowOf('mid')).toMatch(/class="[^"]*\bwarn\b/);
    expect(rowOf('boom')).toMatch(/class="[^"]*\bwarn\b/);
    expect(rowOf('alpha')).not.toMatch(/\bwarn\b/);
    expect(rowOf('zeta')).not.toMatch(/\bwarn\b/);
    expect(rowOf('mid')).toContain('—');
  });

  it('404 for a night with no file', async () => {
    const res = await app().request('/digest/2026-01-09');
    expect(res.status).toBe(404);
  });

  it('renders "nothing ran" for an empty night', async () => {
    const res = await app().request('/digest/2026-01-02');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('a night with a bad line still shows the other rows', async () => {
    const res = await app().request('/digest/2026-01-03');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(jobsFromHtml(html, ['a-job', 'b-job'])).toEqual(['a-job', 'b-job']);
  });
});

describe('GET /api/digest/:night', () => {
  it('200 with { night, rows, badLines } exactly as readNight returns, sorted by job', async () => {
    const res = await app().request('/api/digest/2026-01-01');
    expect(res.status).toBe(200);
    const body = (await res.json()) as Body;
    expect(body).toEqual(readNight(runsDir, '2026-01-01'));
    expect(body.night).toBe('2026-01-01');
    expect(body.badLines).toBe(0);
    expect(body.rows.map((r) => r.job)).toEqual(['alpha', 'boom', 'mid', 'zeta']);
  });

  it('404 for a night with no file', async () => {
    const res = await app().request('/api/digest/2026-01-09');
    expect(res.status).toBe(404);
  });

  it('the empty night is 200 with no rows', async () => {
    const res = await app().request('/api/digest/2026-01-02');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ night: '2026-01-02', rows: [], badLines: 0 });
  });

  it('a night with a bad line counts it and keeps the other rows', async () => {
    const body = (await (await app().request('/api/digest/2026-01-03')).json()) as Body;
    expect(body.badLines).toBe(1);
    expect(body.rows.map((r) => r.job)).toEqual(['a-job', 'b-job']);
  });
});

describe('page and JSON agree', () => {
  it('list the same jobs in the same order', async () => {
    const html = await (await app().request('/digest/2026-01-01')).text();
    const body = (await (await app().request('/api/digest/2026-01-01')).json()) as Body;
    const jobs = body.rows.map((r) => r.job);
    expect(jobsFromHtml(html, jobs)).toEqual(jobs);
  });
});
