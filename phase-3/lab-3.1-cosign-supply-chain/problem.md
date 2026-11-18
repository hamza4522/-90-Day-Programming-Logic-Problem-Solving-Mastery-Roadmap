# Lab 3.1 — Software Supply Chain Security with Cosign & Sigstore
**Phase**: 3 — Advanced DevSecOps  
**Difficulty**: ⭐⭐⭐ Advanced  
**Estimated Time**: 3–4 hours  
**Category**: Supply Chain Security, Image Signing, SLSA

---

## 🎯 Objective

Implement **software supply chain security** by cryptographically signing container images and verifying their integrity before deployment. The 2020 SolarWinds attack compromised the entire build pipeline — supply chain security ensures that even if an attacker gets into your registry, they cannot substitute a malicious image without detection.

---

## 📋 Problem Statement

Your organization experienced a close call: someone pushed a Docker image to the registry that replaced a legitimate image. While it was caught manually, the incident revealed that your deployment process had **no verification** that images were built by your CI/CD system.

You've been tasked with implementing **keyless image signing** using Sigstore/Cosign so that:
1. Images are automatically signed by the CI pipeline after every build
2. The Kubernetes deployment process **verifies signatures** before running any container
3. An unsigned or improperly signed image is **automatically rejected**

---

## 🛠️ Prerequisites

- Docker installed
- GitHub Actions account (for keyless OIDC signing)
- kubectl + a Kubernetes cluster (Kind/Minikube acceptable)
- Access to a container registry (GitHub Container Registry is free)

---

## 📋 Tasks

### Task 1: Understand the Problem (No Tools Yet)

Before jumping into tools, answer these conceptual questions by researching online:

1. What is the **Sigstore** project? Who created it and who maintains it?
2. What is **keyless signing** and how does it differ from signing with a private key?
3. What is the **Transparency Log** (Rekor) and why is it important?
4. What does **SLSA** (Supply-chain Levels for Software Artifacts) stand for? What are the 4 levels?
5. What is the difference between **Cosign**, **Sigstore**, **Rekor**, and **Fulcio**?

Document your answers in `supply-chain-concepts.md`

### Task 2: Install and Configure Cosign

1. Install Cosign locally
2. Generate a **key pair** (traditional method — for understanding):
   ```bash
   cosign generate-key-pair
   # Creates cosign.key (private) and cosign.pub (public)
   ```
3. Sign a test image from Docker Hub using your key pair:
   ```bash
   cosign sign --key cosign.key nginx:latest
   ```
4. Verify the signature:
   ```bash
   cosign verify --key cosign.pub nginx:latest
   ```
5. What happens when you try to verify an unsigned image?

### Task 3: Keyless Signing in GitHub Actions

This is the production approach — no long-lived keys stored in secrets.

1. Create a GitHub repository with a simple Dockerfile
2. Push an image to GitHub Container Registry (GHCR)
3. Create `.github/workflows/sign-and-verify.yml` that:
   - Builds the Docker image
   - Pushes to GHCR
   - Signs using **keyless OIDC** (no secret needed!)
   - Verifies the signature immediately after signing
4. After the workflow runs, get the signature from the image and inspect it

### Task 4: Generate and Attest SBOM

1. Generate an SBOM using Syft:
   ```bash
   syft myimage:latest -o spdx-json > sbom.json
   ```
2. Attach the SBOM to the image as a **cosign attestation**:
   ```bash
   cosign attest --predicate sbom.json --type spdx myimage:latest
   ```
3. Verify the attestation:
   ```bash
   cosign verify-attestation --type spdx myimage:latest | jq .payload | base64 -d | jq .
   ```

### Task 5: Enforce Signature Verification in Kubernetes

Using **Kyverno** (policy engine for Kubernetes):

1. Install Kyverno in your cluster:
   ```bash
   kubectl apply -f https://github.com/kyverno/kyverno/releases/latest/download/install.yaml
   ```

2. Create a Kyverno policy that **blocks deployment of unsigned images**

3. Test: Try to deploy an unsigned image — it should be rejected

4. Test: Deploy your signed image — it should succeed

### Task 6: SLSA Provenance

1. Use the `slsa-framework/slsa-github-generator` action to generate **SLSA provenance** for your build
2. Verify the provenance using `slsa-verifier`
3. Determine: What SLSA level does your pipeline achieve?

---

## 📝 Deliverables

1. `supply-chain-concepts.md` — answers to Task 1 questions
2. `.github/workflows/sign-and-verify.yml` — CI pipeline
3. `kyverno-policy.yaml` — K8s admission policy
4. `sbom-attestation.json` — the SBOM attached to your image
5. `lab-demo.md` — walkthrough of your end-to-end demo

---

## ❓ Questions to Answer

1. If your private signing key is compromised (key-based approach), what must you do? Compare this to what happens if keyless signing is compromised.
2. What is the **chain of trust** in keyless Cosign signing? Trace from GitHub Actions runner to final signature.
3. Can an attacker bypass Kyverno signature verification? Under what conditions?
4. What is the difference between a **signature** (Cosign sign) and an **attestation** (Cosign attest)?
5. Why does supply chain security matter even when you trust your developers? Think about the SolarWinds and XZ Utils attacks.

---

> 💡 **Keyless signing magic**: When you run `cosign sign --yes` in GitHub Actions, Cosign asks GitHub for an OIDC token (proves "this is GitHub Actions running workflow X from repo Y"). Cosign presents this to Fulcio (Sigstore's CA), which issues a short-lived certificate. The image is signed with this certificate. The certificate is recorded in Rekor (public transparency log). All of this without any stored secret!

> 🔑 **Real-world**: Google, Red Hat, and Chainguard use Cosign for their container image supply chains. The CNCF ecosystem is rapidly standardizing on Sigstore.
