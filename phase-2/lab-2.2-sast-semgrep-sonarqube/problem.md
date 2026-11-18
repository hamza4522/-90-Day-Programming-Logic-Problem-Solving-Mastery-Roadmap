# Lab 2.2 — SAST with Semgrep & SonarQube
**Phase**: 2 — CI/CD Security  
**Difficulty**: ⭐⭐ Intermediate  
**Estimated Time**: 3–4 hours  
**Category**: Static Application Security Testing (SAST)

---

## 🎯 Objective

Implement **Static Application Security Testing (SAST)** in a CI/CD pipeline using Semgrep and SonarQube. SAST analyzes source code without executing it, finding security bugs early in the development cycle when they are cheapest to fix.

---

## 📋 Problem Statement

Your development team ships features fast but security reviews are done manually at the end of sprints — often finding critical bugs too late. You need to integrate automated code scanning that:

1. Runs on **every commit and pull request**
2. Catches **security vulnerabilities** (not just code quality issues)
3. **Blocks merges** when critical issues are found
4. Provides **actionable feedback** to developers (not just "error found")

---

## 🛠️ Prerequisites

- Docker installed
- Python 3.x
- A GitHub repository (or GitLab project)
- Node.js/Python sample application to scan

---

## 📋 Tasks

### Task 1: Create a Vulnerable Sample Application

Create a Python Flask application with intentional vulnerabilities to test your scanners:

```bash
mkdir sast-lab && cd sast-lab
git init
```

Create `app.py`:
```python
from flask import Flask, request, render_template_string
import sqlite3
import subprocess
import os

app = Flask(__name__)

# Vulnerability 1: SQL Injection
@app.route('/user')
def get_user():
    user_id = request.args.get('id')
    conn = sqlite3.connect('users.db')
    # BAD: Direct string interpolation in SQL
    query = f"SELECT * FROM users WHERE id = {user_id}"
    result = conn.execute(query).fetchall()
    return str(result)

# Vulnerability 2: Command Injection
@app.route('/ping')
def ping():
    host = request.args.get('host')
    # BAD: user input passed directly to shell
    result = subprocess.run(f"ping -c 1 {host}", shell=True, capture_output=True)
    return result.stdout.decode()

# Vulnerability 3: Server-Side Template Injection (SSTI)
@app.route('/hello')
def hello():
    name = request.args.get('name', 'World')
    # BAD: User input used as template
    template = f"<h1>Hello {name}!</h1>"
    return render_template_string(template)

# Vulnerability 4: Path Traversal
@app.route('/file')
def read_file():
    filename = request.args.get('name')
    # BAD: No path validation
    with open(f"/var/data/{filename}", 'r') as f:
        return f.read()

# Vulnerability 5: Hardcoded Secret
SECRET_KEY = "my-super-secret-key-12345"
API_KEY = "sk-prod-9f8e7d6c5b4a3f2e1d0c"

if __name__ == '__main__':
    app.run(debug=True)  # BAD: debug=True in production
```

Create `requirements.txt`:
```
flask==3.0.0
```

### Task 2: Run Semgrep Locally

1. Install Semgrep and run it against the application
2. Use the `auto` config to get the default rule set
3. Also run with the `python.flask.security` specific ruleset
4. Generate a JSON report of all findings
5. Count: how many issues did Semgrep find? What severity?

**Goal**: Find at least 4 of the 5 vulnerabilities above using Semgrep.

### Task 3: Set Up SonarQube Community Edition

1. Run SonarQube using the provided Docker Compose
2. Create a new project called `sast-lab`
3. Generate an analysis token
4. Run the Sonar Scanner against your `app.py`
5. Access the dashboard and document:
   - How many **Security Hotspots** were found?
   - How many **Bugs** vs **Vulnerabilities**?
   - What is the **Security Rating** (A–E)?

### Task 4: GitHub Actions SAST Integration

Create `.github/workflows/sast.yml` that:
- Runs Semgrep on every push and PR
- Uploads results to GitHub Security tab (SARIF format)
- Fails the build on **ERROR** severity findings
- Generates a summary comment on PRs

### Task 5: Tune and Reduce False Positives

After running the scanners, you'll likely see findings you want to suppress. Create:
- A `.semgrepignore` file to exclude test directories and third-party code
- A `semgrep-rules/` directory with a **custom rule** that catches a pattern specific to your codebase

**Challenge**: Write a custom Semgrep rule that detects any use of `shell=True` in `subprocess` calls.

---

## 📝 Deliverables

1. `app.py` — the vulnerable application (already created above)
2. `.github/workflows/sast.yml` — the CI workflow
3. `.semgrepignore` — exclusion config
4. `semgrep-rules/custom.yaml` — your custom rule
5. `sast-report.json` — Semgrep JSON output
6. `sonarqube-findings.md` — documented SonarQube findings

---

## ❓ Questions to Answer

1. What is the difference between a **Security Hotspot** (SonarQube) and a **Vulnerability**? Which requires developer action?
2. Semgrep found the SQL injection — what is the **specific code pattern** it matched?
3. Why might SAST tools **miss** the Path Traversal vulnerability? What class of tools is better suited for it?
4. How would you handle a situation where Semgrep flags a finding that is a **genuine false positive** but you can't change the code?
5. What is **taint analysis** and how does it relate to SAST? Does Semgrep support it?

---

> 💡 **Tip**: When Semgrep finds an issue, read the **rule message** carefully — it usually explains WHY it's a vulnerability and HOW to fix it. This is what developers will see.

> 💡 **Semgrep Playground**: Test your custom rules at [semgrep.dev/playground](https://semgrep.dev/playground) before adding them to CI.
