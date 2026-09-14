#!/usr/bin/env bash
# Asserts the vendored tree matches spec §5.3 / §5.3.1. Exits non-zero on drift.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MKT="${ROOT}/.claude/marketplace"
PLUGINS="${MKT}/plugins"
fail=0
check() { # check <description> <actual> <expected>
  if [ "$2" = "$3" ]; then printf '  ok    %s (%s)\n' "$1" "$2"
  else printf '  FAIL  %s: got %s, want %s\n' "$1" "$2" "$3"; fail=1; fi
}

# --- skill counts (spec §5.3.1) ---
sp=$(find "${PLUGINS}/superpowers/skills" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
check "superpowers skills" "$sp" "14"
mp=$(find "${PLUGINS}/mattpocock-skills/skills" -mindepth 2 -maxdepth 2 -type d 2>/dev/null | wc -l)
check "mattpocock skills" "$mp" "10"

# --- plugin.json skills array pruned in step with directories ---
arr=$(python3 -c "import json,sys; print(len(json.load(open(sys.argv[1])).get('skills',[])))" \
  "${PLUGINS}/mattpocock-skills/.claude-plugin/plugin.json" 2>/dev/null || echo ERR)
check "mattpocock plugin.json skills[]" "$arr" "10"

# --- hooks survived (both SessionStart hooks depend on these) ---
for f in superpowers/hooks/hooks.json superpowers/hooks/session-start \
         superpowers/skills/using-superpowers/SKILL.md \
         ponytail/hooks/claude-codex-hooks.json ponytail/hooks/ponytail-activate.js; do
  [ -f "${PLUGINS}/${f}" ] && printf '  ok    present %s\n' "$f" \
    || { printf '  FAIL  missing %s\n' "$f"; fail=1; }
done

# --- skill-local scripts/ must survive; root scripts/ must not ---
[ -f "${PLUGINS}/superpowers/skills/brainstorming/scripts/start-server.sh" ] \
  && printf '  ok    skill-local scripts kept\n' \
  || { printf '  FAIL  skill-local scripts pruned\n'; fail=1; }
for p in superpowers mattpocock-skills ponytail; do
  [ -d "${PLUGINS}/${p}/scripts" ] \
    && { printf '  FAIL  root scripts/ was vendored (%s)\n' "$p"; fail=1; } \
    || printf '  ok    root scripts/ dropped (%s)\n' "$p"
done

# --- bloat must not come back ---
[ -d "${PLUGINS}/mattpocock-skills/node_modules" ] \
  && { printf '  FAIL  node_modules vendored\n'; fail=1; } \
  || printf '  ok    no node_modules\n'

# --- no absolute paths in committed marketplace config ---
if grep -rqE '(/home/|/Users/|/mnt/[a-z]/|[A-Za-z]:\\)' "${MKT}/.claude-plugin/marketplace.json" 2>/dev/null; then
  printf '  FAIL  absolute path in marketplace.json\n'; fail=1
else printf '  ok    marketplace.json has no absolute paths\n'; fi

# --- no CRLF survived vendoring (breaks scripts on WSL/Windows) ---
# grep -I already skips binaries and -r recurses, so no find/xargs hop is
# needed — that hop word-splits on any space in the repo path (e.g. a clone
# under "My Documents") and silently scans nothing.
crlf=$(grep -rlI $'\r' "${PLUGINS}" 2>/dev/null | wc -l)
check "files with CRLF" "$crlf" "0"

# --- no kept skill references a cut skill (spec §8) ---
# Only mattpocock-skills is pruned (superpowers and ponytail are vendored
# whole), so a dangling `/slug` reference can only appear there. One is
# documented and allowed: diagnosing-bugs still points at the cut
# improve-codebase-architecture skill.
dangling=$(grep -rhEo '`/[a-zA-Z][a-zA-Z0-9_-]*`' "${PLUGINS}/mattpocock-skills" --include='SKILL.md' 2>/dev/null \
  | tr -d '`/' | sort -u)
bad=0
for slug in ${dangling}; do
  [ "${slug}" = "improve-codebase-architecture" ] && continue
  find "${PLUGINS}/mattpocock-skills/skills" -type d -name "${slug}" 2>/dev/null | grep -q . \
    || { printf '  FAIL  dangling reference to cut skill: %s\n' "${slug}"; bad=1; }
done
[ "${bad}" -eq 0 ] && printf '  ok    no dangling references to cut skills\n' || fail=1

# --- manifest validates ---
if claude plugin validate "${MKT}" >/dev/null 2>&1; then printf '  ok    claude plugin validate\n'
else printf '  FAIL  claude plugin validate\n'; fail=1; fi

[ "$fail" -eq 0 ] && echo "VENDORING OK" || echo "VENDORING FAILED"
exit "$fail"
