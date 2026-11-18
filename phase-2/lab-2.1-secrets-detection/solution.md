# Lab 2.1 — Secrets Detection: Solution Guide
**Phase**: 2 — CI/CD Security  
**Difficulty**: ⭐⭐ Beginner–Intermediate

---

## Task 2: Scan Git History with Gitleaks

### Install Gitleaks

```bash
# Linux/macOS
curl -sSfL https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_8.18.4_linux_x64.tar.gz | tar -xz
sudo mv gitleaks /usr/local/bin/

# Windows (PowerShell)
choco install gitleaks
# Or download from: https://github.com/gitleaks/gitleaks/releases

# macOS
brew install gitleaks

# Verify installation
gitleaks version
```

### Scan the Repository

```bash
# Scan entire git history (all commits, all branches)
gitleaks detect \
  --source . \
  --log-opts="--all --full-history" \
  --verbose \
  --report-format json \
  --report-path gitleaks-report.json

# Scan only unstaged/staged changes (pre-commit mode)
gitleaks protect --staged --verbose

# Quick scan with output to terminal only
gitleaks detect --source . --verbose
```

### Expected Output

```
    ○
    │╲
    │ ○
    ○ ░
    ░    gitleaks

Finding:     AKIAIOSFODNN7EXAMPLE
Secret:      AKIAIOSFODNN7EXAMPLE
RuleID:      aws-access-token
Entropy:     3.45
File:        config.py
Line:        4
Commit:      a1b2c3d4e5f6...  ← Proves it's in history even after deletion!
Author:      Your Name
Email:       you@example.com
Date:        2024-01-15T10:30:00Z
Fingerprint: a1b2c3d4:config.py:aws-access-token:4

...

4 leaks detected. See report at: gitleaks-report.json
```

---

## Task 3: Pre-commit Hooks Setup

### Install pre-commit

```bash
# Install pre-commit framework
pip install pre-commit

# Verify
pre-commit --version
```

### Create `.pre-commit-config.yaml`

```yaml
# .pre-commit-config.yaml
repos:
  # Primary: Gitleaks secret scanner
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.4
    hooks:
      - id: gitleaks
        name: Gitleaks — Detect hardcoded secrets
        description: Detect hardcoded secrets using Gitleaks
        entry: gitleaks protect --staged --redact --verbose
        language: golang
        pass_filenames: false

  # Secondary: detect-secrets (complementary coverage)
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        name: detect-secrets — Secret detection
        args: ['--baseline', '.secrets.baseline']
        exclude: >
          (?x)^(
            .secrets.baseline|
            .*test.*|
            .*\.md$
          )$

  # Bonus: prevent large files (often contain embedded secrets)
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: check-added-large-files
        args: ['--maxkb=500']
      - id: detect-private-key
        name: Detect Private Keys
```

### Initialize and Install

```bash
# Generate detect-secrets baseline (scan current state)
detect-secrets scan > .secrets.baseline

# Install hooks into .git/hooks/
pre-commit install
pre-commit install --hook-type pre-push  # Also block on push

# Test hooks manually (run against all files)
pre-commit run --all-files
```

### Test the Hooks

```bash
# Create a file with a fake secret
cat > test-secret.txt << 'EOF'
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
EOF

git add test-secret.txt
git commit -m "this should be blocked"
```

**Expected output**:
```
Gitleaks — Detect hardcoded secrets...................FAILED
- hook id: gitleaks
- exit code: 1

    ○
    │╲  Finding: AKIAIOSFODNN7EXAMPLE
    ...

Secret detected — commit blocked!
```

---

## Task 4: GitHub Actions CI Integration

```yaml
# .github/workflows/secrets-scan.yml
name: Secrets Scanning

on:
  push:
    branches: ['**']
  pull_request:
    branches: ['**']

jobs:
  gitleaks:
    name: Gitleaks Secret Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout (full history)
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # CRITICAL: fetch ALL history, not just last commit

      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITLEAKS_LICENSE: ${{ secrets.GITLEAKS_LICENSE }}  # Optional for teams

      - name: Upload Gitleaks Report
        uses: actions/upload-artifact@v4
        if: failure()  # Only upload if scan found issues
        with:
          name: gitleaks-report
          path: results.sarif
          retention-days: 30

  # Optional: also post findings to GitHub Security tab
  upload-to-security:
    name: Upload to GitHub Security
    runs-on: ubuntu-latest
    needs: gitleaks
    if: failure()
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      
      - name: Generate SARIF Report
        run: |
          gitleaks detect \
            --log-opts="--all" \
            --report-format sarif \
            --report-path gitleaks.sarif \
            --exit-code 0  # Don't fail here, just generate report
      
      - name: Upload SARIF to GitHub
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: gitleaks.sarif
          category: gitleaks
```

---

## Task 5: `.gitleaksignore` File

```toml
# .gitleaksignore
# Format: <fingerprint>
# Fingerprint = <commitHash>:<filePath>:<ruleID>:<lineNumber>

# Example keys in documentation (not real)
a1b2c3d4e5f6789:docs/examples/config-example.py:aws-access-token:5

# Test fixtures with dummy keys
b2c3d4e5f6789012:tests/fixtures/mock-aws.json:aws-access-token:12

# Known false positive — this is a customer ID not a secret
c3d4e5f6789012ab:src/constants.py:generic-api-key:8
```

**How to get a fingerprint**:
```bash
# Run gitleaks, look for the "Fingerprint:" field in the output
gitleaks detect --verbose 2>&1 | grep Fingerprint
```

---

## ✅ Answers to Reflection Questions

### 1. Why is `git rm` not enough?

`git rm` only removes the file from the **working tree and staging area**. It creates a NEW commit that removes the file, but the file (with the secret) still exists in all **previous commits** in the git object store.

To truly purge secrets from history:
```bash
# Option 1: git-filter-repo (recommended, replaces git filter-branch)
pip install git-filter-repo
git filter-repo --path config.py --invert-paths

# Option 2: BFG Repo Cleaner (faster for large repos)
java -jar bfg.jar --delete-files config.py .
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# After purging, force-push to all branches
git push origin --force --all

# ⚠️ Everyone must re-clone after this!
```

### 2. Allowlisting vs Disabling

| Approach | When to Use |
|---|---|
| **`.gitleaksignore`** (allowlist specific fingerprint) | Known false positive — specific file/line confirmed safe |
| **`--no-verify`** flag | NEVER use in production — bypasses all hooks |
| **Custom rule exclusion in config** | Category of false positives (e.g., all test files) |

**Always allowlist specific fingerprints, never disable the scanner.**

### 3. Developer bypasses pre-commit hooks

**Problem**: `git commit --no-verify` bypasses all hooks.

**Solutions**:
1. **CI is the last line of defense** — always scan in the pipeline (Task 4)
2. **Require PR reviews** — another developer must review the code
3. **Enable GitHub Push Protection** — server-side secret scanning that can't be bypassed
4. **Automated education** — when a hook fires, link to the secret rotation runbook

### 4. Secret Rotation After Leak

When a secret is found in git history (even a "deleted" one):
1. **Immediately revoke** the exposed credential (AWS: IAM → Delete access key)
2. **Generate new credentials** and update all services
3. **Audit the blast radius** — check AWS CloudTrail for unauthorized API calls
4. **Purge from git history** (filter-repo or BFG)
5. **Force-push** and notify all contributors to re-clone
6. **Enable monitoring** (CloudWatch alerts for the new credentials)

### 5. Alternative to History Rewrite

If history rewrite is too risky (large team, many forks):
1. **Revoke immediately** — make the secret worthless
2. **Rotate to new credentials** — old secret is now dead
3. **Enable monitoring** for the old credential (AWS: create CloudWatch alarm if old key is ever used)
4. **Accept the history** — with the secret revoked, it's no longer a live threat
5. **Document the incident** in post-mortem
6. **Prevent recurrence** with hooks + CI (what you just built!)
