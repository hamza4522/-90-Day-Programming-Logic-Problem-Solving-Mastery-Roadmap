#!/usr/bin/env bash
# Build a throwaway git repo with FAKE secrets buried in its history.
#
#   ./setup-lab-repo.sh [target-dir]      (default: ./secrets-lab-sandbox)
#
# Why a script instead of committing the secrets here?
#   This repo is pushed to GitHub. GitHub push protection, Gitleaks in CI,
#   and secret-scanning partners would (correctly!) flag literal keys. So we
#   assemble each fake secret from pieces at runtime. That's also a lesson:
#   scanners match the *final string* in the file, not how you produced it.
#
# All values are fake / documented examples. None of them grant access to anything.
set -euo pipefail

TARGET="${1:-./secrets-lab-sandbox}"
if [ -e "$TARGET" ]; then
  echo "Refusing to overwrite existing path: $TARGET" >&2
  exit 1
fi

mkdir -p "$TARGET"
cd "$TARGET"
git init -q -b main
git config user.name  "Lab Developer"
git config user.email "dev@lab.invalid"

# Fake values assembled from fragments
AWS_ID="AKIA""IOSFODNN7""EXAMPLE"                          # AWS docs example key
AWS_SECRET="wJalrXUtnFEMI/K7MDENG""/bPxRfiCYEXAMPLEKEY"    # AWS docs example secret
GH_TOKEN="ghp_""abcdefghijklmnopqrstuvwxyz0123456789"     # ghp_ + 36 chars
SLACK_HOOK="https://hooks.slack.com/""services/T00000000/B00000000/""XXXXXXXXXXXXXXXXXXXXXXXX"
ACME_TOKEN="acme_live_""0123456789abcdef0123456789abcdef"  # caught only by our CUSTOM rule
PRIVATE_KEY_HEADER="-----BEGIN ""RSA PRIVATE KEY-----"

# --- Commit 1: clean ---------------------------------------------------------
cat > app.py <<'EOF'
import os

DATABASE_URL = os.environ["DATABASE_URL"]
APP_NAME = "MySecureApp"
EOF
git add app.py && git commit -qm "Initial commit - clean code"

# --- Commit 2: the mistake ---------------------------------------------------
cat > config.py <<EOF
# TODO: move to env vars before release
AWS_ACCESS_KEY_ID = "${AWS_ID}"
AWS_SECRET_ACCESS_KEY = "${AWS_SECRET}"
GITHUB_TOKEN = "${GH_TOKEN}"
SLACK_WEBHOOK = "${SLACK_HOOK}"
ACME_API_TOKEN = "${ACME_TOKEN}"
DB_PASSWORD = "MyP@ssw0rd123!"
EOF
git add config.py && git commit -qm "Add config file"

# --- Commit 3: a key on a feature branch (scan --all, not just HEAD) ---------
git checkout -qb feature/deploy
mkdir -p deploy
printf '%s\nMIIEowIBAAKCAQEAfakefakefakefakefakefakefakefakefake\n-----END RSA PRIVATE KEY-----\n' \
  "$PRIVATE_KEY_HEADER" > deploy/id_rsa
git add deploy && git commit -qm "Add deploy key"
git checkout -q main

# --- Commit 4: the "fix" that isn't ------------------------------------------
git rm -q config.py && git commit -qm "Remove config - accidentally committed secrets"

# --- Commit 5: a known false positive (test fixture) -------------------------
mkdir -p tests
cat > tests/test_config.py <<EOF
# Example key from AWS documentation, used to test our config parser.
EXAMPLE_KEY = "${AWS_ID}"
EOF
git add tests && git commit -qm "Add config parser tests"

cat <<EOF

✅ Sandbox repo created at: $(pwd)

   HEAD is clean:    ls            -> app.py tests/
   History is not:   git log --all --oneline --stat

Now try:
   gitleaks git . -v                                # gitleaks >= 8.19 (older: gitleaks detect --source . -v)
   gitleaks git . -v --config ../.gitleaks.toml     # + custom acme_live_ rule
   git log --all -p | grep -nE 'AKIA|ghp_|acme_live_|PRIVATE KEY'

Questions:
   * Which secrets does the default ruleset miss?   (hint: acme_live_, DB_PASSWORD)
   * Which finding is only on a non-main branch?
   * Which finding is a false positive, and how do you allowlist JUST that one?
EOF
