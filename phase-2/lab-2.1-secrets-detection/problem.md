# Lab 2.1 — Secrets Detection with Gitleaks & Pre-commit Hooks
**Phase**: 2 — CI/CD Security  
**Difficulty**: ⭐⭐ Beginner–Intermediate  
**Estimated Time**: 2–3 hours  
**Category**: Secrets Management, Pre-commit Security

---

## 🎯 Objective

Learn to prevent secrets (API keys, passwords, tokens) from being committed to source control by implementing **pre-commit hooks** and **CI-level secrets scanning**. Secret leaks are one of the most common and damaging security incidents in software development.

---

## 📋 Problem Statement

Your team recently had an incident where a developer accidentally committed an AWS access key to the GitHub repository. The key was live for 3 hours before someone noticed, and in that time an attacker had spun up $12,000 worth of EC2 instances for crypto mining.

You've been tasked with implementing a **secrets detection strategy** that catches secrets:
1. **Before commit** (pre-commit hook on developer machines)
2. **At CI level** (in the pipeline, for PRs that bypass hooks)
3. **Historically** (scan the entire git history for previously committed secrets)

---

## 🛠️ Prerequisites

- Git installed
- Python 3.x installed (for pre-commit framework)
- Docker (optional, for gitleaks)
- A GitHub/GitLab account for CI part

---

## 📋 Tasks

### Task 1: Set Up a Test Repository

1. Create a new git repository locally:
   ```bash
   mkdir secrets-detection-lab
   cd secrets-detection-lab
   git init
   git branch -M main
   ```

2. Create a sample application file:
   ```bash
   # Create a simple app config
   cat > app.py << 'EOF'
   import os

   # Application Configuration
   DATABASE_URL = "postgresql://user:password@localhost:5432/mydb"
   APP_NAME = "MySecureApp"
   DEBUG = False

   def get_config():
       return {
           "db": DATABASE_URL,
           "app": APP_NAME
       }
   EOF
   ```

3. Make an initial commit (this is clean):
   ```bash
   git add app.py
   git commit -m "Initial commit - clean code"
   ```

### Task 2: Scan Git History with Gitleaks

Now, "accidentally" add secrets to your repository (simulating a developer mistake):

1. Create a file that contains fake secrets:
   ```bash
   cat > config.py << 'EOF'
   # Database Config
   DB_PASSWORD = "MyP@ssw0rd123!"
   
   # AWS Credentials (DO NOT COMMIT!)
   AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
   AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
   
   # Stripe API
   STRIPE_SECRET_KEY = "sk_live_EXAMPLE_FAKE_KEY_FOR_LAB"
   
   # GitHub Token
   GITHUB_TOKEN = "ghp_ExampleTokenForLabPurposesOnly1234"
   EOF
   ```

2. Commit this file:
   ```bash
   git add config.py
   git commit -m "Add config file"
   ```

3. Now "realize" the mistake and delete the file:
   ```bash
   git rm config.py
   git commit -m "Remove config - accidentally committed secrets"
   ```

**Now your task**: The secrets are STILL in git history! Your job is to:
- Install Gitleaks and scan the repository history
- Verify that all leaked secrets are detected
- Document which secrets were found

### Task 3: Install Pre-commit Hooks

Prevent future secret commits by installing pre-commit hooks:

1. Install the pre-commit framework
2. Create a `.pre-commit-config.yaml` in your repository that:
   - Runs **Gitleaks** to detect secrets before each commit
   - Runs **detect-secrets** as a secondary scanner
3. Test that the hooks work by attempting to commit a file with a fake secret

**The hook must BLOCK the commit when a secret is detected.**

### Task 4: CI/CD Integration

Create a GitHub Actions workflow (`.github/workflows/secrets-scan.yml`) that:
- Triggers on every **push** and **pull request**
- Scans the **entire git history** (not just changed files)
- Fails the pipeline if any secrets are found
- Outputs a **report** of what was found

### Task 5: Create a `.gitleaksignore` File

After running the scanner, you'll realize it might flag things that are **false positives** (e.g., example keys in documentation, test fixtures). 

Create a `.gitleaksignore` file to suppress known false positives without disabling the scanner entirely.

---

## 📝 Deliverables

1. `secrets-detection-lab/` repository with:
   - `.pre-commit-config.yaml`
   - `.github/workflows/secrets-scan.yml`
   - `.gitleaksignore`
   - `gitleaks-report.json` (output from your scan)
2. A `lab-findings.md` file documenting:
   - All secrets detected in the git history
   - Which tool found each secret
   - How you would remediate if these were real secrets

---

## ❓ Questions to Answer

1. Why is `git rm` **not enough** to remove secrets? What must you do to truly purge them?
2. What is the difference between **allowlisting** (`.gitleaksignore`) and disabling the check? When should you use each?
3. How would you handle a developer who removes the pre-commit hooks from their local machine?
4. What is **secret rotation** and why must it happen immediately after a secret is detected in git history?
5. If `git rewrite-history` is too risky for an active repository, what is an alternative recovery strategy?

---

> ⚠️ **Important**: Use only fake/example secrets in this lab. The AWS key format `AKIAIOSFODNN7EXAMPLE` and Stripe key `sk_live_51H0...` used above are known-example keys that will be detected by scanners but are not real credentials.

> 💡 **Tip**: Run `git log --all --oneline` to see all commits including the "deleted" config file. The secrets are still there!
