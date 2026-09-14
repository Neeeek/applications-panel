#!/usr/bin/env bash
# Vendor the curated skill set from the local plugin cache into .claude/marketplace/.
# Run once to create the tree; run again to update. Idempotent.
# Requires a machine with the three plugins installed globally (the maintainer machine).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE="${HOME}/.claude/plugins/cache"
DEST="${ROOT}/.claude/marketplace/plugins"

# Keep-lists are DATA, not comments. Copying skills/ wholesale would silently
# restore the 25 cut mattpocock skills on every sync. Spec §5.3.1.
MATTPOCOCK_KEEP=(
  engineering/codebase-design
  engineering/diagnosing-bugs
  engineering/domain-modeling
  engineering/grill-with-docs
  engineering/prototype
  engineering/research
  engineering/resolving-merge-conflicts
  engineering/wizard
  productivity/grilling
  productivity/writing-for-agents
)

latest() { # latest <marketplace>/<plugin> -> version dir name
  ls "${CACHE}/$1" 2>/dev/null | sort -V | tail -1
}

require() {
  [ -n "$2" ] || { echo "error: $1 not found in ${CACHE}. Install it globally first." >&2; exit 1; }
}

if [ "${1:-}" != "--skip-update" ]; then
  echo "==> Updating plugins from their marketplaces"
  for p in superpowers mattpocock-skills ponytail; do
    claude plugin update "$p" || echo "  (update failed for $p, using cached version)"
  done
fi

SP_V="$(latest claude-plugins-official/superpowers)";      require superpowers "$SP_V"
MP_V="$(latest claude-plugins-official/mattpocock-skills)"; require mattpocock-skills "$MP_V"
PT_V="$(latest ponytail/ponytail)";                         require ponytail "$PT_V"

SP_SRC="${CACHE}/claude-plugins-official/superpowers/${SP_V}"
MP_SRC="${CACHE}/claude-plugins-official/mattpocock-skills/${MP_V}"
PT_SRC="${CACHE}/ponytail/ponytail/${PT_V}"

echo "==> Vendoring superpowers ${SP_V} (all 14 skills)"
rm -rf "${DEST}/superpowers"
mkdir -p "${DEST}/superpowers"
# skills/ copied wholesale: the pack is tightly interlinked and skill-local
# scripts/ subdirectories are load-bearing.
cp -R "${SP_SRC}/.claude-plugin" "${SP_SRC}/skills" "${SP_SRC}/hooks" "${DEST}/superpowers/"
cp "${SP_SRC}/LICENSE" "${DEST}/superpowers/"

echo "==> Vendoring mattpocock-skills ${MP_V} (${#MATTPOCOCK_KEEP[@]} curated skills)"
rm -rf "${DEST}/mattpocock-skills"
mkdir -p "${DEST}/mattpocock-skills/skills"
cp -R "${MP_SRC}/.claude-plugin" "${DEST}/mattpocock-skills/"
cp "${MP_SRC}/LICENSE" "${DEST}/mattpocock-skills/"
for skill in "${MATTPOCOCK_KEEP[@]}"; do
  [ -d "${MP_SRC}/skills/${skill}" ] || { echo "error: keep-list entry missing upstream: ${skill}" >&2; exit 1; }
  mkdir -p "${DEST}/mattpocock-skills/skills/$(dirname "${skill}")"
  cp -R "${MP_SRC}/skills/${skill}" "${DEST}/mattpocock-skills/skills/${skill}"
done

# plugin.json enumerates skill paths explicitly; prune it in step with the
# directories or it references skills that are no longer there.
python3 - "${DEST}/mattpocock-skills/.claude-plugin/plugin.json" "${MATTPOCOCK_KEEP[@]}" <<'PY'
import json, sys
path, keep = sys.argv[1], sys.argv[2:]
data = json.load(open(path))
data["skills"] = [f"./skills/{k}" for k in keep]
json.dump(data, open(path, "w"), indent=2)
open(path, "a").write("\n")
PY

echo "==> Vendoring ponytail ${PT_V}"
rm -rf "${DEST}/ponytail"
mkdir -p "${DEST}/ponytail"
# hooks/ is what makes ponytail a persistent mode rather than an inert skill dir.
cp -R "${PT_SRC}/.claude-plugin" "${PT_SRC}/skills" "${PT_SRC}/commands" "${PT_SRC}/hooks" "${DEST}/ponytail/"
cp "${PT_SRC}/LICENSE" "${DEST}/ponytail/"

# Normalize line endings at vendor time. .gitattributes fixes the committed
# blob, but check-vendoring.sh and anything executing a vendored script run
# against the WORKING TREE. Upstream ships CRLF in several skill-local scripts.
# Detect text files by content (grep -Il skips anything binary) rather than
# enumerating extensions, which misses extensionless files and unlisted
# extensions (e.g. agents/openai.yaml, LICENSE).
echo "==> Normalizing line endings"
# grep -Z null-delimits filenames and xargs -0 splits on those, so this stays
# correct when DEST's path contains a space (e.g. a clone under "My
# Documents") — the find/xargs hop this replaced word-splits on plain
# newlines and silently normalizes nothing there.
grep -rlZI . "${DEST}" 2>/dev/null | xargs -0r sed -i 's/\r$//'

cat > "${ROOT}/.claude/marketplace/VERSIONS" <<EOF
superpowers ${SP_V}
mattpocock-skills ${MP_V}
ponytail ${PT_V}
EOF

echo
echo "Vendored:"
sed 's/^/  /' "${ROOT}/.claude/marketplace/VERSIONS"
echo
echo "Next: review the diff, run ./scripts/check-vendoring.sh, then commit."
echo "If versions changed, re-run bootstrap:"
echo "  rm -f .claude/settings.local.json && ./scripts/bootstrap.sh"
