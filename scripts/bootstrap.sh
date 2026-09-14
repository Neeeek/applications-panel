#!/usr/bin/env bash
# Registers the in-repo marketplace and installs the vendored plugins at local
# scope. Idempotent, and ALWAYS exits 0 — this runs from a SessionStart hook and
# must never block a session. Spec §5.4.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCAL_SETTINGS="${ROOT}/.claude/settings.local.json"
MARKETPLACE="${ROOT}/.claude/marketplace"

# Guard first: on every session after the first this is the only work done.
# Require all three plugins actually installed, not just the marketplace
# registered — a run interrupted between registration and installs must
# retry rather than being mistaken for "done" forever.
if [ -f "${LOCAL_SETTINGS}" ]; then
  bootstrapped=1
  for p in superpowers mattpocock-skills ponytail; do
    grep -q "\"${p}@boilerplate\"" "${LOCAL_SETTINGS}" 2>/dev/null || bootstrapped=0
  done
  [ "${bootstrapped}" -eq 1 ] && exit 0
fi

if [ ! -f "${MARKETPLACE}/.claude-plugin/marketplace.json" ]; then
  echo "ai-boilerplate: .claude/marketplace is missing; skipping plugin bootstrap." >&2
  echo "ai-boilerplate: run ./scripts/sync-plugins.sh to vendor it." >&2
  exit 0
fi

cd "${ROOT}" || exit 0

echo "ai-boilerplate: first run — registering vendored plugins..."
ok=1
# The CLI normalizes this to an absolute path, which is why it goes to
# settings.local.json (gitignored) and never to committed settings.json.
claude plugin marketplace add ./.claude/marketplace --scope local >/dev/null 2>&1 \
  || { echo "ai-boilerplate: marketplace registration failed; run ./scripts/bootstrap.sh manually." >&2; ok=0; }

for p in superpowers mattpocock-skills ponytail; do
  claude plugin install "${p}@boilerplate" --scope local >/dev/null 2>&1 \
    || { echo "ai-boilerplate: failed to install ${p}." >&2; ok=0; }
done

if [ "${ok}" -eq 1 ]; then
  echo "ai-boilerplate: plugins installed. Restart Claude Code to load them."
else
  echo "ai-boilerplate: plugin bootstrap incomplete — see errors above. Check that the claude CLI is on PATH and working, then run ./scripts/bootstrap.sh again." >&2
fi
exit 0
