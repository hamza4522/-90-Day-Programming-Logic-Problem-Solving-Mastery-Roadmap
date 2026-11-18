# Lab 4.4 — Security Governance & Maturity Assessment
**Phase**: 4 — Pro / Leadership  
**Difficulty**: ⭐⭐⭐⭐ Expert  
**Estimated Time**: 4–5 hours  
**Category**: Security Governance, OWASP DSOMM, Maturity Models, Security Champions

---

## 🎯 Objective

Assess your organization's DevSecOps maturity using the **OWASP DevSecOps Maturity Model (DSOMM)** and build a governance framework — policies, exception processes, and a Security Champions program — that scales security beyond the security team.

---

## 📋 Problem Statement

Your company has 15 development teams, 80+ microservices, and 3 security engineers. The security team is the bottleneck:
- Developers wait 2 weeks for security reviews
- Security engineers do manual pen tests because there's no automated tooling in most pipelines
- Some teams have excellent security practices; others have never run a vulnerability scan
- There's no standard policy for "what must every service do before going to production?"
- When a team asks "are we secure enough to ship?" nobody has a framework to answer

Your task: Build the governance layer — maturity assessment, security policies, exception handling, and a Security Champions program — that lets the security team scale from 3 people to the entire engineering org.

---

## 🛠️ Prerequisites

- Understanding of DevSecOps tools from Phases 1–3
- Read the [OWASP DSOMM](https://dsomm.owasp.org/) overview
- Access to your organization's CI/CD pipeline configurations (or use the lab samples)

---

## 📋 Tasks

### Task 1: Self-Assessment with OWASP DSOMM

Use the OWASP DevSecOps Maturity Model to assess your (real or fictional) organization:

1. Visit the [DSOMM](https://dsomm.owasp.org/) interactive model
2. For each of the 5 dimensions, rate your organization at Level 1–4:

| Dimension | Level 1 (Initial) | Level 2 (Managed) | Level 3 (Defined) | Level 4 (Measured) |
|---|---|---|---|---|
| **Build & Deployment** | Manual builds | CI exists, no security gates | Security gates in CI | Metrics tracked, SLA enforced |
| **Culture & Organization** | No security awareness | Ad-hoc training | Security Champions exist | Champions program with KPIs |
| **Information Gathering** | No scanning | Occasional manual scans | Automated scanning in CI | Continuous scanning + triage |
| **Implementation** | No secure defaults | Some hardening guides | Secure-by-default templates | Automated policy enforcement |
| **Test & Verification** | No security testing | SAST only | SAST + DAST + SCA | Full pipeline + pen test + chaos |

3. Create a `maturity-assessment.md` with:
   - Current level for each dimension (with evidence)
   - Target level (realistic 6-month goal)
   - Gap analysis: what's missing?
   - Prioritized roadmap: what to implement first?

### Task 2: Production Readiness Security Checklist

Create a `production-security-checklist.yml` that defines the **minimum security requirements** before any service can go to production:

```yaml
# Categories to cover:
# 1. Code Security — SAST scan, no critical/high findings
# 2. Dependencies — SCA scan, no critical CVEs with available fixes
# 3. Container — Image scan, non-root, minimal base image
# 4. Infrastructure — IaC scan, no misconfigured security groups
# 5. Secrets — No hardcoded secrets, Vault integration
# 6. Authentication — OAuth2/OIDC, no custom auth
# 7. Logging — Security events logged, shipped to SIEM
# 8. SBOM — CycloneDX SBOM generated and stored
# 9. Network — Network policies defined, principle of least privilege
# 10. Incident Response — Runbook exists, on-call configured
```

Define each check as either **REQUIRED** (blocking) or **RECOMMENDED** (advisory).

### Task 3: Security Exception Process

Create `exception-process.md` defining:

1. **What qualifies for an exception?** — accepted risk, timeline extension, compensating control
2. **Who can approve?** — Risk levels mapped to approval authority:
   - Low risk → Team lead
   - Medium risk → Engineering manager + Security engineer
   - High risk → CISO / VP Engineering
   - Critical risk → No exceptions (must fix)
3. **What's required in an exception request?**
   - Business justification
   - Risk assessment (impact × likelihood)
   - Compensating controls in place
   - Remediation timeline (max 90 days)
   - Monitoring plan
4. **Automated tracking**: Create a GitHub issue template for security exceptions with auto-labels, auto-assignment, and expiry reminders

### Task 4: Security Champions Program

Design and document a Security Champions program:

1. **Charter document** (`security-champions-charter.md`):
   - Mission: "Embed security expertise in every development team"
   - Responsibilities: triage findings, review security configs, evangelize best practices
   - Time commitment: 20% of sprint capacity (1 day/week)
   - Selection criteria: volunteer, at least 1 year in the company, completed security training
   - Incentives: conference budget, recognition, career path to Security Engineer

2. **Onboarding curriculum** — a 4-week training plan:
   - Week 1: OWASP Top 10 + labs 1.1–1.2
   - Week 2: SAST/SCA + labs 2.2–2.3
   - Week 3: Container/IaC security + labs 2.4–2.5
   - Week 4: Runtime security + incident response + labs 3.4, 4.1

3. **Ongoing activities**: Monthly security office hours, quarterly CTF, annual security summit

### Task 5: Policy-as-Code Enforcement

Convert your production readiness checklist (Task 2) into automated policy enforcement:

1. Create a **GitHub Actions reusable workflow** that teams include in their pipelines:
   ```yaml
   # .github/workflows/security-gate.yml
   # Reusable workflow that enforces:
   # - Semgrep SAST (no critical findings)
   # - Trivy container scan (no critical/high CVEs)
   # - Gitleaks secret scan (zero findings = hard fail)
   # - SBOM generation (CycloneDX attached to release)
   # - Security checklist annotation in PR
   ```

2. Create an **OPA/Conftest policy** that validates Kubernetes manifests meet security requirements before deployment

3. Create a **compliance badge** system:
   - 🟢 Green: All checks pass
   - 🟡 Yellow: Advisory findings only
   - 🔴 Red: Blocking findings, cannot deploy

### Task 6: Maturity Roadmap & Executive Report

Create an executive-facing report (`executive-report.md`) that includes:

1. **Current state**: Maturity radar chart (dimensions as axes)
2. **6-month roadmap**: Gantt-style timeline of improvements
3. **Resource ask**: What the security team needs (people, tools, budget)
4. **ROI justification**: Cost of a breach vs cost of the program
5. **Benchmarking**: How you compare to industry peers (BSIMM data)

---

## 📝 Deliverables

1. `maturity-assessment.md` — DSOMM self-assessment with gap analysis
2. `production-security-checklist.yml` — machine-readable security requirements
3. `exception-process.md` — security exception handling procedure
4. `security-champions-charter.md` — Champions program design
5. `.github/workflows/security-gate.yml` — reusable security pipeline
6. `executive-report.md` — CISO-ready maturity report

---

## ❓ Questions to Answer

1. What is the difference between **OWASP DSOMM**, **BSIMM**, and **SAMM**? Which would you use and when?
2. A team says "security slows us down." How do you respond with data? What metrics prove that DevSecOps ACCELERATES delivery?
3. Your Security Champions program has 15 champions but only 5 are actively participating. How do you fix this?
4. A VP says "just make everything a hard gate — block all deployments with any vulnerability." Why is this a bad idea?
5. How do you handle the tension between "shift-left" (developers own security) and "you need trained security experts for complex issues"?

---

> 💡 **Scaling formula**: 1 security engineer per 10 developers is unsustainable. 1 security champion per team + automated tooling + clear policies = security scales with engineering.

> 📋 **Industry benchmark**: The average BSIMM participant has 1 security person per 75 developers. The top performers have 1:100+ — because they've automated and distributed security responsibility.

---

## 🔗 Useful Links & References

- [OWASP DevSecOps Maturity Model (DSOMM)](https://dsomm.owasp.org/)
- [OWASP Software Assurance Maturity Model (SAMM)](https://owaspsamm.org/)
- [Building Security In Maturity Model (BSIMM)](https://www.bsimm.com/)
- [OWASP Security Champions Playbook](https://owasp.org/www-project-security-champions-playbook/)
- [OpenSSF Best Practices Badge Program](https://bestpractices.coreinfrastructure.org/)
- [NIST Secure Software Development Framework (SSDF) SP 800-218](https://csrc.nist.gov/pubs/sp/800/218/final)


