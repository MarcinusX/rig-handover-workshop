---
name: plan-to-issues
description: Split this repo's plan.md into GitHub issues with gh, one per unit of work, after a human has reviewed the split. Use when a plan is ready and has no issues yet.
---

# plan-to-issues

Turns `plan.md` into GitHub issues that workers can pick up cold. Easiest with `gh`, authenticated,
in a shell this agent can run.

## Steps

1. Read `plan.md`, `AGENTS.md` and `docs/adr/`.
2. Draft the split as a table: title · plan section · scope · done when · blocked by.
   One issue per unit of work.
3. **Stop and show the table to the human.** Publish nothing until they approve it.
4. Ask the human what every issue here must carry (fields, labels, wording), unless it is
   already written down in this session or in the repo. It is written down below, under
   "What every issue carries".
5. Create each issue in dependency order, so blocked-by can cite real numbers:

   ```sh
   gh issue create --title "<title>" --body-file <tmp.md>
   ```

6. Record every issue URL from gh's output (not from memory) and reply with the list.

Closing one, with the closing comment from AGENTS.md:

```sh
gh issue close <n> -c "<closing comment>"
```

## What every issue carries

Agreed with the human on 2026-10-30 (plan morning-digest). Every issue:

- has the label `plan:<plan name>` (from `plan.md`'s frontmatter), created first if missing;
- opens with `Source: plan.md § <n>` as its first line;
- then has three sections: `## Scope` (what changes, which files), `## Done when` (the plan's
  done condition, checkable), `## Blocked by` (`#n`, or `—`; "#n to start, done needs #m" when a
  part can start early but can't finish alone).

An issue whose done condition depends on someone else (a reviewer, a human) stays open until
they have acted. Sending something is not the same as it being reviewed.

## Closing

`closes #n` in a pushed commit closes the issue before the closing comment exists. Post the
closing comment from AGENTS.md right after the push (`gh issue comment <n>`), or close with
`gh issue close <n> -c` and keep `closes` out of the message.

## No `gh`

Steps 1–4 hold either way. GitHub reachable another way (a connector, the REST API, the web UI):
the same issues, made that way. GitHub issues out of reach altogether: write them as files in
`docs/issues/`, format in ADR 0004, then commit and push.

## Don'ts

- Don't paste the whole plan into one issue, and don't keep issues only in chat.
- Don't invent sections the plan doesn't have. If the plan is unclear, ask.
