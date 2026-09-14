# ai-boilerplate

A template repository carrying a working Claude Code setup: a routing table,
five agents, a curated vendored skill library, tuned permissions, and a docs
scaffold. Stack-agnostic — it ships no `package.json`, no framework, no test
runner.

## Use it

```bash
npx degit <your-user>/ai-boilerplate my-project
cd my-project
```

Open the project in Claude Code. A SessionStart hook registers the vendored
plugins on first run; restart Claude Code when it says to. Then:

```
/setup
```

## What is in here

| Path | What |
|---|---|
| `CLAUDE.md` | Routing table, working agreements, docs discipline |
| `CONTEXT.md` | Project facts an agent cannot infer from code |
| `.claude/agents/` | orchestrator, agent-builder, architect, docs-keeper, code-reviewer |
| `.claude/marketplace/` | Vendored plugins (~1.1MB), curated per-skill |
| `.claude/skills/` | Project-local skills |
| `.claude/commands/` | Custom commands (`/setup`) |
| `scripts/` | Bootstrap, vendoring, and their checks |
| `docs/` | Changelog, ADRs, ideas, specs and plans |

## Vendored skills

| Plugin | Skills | Why |
|---|---|---|
| superpowers | all 14 | Process: brainstorming, planning, TDD, debugging, verification |
| mattpocock-skills | 10 of 35 | Craft references with no superpowers equivalent |
| ponytail | all | Lazy-senior-dev mode, active via hook |

Curation rationale is in `docs/decisions/0001-vendored-curated-skill-library.md`.

## Maintenance

```bash
./scripts/sync-plugins.sh      # update vendored plugins, then review the diff
./scripts/check-vendoring.sh   # assert the vendored tree is correct
./scripts/check-bootstrap.sh   # assert bootstrap's guard and exit-0 behavior
```

## Turning off the automatic bootstrap

Remove the `hooks` block from `.claude/settings.json` and run
`./scripts/bootstrap.sh` by hand instead.

## Recovering after the project is moved or renamed

The CLI registers the marketplace by absolute path in (gitignored)
`.claude/settings.local.json`. If the project directory is later moved or
renamed, that path goes stale and the bootstrap guard silently short-circuits
forever, since it only checks that the file exists. Recover with:

```bash
rm -f .claude/settings.local.json && ./scripts/bootstrap.sh
```

## Optional: context7

Library and API questions route to context7. It is not installed by default:

```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp
```
