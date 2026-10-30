// Plan morning-digest § 1. The contract every part of § 2 starts against: the reader fills it,
// the page and the JSON only show it, so the two can't disagree (ADR 0001).

export type RunStatus = 'ok' | 'retry' | 'fail';

// One line of runs/<night>.jsonl, once parsed.
export type RunLine = {
  at: string;
  job: string;
  status: RunStatus;
  owner: string | null;
  error?: string;
};

// One row per job for the night. Times keep the offset from the log, never converted to UTC.
export type DigestRow = {
  job: string;
  owner: string | null; // null renders as —
  runs: number; // lines for this job
  retries: number; // lines with status retry
  lastStatus: RunStatus;
  lastError: string | null; // most recent error seen for this job tonight
  firstAt: string;
  lastAt: string;
};

export type Night = {
  night: string; // YYYY-MM-DD
  rows: DigestRow[]; // sorted by job
  badLines: number; // lines that didn't parse: counted, never thrown
};

// null: no file for that night (or not a YYYY-MM-DD night) → 404. An empty file is a Night with no rows.
export type ReadNight = (runsDir: string, night: string) => Night | null;
