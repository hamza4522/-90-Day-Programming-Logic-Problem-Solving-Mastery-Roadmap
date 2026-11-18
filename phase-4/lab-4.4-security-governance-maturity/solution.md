# Lab 4.4 — Security Governance & Maturity Assessment Solution Guide
**Phase**: 4 — Pro / Leadership

---

## Task 1: OWASP DSOMM Assessment

```markdown
# maturity-assessment.md — DevSecOps Maturity Assessment
## Organization: Acme Corp (Example)
## Date: 2024-06-15
## Assessed by: Security Engineering Team

### Current Maturity Levels

| Dimension | Current Level | Target (6mo) | Key Gap |
|---|---|---|---|
| Build & Deployment | Level 2 (Managed) | Level 3 | Security gates exist in 4/15 team pipelines |
| Culture & Organization | Level 1 (Initial) | Level 2 | No champions program, ad-hoc training only |
| Information Gathering | Level 2 (Managed) | Level 3 | Scanning inconsistent — some teams skip it |
| Implementation | Level 1 (Initial) | Level 2 | No secure-by-default templates |
| Test & Verification | Level 2 (Managed) | Level 3 | SAST only, no DAST or runtime monitoring |

### Evidence for Current Ratings

**Build & Deployment — Level 2**:
- ✅ CI/CD exists for all services (GitHub Actions)
- ✅ 4 teams have Trivy container scanning in CI
- ❌ No security gates block deployment
- ❌ No artifact signing
- ❌ 11 teams have zero security tooling in pipeline

**Culture & Organization — Level 1**:
- ✅ Security team exists (3 people)
- ❌ No formal security training program
- ❌ No Security Champions
- ❌ No security-focused onboarding for new engineers
- ❌ Developers see security as "security team's job"

**Information Gathering — Level 2**:
- ✅ Occasional Trivy scans (triggered manually)
- ✅ Dependabot enabled on 60% of repos
- ❌ No SAST (Semgrep/SonarQube)
- ❌ No secret scanning (Gitleaks)
- ❌ No centralized vulnerability dashboard

**Implementation — Level 1**:
- ❌ No secure Dockerfile templates
- ❌ No hardened Kubernetes manifests
- ❌ Each team builds from scratch — inconsistent security posture
- ❌ No network policies
- ❌ Secrets in environment variables, not Vault

**Test & Verification — Level 2**:
- ✅ Unit tests in CI (functional, not security)
- ✅ Some teams run npm audit
- ❌ No DAST testing
- ❌ No penetration testing program
- ❌ No runtime monitoring (Falco)

### Prioritized 6-Month Roadmap

| Priority | Action | Impact | Effort | Timeline |
|---|---|---|---|---|
| P0 | Deploy Gitleaks to all repos (pre-commit + CI) | High — prevents credential leaks | Low | Week 1–2 |
| P0 | Add Trivy container scan to all CI pipelines | High — catches critical CVEs | Low | Week 2–4 |
| P1 | Launch Security Champions program (5 volunteers) | High — scales security knowledge | Medium | Month 1–2 |
| P1 | Create secure-by-default templates (Dockerfile, K8s, Terraform) | High — prevents misconfig | Medium | Month 2–3 |
| P1 | Deploy Semgrep to all repos | Medium — catches code-level vulns | Low | Month 2 |
| P2 | Deploy Vault for secrets management | High — eliminates hardcoded secrets | High | Month 3–4 |
| P2 | Set up security metrics dashboard | Medium — enables measurement | Medium | Month 3–4 |
| P2 | Implement DAST with ZAP in staging | Medium — catches runtime vulns | Medium | Month 4–5 |
| P3 | Deploy Falco for runtime monitoring | Medium — detects active threats | High | Month 5–6 |
| P3 | Establish pen testing program (quarterly) | Medium — deep testing | High | Month 6 |
```

---

## Task 2: Production Security Checklist

```yaml
# production-security-checklist.yml
apiVersion: security.acme.com/v1
kind: ProductionSecurityChecklist
metadata:
  version: "2.0"
  last_updated: "2024-06-15"
  owner: security-engineering
  review_cadence: quarterly

requirements:
  # ═══ CODE SECURITY ═══
  code_security:
    - id: SEC-CODE-01
      name: "SAST scan completed"
      description: "Semgrep or equivalent SAST tool has been run against the codebase"
      enforcement: REQUIRED
      evidence: "CI pipeline includes SAST step; link to latest scan report"
      tools: ["semgrep", "sonarqube"]

    - id: SEC-CODE-02
      name: "No unresolved critical/high SAST findings"
      description: "All critical and high severity SAST findings are resolved or have approved exceptions"
      enforcement: REQUIRED
      evidence: "Scan report shows 0 critical/high, or exception tickets linked"

    - id: SEC-CODE-03
      name: "Custom security rules for business logic"
      description: "Team has written custom Semgrep rules for their specific security patterns"
      enforcement: RECOMMENDED
      evidence: "Custom .semgrep.yml rules in repo"

  # ═══ DEPENDENCIES ═══
  dependencies:
    - id: SEC-DEP-01
      name: "SCA scan completed"
      description: "Trivy/Snyk/npm audit has scanned all dependencies"
      enforcement: REQUIRED
      evidence: "CI pipeline includes SCA step"
      tools: ["trivy", "snyk", "npm audit"]

    - id: SEC-DEP-02
      name: "No critical CVEs with available fixes"
      description: "All critical CVEs that have a fix available must be patched"
      enforcement: REQUIRED
      evidence: "Grype/Trivy report with --only-fixed filter shows 0 critical"

    - id: SEC-DEP-03
      name: "SBOM generated"
      description: "CycloneDX or SPDX SBOM generated and stored"
      enforcement: REQUIRED
      evidence: "SBOM artifact uploaded in CI; attached as image attestation"
      tools: ["syft"]

    - id: SEC-DEP-04
      name: "Dependency update automation"
      description: "Dependabot or Renovate configured for automated dependency PRs"
      enforcement: RECOMMENDED
      evidence: "dependabot.yml or renovate.json in repo"

  # ═══ CONTAINER SECURITY ═══
  container:
    - id: SEC-CTR-01
      name: "Container image scanned"
      description: "Final Docker image scanned with Trivy"
      enforcement: REQUIRED
      evidence: "CI pipeline includes image scan step"

    - id: SEC-CTR-02
      name: "Non-root container"
      description: "Container runs as non-root user"
      enforcement: REQUIRED
      evidence: "Dockerfile contains USER directive; Kubesec score > 0"

    - id: SEC-CTR-03
      name: "Minimal base image"
      description: "Using distroless, Alpine, or -slim base image"
      enforcement: REQUIRED
      evidence: "Dockerfile FROM line uses approved base image"

    - id: SEC-CTR-04
      name: "Image signed with Cosign"
      description: "Container image is signed and signature is verified before deployment"
      enforcement: REQUIRED
      evidence: "cosign verify succeeds; admission controller enforces"

  # ═══ SECRETS ═══
  secrets:
    - id: SEC-SECRET-01
      name: "No hardcoded secrets"
      description: "Gitleaks scan shows zero findings"
      enforcement: REQUIRED  # HARD FAIL — no exceptions
      evidence: "Gitleaks CI step passes with zero findings"

    - id: SEC-SECRET-02
      name: "Secrets managed via Vault"
      description: "All runtime secrets sourced from HashiCorp Vault or cloud KMS"
      enforcement: REQUIRED
      evidence: "No secrets in env vars, ConfigMaps, or .env files"

  # ═══ AUTHENTICATION ═══
  authentication:
    - id: SEC-AUTH-01
      name: "Standard auth protocol"
      description: "Using OAuth2/OIDC — no custom authentication"
      enforcement: REQUIRED
      evidence: "Architecture doc shows auth flow via identity provider"

    - id: SEC-AUTH-02
      name: "Service-to-service auth"
      description: "mTLS or JWT-based service authentication"
      enforcement: REQUIRED
      evidence: "Network diagram shows mTLS between services"

  # ═══ LOGGING ═══
  logging:
    - id: SEC-LOG-01
      name: "Security events logged"
      description: "Auth failures, access denials, privilege changes are logged"
      enforcement: REQUIRED
      evidence: "Log sample showing security events in structured format"

    - id: SEC-LOG-02
      name: "Logs shipped to SIEM"
      description: "All logs forwarded to central logging (ELK/Splunk/Datadog)"
      enforcement: REQUIRED
      evidence: "Service appears in SIEM dashboard"

  # ═══ NETWORK ═══
  network:
    - id: SEC-NET-01
      name: "Kubernetes NetworkPolicies defined"
      description: "Default deny + explicit allow rules"
      enforcement: REQUIRED
      evidence: "NetworkPolicy YAML in deployment manifests"

    - id: SEC-NET-02
      name: "No unnecessary internet egress"
      description: "Pods cannot reach the internet unless explicitly required"
      enforcement: RECOMMENDED
      evidence: "Egress NetworkPolicy restricts outbound traffic"

  # ═══ INCIDENT RESPONSE ═══
  incident_response:
    - id: SEC-IR-01
      name: "Runbook exists"
      description: "Service has a runbook with incident response procedures"
      enforcement: REQUIRED
      evidence: "Link to runbook in wiki/Confluence"

    - id: SEC-IR-02
      name: "On-call configured"
      description: "PagerDuty/Opsgenie rotation includes service team"
      enforcement: REQUIRED
      evidence: "Service listed in on-call schedule"

scoring:
  green: "All REQUIRED checks pass"
  yellow: "All REQUIRED checks pass, some RECOMMENDED checks fail"
  red: "Any REQUIRED check fails — cannot deploy to production"
```

---

## Task 3: Security Exception Process

```markdown
# exception-process.md — Security Exception Handling

## Purpose
A security exception is a formal, time-limited acknowledgment that a specific security
requirement cannot be met, along with compensating controls to reduce risk.

## Exception Types

| Type | Description | Example |
|---|---|---|
| **Accepted Risk** | Risk is understood and accepted | Legacy service EOL in 3 months — not worth patching |
| **Timeline Extension** | Will fix, but need more time | Critical CVE fix breaks API compatibility — need migration |
| **Compensating Control** | Alternative mitigation in place | Can't patch library → added WAF rule to block exploit |
| **False Positive** | Finding is incorrect | Scanner flagged test code as a vulnerability |

## Approval Authority

| Risk Level | Criteria | Approver | Max Duration |
|---|---|---|---|
| **Low** | Medium/Low severity, no customer data exposure | Team Lead | 90 days |
| **Medium** | High severity, limited blast radius | Eng Manager + Security Engineer | 60 days |
| **High** | Critical severity, or involves PII/PCI data | Director of Engineering + CISO | 30 days |
| **Critical** | Active exploit in the wild, or auth bypass | **No exceptions — must fix immediately** | N/A |

## Exception Request Template

### GitHub Issue Template
```

```yaml
# .github/ISSUE_TEMPLATE/security-exception.yml
name: Security Exception Request
description: Request an exception to a security requirement
labels: ["security-exception", "needs-review"]
assignees: ["security-team"]

body:
  - type: dropdown
    id: risk-level
    attributes:
      label: Risk Level
      options:
        - Low (Medium/Low severity, no data exposure)
        - Medium (High severity, limited blast radius)
        - High (Critical severity or PII/PCI involved)
    validations:
      required: true

  - type: input
    id: finding
    attributes:
      label: Security Finding
      description: "CVE ID, Semgrep rule, or checklist item"
      placeholder: "CVE-2024-1234 / semgrep.python.sql-injection / SEC-CTR-02"
    validations:
      required: true

  - type: textarea
    id: justification
    attributes:
      label: Business Justification
      description: "Why can't this be fixed within the standard SLA?"
    validations:
      required: true

  - type: textarea
    id: compensating
    attributes:
      label: Compensating Controls
      description: "What mitigations are in place to reduce risk?"
    validations:
      required: true

  - type: input
    id: remediation-date
    attributes:
      label: Remediation Target Date
      placeholder: "YYYY-MM-DD (max 90 days from today)"
    validations:
      required: true

  - type: input
    id: monitoring
    attributes:
      label: Monitoring Plan
      description: "How will you detect if this vulnerability is exploited?"
    validations:
      required: true
```

---

## Task 4: Security Champions Program

```markdown
# security-champions-charter.md

## Mission
Embed security expertise in every development team by training and empowering
volunteer Security Champions who serve as the bridge between their team and the
security engineering team.

## Program Structure

### Roles

**Security Champion** (1 per team, 15 total):
- 20% time allocation (1 day/week) approved by their manager
- First point of contact for security questions on their team
- Triages security findings in their team's pipelines
- Reviews security-sensitive PRs (auth changes, crypto, data handling)
- Attends monthly Champions meetup
- Participates in quarterly CTF

**Security Champion Lead** (1 total):
- Senior champion who mentors new champions
- Runs the monthly meetup
- Maintains the Champions knowledge base
- Reports program metrics to CISO

**Security Engineering Team** (sponsors):
- Provides training curriculum
- Available for escalation on complex issues
- Runs quarterly training workshops
- Maintains tooling and policies

### Selection Criteria
- [ ] Volunteer (not assigned — intrinsic motivation matters)
- [ ] At least 1 year at the company (knows the codebase and culture)
- [ ] Manager approval for 20% time commitment
- [ ] Completed OWASP Top 10 training
- [ ] Passed internal security fundamentals quiz (80%+ score)

### Onboarding (4-Week Bootcamp)

| Week | Topic | Lab Work | Deliverable |
|---|---|---|---|
| 1 | OWASP Top 10, Attacker Mindset | Lab 1.1 (Juice Shop), Lab 1.2 (Threat Modeling) | Threat model of own team's service |
| 2 | SAST, SCA, Secret Scanning | Lab 2.1, 2.2, 2.3 | Run scans on own team's repos; triage top 5 findings |
| 3 | Container & IaC Security | Lab 2.4, 2.5 | Harden own team's Dockerfile; fix Checkov findings |
| 4 | Runtime Security & IR | Lab 3.4, 4.1 | Write incident response runbook for own service |

### Ongoing Activities

| Cadence | Activity | Description |
|---|---|---|
| Weekly | Office hours (30 min) | Champions available in #security-champions Slack |
| Monthly | Champions meetup (1 hour) | Present findings, share learnings, discuss new threats |
| Quarterly | CTF competition (half day) | Gamified security challenges; prizes for top 3 |
| Quarterly | Training workshop (half day) | Deep dive on a security topic (e.g., supply chain, K8s security) |
| Annually | Security summit (full day) | Keynotes, workshops, awards ceremony |

### Incentives & Career Growth

| Incentive | Details |
|---|---|
| Conference budget | $2,000/year for security conferences (BSides, OWASP, KubeCon) |
| Certification support | Company pays for CSSLP, CEH, CKS, or similar certification |
| Recognition | "Security Champion of the Quarter" announced in all-hands |
| Career path | Security Champion → Senior Champion → Security Engineer (defined promotion path) |
| Swag | Champion hoodie, laptop sticker, Slack emoji |

### Program KPIs

| Metric | Target | Measured |
|---|---|---|
| Active champions (attended meetup this month) | > 80% of enrolled | Monthly |
| MTTR for champion-team vs non-champion-team | Champion teams 50% faster | Quarterly |
| Security findings triaged within 48h | > 90% | Weekly |
| Champion satisfaction (NPS survey) | > 7/10 | Quarterly |
| Teams with a champion | 100% of teams > 5 people | Quarterly |
```

---

## Task 5: Reusable Security Pipeline

```yaml
# .github/workflows/security-gate.yml
name: Security Gate (Reusable)

on:
  workflow_call:
    inputs:
      fail-on-critical:
        type: boolean
        default: true
      fail-on-secrets:
        type: boolean
        default: true  # NEVER set to false
      generate-sbom:
        type: boolean
        default: true
      language:
        type: string
        default: 'auto'
    outputs:
      compliance-badge:
        description: "green, yellow, or red"
        value: ${{ jobs.security-gate.outputs.badge }}

permissions:
  contents: read
  security-events: write

jobs:
  security-gate:
    name: "🔒 Security Gate"
    runs-on: ubuntu-latest
    outputs:
      badge: ${{ steps.badge.outputs.color }}

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for Gitleaks

      # ── Secret Scanning (HARD GATE) ──
      - name: "🔑 Secret Scan (Gitleaks)"
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        continue-on-error: false  # NEVER allow secrets

      # ── SAST ──
      - name: "🔍 SAST (Semgrep)"
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/default
            p/owasp-top-ten
            p/security-audit
          generateSarif: true

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: semgrep.sarif

      # ── Container Scan ──
      - name: "🐳 Container Scan (Trivy)"
        if: hashFiles('Dockerfile') != ''
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'CRITICAL,HIGH'
          exit-code: ${{ inputs.fail-on-critical && '1' || '0' }}
          format: 'table'

      # ── SBOM Generation ──
      - name: "📦 Generate SBOM"
        if: inputs.generate-sbom
        uses: anchore/sbom-action@v0
        with:
          format: cyclonedx-json
          output-file: sbom.cyclonedx.json

      - name: Upload SBOM
        if: inputs.generate-sbom
        uses: actions/upload-artifact@v4
        with:
          name: sbom
          path: sbom.cyclonedx.json

      # ── Compliance Badge ──
      - name: Calculate Badge
        id: badge
        if: always()
        run: |
          if [ "${{ job.status }}" = "success" ]; then
            echo "color=green" >> $GITHUB_OUTPUT
            echo "🟢 All security checks passed"
          else
            echo "color=red" >> $GITHUB_OUTPUT
            echo "🔴 Security checks failed — review required"
          fi
```

**Teams adopt it by adding to their pipeline**:
```yaml
# In each team's .github/workflows/ci.yml
jobs:
  security:
    uses: org/security-pipelines/.github/workflows/security-gate.yml@main
    with:
      fail-on-critical: true
      generate-sbom: true
```

---

## ✅ Answers to Reflection Questions

### 1. DSOMM vs BSIMM vs SAMM

| Model | Creator | Approach | Best For |
|---|---|---|---|
| **DSOMM** | OWASP | Prescriptive — tells you WHAT to implement | Teams starting DevSecOps; clear action items |
| **BSIMM** | Synopsys | Descriptive — measures what you DO vs industry peers | Mature orgs wanting benchmarking data |
| **SAMM** | OWASP | Balanced — assessment + improvement roadmap | Organizations wanting a structured maturity program |

**Use DSOMM** when you're building a DevSecOps program from scratch (it's a checklist).
**Use SAMM** when you want a formal improvement program with governance.
**Use BSIMM** when you want to benchmark against 100+ other organizations.

### 2. "Security Slows Us Down" — Data-Driven Response

Show metrics that prove the opposite:

1. **Pre-commit hooks add 2 seconds to commit. Fixing a secret leak in production costs 5 days.** ROI: 2 seconds vs 40 hours.
2. **Teams with security gates deploy MORE frequently** — they catch issues early, so fewer rollbacks and hotfixes.
3. **MTTR data**: Teams using SAST fix vulnerabilities in hours (during development). Teams without SAST fix them in weeks (after pen test or incident).
4. **Incident data**: "We had 0 security incidents this quarter. Last year same quarter: 3 incidents costing $X in engineering time."

### 3. Fixing Low Champion Participation

1. **Talk to the 10 inactive champions** — ask why. Common reasons:
   - Manager didn't actually allocate 20% time → Fix: get written commitment from VP Engineering
   - Don't feel skilled enough → Fix: pair with active champion (buddy system)
   - Don't see the value → Fix: show how their work prevented incidents
2. **Make it easy**: Pre-triage findings and assign to champions (don't make them hunt)
3. **Make it visible**: Leaderboard (gamification), shout-outs in all-hands
4. **Make it consequential**: Champions who don't participate for 2 months → have an honest conversation, offer to step down gracefully

### 4. "Block All Deployments with Any Vulnerability"

This is a **terrible idea** because:
- **Alert fatigue**: Developers will find workarounds (suppress findings, skip scanning)
- **False positives**: Every scanner has false positives — you'll block legitimate deployments
- **Not all vulns are equal**: A low-severity info disclosure in an internal tool ≠ a critical RCE in a public API
- **Business impact**: Blocking a revenue-critical deployment because of a low-severity CVE in a test dependency is disproportionate
- **Unfixable vulns**: Some CVEs have no fix available — you'd block forever

**Better approach**: Gate on **critical + high with fix available**. Advisory on medium/low. Exception process for edge cases.

### 5. Shift-Left vs Expert Security

It's not either/or — it's a **layered model**:

| Layer | Who | What |
|---|---|---|
| **Developer** | All developers | Pre-commit hooks, SAST/SCA in IDE, secure coding training |
| **Security Champion** | 1 per team | Triage findings, review security PRs, threat model |
| **Security Engineer** | Central team | Complex vuln analysis, pen testing, incident response, tooling |
| **External Expert** | Consultants | Annual pen test, red team exercise, architecture review |

Shift-left handles the **80% of common issues** (SQLi, XSS, outdated deps). Expert security handles the **20% that requires deep expertise** (business logic flaws, architecture-level issues, novel attack vectors).

