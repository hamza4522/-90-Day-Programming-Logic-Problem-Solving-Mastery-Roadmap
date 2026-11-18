# Lab 6.1 — End-to-End Secure CI/CD Pipeline Integration (Capstone)
**Phase**: 6 — Capstone & Enterprise Architect  
**Difficulty**: ⭐⭐⭐⭐⭐ Expert  
**Estimated Time**: 6–8 hours  
**Category**: Pipeline Security, SLSA Level 3, Attestations, Admission Control, DevSecOps Orchestration

---

## 🎯 Objective

Synthesize everything learned across Phases 1 through 5 into a unified, enterprise-grade, **End-to-End Secure CI/CD Pipeline**. Implement automated gates from IDE commit through artifact signing, provenance generation, vulnerability policy enforcement, and runtime admission control adhering to [SLSA (Supply-chain Levels for Software Artifacts) Level 3](https://slsa.dev/).

---

## 📋 Problem Statement

Your enterprise operates across distributed development teams shipping multi-tier microservices into Kubernetes. Previous initiatives introduced individual security tools, but they exist as isolated "point solutions":
- Static checks run only on developer machines or ad-hoc PR triggers.
- Container images get built and pushed without cryptographically verifiable provenance.
- Developers bypass scanners using environment variables or untracked skip flags.
- Kubernetes clusters accept any container image as long as the registry URL matches, allowing unvetted or vulnerable images into production.

The CISO and Chief Software Architect have mandated:
1. **Zero Unsigned Deployments**: Only artifacts built by authorized GitHub Actions runners, signed via [Sigstore Cosign](https://docs.sigstore.dev/), and bearing verified [SLSA provenance](https://slsa.dev/spec/v1.0/provenance) can be scheduled in the production cluster.
2. **Automated Multi-Stage Gates**: Every PR and merge must run pre-commit verification, SAST ([Semgrep](https://semgrep.dev/)), Secret Scanning ([Gitleaks](https://github.com/gitleaks/gitleaks)), Dependency SCA ([Trivy](https://aquasecurity.github.io/trivy/)), SBOM generation ([Syft](https://github.com/anchore/syft)), and Image Scanning ([Grype](https://github.com/anchore/grype)).
3. **Admission Enforcement**: Kubernetes Admission Controllers ([Kyverno](https://kyverno.io/) or [OPA Gatekeeper](https://open-policy-agent.github.io/gatekeeper/website/docs/)) must cryptographically block non-compliant images before pods are created.

Your mission: Build and prove this complete end-to-end secure software delivery lifecycle.

---

## 🛠️ Prerequisites

- Git and GitHub CLI (`gh`)
- Docker & Docker Buildx
- Kubernetes cluster (Kind, Minikube, or cloud provider like GKE/EKS)
- [Cosign CLI](https://docs.sigstore.dev/system_config/installation/)
- [Syft](https://github.com/anchore/syft) & [Grype](https://github.com/anchore/grype)
- [Kyverno CLI](https://kyverno.io/docs/kyverno-cli/) or Helm to install Kyverno in-cluster
- Familiarity with earlier labs:
  - [Lab 2.1 — Secrets Detection](../phase-2/lab-2.1-secrets-detection/problem.md)
  - [Lab 2.2 — SAST with Semgrep](../phase-2/lab-2.2-sast-semgrep-sonarqube/problem.md)
  - [Lab 3.1 — Cosign & Supply Chain](../phase-3/lab-3.1-cosign-supply-chain/problem.md)
  - [Lab 3.2 — Policy as Code with OPA](../phase-3/lab-3.2-policy-as-code-opa/problem.md)
  - [Lab 4.2 — SBOM Generation with Syft](../phase-4/lab-4.2-sbom-generation-syft/problem.md)

---

## 📋 Tasks

### Task 1: Pipeline Architecture & Security Gate Matrix

Map out the pipeline stages and exact pass/fail criteria in a matrix:

```
[Developer Workspace]
    │  (Pre-commit hook: Gitleaks + Lint)
    ▼
[Git Push / Pull Request]
    │  Phase A: Static Analysis (Gitleaks, Semgrep SAST)
    │  Phase B: Dependency Scanning (Trivy SCA)
    │  Phase C: IaC Validation (Checkov)
    ▼
[Merge to Main]
    │  Phase D: Container Build (Multi-stage, Non-root distroless)
    │  Phase E: SBOM Generation (Syft CycloneDX)
    │  Phase F: Vulnerability Scan against SBOM (Grype - fail on Critical/High with fix)
    │  Phase G: Cryptographic Signing & Attestation (Cosign keyless via OIDC)
    │  Phase H: SLSA Provenance Generation (slsa-github-generator)
    ▼
[Container Registry (GHCR)]
    │  Signed Image + Attested SBOM + SLSA In-Toto Predicate
    ▼
[Kubernetes Production Cluster]
    │  Kyverno / Gatekeeper Admission Controller
    │  - Verifies Cosign signature against GitHub OIDC Identity
    │  - Verifies SBOM presence
    │  - Verifies SLSA provenance
    ▼
[Runtime Pod Scheduling]
```

Document your criteria in `pipeline-spec.md` with blocking thresholds.

### Task 2: Build the Golden Pipeline Workflow

Create a comprehensive GitHub Actions workflow `.github/workflows/golden-pipeline.yml`:
1. Use least-privilege GitHub `permissions:` block (`contents: read`, `id-token: write`, `packages: write`).
2. Run parallel scan jobs for SAST, Secrets, and SCA on pull requests.
3. On merge to `main`:
   - Build image with metadata tags and immutability digests.
   - Generate CycloneDX JSON SBOM with Syft.
   - Attest SBOM to the image using Cosign.
   - Generate SLSA v1.0 provenance attestation using the [SLSA GitHub Generator](https://github.com/slsa-framework/slsa-github-generator).

### Task 3: Deploy Kyverno Admission Controller

Install Kyverno into your Kubernetes cluster and configure an image verification policy:

```bash
# Install Kyverno via Helm
helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo update
helm install kyverno kyverno/kyverno -n kyverno --create-namespace
```

Write a `ClusterPolicy` that:
1. Rejects any pod in `production` whose image is not signed by your GitHub repository workflow identity.
2. Verifies that an attested CycloneDX SBOM is present on the image digest.
3. Enforces read-only root filesystems and non-root users at admission time.

### Task 4: Attack and Validation Testing

Conduct three verification tests:
1. **Happy Path**: Commit clean application code, watch pipeline build, scan, sign, attest, and deploy successfully to Kubernetes.
2. **Untrusted Image Injection**: Attempt to manually deploy an unsigned image (`docker.io/library/nginx:latest` or an image built locally without Cosign signing) into the `production` namespace. Verify Kyverno blocks it with an informative audit event.
3. **Compromised Dependency PR**: Submit a pull request introducing a dependency with a known Critical CVE (e.g. `lodash: 4.17.19`). Verify the PR pipeline blocks the merge before the code can ever be built into an image.

---

## 📝 Deliverables

1. `.github/workflows/golden-pipeline.yml` — End-to-end GitHub Actions workflow.
2. `k8s/kyverno-policy.yaml` — Kyverno admission control policy enforcing signature and attestation verification.
3. `k8s/production-deployment.yaml` — Immutable production deployment referencing image digests.
4. `pipeline-audit-report.md` — Test evidence showing pass/fail logs, blocked unsigned deployment attempts, and verification output.

---

## ❓ Questions to Answer

1. What specific supply chain threats does [SLSA Level 3](https://slsa.dev/spec/v1.0/levels) mitigate that container image signing alone does not?
2. Why must container image verification in Kubernetes admission controllers always be performed by **digest** (`sha256:...`) rather than mutable **tags** (`latest`, `v1.0.0`)?
3. How does keyless signing with [Sigstore Fulcio](https://docs.sigstore.dev/certificate_authority/overview/) and [Rekor](https://docs.sigstore.dev/rekor/overview/) eliminate the risk of compromised long-lived private signing keys?
4. If an in-cluster admission controller is down or in a crash-loop, what is the failure mode (`fail-open` vs `fail-closed`) and how should an enterprise configure it?

---

## 🔗 Useful Links & References

- [SLSA Specification v1.0](https://slsa.dev/spec/v1.0/)
- [Sigstore Documentation](https://docs.sigstore.dev/)
- [Cosign CLI Reference](https://docs.sigstore.dev/cosign/overview/)
- [Kyverno Policy Documentation](https://kyverno.io/docs/writing-policies/verify-images/)
- [OpenSSF Best Practices](https://bestpractices.coreinfrastructure.org/)
- [NIST SP 800-218: Secure Software Development Framework (SSDF)](https://csrc.nist.gov/pubs/sp/800/218/final)

