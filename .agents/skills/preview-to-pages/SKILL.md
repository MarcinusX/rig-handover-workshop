---
name: preview-to-pages
description: Put a rig page on a public link for review with GitHub Pages, and take the lane marker off it afterwards, without ever committing the preview. Use for a plan's "Preview for review" and "Clean up" steps.
---

# preview-to-pages

ADR 0003: previews are public, short-lived, and never in the repo. This repo builds the preview
in CI (`.github/workflows/preview.yml`) and deploys it to GitHub Pages, so the HTML never lands
in a commit and the link stays the same across uploads.

Ask the human before each publish: what, where, who can see it, how to undo it.

## Publish (with marker)

1. Change the page the workflow saves if this plan reviews another route (the `curl` line).
2. Once per repo: `gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow`.
3. `gh variable set LANE_MARKER --body "<marker from .env>"` (never echo it in chat or logs).
4. `gh workflow run preview.yml`, then `gh run watch <id> --exit-status`.
5. Check from outside: `curl -s https://<owner>.github.io/<repo>/` returns 200 and shows the
   banner with the marker. Then send the link.
6. Keep the preview issue open until the reviewer has looked.

## Clean up (marker off)

1. `gh variable delete LANE_MARKER`, rerun the workflow, watch it.
2. `curl` the link again (add `?v=<random>` against caches): banner reads "no marker set", the
   marker string is gone.
3. Move the plan to `docs/plans/done/` with its issue list.
