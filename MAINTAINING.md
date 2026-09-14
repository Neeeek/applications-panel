# Maintaining ai-boilerplate

This file is the source of truth for what belongs in the boilerplate and why.
It is template-only — `/setup` deletes it from projects built from this repo.

## What belongs here

Something earns a place in the template if it is useful in **most** projects
you start. Anything useful in one project belongs in that project.

| Belongs | Does not belong |
|---|---|
| Routing rules that hold across projects | Project-specific routing |
| Agents you would recreate every time | An agent for one codebase |
| Skills with no equivalent already installed | A skill duplicating a vendored one |
| Permissions safe in any project | Permissions specific to one stack |
| Docs structure | Docs content |

## What deliberately is not here

- **Code scaffolding.** No `package.json`, framework, or test runner. One
  stack-agnostic template beats N stack variants, and pinned versions rot.
- **Stack presets.** Maintaining several scaffolds is what kills template repos.
- **An `/extend` command.** The routing table already covers capability gaps.
- **A fourth code-review implementation.** Three exist; `code-reviewer`
  dispatches to them.

## Changing the vendored skill set

Edit the keep-list in `scripts/sync-plugins.sh` — it is shell array data, not a
comment, precisely so a sync cannot quietly undo a curation decision. Then:

```bash
./scripts/sync-plugins.sh
./scripts/check-vendoring.sh
```

Before cutting a skill, check what references it:

```bash
grep -rl '<skill-name>' .claude/marketplace/plugins/*/skills/
```

A kept skill referencing a cut one is a dangling reference. That is why
superpowers is vendored whole — cutting two skills there breaks seven
references. Update the expected counts in `scripts/check-vendoring.sh` when the
keep-list changes.

## Folding project improvements back

When a project's copy grows something worth keeping, copy it here, generalize
away the project specifics, and record why in `docs/decisions/`. Improvements
do not propagate automatically — that is the accepted cost of the template-repo
model.
