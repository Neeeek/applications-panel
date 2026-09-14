# CLAUDE.md

## Project

<!-- Filled in by /setup. Until then this is the ai-boilerplate template. -->

**Name:** _(unset)_
**Purpose:** _(unset)_
**Stack:** _(unset)_

## Routing

This table is the single source of truth for routing. The `orchestrator` agent
reads it rather than carrying its own copy — if you change routing, change it
here only.

| Situation | Route to |
|---|---|
| "Let's build X" / new feature | `superpowers:brainstorming` → `superpowers:writing-plans` |
| Bug, test failure, unexpected behavior | `superpowers:systematic-debugging` |
| Performance regression, hard-to-isolate bug | `mattpocock-skills:diagnosing-bugs` |
| Writing implementation code | `superpowers:test-driven-development` |
| 3+ independent tasks, multi-phase work | `orchestrator` agent |
| Need a new agent, skill, or permission | `agent-builder` agent |
| Shipped something / docs stale | `docs-keeper` agent |
| Module structure, interface, or tradeoff question | `architect` agent, `mattpocock-skills:codebase-design` |
| Pre-merge review | `code-reviewer` agent |
| Missing capability | `find-skills` |
| Library or API facts needed | context7 MCP if configured, else fetch official docs — never from memory |
| Stress-test a plan or decision | `mattpocock-skills:grilling` |
| Stress-test and capture ADRs/glossary as you go | `mattpocock-skills:grill-with-docs` |
| Domain vocabulary, ADR authoring | `mattpocock-skills:domain-modeling` |
| Answer a question from primary sources | `mattpocock-skills:research` |
| Sanity-check a state model or UI shape | `mattpocock-skills:prototype` |
| Authoring CLAUDE.md, AGENTS.md, or a skill | `mattpocock-skills:writing-for-agents` |
| Mid-merge/rebase conflict | `mattpocock-skills:resolving-merge-conflicts` |
| Steps only a human can do (provisioning, CI secrets) | `mattpocock-skills:wizard` |
| Any code being written or simplified | `ponytail` is active via hook — no invocation needed |

## Working agreements

- **Root cause, not symptom.** Before editing, find every caller of the
  function you are about to change. One guard in the shared function beats a
  guard in each caller.
- **Tests first** for anything non-trivial, via
  `superpowers:test-driven-development`. Throwaway prototypes are the exception
  — label them as such.
- **Evidence before claims.** Never say something works, passes, or is fixed
  without showing the command output. See
  `superpowers:verification-before-completion`.
- **Report faithfully.** If tests fail, say so with the output. If a step was
  skipped, say which.
- **Reuse before writing.** Check whether a helper, type, or pattern already
  exists in this repo before adding one.

## Docs discipline

| What happened | Where it goes |
|---|---|
| Chose an approach and rejected alternatives | New ADR in `docs/decisions/` |
| Shipped a user-visible change | A line in `docs/CHANGELOG.md` |
| Unbaked thought, "maybe later" | A note in `docs/ideas/` |
| Learned a project fact not inferable from code | `CONTEXT.md` |
| Design for a multi-step piece of work | `docs/superpowers/specs/` |

`CONTEXT.md` is at the repo root deliberately: `codebase-design`,
`domain-modeling`, and `diagnosing-bugs` read that path by convention.

## Self-extension

When a capability is missing:

1. Check whether an installed skill covers it (`find-skills`).
2. If not, hand to `agent-builder` to create a project-local agent or skill
   under `.claude/`.
3. If it needs a permission the sandbox denies, `agent-builder` proposes the
   change to `.claude/settings.json` — it does not grant it silently.

Machine-level changes (`brew`, global installs) always prompt. That is
deliberate: they mutate the machine, not the project.

## Plugin setup

Vendored plugins live in `.claude/marketplace/`. A SessionStart hook runs
`scripts/bootstrap.sh` on first use in a fresh clone; restart Claude Code
afterwards. To update them, run `./scripts/sync-plugins.sh`. To disable the
automatic bootstrap, remove the `hooks` block from `.claude/settings.json`.

If the project directory is later moved or renamed, the absolute path the CLI
registered in gitignored `.claude/settings.local.json` goes stale and the
bootstrap guard silently short-circuits forever. Recover with:
`rm -f .claude/settings.local.json && ./scripts/bootstrap.sh`.
