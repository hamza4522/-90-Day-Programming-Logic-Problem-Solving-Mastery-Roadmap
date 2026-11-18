# Lab 2.2 — SAST Solution Guide
**Phase**: 2 — CI/CD Security

---

## Task 2: Running Semgrep

### Install Semgrep
```bash
# Python pip (recommended)
pip install semgrep

# macOS
brew install semgrep

# Docker
docker pull semgrep/semgrep

# Verify
semgrep --version
```

### Run Semgrep Against the Vulnerable App

```bash
# Auto config — uses Semgrep registry rules (best for starting)
semgrep scan --config=auto app.py --verbose

# Target Python/Flask security rules specifically
semgrep scan --config=p/flask app.py
semgrep scan --config=p/python app.py
semgrep scan --config=p/owasp-top-ten app.py

# Generate JSON report
semgrep scan \
  --config=auto \
  --json \
  --output=sast-report.json \
  app.py

# Generate SARIF report (for GitHub Security tab)
semgrep scan \
  --config=auto \
  --sarif \
  --output=sast-report.sarif \
  app.py

# Set severity threshold — fail on ERROR level
semgrep scan --config=auto --severity=ERROR --error app.py
```

### Expected Findings

```
Findings for app.py:
  python.flask.security.injection.tainted-sql-string.tainted-sql-string
    Severity: ERROR
    Line 13: query = f"SELECT * FROM users WHERE id = {user_id}"
    Message: User-controlled data flows into SQL query. Use parameterized queries.

  python.lang.security.audit.subprocess-shell-true.subprocess-shell-true
    Severity: WARNING  
    Line 21: result = subprocess.run(f"ping -c 1 {host}", shell=True, ...)
    Message: Using shell=True with user-controlled input is vulnerable to command injection.

  python.flask.security.injection.tainted-template-string.tainted-template-string
    Severity: ERROR
    Line 29: return render_template_string(template)
    Message: User-controlled input flows into render_template_string — SSTI vulnerability.

  python.lang.security.audit.hardcoded-string.hardcoded-string
    Severity: WARNING
    Lines 36-37: SECRET_KEY = "my-super-secret..."
    Message: Hardcoded secret detected.

5 findings. 2 errors, 3 warnings.
```

---

## Task 3: SonarQube Setup

### Docker Compose

```yaml
# docker-compose-sonarqube.yml
version: '3'
services:
  sonarqube:
    image: sonarqube:10-community
    depends_on:
      - db
    ports:
      - "9000:9000"
    environment:
      - SONAR_JDBC_URL=jdbc:postgresql://db:5432/sonar
      - SONAR_JDBC_USERNAME=sonar
      - SONAR_JDBC_PASSWORD=sonar
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_logs:/opt/sonarqube/logs
    ulimits:
      nofile:
        soft: 65536
        hard: 65536

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=sonar
      - POSTGRES_PASSWORD=sonar
      - POSTGRES_DB=sonar
    volumes:
      - postgresql_data:/var/lib/postgresql/data

volumes:
  sonarqube_data:
  sonarqube_logs:
  postgresql_data:
```

```bash
# Start SonarQube
docker-compose -f docker-compose-sonarqube.yml up -d

# Wait ~60 seconds for startup
# Access at: http://localhost:9000
# Default login: admin / admin (you'll be prompted to change it)
```

### Create Project & Run Scanner

```bash
# 1. In SonarQube UI:
#    - Create Project → Manual
#    - Name: sast-lab
#    - Key: sast-lab
#    - Generate Token: sast-lab-token

# 2. Run scanner via Docker
docker run \
  --rm \
  --network host \
  -v "$(pwd):/usr/src" \
  sonarsource/sonar-scanner-cli \
  -Dsonar.projectKey=sast-lab \
  -Dsonar.sources=/usr/src \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=YOUR_TOKEN_HERE

# Or create sonar-project.properties
cat > sonar-project.properties << 'EOF'
sonar.projectKey=sast-lab
sonar.projectName=SAST Lab
sonar.projectVersion=1.0
sonar.sources=.
sonar.python.version=3
sonar.host.url=http://localhost:9000
sonar.login=YOUR_TOKEN
EOF

sonar-scanner
```

---

## Task 4: GitHub Actions SAST Workflow

```yaml
# .github/workflows/sast.yml
name: SAST Pipeline

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main, develop]

permissions:
  contents: read
  security-events: write  # Required to upload SARIF
  pull-requests: write    # Required for PR comments

jobs:
  semgrep:
    name: Semgrep SAST
    runs-on: ubuntu-latest
    container:
      image: semgrep/semgrep
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Semgrep — Auto rules
        run: |
          semgrep scan \
            --config=auto \
            --config=p/flask \
            --config=p/owasp-top-ten \
            --sarif \
            --output=semgrep.sarif \
            --json \
            --output=semgrep.json \
            .
        continue-on-error: true

      - name: Upload SARIF to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: semgrep.sarif
          category: semgrep

      - name: Fail on Critical/Error findings
        run: |
          # Count ERROR severity findings
          ERROR_COUNT=$(cat semgrep.json | python3 -c "
          import json, sys
          data = json.load(sys.stdin)
          errors = [r for r in data.get('results', []) 
                    if r.get('extra', {}).get('severity') == 'ERROR']
          print(len(errors))
          ")
          echo "ERROR findings: $ERROR_COUNT"
          if [ "$ERROR_COUNT" -gt "0" ]; then
            echo "❌ $ERROR_COUNT SAST errors found. Pipeline blocked."
            exit 1
          fi
          echo "✅ No ERROR-level SAST findings. Pipeline continues."

      - name: Post PR Comment with Summary
        uses: actions/github-script@v7
        if: github.event_name == 'pull_request' && always()
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('semgrep.json', 'utf8'));
            const results = report.results || [];
            const errors = results.filter(r => r.extra?.severity === 'ERROR');
            const warnings = results.filter(r => r.extra?.severity === 'WARNING');
            
            const body = `## 🔍 SAST Scan Results
            | Severity | Count |
            |---|---|
            | 🔴 Error | ${errors.length} |
            | 🟡 Warning | ${warnings.length} |
            | Total | ${results.length} |
            
            ${errors.length > 0 ? '❌ **Pipeline blocked** — fix ERROR findings before merging.' : '✅ **No blocking issues found.**'}
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });

      - name: Upload JSON Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: semgrep-report
          path: |
            semgrep.json
            semgrep.sarif
          retention-days: 30
```

---

## Task 5: Custom Semgrep Rule

### `.semgrepignore`
```
# Exclude third-party and generated code
node_modules/
vendor/
.venv/
dist/
build/
*.min.js

# Exclude test files (adjust severity, not ignore completely in prod)
tests/
test_*.py
*_test.py
```

### `semgrep-rules/custom.yaml`
```yaml
rules:
  - id: subprocess-shell-true-with-user-input
    patterns:
      - pattern: subprocess.$FUNC(..., shell=True, ...)
      - pattern-not: subprocess.$FUNC("...", shell=True, ...)  # Allow hardcoded strings
    message: |
      `shell=True` with dynamic input allows command injection.
      An attacker can inject shell metacharacters (`;`, `|`, `&&`) to run arbitrary commands.
      
      Fix: Use a list of arguments instead of shell=True:
        subprocess.run(["ping", "-c", "1", host], capture_output=True)
    languages: [python]
    severity: ERROR
    metadata:
      category: security
      cwe: CWE-78
      owasp: A03:2021 Injection
      confidence: HIGH
      references:
        - https://docs.python.org/3/library/subprocess.html#security-considerations

  - id: flask-debug-true
    pattern: app.run(..., debug=True, ...)
    message: |
      Flask debug mode is enabled. This exposes an interactive debugger
      in the browser which allows arbitrary Python code execution.
      Never use debug=True in production.
    languages: [python]
    severity: ERROR
    metadata:
      category: security
      cwe: CWE-94
```

```bash
# Test your custom rule
semgrep scan --config=semgrep-rules/ app.py

# Expected output:
# subprocess-shell-true-with-user-input: app.py line 21
# flask-debug-true: app.py line 41
```

---

## ✅ Answers to Reflection Questions

### 1. Security Hotspot vs Vulnerability (SonarQube)

| | Security Hotspot | Vulnerability |
|---|---|---|
| **Definition** | Code that is security-sensitive but MAY be safe | Code that IS definitely a security issue |
| **Action Required** | Developer must review and mark as Safe/Unsafe | Must be fixed |
| **Example** | Using `Random` (may be fine if not crypto) | SQL query with user input (always bad) |
| **SonarQube Flow** | Review → Mark as Reviewed | Fix → Mark as Resolved |

### 2. Semgrep's SQL Injection Pattern Match

Semgrep matched the **taint flow** from the source (user input) to the sink (SQL query):
```python
# Source (taint origin)
user_id = request.args.get('id')  # ← User-controlled input

# Sink (dangerous operation)
query = f"SELECT * FROM users WHERE id = {user_id}"  # ← Tainted variable reaches SQL
```
The rule uses taint mode: it tracks that `user_id` comes from `request.args` (untrusted source) and flows into a format string used in SQL (dangerous sink).

### 3. Why SAST Might Miss Path Traversal

SAST tools work on **static code** — they analyze patterns and data flows visible in source code. Path traversal (`/file?name=../../etc/passwd`) depends on:
- **Runtime behavior** of the filesystem
- **Configuration** of the server
- **Context** that's only visible at runtime

**Better tools for Path Traversal**:
- **DAST** (OWASP ZAP) — sends actual `../` payloads and checks responses
- **IAST** (Contrast Security) — instruments the running app

### 4. Handling Genuine False Positives

```python
# Option 1: Semgrep inline suppression
result = subprocess.run(["cmd"], shell=True, ...)  # nosemgrep: subprocess-shell-true

# Option 2: Block-level suppression
# nosemgrep: subprocess-shell-true-with-user-input
result = subprocess.run(["cmd"], shell=True, ...)

# Option 3: .semgrepignore for entire file
# Add the file path to .semgrepignore

# Best practice: Add a comment explaining WHY it's safe
# nosemgrep: subprocess-shell-true — input is validated against allowlist on line 15
```

### 5. Taint Analysis in Semgrep

**Taint Analysis** tracks the flow of "tainted" (untrusted) data from a **source** (user input, file, network) to a **sink** (SQL query, shell command, HTML output).

Semgrep **does support taint analysis** via:
```yaml
mode: taint
pattern-sources:
  - pattern: request.args.get(...)
pattern-sinks:
  - pattern: conn.execute(...)
```

This is how it detected the SQL injection — it traced `user_id` from `request.args.get('id')` through the f-string to `conn.execute(query)`.
