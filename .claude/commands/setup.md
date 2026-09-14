---
description: First-run setup for a project copied from ai-boilerplate. Interviews you, fills CLAUDE.md, and removes template-only files.
---

Run this once in a fresh copy of the boilerplate.

## 1. Confirm plugins are loaded

```bash
claude plugin list
```

If `superpowers@boilerplate`, `mattpocock-skills@boilerplate`, and
`ponytail@boilerplate` are absent, run `./scripts/bootstrap.sh` and tell the
user to restart Claude Code before continuing. Do not proceed without them —
the rest of this flow depends on those skills.

## 2. Interview

Ask these one at a time. Do not batch them, and do not guess answers.

1. Project name?
2. What is it for, in one sentence?
3. Stack — runtime, framework, package manager? (Or "undecided".)
4. Is this a throwaway spike, an MVP, or something long-lived?
5. Deploy target, if known?

## 3. Fill in the docs

- Replace the `## Project` block in `CLAUDE.md` with the answers from 1-4.
- Fill the "Stack and deploy targets" section of `CONTEXT.md` from answers 3
  and 5. Leave the other sections empty — they get filled as facts emerge.

## 4. Offer to scaffold the stack

The template ships no code scaffolding on purpose. Offer to set up the stack
the user named. Use their exact choice; do not substitute a framework you
prefer. If they said "undecided", skip this and move on.

## 5. Offer context7

The routing table sends library and API questions to context7. It is not
installed by default because it is a network service. Ask whether to add it:

```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp
```

Only run this if the user says yes.

## 6. Initialize the repo

If `.git` does not exist, run `git init`.

## 7. Record the first decision

Check `docs/decisions/` for the highest existing number (this template ships
with `0001-vendored-curated-skill-library.md`, so the next one is `0002`).
Ask `docs-keeper` to write `docs/decisions/NNNN-<slug>.md` — using that next
number — capturing the stack choice from step 2: what was chosen, what was
rejected, and why. If the user answered "undecided", skip this.

## 8. Remove template-only files, replace README

These describe the boilerplate itself and do not belong in a project built
from it:

```bash
rm -f MAINTAINING.md docs/superpowers/specs/2026-09-02-ai-boilerplate-design.md
rm -f docs/superpowers/plans/2026-09-02-ai-boilerplate.md
```

Confirm with the user before deleting. If they want to keep the design doc as
reference, leave it.

`README.md` is also about the boilerplate itself (the `degit` line, the
vendored-skills table) and would mislead anyone reading the finished project.
Do not just delete it — replace it with a minimal README built from the
interview answers:

```markdown
# <project name from question 1>

<one-sentence purpose from question 2>

## Getting started

<a short setup/run stub for the stack from question 3, or a placeholder if
the user answered "undecided">
```

Confirm the replacement with the user before writing it.

## 9. Report

Tell the user what was set up, what was skipped, and what to do next. If any
step failed, say which and why — do not report success for a step that did not
run.
