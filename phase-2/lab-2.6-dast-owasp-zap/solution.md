# Lab 2.6 — DAST with OWASP ZAP: Solution Guide
**Phase**: 2 — CI/CD Security

---

## Task 2 & 3: ZAP Scan Commands

```bash
# Pull ZAP image
docker pull ghcr.io/zaproxy/zaproxy:stable

# BASELINE SCAN (passive — no attacks)
docker run --rm \
  --network="host" \
  -v "$(pwd):/zap/wrk/:rw" \
  -t ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py \
  -t http://localhost:5000 \
  -g gen.conf \
  -r baseline-report.html \
  -J baseline-report.json \
  -x baseline-report.xml

# FULL SCAN (active — sends attack payloads)
docker run --rm \
  --network="host" \
  -v "$(pwd):/zap/wrk/:rw" \
  -t ghcr.io/zaproxy/zaproxy:stable \
  zap-full-scan.py \
  -t http://localhost:5000 \
  -r fullscan-report.html \
  -J fullscan-report.json \
  -l WARN

# API SCAN (with OpenAPI spec)
docker run --rm \
  --network="host" \
  -v "$(pwd):/zap/wrk/:rw" \
  -t ghcr.io/zaproxy/zaproxy:stable \
  zap-api-scan.py \
  -t http://localhost:5000/openapi.yaml \
  -f openapi \
  -r api-scan-report.html
```

---

## Task 4: OpenAPI Specification

```yaml
# openapi.yaml
openapi: 3.0.0
info:
  title: Vulnerable App API
  version: 1.0.0
  description: API for DAST lab testing

servers:
  - url: http://localhost:5000

paths:
  /:
    get:
      summary: Home page
      parameters:
        - name: name
          in: query
          schema:
            type: string
      responses:
        '200':
          description: OK

  /login:
    post:
      summary: Login
      requestBody:
        content:
          application/x-www-form-urlencoded:
            schema:
              type: object
              properties:
                username:
                  type: string
                password:
                  type: string
      responses:
        '200':
          description: Login result

  /api/users/{user_id}:
    get:
      summary: Get user by ID
      parameters:
        - name: user_id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: User details

  /api/admin:
    get:
      summary: Admin panel
      responses:
        '200':
          description: Admin data

  /api/ping:
    get:
      summary: Ping a host
      parameters:
        - name: host
          in: query
          schema:
            type: string
      responses:
        '200':
          description: Ping result
```

---

## Task 5: GitHub Actions DAST Workflow

```yaml
# .github/workflows/dast.yml
name: DAST — Dynamic Security Testing

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Nightly full scan

permissions:
  contents: read
  issues: write
  security-events: write

jobs:
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    outputs:
      app-url: ${{ steps.deploy.outputs.url }}
    steps:
      - uses: actions/checkout@v4

      - name: Start Application (local staging)
        id: deploy
        run: |
          pip install flask flask-cors
          python vulnerable_app.py &
          sleep 3  # Wait for startup
          echo "url=http://localhost:5000" >> $GITHUB_OUTPUT

      - name: Verify App is Running
        run: curl -f http://localhost:5000 || exit 1

  zap-baseline:
    name: ZAP Baseline Scan
    runs-on: ubuntu-latest
    needs: deploy-staging
    steps:
      - uses: actions/checkout@v4

      - name: Start Application
        run: |
          pip install flask flask-cors
          python vulnerable_app.py &
          sleep 3

      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.12.0
        with:
          target: 'http://localhost:5000'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'  # Include passive ajax spider
          fail_action: true  # Fail job on alerts

      - name: Upload ZAP Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: zap-baseline-report
          path: |
            report_html.html
            report_json.json
          retention-days: 30

  zap-full-scan:
    name: ZAP Full Active Scan
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.event_name == 'schedule' || contains(github.event.head_commit.message, '[full-scan]')
    steps:
      - uses: actions/checkout@v4

      - name: Start Application
        run: |
          pip install flask flask-cors
          python vulnerable_app.py &
          sleep 3

      - name: ZAP Full Scan
        uses: zaproxy/action-full-scan@v0.10.0
        with:
          target: 'http://localhost:5000'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'

      - name: Upload Full Scan Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: zap-full-scan-report
          path: |
            report_html.html
            report_json.json

  zap-api-scan:
    name: ZAP API Scan
    runs-on: ubuntu-latest
    needs: deploy-staging
    steps:
      - uses: actions/checkout@v4

      - name: Start Application
        run: |
          pip install flask flask-cors
          python vulnerable_app.py &
          sleep 3

      - name: ZAP API Scan
        uses: zaproxy/action-api-scan@v0.7.0
        with:
          target: 'http://localhost:5000/openapi.yaml'
          format: openapi
          rules_file_name: '.zap/rules.tsv'

      - name: Upload API Scan Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: zap-api-scan-report
          path: report_html.html
```

---

## Task 6: ZAP Rules File

```tsv
# .zap/rules.tsv
# Format: RuleID\tACTION\tParameter
# Actions: IGNORE, WARN, FAIL
# Get rule IDs from ZAP scan output

# Information leakage — accept as known risk (informational only)
10021	IGNORE	(Passive Scan - X-Content-Type-Options Header Missing)
10038	WARN	(Content Security Policy Header Not Set)
10020	WARN	(X-Frame-Options Header Not Set)
10036	WARN	(Server Leaks Version Information via Server HTTP Response Header)
10027	IGNORE	(Information Disclosure - Suspicious Comments)

# Active security issues — FAIL pipeline
40012	FAIL	(Cross Site Scripting (Reflected))
40014	FAIL	(Cross Site Scripting (Persistent))
40018	FAIL	(SQL Injection)
40017	FAIL	(Server Side Include)
90020	FAIL	(Remote OS Command Injection)
10202	FAIL	(Absence of Anti-CSRF Tokens)
```

---

## ✅ Answers to Reflection Questions

### 1. Added Value of DAST When SAST Already Found It

| Aspect | SAST | DAST |
|---|---|---|
| **Confirms exploitability** | Found code pattern | Confirms it's actually exploitable at runtime |
| **Configuration context** | Can't see runtime config | Tests actual running config (WAF, middleware) |
| **Defense testing** | Finds the bug | Verifies your fix actually works |
| **False positive rate** | Higher | Lower (real HTTP 200 with injected data = real vuln) |
| **New attack paths** | Limited | Finds combinations SAST can't reason about |

**Real value**: DAST validates that your WAF/security middleware is working. If SAST says "SQL injection" but DAST can't exploit it, your WAF is doing its job.

### 2. Missing Security Headers — Where to Fix

Security headers can be set at:
- **Application level** (Flask): `response.headers['X-Frame-Options'] = 'DENY'`
- **Web server** (nginx): `add_header X-Frame-Options "DENY" always;`
- **CDN/Proxy** (CloudFront, Cloudflare): Configure at edge
- **Kubernetes Ingress**: Via annotations on nginx ingress

**Best practice**: Fix at the **web server/proxy level** — it's applied uniformly across all endpoints and doesn't require code changes:

```nginx
# nginx.conf security headers
server {
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
}
```

### 3. DAST Against Production vs Staging

| | Production | Staging |
|---|---|---|
| **Active scan risk** | HIGH — attacks may corrupt real data, trigger alerts, cause downtime | LOW — isolated environment |
| **Baseline scan risk** | Low (passive only) | Very low |
| **Test data quality** | Real data → better results | Synthetic data → may miss some paths |
| **Recommendation** | Passive/baseline only, off-hours | Full active scan |

**If you must test production**: Use read-only passive scan only, schedule for lowest traffic (3-4am), alert DevOps team, have rollback ready.

### 4. Optimizing DAST for Speed

```
Slow pipeline (15+ min)         Fast pipeline (2-3 min)
───────────────────────         ───────────────────────
zap-full-scan.py          →     zap-baseline.py (every PR)
  + all active scanners         + key endpoints only
  + deep spider                 + passive scan only
  + all paths
                          +     zap-full-scan.py (nightly/pre-release)
```

**Speed optimization strategies**:
1. **Split scans**: Baseline (fast) on every PR, Full (slow) nightly
2. **Scope limiting**: Only scan changed URLs, not entire app
3. **Parallel scanning**: Split endpoints across multiple ZAP instances
4. **Disable slow rules**: `zap-full-scan.py -z "-config scanner.threadPerHost=5"`
5. **Target selection**: Only DAST the authentication/input endpoints

### 5. Authenticated DAST

**What it is**: ZAP logs in to your application before scanning, allowing it to test pages/endpoints that require authentication.

**Why it's critical**: Without authentication, ZAP only sees:
- Login page
- Public pages
- Error pages

With authentication, ZAP can test:
- User profile pages (IDOR vulnerabilities)
- Admin panels (broken access control)
- API endpoints that require tokens
- Post-login XSS on personalized content
- Business logic flaws (e.g., price manipulation)

**ZAP Authenticated Scan Setup**:
```yaml
# With form-based auth
- name: ZAP Authenticated Scan
  uses: zaproxy/action-full-scan@v0.10.0
  with:
    target: 'http://localhost:5000'
    cmd_options: >
      -z "
        -config users.username=admin
        -config users.password=admin123
        -config authentication.loginUrl=http://localhost:5000/login
        -config authentication.loginRequestData=username={%username%}&password={%password%}
        -config authentication.loggedInIndicator=\\Qsuccess\\E
      "
```
