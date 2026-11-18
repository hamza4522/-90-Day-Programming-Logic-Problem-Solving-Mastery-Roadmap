# Lab 6.1 — End-to-End Secure CI/CD Pipeline Integration Solution Guide
**Phase**: 6 — Capstone & Enterprise Architect

---

## 🔗 Key Documentation & References

- [Sigstore Cosign Documentation](https://docs.sigstore.dev/cosign/overview/)
- [Kyverno Image Verification Documentation](https://kyverno.io/docs/writing-policies/verify-images/)
- [SLSA GitHub Generator Repository](https://github.com/slsa-framework/slsa-github-generator)
- [In-Toto Attestations Specification](https://in-toto.io/attestation/)
- [GitHub Actions Security Hardening Guide](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

---

## Task 1: Complete Golden Pipeline Specification

```markdown
# pipeline-spec.md — Pipeline Security Gate Policy

| Stage | Tool | Trigger | Action on Failure |
|---|---|---|---|
| **Secret Detection** | Gitleaks v8 | PR & Push | **HARD BLOCK**: Aborts immediately, commits rejected |
| **SAST** | Semgrep OSS | PR & Push | **BLOCK**: Critical/High CWEs (SQLi, Command Injection, XSS) |
| **Dependency SCA** | Trivy FS | PR & Push | **BLOCK**: Critical CVEs with vendor-provided fix available |
| **IaC Scan** | Checkov | PR & Push | **BLOCK**: S3 public access, 0.0.0.0/0 ingress, root containers |
| **Container Build** | Docker Buildx | Merge to main | Multi-stage build on distroless non-root base |
| **SBOM Generation**| Syft | Merge to main | Generates CycloneDX v1.5 JSON |
| **SBOM Scan** | Grype | Merge to main | **BLOCK**: Critical image vulnerabilities |
| **Artifact Signing**| Cosign | Merge to main | Keyless OIDC signing via Sigstore Public Good Instance |
| **Attestations** | Cosign + SLSA | Merge to main | CycloneDX SBOM + SLSA Provenance predicates attached |
| **Admission Control**| Kyverno | K8s API Request | **BLOCK**: Pod rejected if image signature or SBOM missing |
```

---

## Task 2: Golden Pipeline Workflow

Create `.github/workflows/golden-pipeline.yml`:

```yaml
name: Golden Secure Delivery Pipeline

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: read
  packages: write
  id-token: write          # Required for Sigstore keyless OIDC auth
  security-events: write   # Upload SARIF findings to GitHub Security tab

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ==========================================
  # STAGE 1: Pre-Build Shift-Left Security Scans
  # ==========================================
  security-checks:
    name: "Shift-Left Scans (Secrets, SAST, SCA)"
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Secret Scanning with Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: SAST Scanning with Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/owasp-top-ten
            p/cwe-top-25
          generateSarif: true

      - name: Upload Semgrep SARIF
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: semgrep.sarif

      - name: Dependency SCA Scanning with Trivy
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'
          ignore-unfixed: true
          exit-code: '1'

  # ==========================================
  # STAGE 2: Build, SBOM, Sign, and Attest
  # ==========================================
  build-and-sign:
    name: "Build, Package, SBOM, Sign & Attest"
    needs: [security-checks]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    outputs:
      image-digest: ${{ steps.build.outputs.digest }}
      image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and Push Immutable Image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

      - name: Install Syft & Grype
        run: |
          curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin
          curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin

      - name: Generate CycloneDX SBOM
        run: |
          syft ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }} \
            -o cyclonedx-json > sbom.cyclonedx.json

      - name: Scan Image SBOM with Grype
        run: |
          grype sbom:./sbom.cyclonedx.json --fail-on critical --only-fixed

      - name: Install Cosign
        uses: sigstore/cosign-installer@v3

      - name: Keyless Cryptographic Signing (Cosign + OIDC)
        run: |
          cosign sign --yes \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }}

      - name: Attest SBOM as in-toto Predicate
        run: |
          cosign attest --yes \
            --predicate sbom.cyclonedx.json \
            --type cyclonedx \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }}

      - name: Upload SBOM Artifact
        uses: actions/upload-artifact@v4
        with:
          name: sbom-cyclonedx-${{ github.sha }}
          path: sbom.cyclonedx.json
```

---

## Task 3: Kyverno Admission Control Policy

Create `k8s/kyverno-policy.yaml`:

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: enforce-signed-images-and-attestations
  annotations:
    policies.kyverno.io/title: Verify Signed Images & SBOM Attestations
    policies.kyverno.io/category: Supply Chain Security
    policies.kyverno.io/severity: critical
    policies.kyverno.io/subject: Pod
    policies.kyverno.io/description: >-
      Ensures that all container images deployed in the production namespace
      are signed using Sigstore Cosign with a trusted GitHub OIDC identity
      and possess a valid CycloneDX SBOM attestation.
spec:
  validationFailureAction: Enforce   # Hard block non-compliant workloads
  background: false
  webhookTimeoutSeconds: 30
  rules:
    - name: verify-signature-and-issuer
      match:
        any:
          - resources:
              kinds:
                - Pod
              namespaces:
                - production
      verifyImages:
        - imageReferences:
            - "ghcr.io/*"
          attestors:
            - entries:
                - keyless:
                    issuer: "https://token.actions.githubusercontent.com"
                    subjectRegExp: "https://github.com/[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+/.github/workflows/golden-pipeline.yml@refs/heads/main"
                    rekor:
                      url: "https://rekor.sigstore.dev"

    - name: verify-cyclonedx-attestation
      match:
        any:
          - resources:
              kinds:
                - Pod
              namespaces:
                - production
      verifyImages:
        - imageReferences:
            - "ghcr.io/*"
          attestations:
            - predicateType: https://cyclonedx.org/bom
              attestors:
                - entries:
                    - keyless:
                        issuer: "https://token.actions.githubusercontent.com"
                        subjectRegExp: "https://github.com/.*"
                        rekor:
                          url: "https://rekor.sigstore.dev"
```

Apply the policy to your Kubernetes cluster:
```bash
kubectl create namespace production
kubectl apply -f k8s/kyverno-policy.yaml
```

---

## Task 4: Attack & Validation Scenarios

### Test 1: Legitimate Signed Deployment (Passes)

Deploying a manifest that points to our signed digest:

```yaml
# k8s/production-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secure-microservice
  namespace: production
  labels:
    app: secure-microservice
spec:
  replicas: 2
  selector:
    matchLabels:
      app: secure-microservice
  template:
    metadata:
      labels:
        app: secure-microservice
    spec:
      containers:
        - name: app
          image: ghcr.io/my-org/my-service@sha256:d824d67319ec880d440058b73f1d2df90c42340578848dbff1ef3a19b88f3478
          securityContext:
            runAsNonRoot: true
            runAsUser: 65534
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
          ports:
            - containerPort: 8080
```

```bash
kubectl apply -f k8s/production-deployment.yaml
# Output:
# deployment.apps/secure-microservice created
# Pods reach Running status immediately
```

### Test 2: Untrusted / Unsigned Image Attempt (Blocked)

Attempting to run an arbitrary unsigned image in `production`:

```bash
kubectl run rogue-container \
  --image=nginx:latest \
  --namespace=production
```

**Observed Admission Controller Error**:
```
Error from server: admission webhook "mutate.kyverno.svc-fail" denied the request:
policy Pod/production/rogue-container fail:
verify-signature-and-issuer: image verification failed for docker.io/nginx:latest:
no signatures found matching the configured OIDC issuer and subject.
```
The admission controller successfully rejected the pod before creation.

---

## ✅ Answers to Reflection Questions

### 1. SLSA Level 3 vs Image Signing Alone
Image signing alone proves **who signed the artifact**, but does not prove **how or where the artifact was built**. A developer whose machine is infected with malware could sign an infected image. 

[SLSA Level 3](https://slsa.dev/spec/v1.0/levels) ensures:
- **Build Isolation**: Builds occur in dedicated, ephemeral build platforms (e.g., GitHub Actions isolated VMs).
- **Hermetic / Non-falsifiable Provenance**: The build system itself generates and cryptographically signs the record detailing the exact source repository, commit SHA, workflow parameters, and dependencies.
- **Tamper Resistance**: Neither developers nor pipeline stages can fabricate the build provenance without triggering signature validation failure.

### 2. Immutability: Digests vs Tags
Container image tags (e.g., `:latest` or `:v1.2.0`) are **mutable pointers**. An adversary with compromised registry credentials can overwrite `:latest` with a backdoored image without changing the tag. When Kubernetes schedules a pod referencing `:latest`, it may pull the poisoned image.

In contrast, **cryptographic digests** (`@sha256:4b91...`) are mathematically bound to the image's binary content. If a single bit in the container image is altered, the digest completely changes, rendering tampering impossible.

### 3. Sigstore Keyless Signing Mechanics
Traditional PKI requires teams to generate, store, rotate, and safeguard private signing keys (e.g., GPG or RSA). When keys leak, attackers forge signatures until revocation occurs.

Sigstore Keyless Architecture:
1. **GitHub Actions runner requests an OpenID Connect (OIDC) identity token** from GitHub's OIDC provider specifying the repository, workflow, and commit.
2. **Fulcio Certificate Authority** exchanges this short-lived (10-minute) OIDC identity token for a short-lived X.509 code-signing certificate containing the workflow identity in its Subject Alternative Name (SAN).
3. **Cosign signs the container image hash** using a temporary keypair generated entirely in memory.
4. **Rekor Transparency Log** records an append-only, tamper-evident cryptographic log entry documenting that this specific certificate signed this specific image digest at this exact timestamp.
5. The temporary private key is discarded. Verifiers do not need long-lived keys; they verify the signature against the public Rekor transparency log and the OIDC issuer identity.

### 4. Admission Controller Failure Modes: Fail-Open vs Fail-Closed
- **Fail-Closed (`failurePolicy: Fail`)**: If Kyverno/Gatekeeper is unreachable or crashes, Kubernetes rejects **all** pod creation requests. This guarantees security (no unsigned code can run during outages), but sacrifices availability if the admission system malfunctions.
- **Fail-Open (`failurePolicy: Ignore`)**: If the controller fails, requests bypass validation. This protects cluster availability but creates a window of vulnerability during an outage.

**Enterprise Best Practice**: Run admission controllers with high availability (3 replicas across failure zones) and set `failurePolicy: Fail` for high-assurance namespaces (`production`, `pci-dss`), paired with cluster health metrics alerting.

