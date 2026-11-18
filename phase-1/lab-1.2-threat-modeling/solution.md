# Lab 1.2 — Threat Modeling a CI/CD Pipeline: Solution Guide
**Phase**: 1 — Security Foundation  
**Difficulty**: ⭐⭐ Beginner–Intermediate

---

## Task 1: Data Flow Diagram (DFD)

```
[External Entity] Developer Laptop
        │
        │ git push (HTTPS/SSH) ──── Trust Boundary 1 ────
        ▼
[Data Store] GitHub Repository
        │
        │ webhook + GITHUB_TOKEN
        ▼
[Process] GitHub Actions Runner        ◄── [External] npm Registry
        │ (Ephemeral, shared infra)         (Untrusted external)
        │
        ├── [Process] npm install
        ├── [Process] docker build
        │
        │ docker push (DOCKER_TOKEN) ─── Trust Boundary 2 ────
        ▼
[Data Store] DockerHub Registry
        │
        │ image pull + kubectl apply ─── Trust Boundary 3 ────
        ▼
[Process] AWS EKS Cluster (Production)
        │
        └── [Data Store] AWS Resources (RDS, S3, etc.)
```

**Trust Boundaries**:
- TB1: Internet ↔ GitHub (authentication via SSH key / PAT)
- TB2: CI Runner ↔ External Registries (credentials stored as secrets)
- TB3: CI Runner ↔ AWS (KUBECONFIG / IAM role)

---

## Task 2: STRIDE Threat Table

### Component: GitHub Repository

| STRIDE | Threat | Example Attack |
|---|---|---|
| **S** Spoofing | Attacker pushes code as legitimate developer | Compromised developer PAT used to push malicious code |
| **T** Tampering | Attacker modifies pipeline YAML file | PR with modified `.github/workflows/` to exfiltrate secrets |
| **R** Repudiation | No audit trail of who approved a PR | Forced push to main branch with no review |
| **I** Info Disclosure | Hardcoded secret in source code | `AWS_SECRET_KEY=xxx` committed accidentally |
| **D** DoS | Flooding repository with large PRs | API abuse to exhaust GitHub Actions minutes |
| **E** Elevation | Attacker gains write access via misconfigured branch protection | Direct push to main without review |

### Component: GitHub Actions Secrets

| STRIDE | Threat | Example Attack |
|---|---|---|
| **S** Spoofing | Workflow from fork accesses parent secrets | Fork-based PR triggers workflow with secret access |
| **T** Tampering | Secrets overwritten by malicious workflow | Workflow modifies environment to intercept secrets |
| **I** Info Disclosure | Secret printed in build logs | `echo $DOCKER_PASSWORD` in debug step |
| **E** Elevation | Workflow gets elevated permissions via GITHUB_TOKEN | `permissions: write-all` in workflow grants too much access |

### Component: CI/CD Runner

| STRIDE | Threat | Example Attack |
|---|---|---|
| **T** Tampering | Dependency confusion / typosquatting | `npm install coloers` (typo) installs malicious package |
| **T** Tampering | Build artifact tampering | Attacker with runner access modifies compiled binary |
| **I** Info Disclosure | Env var exposure | Malicious package reads `process.env` and exfiltrates |
| **E** Elevation | Privileged container escape | Build container runs as root; escapes to host |

### Component: npm Registry (External)

| STRIDE | Threat | Example Attack |
|---|---|---|
| **T** Tampering | Package maintainer account hijacked | Malicious code injected into popular package (event-stream attack, 2018) |
| **T** Tampering | Dependency confusion | Internal package name `@mycompany/utils` squatted on public npm |
| **S** Spoofing | Typosquatting | `lodash` vs `loadsh` — attacker publishes fake package |

### Component: DockerHub

| STRIDE | Threat | Example Attack |
|---|---|---|
| **S** Spoofing | Base image from untrusted source | `FROM ubuntu:latest` — "ubuntu" could be a malicious publisher |
| **T** Tampering | Image layer poisoned after build | Image tag mutated after CI builds from it |
| **I** Info Disclosure | Public image exposes secrets baked in | `RUN echo $SECRET > /app/config` |
| **E** Elevation | Compromised DockerHub token | Attacker pushes malicious image that gets auto-deployed |

### Component: AWS EKS

| STRIDE | Threat | Example Attack |
|---|---|---|
| **S** Spoofing | Stolen KUBECONFIG used to deploy workloads | Leaked CI secret gives attacker cluster access |
| **T** Tampering | Manifest substitution | MITM attack swaps deployment YAML in transit |
| **E** Elevation | Over-privileged service account | Pod with `cluster-admin` role compromises entire cluster |
| **D** DoS | Resource exhaustion | Malicious pod requests all CPU/memory |

---

## Task 3: Top 5 Threats — DREAD Scores

| # | Threat | D | R | E | A | D | Score | Level |
|---|---|---|---|---|---|---|---|---|
| 1 | npm dependency confusion/tampering | 3 | 2 | 2 | 3 | 2 | **2.4** | High |
| 2 | GitHub Actions secret disclosure via logs | 3 | 2 | 2 | 3 | 2 | **2.4** | High |
| 3 | Compromised DockerHub token → malicious image deployed | 3 | 2 | 2 | 3 | 2 | **2.4** | High |
| 4 | Over-privileged GITHUB_TOKEN | 2 | 2 | 2 | 3 | 3 | **2.4** | High |
| 5 | Developer PAT stolen → code tampering | 3 | 2 | 2 | 3 | 1 | **2.2** | Med-High |

---

## Task 4: Proposed Mitigations

### Threat 1: npm Dependency Tampering
```yaml
# Use npm lock files and verify integrity
- name: Install dependencies (pinned)
  run: npm ci  # Uses package-lock.json, fails if different

# Add SCA scanning
- name: Dependency audit
  run: |
    npm audit --audit-level=high
    npx better-npm-audit audit
```
Also: Use Trivy/Snyk for dependency scanning (Lab 2.3).

### Threat 2: Secret Disclosure in Logs
```yaml
# GitHub Actions auto-masks registered secrets
# But custom values need manual masking:
- name: Mask dynamic secrets
  run: echo "::add-mask::$MY_DYNAMIC_VALUE"

# Never do this:
- run: echo $DOCKER_PASSWORD  # NEVER print secrets
```

### Threat 3: DockerHub Token Compromise
```yaml
# Use short-lived OIDC tokens instead of long-lived secrets
- name: Login to DockerHub (OIDC)
  uses: docker/login-action@v3
  with:
    registry: ghcr.io  # Use GitHub Container Registry with OIDC
    # No static credentials needed!
```
Also: Sign images with Cosign (Lab 3.1).

### Threat 4: Over-privileged GITHUB_TOKEN
```yaml
# Restrict permissions at workflow level
permissions:
  contents: read      # Read-only by default
  packages: write     # Only what's needed
  id-token: write     # Only for OIDC

# NEVER use:
# permissions: write-all
```

### Threat 5: Developer PAT Stolen
- Enforce **branch protection rules**: require PR reviews + status checks
- Require **signed commits** (GPG/SSH signing)
- Enable **push protection** in GitHub Advanced Security
- Use **short-lived tokens** via GitHub Apps instead of PATs

---

## ✅ Answers to Reflection Questions

1. **Most attack surface**: The CI/CD Runner — it fetches external dependencies, has access to secrets, runs arbitrary code from PRs, and has credentials to push to registries and deploy to production.

2. **Blast radius of compromised laptop**: Attacker gets git access → can push code → triggers CI → can modify workflow YAML in a PR to exfiltrate secrets → gains DockerHub + AWS access.

3. **Detecting tampered dependencies**: Use `npm ci` (verifies lock file integrity), enable Subresource Integrity (SRI), use Trivy/Snyk in CI, pin dependency versions in lock files.

4. **If GitHub Actions secrets leak**: Immediately rotate ALL secrets (DockerHub token, AWS keys, KUBECONFIG). Audit recent deployments for unauthorized changes. Enable secret scanning to detect if they were committed to code.

5. **Audit logging placement**: 
   - Git: GitHub audit log (who pushed, who approved PRs)
   - CI: Pipeline execution logs with actor info
   - Registry: DockerHub/ECR push/pull audit logs
   - Kubernetes: API server audit logs + Falco for runtime
   - AWS: CloudTrail for all API calls
