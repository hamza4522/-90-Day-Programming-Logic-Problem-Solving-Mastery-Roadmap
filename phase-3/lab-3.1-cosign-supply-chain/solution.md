# Lab 3.1 — Supply Chain Security Solution Guide
**Phase**: 3 — Advanced DevSecOps

---

## Task 1: Conceptual Answers

### Sigstore
An open-source project (incubated by Linux Foundation / OpenSSF) providing free, easy-to-use tools for signing, verifying, and protecting software. Created by engineers from Google, Red Hat, and Purdue University. Components: Cosign (signing tool), Rekor (transparency log), Fulcio (certificate authority).

### Keyless Signing vs Key-based
- **Key-based**: You generate a key pair, store private key securely (HSM, vault), distribute public key. Problem: key management is hard, keys expire or get compromised.
- **Keyless**: Uses OIDC identity (GitHub Actions, Google Workload Identity) as proof. Short-lived certificate issued by Fulcio. No long-lived private key to steal or manage.

### Transparency Log (Rekor)
An append-only, tamper-evident log (like a blockchain audit trail) of all signing events. Every signature is recorded. This means:
- You can audit who signed what
- Attackers can't sign without leaving a trace
- You can detect backdated signatures

### SLSA Levels
- **Level 1**: Build process documented, provenance generated
- **Level 2**: Build uses version control, hosted build service generates provenance
- **Level 3**: Hardened build, all deps verified, provenance non-forgeable
- **Level 4**: Two-party review, hermetic builds, reproducible

### Component Roles
| Component | Role |
|---|---|
| **Sigstore** | The overall project umbrella |
| **Cosign** | CLI tool for signing/verifying images and files |
| **Rekor** | Transparency log — records all signing events |
| **Fulcio** | Certificate authority — issues short-lived certs from OIDC identity |

---

## Task 2: Key-based Signing

```bash
# Install Cosign
# Linux
curl -O https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64
chmod +x cosign-linux-amd64
sudo mv cosign-linux-amd64 /usr/local/bin/cosign

# macOS
brew install cosign

# Windows
choco install cosign

# Verify
cosign version

# Generate key pair
cosign generate-key-pair
# Creates: cosign.key (KEEP SECRET), cosign.pub (distribute)

# Sign a public image (requires you to push it to your registry first)
# First, tag and push:
docker pull nginx:alpine
docker tag nginx:alpine ghcr.io/YOUR_USERNAME/test-nginx:latest
docker push ghcr.io/YOUR_USERNAME/test-nginx:latest

# Sign with key
cosign sign --key cosign.key ghcr.io/YOUR_USERNAME/test-nginx:latest

# Verify
cosign verify --key cosign.pub ghcr.io/YOUR_USERNAME/test-nginx:latest

# What happens with unsigned image?
cosign verify --key cosign.pub nginx:latest
# Error: no signatures found for image
```

---

## Task 3: Keyless Signing in GitHub Actions

```yaml
# .github/workflows/sign-and-verify.yml
name: Build, Push, Sign & Verify

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

permissions:
  contents: read
  packages: write
  id-token: write  # CRITICAL: Required for OIDC keyless signing

jobs:
  build-sign-verify:
    runs-on: ubuntu-latest
    outputs:
      digest: ${{ steps.push.outputs.digest }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install Cosign
        uses: sigstore/cosign-installer@v3
        with:
          cosign-release: 'v2.2.3'

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and Push Image
        id: push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          # Use digest for signing (immutable reference)
          outputs: type=image,name=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }},push-by-digest=true,name-canonical=true

      - name: Sign Image (Keyless via OIDC)
        run: |
          IMAGE="${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.push.outputs.digest }}"
          cosign sign --yes "$IMAGE"
          echo "✅ Image signed: $IMAGE"
        env:
          COSIGN_EXPERIMENTAL: "1"  # Enable keyless mode

      - name: Verify Signature
        run: |
          IMAGE="${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.push.outputs.digest }}"
          cosign verify \
            --certificate-identity-regexp "https://github.com/${{ github.repository }}/" \
            --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
            "$IMAGE" | jq .
          echo "✅ Signature verified!"

      - name: Inspect Signature
        run: |
          IMAGE="${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.push.outputs.digest }}"
          # Get the signature details
          cosign triangulate "$IMAGE"  # Shows the signature location in registry
          
          # Download and inspect
          cosign download signature "$IMAGE" | jq .
```

### Inspect the Generated Certificate

```bash
# After the workflow runs, download and inspect the signature
cosign download signature ghcr.io/YOUR_ORG/IMAGE@sha256:DIGEST | \
  jq -r '.[0].Cert' | \
  base64 -d | \
  openssl x509 -noout -text

# You'll see:
# Subject Alternative Name: https://github.com/YOUR_ORG/REPO/.github/workflows/sign-and-verify.yml@refs/heads/main
# Issuer: Fulcio
# Validity: Only 10 minutes! (keyless certificate)
```

---

## Task 4: SBOM Generation and Attestation

```bash
# Install Syft
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin

# Generate SBOM
syft ghcr.io/YOUR_ORG/IMAGE:latest -o spdx-json > sbom.json

# Attach SBOM as attestation (keyless)
cosign attest \
  --yes \
  --predicate sbom.json \
  --type spdx \
  ghcr.io/YOUR_ORG/IMAGE@sha256:DIGEST

# Verify and retrieve the attestation
cosign verify-attestation \
  --type spdx \
  --certificate-identity-regexp "https://github.com/YOUR_ORG/" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  ghcr.io/YOUR_ORG/IMAGE@sha256:DIGEST | \
  jq -r '.payload' | \
  base64 -d | \
  jq .predicate.packages[:5]  # Show first 5 packages from SBOM
```

### Add SBOM Attestation to Workflow

```yaml
- name: Generate and Attest SBOM
  run: |
    # Install Syft
    curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin

    IMAGE="${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.push.outputs.digest }}"
    
    # Generate SBOM
    syft "$IMAGE" -o spdx-json > sbom.json
    
    # Attest SBOM to the image
    cosign attest --yes \
      --predicate sbom.json \
      --type spdx \
      "$IMAGE"
    
    echo "✅ SBOM generated and attested"
    
    # Scan SBOM for vulnerabilities
    grype sbom:sbom.json --fail-on high
```

---

## Task 5: Kyverno Admission Policy

```bash
# Install Kyverno
kubectl apply -f https://github.com/kyverno/kyverno/releases/latest/download/install.yaml

# Wait for Kyverno to be ready
kubectl wait --for=condition=ready pod -l app=kyverno -n kyverno --timeout=120s
```

```yaml
# kyverno-policy.yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-signed-images
  annotations:
    policies.kyverno.io/title: Require Signed Images
    policies.kyverno.io/description: >
      All container images must be signed using Cosign/Sigstore keyless signing.
      Unsigned images will be rejected at admission.
spec:
  validationFailureAction: Enforce  # Block (use Audit for warning-only mode)
  background: false
  rules:
    - name: verify-image-signature
      match:
        any:
          - resources:
              kinds: [Pod]
              namespaces: [production, staging]  # Only enforce in these namespaces
      verifyImages:
        - imageReferences:
            - "ghcr.io/YOUR_ORG/*"  # Only your org's images
          attestors:
            - entries:
                - keyless:
                    subject: "https://github.com/YOUR_ORG/*"
                    issuer: "https://token.actions.githubusercontent.com"
                    rekor:
                      url: https://rekor.sigstore.dev
          mutateDigest: true   # Update image tag to digest for immutability
          verifyDigest: true   # Verify the digest is correct
          required: true       # Signature is mandatory
```

```bash
# Apply the policy
kubectl apply -f kyverno-policy.yaml

# Test: Try to deploy unsigned image
kubectl run unsigned-test \
  --image=nginx:latest \
  --namespace=production

# Expected: Admission webhook denied

# Test: Deploy your signed image
kubectl run signed-test \
  --image=ghcr.io/YOUR_ORG/IMAGE@sha256:DIGEST \
  --namespace=production

# Expected: Pod created successfully
```

---

## ✅ Answers to Reflection Questions

### 1. Key Compromise: Key-based vs Keyless

| | Key-based | Keyless |
|---|---|---|
| **If compromised** | Attacker can sign anything as you; must rotate ALL keys across all systems | Short-lived cert expired in 10 min; no key to steal; attacker needs your OIDC identity |
| **Recovery** | Revoke old public key, redistribute new public key, re-sign all artifacts | Nothing to recover! OIDC identity (GitHub Actions) wasn't compromised |
| **Audit impact** | Hard to tell what was signed with stolen key | Rekor log shows exactly what was signed with your identity |

### 2. Chain of Trust — Keyless Cosign

```
GitHub Actions runner starts
         │
         ▼ (1) Requests OIDC token from GitHub
GitHub OIDC Provider
         │ Issues: "This is github.com/ORG/REPO@main workflow"
         ▼ (2) Cosign presents OIDC token to Fulcio
Fulcio (Sigstore CA)
         │ Verifies OIDC token with GitHub
         │ Issues short-lived X.509 certificate (10 min TTL)
         │ Certificate embeds: github repo URL, workflow, SHA
         ▼ (3) Cosign signs image with the certificate
Image Signature
         │ Recorded in Rekor (transparency log)
         ▼ (4) Verifier checks
  - Is signature in Rekor? ✓
  - Does certificate match expected identity? ✓
  - Is certificate from trusted Fulcio? ✓
  - Is certificate within validity period? ✓ (when it was used)
```

### 3. Can Attacker Bypass Kyverno?

**Yes, under these conditions**:
- `validationFailureAction: Audit` instead of `Enforce` (warning only)
- Kyverno pods are down (availability issue → security policy bypassed)
- Attacker has `cluster-admin` access (can modify policies)
- Policy has a wildcard or namespace exclusion the attacker can exploit

**Mitigation**:
- `Enforce` mode + multiple Kyverno replicas
- RBAC: Only platform team can modify ClusterPolicies
- Monitor Kyverno pod health
- Don't exclude `kube-system` from all policies

### 4. Signature vs Attestation

| | Signature (`cosign sign`) | Attestation (`cosign attest`) |
|---|---|---|
| **What it proves** | "I built this image" | "This image has this property" |
| **Data attached** | None (just the signature) | A predicate document (SBOM, test results, SLSA provenance) |
| **Use case** | Basic integrity | Rich supply chain metadata |
| **Verification** | Did trusted party sign it? | Did trusted party sign this claim about the image? |

### 5. Why Supply Chain Security Matters Even With Trusted Developers

**SolarWinds 2020**: Hackers compromised the BUILD SERVER (not developers). They injected malicious code into the build process. All developers' code was clean — but the build artifacts were poisoned. 18,000 organizations downloaded trojanized software. Supply chain signing would have detected a signature mismatch.

**XZ Utils 2024**: A social engineering campaign where a malicious contributor gained trust over years and inserted a backdoor into the release tarball (but not the source code). SBOM + provenance could have caught this.

**Lesson**: You trust developers, but you can't always trust:
- The build environment (compromised runner, poisoned cache)
- The registry (image substitution)
- Third-party contributors (social engineering)
- The release process (tampering between build and distribution)

Supply chain security creates a **cryptographic audit trail** that is tamper-evident — even internal threats leave traces.
