# Lab 2.3 — SCA Solution Guide
**Phase**: 2 — CI/CD Security

---

## Task 3: Trivy Installation & Scan

```bash
# Install Trivy
# Linux
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# macOS
brew install trivy

# Windows (PowerShell — as admin)
choco install trivy

# Verify
trivy --version

# Scan project filesystem
trivy fs --severity HIGH,CRITICAL .

# Scan with all severities and JSON output
trivy fs \
  --format json \
  --output trivy-report.json \
  .

# Generate SARIF for GitHub
trivy fs \
  --format sarif \
  --output trivy-report.sarif \
  --severity HIGH,CRITICAL \
  .

# Generate SBOM — CycloneDX format
trivy fs \
  --format cyclonedx \
  --output sbom-cyclonedx.json \
  .

# Generate SBOM — SPDX format
trivy fs \
  --format spdx-json \
  --output sbom-spdx.json \
  .

# Scan with exit code for CI (fail on CRITICAL)
trivy fs \
  --severity CRITICAL \
  --exit-code 1 \
  --format table \
  .
```

### Expected Trivy Output

```
2024-01-15T10:30:00.000+0000  INFO  Detected OS: unknown
2024-01-15T10:30:00.000+0000  INFO  Number of language-specific files: 1
2024-01-15T10:30:00.000+0000  INFO  Detecting node-pkg vulnerabilities...

package-lock.json (node-pkg)
════════════════════════════════════════════════
Total: 12 (HIGH: 7, CRITICAL: 5)

┌──────────────────┬────────────────────┬──────────┬────────────────┬───────────────┬──────────────────────────────┐
│ Library          │ Vulnerability      │ Severity │ Inst. Version  │ Fixed Version │ Title                        │
├──────────────────┼────────────────────┼──────────┼────────────────┼───────────────┼──────────────────────────────┤
│ axios            │ CVE-2019-10742     │ HIGH     │ 0.18.0         │ 0.18.1        │ axios SSRF vulnerability      │
│ lodash           │ CVE-2019-10744     │ CRITICAL │ 4.17.4         │ 4.17.12       │ Prototype Pollution           │
│ lodash           │ CVE-2020-8203      │ HIGH     │ 4.17.4         │ 4.17.19       │ Prototype Pollution via merge │
│ minimist         │ CVE-2020-7598      │ HIGH     │ 1.2.0          │ 1.2.3         │ Prototype Pollution           │
│ jsonwebtoken     │ CVE-2022-23529     │ CRITICAL │ 8.5.1          │ 9.0.0         │ Unsafe object injection       │
└──────────────────┴────────────────────┴──────────┴────────────────┴───────────────┴──────────────────────────────┘
```

---

## Task 4: Snyk Setup & Scan

```bash
# Install Snyk CLI
npm install -g snyk

# Authenticate (opens browser)
snyk auth

# Test current project
snyk test

# Test with JSON output
snyk test --json > snyk-report.json

# Monitor project (continuous tracking)
snyk monitor

# Fix vulnerabilities automatically (creates PRs)
snyk fix

# Test Docker image too
snyk container test node:18-alpine
```

---

## Task 5: GitHub Actions SCA Workflow

```yaml
# .github/workflows/sca.yml
name: Software Composition Analysis

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * 1'  # Weekly scan on Mondays at 6am

permissions:
  contents: read
  security-events: write
  packages: read

jobs:
  npm-audit:
    name: npm Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: npm Audit — High severity gate
        run: |
          npm audit --audit-level=high --json > npm-audit.json || true
          HIGH_COUNT=$(cat npm-audit.json | node -e "
            const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
            const vulns = d.vulnerabilities || {};
            const highs = Object.values(vulns).filter(v => 
              v.severity === 'high' || v.severity === 'critical'
            );
            console.log(highs.length);
          ")
          echo "High/Critical vulnerabilities: $HIGH_COUNT"
          if [ "$HIGH_COUNT" -gt "0" ]; then
            echo "❌ Blocking pipeline — $HIGH_COUNT high/critical vulnerabilities found"
            exit 1
          fi

  trivy-sca:
    name: Trivy Dependency Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Trivy — Filesystem Scan (Table)
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'table'
          severity: 'CRITICAL,HIGH'

      - name: Trivy — Generate SARIF Report
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-sca.sarif'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'  # Block on findings

      - name: Upload SARIF to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: 'trivy-sca.sarif'
          category: trivy-sca

  sbom-generation:
    name: Generate SBOM
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate SBOM — CycloneDX
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'cyclonedx'
          output: 'sbom-cyclonedx.json'

      - name: Generate SBOM — SPDX
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'spdx-json'
          output: 'sbom-spdx.json'

      - name: Upload SBOMs as Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: sbom-reports
          path: |
            sbom-cyclonedx.json
            sbom-spdx.json
          retention-days: 90  # Keep for compliance

      - name: Scan SBOM for Vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'sbom'
          scan-ref: 'sbom-cyclonedx.json'
          severity: 'CRITICAL'
          exit-code: '1'
```

---

## ✅ Answers to Reflection Questions

### 1. CVE vs CVSS Score

| Term | Definition | Example |
|---|---|---|
| **CVE** | Common Vulnerabilities and Exposures — unique ID for a vulnerability | CVE-2019-10742 |
| **CVSS** | Common Vulnerability Scoring System — numerical severity score 0-10 | 7.5 (HIGH) |

**CVSS v3 Score Components**:
- **Attack Vector** (Network=worst, Physical=best)
- **Attack Complexity** (Low=easier to exploit)  
- **Privileges Required** (None=worst)
- **User Interaction** (None=worse)
- **Scope** (Changed=worse — affects other systems)
- **Confidentiality/Integrity/Availability Impact** (High=worst)

Ratings: Critical(9.0-10), High(7.0-8.9), Medium(4.0-6.9), Low(0.1-3.9)

### 2. Why Tools Find Different Vulnerabilities

| Reason | Explanation |
|---|---|
| **Database differences** | Trivy uses NVD + GitHub Advisory + more; npm audit uses npm Advisory DB |
| **Transitive deps** | Tools handle indirect dependencies differently |
| **Version matching** | Different algorithms for matching vulnerability version ranges |
| **CVE freshness** | Different update frequencies for vulnerability databases |
| **Custom rules** | Snyk has proprietary research finding CVEs before NVD |

**Bottom line**: Use multiple tools for better coverage. Trivy + npm audit is a good combination.

### 3. Dependency Confusion vs Vulnerable Dependency

| | Dependency Confusion | Vulnerable Dependency |
|---|---|---|
| **What it is** | Attacker publishes malicious package to PUBLIC registry with SAME NAME as your INTERNAL package | Public package with known CVE |
| **Attack vector** | Package manager pulls from public instead of private registry | Using a package with a bug |
| **Prevention** | Use scoped packages (`@mycompany/utils`), configure registry priority | Regular scanning + updates |
| **Famous example** | Alex Birsan's 2021 research affecting Microsoft, Apple, PayPal | Log4Shell (Log4j CVE-2021-44228) |

### 4. "We Can't Upgrade — It Will Break the API"

DevSecOps response (graduated approach):
1. **Risk acceptance**: Document the vulnerability, get sign-off from security + management
2. **Compensating controls**: WAF rule to block exploit patterns, network restriction to reduce attack surface
3. **Monitoring**: Alert if the vulnerability is being actively exploited in the wild
4. **Scheduled upgrade**: Put a hard deadline in the backlog — not "someday" but a sprint
5. **Vulnerability management tool**: Track it in Snyk/Trivy with a suppression + expiry date
6. **Dependency isolation**: If possible, isolate the vulnerable package to a separate service

### 5. SBOM for Compliance

| Compliance Framework | Required SBOM Fields |
|---|---|
| **SOC2** | Component names, versions, licenses, known vulnerabilities at time of release |
| **HIPAA** | All software components, version tracking, vulnerability management evidence |
| **NIST SSDF** | Component provenance, build integrity, known vulnerabilities |
| **Executive Order 14028** | Minimum elements: supplier, component name, version, unique identifiers, dependency relationships, author, timestamp |

The **NTIA Minimum Elements** for SBOM (required by US Executive Order):
1. Supplier Name
2. Component Name  
3. Version
4. Other Unique Identifiers (CPE, PURL)
5. Dependency Relationship
6. Author of SBOM Data
7. Timestamp
