# Lab 2.4 — Container Security Solution Guide
**Phase**: 2 — CI/CD Security

---

## Task 2: Hadolint — Dockerfile Linting

```bash
# Install Hadolint
# Linux/macOS
curl -L https://github.com/hadolint/hadolint/releases/latest/download/hadolint-Linux-x86_64 -o /usr/local/bin/hadolint
chmod +x /usr/local/bin/hadolint

# macOS
brew install hadolint

# Windows
choco install hadolint

# Docker (no install needed)
docker run --rm -i hadolint/hadolint < Dockerfile

# Lint and output JSON
hadolint --format json Dockerfile > hadolint-report.json

# Lint with specific severity threshold
hadolint --failure-threshold error Dockerfile
```

### Expected Hadolint Output

```
Dockerfile:2 DL3007 warning: Using latest is best avoided; use a specific version tag.
Dockerfile:7 DL3045 warning: `COPY` to a relative destination without `WORKDIR` set.
Dockerfile:13 DL3013 warning: Pin versions in pip. Instead of `pip install -r requirements.txt` use `pip install -r requirements.txt --no-cache-dir`
Dockerfile:13 DL3042 warning: Avoid use of cache directory with pip. Use `pip install --no-cache-dir <package>`.
Dockerfile:16 DL3000 error: Use absolute WORKDIR.
```

---

## Task 3: Trivy Image Scanning

```bash
# Build the insecure image
docker build -t myapp:insecure -f Dockerfile.insecure .

# Scan image — show all severities
trivy image myapp:insecure

# Scan with only HIGH/CRITICAL
trivy image --severity HIGH,CRITICAL myapp:insecure

# JSON output for programmatic use
trivy image --format json --output trivy-image-scan.json myapp:insecure

# Compare base images
trivy image python:latest --severity CRITICAL
trivy image python:3.11-alpine --severity CRITICAL
trivy image python:3.11-slim-bookworm --severity CRITICAL
```

---

## Task 4: Fixed Secure Dockerfile

```dockerfile
# Dockerfile — SECURE VERSION
# Stage 1: Build stage (has build tools, discarded after)
FROM python:3.11.7-slim-bookworm AS builder

# Don't cache pip downloads
ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Copy only dependency files first (better layer caching)
COPY requirements.txt .

# Install dependencies into a separate location
RUN pip install --prefix=/install -r requirements.txt

# Stage 2: Runtime stage (minimal, no build tools)
FROM python:3.11.7-slim-bookworm AS runtime

# Security: Create a non-root user and group
RUN groupadd --gid 1001 appgroup && \
    useradd --uid 1001 --gid appgroup --shell /bin/bash --create-home appuser

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Set working directory (absolute path)
WORKDIR /app

# Copy application code only
COPY --chown=appuser:appgroup app.py .

# Security: Drop all capabilities, run as non-root
USER appuser

# Document what the port is for
EXPOSE 5000

# Use exec form (not shell form) for CMD — avoids shell injection
CMD ["python", "app.py"]
```

### `.dockerignore`

```
# .dockerignore — Prevent sensitive files from being copied into image
.git/
.gitignore
.env
.env.*
*.env
secrets/
**/.secrets

# Development files
*.md
Dockerfile*
docker-compose*
.dockerignore

# CI/CD
.github/
.gitlab-ci.yml

# Test files
tests/
test_*
*_test.py

# Python artifacts
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.egg
*.egg-info/
dist/
build/
.venv/
venv/
env/

# IDE
.vscode/
.idea/
*.swp
```

---

## Task 5: GitHub Actions Container Security Pipeline

```yaml
# .github/workflows/container-security.yml
name: Container Security Pipeline

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

permissions:
  contents: read
  packages: write
  security-events: write
  id-token: write  # For cosign OIDC signing

jobs:
  dockerfile-lint:
    name: Dockerfile Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Hadolint — Lint Dockerfile
        uses: hadolint/hadolint-action@v3.1.0
        with:
          dockerfile: Dockerfile
          format: sarif
          output-file: hadolint.sarif
          failure-threshold: error  # Only fail on errors, not warnings

      - name: Upload Hadolint SARIF
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: hadolint.sarif
          category: hadolint

  build-and-scan:
    name: Build & Scan Image
    runs-on: ubuntu-latest
    needs: dockerfile-lint
    outputs:
      image-digest: ${{ steps.push.outputs.digest }}

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build Image (don't push yet)
        uses: docker/build-push-action@v5
        with:
          context: .
          load: true  # Load into local Docker daemon for scanning
          tags: ${{ env.IMAGE_NAME }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Trivy — Scan Image (Table)
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: 'table'
          severity: 'CRITICAL,HIGH'

      - name: Trivy — SARIF Report
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-image.sarif'
          severity: 'CRITICAL'
          exit-code: '1'  # Block pipeline on CRITICAL findings

      - name: Upload Trivy SARIF
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: trivy-image.sarif
          category: trivy-image

      - name: Login to Container Registry
        if: github.ref == 'refs/heads/main'
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Push Image (only if security gates pass)
        if: github.ref == 'refs/heads/main'
        id: push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

  sign-image:
    name: Sign Image with Cosign
    runs-on: ubuntu-latest
    needs: build-and-scan
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Install Cosign
        uses: sigstore/cosign-installer@v3

      - name: Sign the Container Image
        run: |
          cosign sign --yes \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ needs.build-and-scan.outputs.image-digest }}
        env:
          COSIGN_EXPERIMENTAL: 1  # Keyless signing via OIDC
```

---

## Task 6: Base Image Comparison

| Base Image | Approx Size | CRITICAL CVEs | HIGH CVEs | Notes |
|---|---|---|---|---|
| `python:latest` | ~1.0 GB | 5-10+ | 20-30+ | Avoid — full Debian, unpinned |
| `python:3.11-slim` | ~130 MB | 0-2 | 5-10 | Good balance |
| `python:3.11-alpine` | ~55 MB | 0 | 0-2 | Small, but musl libc compat issues |
| `python:3.11-slim-bookworm` | ~130 MB | 0-1 | 3-7 | Pinned Debian version, recommended |
| `gcr.io/distroless/python3` | ~55 MB | 0 | 0 | Best security, no shell |

**Recommendation**: `python:3.11-slim-bookworm` for most apps (balance of compatibility + security). `distroless` for maximum security if you can live without a debug shell.

---

## ✅ Answers to Reflection Questions

### 1. Running as Root in Containers

Even though containers are isolated via namespaces and cgroups, running as root is dangerous because:
- **Container escape**: If an attacker exploits a kernel vulnerability (e.g., runc CVE-2019-5736), they break out of the container as `root` on the HOST
- **Privilege escalation**: Attackers can modify files, install backdoors, read other containers' secrets via `/proc`
- **Volume mounts**: A root container can write to any mounted volume (including the host filesystem if misconfigured)
- **Compliance**: Most security standards (CIS Kubernetes Benchmark) require non-root containers

### 2. Distroless Images

**What they are**: Container images that contain ONLY the application and its runtime dependencies. No shell (`/bin/sh`), no package manager (`apt`, `yum`), no OS utilities.

**Tradeoffs**:

| Pro | Con |
|---|---|
| Minimal attack surface (nothing for attacker to use) | Hard to debug — no shell to exec into |
| Smallest possible image size | Can't install additional tools at runtime |
| Fewer CVEs (no OS packages) | Requires multi-stage builds |
| Forces immutability | Some apps need OS utilities at runtime |

**Debug workaround**:
```bash
# Use debug variant of distroless (has busybox shell)
FROM gcr.io/distroless/python3:debug
# Only use in dev, not production!
```

### 3. CVE With No Fix Available

**Options (in priority order)**:
1. **Check for workarounds**: NVD and vendor advisories often list mitigations
2. **Compensating controls**: WAF rules, network restrictions to reduce exposure
3. **Risk acceptance**: Document and get sign-off with expiry date (e.g., revisit in 30 days)
4. **Base image change**: Can a different base image eliminate the vulnerable package?
5. **Suppress in CI with expiry**: `trivy image --ignorefile .trivyignore`

```yaml
# .trivyignore — suppress known/accepted CVEs
# Format: CVE-ID
# Always add expiry and justification comment!
CVE-2023-XXXXX  # No fix available; compensating control: WAF rule deployed (review 2024-03-01)
```

### 4. Image Scanning vs Runtime Security

| Aspect | Image Scanning (Trivy) | Runtime Security (Falco) |
|---|---|---|
| **When** | Before deployment (build time) | After deployment (running time) |
| **What it catches** | Known CVEs, misconfigs, hardcoded secrets | Anomalous behavior, zero-days, insider threats |
| **Misses** | Runtime exploits, logic flaws, zero-days | Known-bad configurations baked in before start |
| **Example** | `log4j` CVE in jar file | Container executing `whoami` then making outbound DNS |

**You need both**: Image scanning is the "entrance exam" (don't deploy known-bad), runtime security is the "ongoing surveillance" (catch what slips through or happens after).

### 5. Multi-Stage Builds & Attack Surface

**Without multi-stage**:
```
Final image = App code + All build tools (gcc, pip, git, curl...) + OS
```

**With multi-stage**:
```
Builder stage: App code + All build tools → Compile/build
Final image: ONLY the compiled artifact + minimal runtime
```

**Benefits**:
- **Smaller image**: No build tools → fewer packages → fewer CVEs
- **No compiler**: Attacker can't compile new exploits inside the container
- **No build secrets**: `RUN git clone ... --password=$SECRET` only in builder stage
- **Immutability**: If there's no `apt` or `pip`, attacker can't install new software
