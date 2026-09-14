#!/usr/bin/env bash
# Verifies bootstrap.sh's required properties (spec §5.4).
#
# `claude` is STUBBED on PATH. This is not laziness: `claude plugin marketplace
# add` registers the marketplace name globally, so running the real CLI here
# would collide with this repo's own `boilerplate` registration and leave
# residue in the user's plugin config. The stub emulates just enough to
# exercise bootstrap's guard, idempotence, and exit-0 behavior. The real
# end-to-end run happens once, against the real repo, in Step 6.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fail=0
note() { printf '  %-6s %s\n' "$1" "$2"; [ "$1" = "FAIL" ] && fail=1; return 0; }

WORK="$(mktemp -d)"
trap 'rm -rf "${WORK}"' EXIT
cp -R "${ROOT}/.claude" "${ROOT}/scripts" "${WORK}/"
rm -f "${WORK}/.claude/settings.local.json"

mkdir -p "${WORK}/bin"
cat > "${WORK}/bin/claude" <<'STUB'
#!/usr/bin/env bash
echo "STUB-CALL: $*" >> "${STUB_LOG}"
if [ "${1:-}" = "plugin" ] && [ "${2:-}" = "marketplace" ] && [ "${3:-}" = "add" ]; then
  printf '{\n  "extraKnownMarketplaces": {\n    "boilerplate": { "source": { "source": "directory", "path": "%s" } }\n  }\n}\n' \
    "$(pwd)/.claude/marketplace" > .claude/settings.local.json
elif [ "${1:-}" = "plugin" ] && [ "${2:-}" = "install" ]; then
  printf '  "%s": true\n' "${3}" >> .claude/settings.local.json
fi
exit 0
STUB
chmod +x "${WORK}/bin/claude"
export PATH="${WORK}/bin:${PATH}"
export STUB_LOG="${WORK}/stub.log"
cd "${WORK}" || exit 1

# 1. syntax
if bash -n scripts/bootstrap.sh 2>/dev/null; then note ok "bootstrap.sh parses"
else note FAIL "syntax error"; fi

# 2. first run registers the marketplace and installs all three plugins
: > "${STUB_LOG}"
./scripts/bootstrap.sh >/dev/null 2>&1; rc=$?
if [ "${rc}" -eq 0 ]; then note ok "first run exits 0"; else note FAIL "first run exit ${rc}"; fi
if grep -q boilerplate .claude/settings.local.json 2>/dev/null; then
  note ok "first run registered marketplace"
else note FAIL "no settings.local.json written"; fi
for p in superpowers mattpocock-skills ponytail; do
  if grep -q "install ${p}@boilerplate" "${STUB_LOG}"; then note ok "installed ${p}"
  else note FAIL "did not install ${p}"; fi
done

# 3. guard: a second run must do no work at all
: > "${STUB_LOG}"
./scripts/bootstrap.sh >/dev/null 2>&1; rc=$?
if [ "${rc}" -eq 0 ]; then note ok "second run exits 0"; else note FAIL "second run exit ${rc}"; fi
if [ ! -s "${STUB_LOG}" ]; then note ok "guard short-circuits (zero CLI calls)"
else note FAIL "second run re-did work: $(cat "${STUB_LOG}")"; fi

# 4. must exit 0 when the marketplace is missing — never block a session —
#    and must not touch the CLI at all (mutation-tested: deleting this
#    branch from bootstrap.sh still exits 0, so the exit code alone proves
#    nothing; the zero-calls assertion is what catches it)
rm -f .claude/settings.local.json
mv .claude/marketplace .claude/marketplace.hidden
: > "${STUB_LOG}"
./scripts/bootstrap.sh >/dev/null 2>&1; rc=$?
if [ "${rc}" -eq 0 ]; then note ok "exits 0 when marketplace missing"
else note FAIL "exit ${rc} when marketplace missing"; fi
if [ ! -s "${STUB_LOG}" ]; then note ok "made zero CLI calls when marketplace missing"
else note FAIL "made CLI calls when marketplace missing: $(cat "${STUB_LOG}")"; fi
mv .claude/marketplace.hidden .claude/marketplace

# 5. must exit 0 when the CLI itself fails, and must NOT report success —
#    reporting the "installed" message unconditionally is a real bug this
#    caught: verified by mutation (see final-fix-report.md).
rm -f .claude/settings.local.json
printf '#!/usr/bin/env bash\nexit 1\n' > "${WORK}/bin/claude"
chmod +x "${WORK}/bin/claude"
out="$(./scripts/bootstrap.sh 2>&1)"; rc=$?
if [ "${rc}" -eq 0 ]; then note ok "exits 0 when claude CLI fails"
else note FAIL "exit ${rc} when CLI fails"; fi
if echo "${out}" | grep -q "plugins installed"; then
  note FAIL "claimed success while claude CLI failed"
else note ok "does not claim success when claude CLI fails"; fi

# 6. committed settings.json must never contain an absolute path (any form:
#    ${HOME} alone misses machines other than the one that wrote the check)
if grep -qE '(/home/|/Users/|/mnt/[a-z]/|[A-Za-z]:\\)' .claude/settings.json 2>/dev/null; then
  note FAIL "settings.json contains an absolute path"
else note ok "settings.json has no absolute paths"; fi

# 7. allow list must not permit a global install (npm/pnpm install take an
# exact no-arg allow entry; a ":*" prefix would also permit "npm install -g")
if grep -qE '"Bash\((npm|pnpm) install:\*\)"|brew' .claude/settings.json 2>/dev/null; then
  note FAIL "settings.json allow list permits a global install"
else note ok "settings.json has no global-install escape"; fi

[ "${fail}" -eq 0 ] && echo "BOOTSTRAP OK" || echo "BOOTSTRAP FAILED"
exit "${fail}"
