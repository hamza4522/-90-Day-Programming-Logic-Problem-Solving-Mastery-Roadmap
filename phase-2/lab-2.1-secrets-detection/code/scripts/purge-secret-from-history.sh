#!/usr/bin/env bash
# Leaked-secret incident runbook, as a script — Lab 2.1
#
#   ./purge-secret-from-history.sh <path-to-sandbox-repo> <file-to-purge>
#   e.g. ./purge-secret-from-history.sh ../secrets-lab-sandbox config.py
#
# ORDER MATTERS. The steps below are the real-world order of operations:
#
#   1. ROTATE / REVOKE the credential.   <- do this FIRST, within minutes.
#   2. Check provider audit logs for use of the credential (CloudTrail, GitHub
#      audit log) from first commit time -> revocation time.
#   3. Purge it from history (this script) — hygiene, NOT remediation.
#   4. Force-push, then have every collaborator re-clone.
#   5. Ask the host to purge cached views (GitHub Support: cached PR diffs,
#      forks are NOT rewritten by your force-push).
#   6. Post-incident: why did hooks/CI not stop it? Add the missing control.
#
# Why rotation comes first: once pushed, assume the secret is compromised.
# Bots scrape public GitHub pushes for AWS keys within ~1 minute. Rewriting
# history cannot un-leak a key someone already copied.
set -euo pipefail

REPO="${1:?usage: $0 <repo> <file>}"
FILE="${2:?usage: $0 <repo> <file>}"

if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "Install git-filter-repo first:  pip install git-filter-repo" >&2
  echo "(It replaces the deprecated 'git filter-branch' and BFG for most uses.)" >&2
  exit 1
fi

cd "$REPO"
echo "==> Step 1 reminder: have you ROTATED the credential? (Ctrl-C to abort)"
sleep 3

echo "==> Commits that touched $FILE (all branches):"
git log --all --oneline -- "$FILE"

# filter-repo refuses to run on a non-fresh clone without --force; that is a
# safety feature. In a real incident, run it on a fresh mirror clone:
#   git clone --mirror git@github.com:org/repo.git
git filter-repo --force --invert-paths --path "$FILE"

# Alternative: keep the file but replace just the secret strings.
#   printf 'AKIAIOSFODNN7EXAMPLE==>***REMOVED***\n' > replacements.txt
#   git filter-repo --replace-text replacements.txt

echo "==> Verify: this should print nothing"
git log --all --oneline -- "$FILE"
echo "==> Re-scan:"
gitleaks git . -v || true

cat <<'EOF'

Next (real repo only):
  git push --force --all && git push --force --tags
  Tell all collaborators to re-clone (old clones still contain the secret).
EOF
