# 🛡️ DevSecOps Labs — Master Index
**From DevOps to DevSecOps: Complete Hands-On Roadmap (Beginner to Enterprise Architect)**

Welcome to the comprehensive DevSecOps hands-on curriculum. This program covers the complete software delivery lifecycle across **6 progressive phases**: code security, pipeline security, supply chain attestation, cloud posture, automated incident response, chaos engineering, and zero-trust workload identity.

---

## 📁 Full Curriculum Structure

```
devsecops-labs/
├── README.md                                             ← You are here
│
├── phase-1/   Security Foundation
│   ├── lab-1.1-juice-shop/                              ← Vulnerability discovery & web app security
│   │   ├── problem.md
│   │   └── solution.md
│   └── lab-1.2-threat-modeling/                         ← STRIDE threat modeling & DFDs
│       ├── problem.md
│       └── solution.md
│
├── phase-2/   CI/CD Security (Core Shift-Left)
│   ├── lab-2.1-secrets-detection/                       ← Gitleaks, detect-secrets, pre-commit gates
│   │   ├── problem.md
│   │   └── solution.md
│   ├── lab-2.2-sast-semgrep-sonarqube/                  ← Semgrep rules & SAST in CI/CD
│   │   ├── problem.md
│   │   └── solution.md
│   ├── lab-2.3-sca-trivy-snyk/                          ← Software Composition Analysis & CVE triage
│   │   ├── problem.md
│   │   └── solution.md
│   ├── lab-2.4-container-security/                      ← Hadolint, distroless, non-root Dockerfiles
│   │   ├── problem.md
│   │   └── solution.md
│   ├── lab-2.5-iac-scanning-checkov/                    ← Checkov, tfsec, IaC misconfigurations
│   │   ├── problem.md
│   │   └── solution.md
│   └── lab-2.6-dast-owasp-zap/                          ← Dynamic Application Security Testing in CI
│       ├── problem.md
│       └── solution.md
│
├── phase-3/   Advanced DevSecOps
│   ├── lab-3.1-cosign-supply-chain/                     ← Sigstore Cosign, keyless OIDC signing
│   │   ├── problem.md
│   │   └── solution.md
│   ├── lab-3.2-policy-as-code-opa/                      ← Open Policy Agent, Conftest, Rego
│   │   ├── problem.md
│   │   └── solution.md
│   ├── lab-3.3-secrets-vault/                           ← HashiCorp Vault, dynamic DB creds, K8s auth
│   │   ├── problem.md
│   │   └── solution.md
│   └── lab-3.4-runtime-security-falco/                  ← Falco eBPF runtime detection & alerts
│       ├── problem.md
│       └── solution.md
│
├── phase-4/   Governance, Compliance & SBOM
│   ├── lab-4.1-compliance-as-code-inspec/               ← Chef InSpec, CIS benchmarks, SOC2 audits
│   │   ├── problem.md
│   │   └── solution.md
│   ├── lab-4.2-sbom-generation-syft/                    ← Syft, Grype, CycloneDX/SPDX, blast radius
│   │   ├── problem.md
│   │   └── solution.md
│   ├── lab-4.3-security-metrics-dashboard/              ← Prometheus, Grafana, MTTR, risk scoring
│   │   ├── problem.md
│   │   └── solution.md
│   └── lab-4.4-security-governance-maturity/            ← OWASP DSOMM, Security Champions, policy gates
│       ├── problem.md
│       └── solution.md
│
├── phase-5/   Incident Response, Cloud Security & Chaos
│   ├── lab-5.1-incident-response-automation/            ← SOAR playbooks, pod isolation, forensics
│   │   ├── problem.md
│   │   └── solution.md
│   ├── lab-5.2-cspm-prowler/                            ← Cloud security posture management, CIS AWS
│   │   ├── problem.md
│   │   └── solution.md
│   ├── lab-5.3-chaos-engineering-security/              ← Security Game Days, automated chaos tests
│   │   ├── problem.md
│   │   └── solution.md
│   └── lab-5.4-container-forensics/                     ← Live container memory, filesystem diffs, IOCs
│       ├── problem.md
│       └── solution.md
│
└── phase-6/   Capstone & Enterprise Architecture
    ├── lab-6.1-end-to-end-secure-pipeline/              ← SLSA Level 3, Kyverno admission control
    │   ├── problem.md
    │   └── solution.md
    └── lab-6.2-zero-trust-spiffe-spire/                 ← SPIFFE/SPIRE, workload attestation, mTLS
        ├── problem.md
        └── solution.md
```

---

## 📋 Master Lab Quick Reference

| Lab | Title / Topic | Primary Tools | Difficulty | Est. Time | Links |
|---|---|---|:---:|:---:|:---:|
| **1.1** | Web Application Attack Simulation | [OWASP Juice Shop](https://github.com/juice-shop/juice-shop) | ⭐ | 3–4h | [Problem](phase-1/lab-1.1-juice-shop/problem.md) \| [Solution](phase-1/lab-1.1-juice-shop/solution.md) |
| **1.2** | Threat Modeling with STRIDE | [OWASP Threat Dragon](https://threatdragon.com) | ⭐⭐ | 2–3h | [Problem](phase-1/lab-1.2-threat-modeling/problem.md) \| [Solution](phase-1/lab-1.2-threat-modeling/solution.md) |
| **2.1** | Secret Leak Prevention & Detection | [Gitleaks](https://github.com/gitleaks/gitleaks), pre-commit | ⭐⭐ | 2–3h | [Problem](phase-2/lab-2.1-secrets-detection/problem.md) \| [Solution](phase-2/lab-2.1-secrets-detection/solution.md) |
| **2.2** | Static Application Security Testing (SAST) | [Semgrep](https://semgrep.dev/), SonarQube | ⭐⭐ | 3–4h | [Problem](phase-2/lab-2.2-sast-semgrep-sonarqube/problem.md) \| [Solution](phase-2/lab-2.2-sast-semgrep-sonarqube/solution.md) |
| **2.3** | Software Composition Analysis (SCA) | [Trivy](https://aquasecurity.github.io/trivy/), Snyk | ⭐⭐ | 2–3h | [Problem](phase-2/lab-2.3-sca-trivy-snyk/problem.md) \| [Solution](phase-2/lab-2.3-sca-trivy-snyk/solution.md) |
| **2.4** | Container Image Hardening | [Hadolint](https://github.com/hadolint/hadolint), Distroless | ⭐⭐ | 3–4h | [Problem](phase-2/lab-2.4-container-security/problem.md) \| [Solution](phase-2/lab-2.4-container-security/solution.md) |
| **2.5** | Infrastructure as Code (IaC) Scanning | [Checkov](https://www.checkov.io/), tfsec | ⭐⭐ | 3–4h | [Problem](phase-2/lab-2.5-iac-scanning-checkov/problem.md) \| [Solution](phase-2/lab-2.5-iac-scanning-checkov/solution.md) |
| **2.6** | Dynamic Application Security Testing (DAST) | [OWASP ZAP](https://www.zaproxy.org/) | ⭐⭐⭐ | 3–4h | [Problem](phase-2/lab-2.6-dast-owasp-zap/problem.md) \| [Solution](phase-2/lab-2.6-dast-owasp-zap/solution.md) |
| **3.1** | Supply Chain Security & Artifact Signing | [Sigstore Cosign](https://docs.sigstore.dev/), Syft | ⭐⭐⭐ | 3–4h | [Problem](phase-3/lab-3.1-cosign-supply-chain/problem.md) \| [Solution](phase-3/lab-3.1-cosign-supply-chain/solution.md) |
| **3.2** | Policy as Code | [Open Policy Agent](https://www.openpolicyagent.org/), Conftest, Rego | ⭐⭐⭐ | 3–4h | [Problem](phase-3/lab-3.2-policy-as-code-opa/problem.md) \| [Solution](phase-3/lab-3.2-policy-as-code-opa/solution.md) |
| **3.3** | Centralized Secrets Management | [HashiCorp Vault](https://developer.hashicorp.com/vault) | ⭐⭐⭐ | 4–5h | [Problem](phase-3/lab-3.3-secrets-vault/problem.md) \| [Solution](phase-3/lab-3.3-secrets-vault/solution.md) |
| **3.4** | Kubernetes Runtime Threat Detection | [Falco](https://falco.org/), eBPF, Falcosidekick | ⭐⭐⭐ | 3–4h | [Problem](phase-3/lab-3.4-runtime-security-falco/problem.md) \| [Solution](phase-3/lab-3.4-runtime-security-falco/solution.md) |
| **4.1** | Continuous Compliance as Code | [Chef InSpec](https://docs.chef.io/inspec/), CIS Benchmarks | ⭐⭐⭐⭐ | 4–5h | [Problem](phase-4/lab-4.1-compliance-as-code-inspec/problem.md) \| [Solution](phase-4/lab-4.1-compliance-as-code-inspec/solution.md) |
| **4.2** | SBOM Generation & Vulnerability Triage | [Syft](https://github.com/anchore/syft), [Grype](https://github.com/anchore/grype), CycloneDX | ⭐⭐⭐ | 3–4h | [Problem](phase-4/lab-4.2-sbom-generation-syft/problem.md) \| [Solution](phase-4/lab-4.2-sbom-generation-syft/solution.md) |
| **4.3** | Security Metrics & Executive Dashboard | [Prometheus](https://prometheus.io/), [Grafana](https://grafana.com/) | ⭐⭐⭐ | 3–4h | [Problem](phase-4/lab-4.3-security-metrics-dashboard/problem.md) \| [Solution](phase-4/lab-4.3-security-metrics-dashboard/solution.md) |
| **4.4** | Security Governance & Maturity Models | [OWASP DSOMM](https://dsomm.owasp.org/), Security Champions | ⭐⭐⭐⭐ | 4–5h | [Problem](phase-4/lab-4.4-security-governance-maturity/problem.md) \| [Solution](phase-4/lab-4.4-security-governance-maturity/solution.md) |
| **5.1** | Incident Response & Quarantine Automation | Kubernetes NetworkPolicy, SOAR, Python | ⭐⭐⭐⭐ | 4–5h | [Problem](phase-5/lab-5.1-incident-response-automation/problem.md) \| [Solution](phase-5/lab-5.1-incident-response-automation/solution.md) |
| **5.2** | Cloud Security Posture Management (CSPM) | [Prowler](https://github.com/prowler-cloud/prowler), CIS AWS Benchmark | ⭐⭐⭐⭐ | 4–5h | [Problem](phase-5/lab-5.2-cspm-prowler/problem.md) \| [Solution](phase-5/lab-5.2-cspm-prowler/solution.md) |
| **5.3** | Chaos Engineering for Security | Game Days, Red/Blue Team, Resilience | ⭐⭐⭐⭐ | 4–5h | [Problem](phase-5/lab-5.3-chaos-engineering-security/problem.md) \| [Solution](phase-5/lab-5.3-chaos-engineering-security/solution.md) |
| **5.4** | Container Digital Forensics | Container diff, Memory, `crictl`, volatile state | ⭐⭐⭐⭐⭐ | 5–6h | [Problem](phase-5/lab-5.4-container-forensics/problem.md) \| [Solution](phase-5/lab-5.4-container-forensics/solution.md) |
| **6.1** | End-to-End Secure CI/CD Pipeline (Capstone) | [SLSA v1.0](https://slsa.dev/), [Kyverno](https://kyverno.io/), Cosign | ⭐⭐⭐⭐⭐ | 6–8h | [Problem](phase-6/lab-6.1-end-to-end-secure-pipeline/problem.md) \| [Solution](phase-6/lab-6.1-end-to-end-secure-pipeline/solution.md) |
| **6.2** | Zero-Trust Workload Identity & mTLS | [SPIFFE](https://spiffe.io/), [SPIRE](https://spiffe.io/docs/latest/spire-about/spire-concepts/), Envoy mTLS | ⭐⭐⭐⭐⭐ | 6–8h | [Problem](phase-6/lab-6.2-zero-trust-spiffe-spire/problem.md) \| [Solution](phase-6/lab-6.2-zero-trust-spiffe-spire/solution.md) |

---

## 🗓️ Recommended Study Schedule

### Stage 1: Security Foundations & Shift-Left (Weeks 1–4)
- [ ] **Week 1**: [Lab 1.1 — OWASP Juice Shop Attack Simulation](phase-1/lab-1.1-juice-shop/problem.md) & [Lab 1.2 — Threat Modeling with STRIDE](phase-1/lab-1.2-threat-modeling/problem.md)
- [ ] **Week 2**: [Lab 2.1 — Secret Detection with Gitleaks](phase-2/lab-2.1-secrets-detection/problem.md) & [Lab 2.2 — SAST with Semgrep](phase-2/lab-2.2-sast-semgrep-sonarqube/problem.md)
- [ ] **Week 3**: [Lab 2.3 — SCA Dependency Scanning](phase-2/lab-2.3-sca-trivy-snyk/problem.md) & [Lab 2.4 — Container Image Hardening](phase-2/lab-2.4-container-security/problem.md)
- [ ] **Week 4**: [Lab 2.5 — IaC Security with Checkov](phase-2/lab-2.5-iac-scanning-checkov/problem.md) & [Lab 2.6 — DAST with OWASP ZAP](phase-2/lab-2.6-dast-owasp-zap/problem.md)

### Stage 2: Supply Chain, Policy & Runtime Security (Weeks 5–8)
- [ ] **Week 5**: [Lab 3.1 — Artifact Signing with Cosign](phase-3/lab-3.1-cosign-supply-chain/problem.md) & [Lab 3.2 — Policy as Code with OPA](phase-3/lab-3.2-policy-as-code-opa/problem.md)
- [ ] **Week 6**: [Lab 3.3 — Secrets Management with HashiCorp Vault](phase-3/lab-3.3-secrets-vault/problem.md)
- [ ] **Week 7**: [Lab 3.4 — Runtime Threat Detection with Falco](phase-3/lab-3.4-runtime-security-falco/problem.md)
- [ ] **Week 8**: [Lab 4.1 — Continuous Compliance as Code with InSpec](phase-4/lab-4.1-compliance-as-code-inspec/problem.md)

### Stage 3: Governance, SBOM & Posture Management (Weeks 9–12)
- [ ] **Week 9**: [Lab 4.2 — SBOM Generation with Syft & Grype](phase-4/lab-4.2-sbom-generation-syft/problem.md)
- [ ] **Week 10**: [Lab 4.3 — DevSecOps Metrics & Prometheus/Grafana Dashboards](phase-4/lab-4.3-security-metrics-dashboard/problem.md)
- [ ] **Week 11**: [Lab 4.4 — Security Governance, DSOMM & Champions Program](phase-4/lab-4.4-security-governance-maturity/problem.md)
- [ ] **Week 12**: [Lab 5.2 — Cloud Security Posture Management with Prowler](phase-5/lab-5.2-cspm-prowler/problem.md)

### Stage 4: Incident Response, Forensics & Resilience (Weeks 13–15)
- [ ] **Week 13**: [Lab 5.1 — Automated Incident Response & Pod Quarantine](phase-5/lab-5.1-incident-response-automation/problem.md)
- [ ] **Week 14**: [Lab 5.3 — Security Chaos Engineering & Game Days](phase-5/lab-5.3-chaos-engineering-security/problem.md)
- [ ] **Week 15**: [Lab 5.4 — Container Forensics, Memory Analysis & Evidence Chains](phase-5/lab-5.4-container-forensics/problem.md)

### Stage 5: Capstone & Zero-Trust Architecture (Weeks 16–18+)
- [ ] **Week 16–17**: [Lab 6.1 — Capstone: End-to-End SLSA L3 Pipeline with Kyverno](phase-6/lab-6.1-end-to-end-secure-pipeline/problem.md)
- [ ] **Week 18+**: [Lab 6.2 — Zero-Trust Workload Identity with SPIFFE/SPIRE](phase-6/lab-6.2-zero-trust-spiffe-spire/problem.md)

---

## 🔧 Tool Installation & Setup Quick Reference

```bash
# ─── Secrets & Static Analysis ───
brew install gitleaks                          # macOS
choco install gitleaks                         # Windows
pip install semgrep                            # SAST tool
pip install checkov                            # IaC Scanner (Terraform/K8s/CloudFormation)

# ─── Container & Dependency Scanning ───
brew install hadolint                          # Dockerfile linter
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin

# ─── Supply Chain & Policy Enforcement ───
brew install cosign                            # Sigstore signing tool
brew install conftest                          # OPA testing on config files
brew install kyverno                           # Kyverno CLI for policy testing

# ─── Cloud & Compliance ───
pip install prowler                            # AWS/GCP/Azure CSPM
curl https://omnitruck.chef.io/install.sh | sudo bash -s -- -P inspec

# ─── Dynamic Testing & Secret Infrastructure (Docker Quickstarts) ───
docker pull ghcr.io/zaproxy/zaproxy:stable    # OWASP ZAP DAST
docker run -d -p 8200:8200 -e VAULT_DEV_ROOT_TOKEN_ID=root hashicorp/vault
```

---

## 📚 Essential Standards, Frameworks & References

| Topic / Category | Standard / Guide | Official Resource |
|---|---|---|
| **Software Supply Chain** | SLSA Framework | [SLSA Specification v1.0](https://slsa.dev/spec/v1.0/) |
| **Artifact Signing** | Sigstore Documentation | [Sigstore Project Docs](https://docs.sigstore.dev/) |
| **SBOM Formats** | CycloneDX & SPDX Standards | [CycloneDX](https://cyclonedx.org/) \| [SPDX](https://spdx.dev/) |
| **Federal Compliance** | NIST SSDF SP 800-218 | [NIST SSDF Overview](https://csrc.nist.gov/pubs/sp/800/218/final) |
| **Zero Trust Architecture** | NIST SP 800-207 | [NIST Zero Trust Guidelines](https://csrc.nist.gov/pubs/sp/800/207/final) |
| **Workload Identity** | SPIFFE & SPIRE Standards | [SPIFFE.io](https://spiffe.io/) \| [SPIRE Concepts](https://spiffe.io/docs/latest/spire-about/spire-concepts/) |
| **Incident Response** | NIST SP 800-61 Rev 2 | [Computer Incident Handling](https://csrc.nist.gov/pubs/sp/800/61/r2/final) |
| **Digital Forensics** | RFC 3227 & NIST SP 800-86 | [RFC 3227 Evidence Guidelines](https://www.rfc-editor.org/rfc/rfc3227) |
| **Maturity Models** | OWASP DSOMM & SAMM | [OWASP DSOMM](https://dsomm.owasp.org/) \| [OWASP SAMM](https://owaspsamm.org/) |
| **Cloud Benchmarks** | CIS Benchmarks | [CIS Security Benchmarks](https://www.cisecurity.org/cis-benchmarks) |
| **Kubernetes Security** | Kyverno & Falco | [Kyverno Policies](https://kyverno.io/) \| [Falco Security](https://falco.org/) |

---

## 💡 How to Maximize Your Learning

1. **Read `problem.md` first**: Understand the scenario, architectural failure modes, and security objectives before viewing solutions.
2. **Attempt the tasks independently**: Write rules, configurations, and scripts yourself before consulting `solution.md`.
3. **Inspect the verification output**: Security is only as good as what is proven; execute the verification and attack simulation steps for each lab.
4. **Follow the linked documentation**: DevSecOps is a rapidly evolving discipline. Use the curated links to read primary RFCs, standards, and vendor docs.
5. **Apply to real projects**: Immediately operationalize at least one technique (e.g., pre-commit hooks, CycloneDX SBOMs, or Kyverno admission policies) into your active engineering codebases.
