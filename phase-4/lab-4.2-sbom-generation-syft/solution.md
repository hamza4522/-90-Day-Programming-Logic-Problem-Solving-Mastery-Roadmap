# Lab 4.2 — SBOM Generation & Vulnerability Management Solution Guide
**Phase**: 4 — Pro / Leadership

---

## Task 1: Installation & First SBOM

```bash
# Install Syft
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin
syft version

# Install Grype
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin
grype version

# Generate SBOM from nginx — CycloneDX format
syft docker:nginx:latest -o cyclonedx-json > nginx-sbom.json

# SPDX format
syft docker:nginx:latest -o spdx-json > nginx-sbom-spdx.json

# Human-readable
syft docker:nginx:latest -o table
```

**Expected output (table)** — you'll see ~130-150 packages:
```
NAME                    VERSION         TYPE
adduser                 3.134           deb
apt                     2.6.1           deb
base-files              12.4+deb12u5    deb
...
nginx                   1.25.4          deb
openssl                 3.0.13          deb
```

---

## Task 2: Vulnerable Multi-Service Application

### Frontend (Node.js)

```dockerfile
# frontend/Dockerfile
FROM node:16-slim
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

```json
// frontend/package.json
{
  "name": "vulnerable-frontend",
  "version": "1.0.0",
  "dependencies": {
    "express": "4.17.1",
    "lodash": "4.17.19",
    "minimist": "1.2.5",
    "axios": "0.21.1",
    "node-forge": "0.10.0"
  }
}
```

```javascript
// frontend/server.js
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Frontend OK'));
app.listen(3000);
```

### Backend (Python)

```dockerfile
# backend/Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
```

```
# backend/requirements.txt
flask==2.0.1
requests==2.25.1
jinja2==3.0.1
pyyaml==5.4.1
cryptography==3.4.7
pillow==8.3.1
```

```python
# backend/app.py
from flask import Flask
app = Flask(__name__)

@app.route('/')
def health():
    return 'Backend OK'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

### API Gateway (Java — with Log4j!)

```dockerfile
# api-gateway/Dockerfile
FROM maven:3.8-openjdk-11 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:resolve
COPY src/ src/
RUN mvn package -DskipTests

FROM openjdk:11-jre-slim
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
```

```xml
<!-- api-gateway/pom.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.example</groupId>
    <artifactId>api-gateway</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <dependencies>
        <dependency>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-core</artifactId>
            <version>2.14.1</version>  <!-- VULNERABLE to Log4Shell! -->
        </dependency>
        <dependency>
            <groupId>com.google.code.gson</groupId>
            <artifactId>gson</artifactId>
            <version>2.8.6</version>
        </dependency>
        <dependency>
            <groupId>commons-collections</groupId>
            <artifactId>commons-collections</artifactId>
            <version>3.2.1</version>  <!-- Deserialization vuln -->
        </dependency>
    </dependencies>
</project>
```

### Build & Scan All Services

```bash
# Build images
docker build -t vuln-frontend:latest ./frontend
docker build -t vuln-backend:latest ./backend
# (Java build may take longer)
docker build -t vuln-api-gateway:latest ./api-gateway

# Generate SBOMs
mkdir -p sbom/

syft docker:vuln-frontend:latest -o cyclonedx-json > sbom/frontend-sbom.json
syft docker:vuln-backend:latest -o cyclonedx-json > sbom/backend-sbom.json
syft docker:vuln-api-gateway:latest -o cyclonedx-json > sbom/api-gateway-sbom.json

# Scan each SBOM
echo "=== Frontend Vulnerabilities ==="
grype sbom:./sbom/frontend-sbom.json --only-fixed
echo ""
echo "=== Backend Vulnerabilities ==="
grype sbom:./sbom/backend-sbom.json --only-fixed
echo ""
echo "=== API Gateway Vulnerabilities ==="
grype sbom:./sbom/api-gateway-sbom.json --only-fixed
```

---

## Task 3: SBOM Format Comparison

```bash
# Generate all formats from the same image
syft docker:vuln-frontend:latest -o cyclonedx-json > compare/cyclonedx.json
syft docker:vuln-frontend:latest -o spdx-json > compare/spdx.json
syft docker:vuln-frontend:latest -o json > compare/syft-native.json
syft docker:vuln-frontend:latest -o table > compare/table.txt
```

### Comparison Table

| Feature | CycloneDX | SPDX | Syft Native |
|---|---|---|---|
| **License info** | ✅ `licenses[]` | ✅ `licenseDeclared` | ✅ `licenses` |
| **Dependency tree** | ✅ `dependencies[]` | ✅ `relationships[]` | ✅ `relationships` |
| **Vulnerability data** | ✅ (via VEX) | ❌ (separate VEX doc) | ❌ |
| **Package URLs (purl)** | ✅ | ✅ | ✅ |
| **File hashes** | ✅ SHA-256 | ✅ SHA-256, SHA-1 | ✅ multiple |
| **NIST/EO 14028** | ✅ Recommended | ✅ Recommended | ❌ Vendor-specific |
| **Ecosystem support** | Broad (OWASP) | Broad (Linux Foundation) | Anchore only |

**Key takeaway**: Both CycloneDX and SPDX are acceptable for EO 14028. CycloneDX is more popular in security tooling (OWASP ecosystem). SPDX has broader adoption in open-source licensing compliance (Linux Foundation).

---

## Task 4: SBOM-Powered Vulnerability Management

### Consolidated Vulnerability Scanner Script

```bash
#!/bin/bash
# scan-all-sboms.sh — Scan all SBOMs and produce consolidated report

SBOM_DIR="${1:-./sbom}"
OUTPUT_DIR="${2:-./reports}"
mkdir -p "$OUTPUT_DIR"

echo "╔═══════════════════════════════════════════════╗"
echo "║     SBOM Vulnerability Consolidation Report   ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

TOTAL_CRITICAL=0
TOTAL_HIGH=0

for sbom_file in "$SBOM_DIR"/*.json; do
    service_name=$(basename "$sbom_file" .json | sed 's/-sbom//')
    echo "━━━ Scanning: $service_name ━━━"

    # Scan SBOM and capture JSON output
    grype sbom:"$sbom_file" -o json > "$OUTPUT_DIR/${service_name}-vulns.json" 2>/dev/null

    # Count by severity
    CRITICAL=$(jq '[.matches[] | select(.vulnerability.severity == "Critical")] | length' "$OUTPUT_DIR/${service_name}-vulns.json")
    HIGH=$(jq '[.matches[] | select(.vulnerability.severity == "High")] | length' "$OUTPUT_DIR/${service_name}-vulns.json")
    MEDIUM=$(jq '[.matches[] | select(.vulnerability.severity == "Medium")] | length' "$OUTPUT_DIR/${service_name}-vulns.json")
    LOW=$(jq '[.matches[] | select(.vulnerability.severity == "Low")] | length' "$OUTPUT_DIR/${service_name}-vulns.json")

    echo "  🔴 Critical: $CRITICAL"
    echo "  🟠 High:     $HIGH"
    echo "  🟡 Medium:   $MEDIUM"
    echo "  🟢 Low:      $LOW"
    echo ""

    TOTAL_CRITICAL=$((TOTAL_CRITICAL + CRITICAL))
    TOTAL_HIGH=$((TOTAL_HIGH + HIGH))
done

echo "═══════════════════════════════════════════════"
echo "TOTAL CRITICAL: $TOTAL_CRITICAL | TOTAL HIGH: $TOTAL_HIGH"
if [ "$TOTAL_CRITICAL" -gt 0 ]; then
    echo "❌ ACTION REQUIRED: Critical vulnerabilities found!"
    exit 1
fi
```

### Blast Radius Query: "Which services use package X?"

```bash
#!/bin/bash
# blast-radius.sh — Find which services contain a specific package or CVE

QUERY="$1"
SBOM_DIR="${2:-./sbom}"

if [ -z "$QUERY" ]; then
    echo "Usage: $0 <package-name-or-CVE> [sbom-directory]"
    echo "Examples:"
    echo "  $0 log4j-core ./sbom"
    echo "  $0 CVE-2021-44228 ./sbom"
    exit 1
fi

echo "🔍 Searching for: $QUERY"
echo "📁 SBOM directory: $SBOM_DIR"
echo ""

# Check if query looks like a CVE
if [[ "$QUERY" == CVE-* ]]; then
    echo "═══ CVE Blast Radius Analysis ═══"
    for sbom_file in "$SBOM_DIR"/*.json; do
        service_name=$(basename "$sbom_file" .json | sed 's/-sbom//')

        # Scan SBOM for specific CVE
        result=$(grype sbom:"$sbom_file" -o json 2>/dev/null | \
            jq --arg cve "$QUERY" '[.matches[] | select(.vulnerability.id == $cve)]')

        count=$(echo "$result" | jq 'length')

        if [ "$count" -gt 0 ]; then
            echo "🚨 AFFECTED: $service_name"
            echo "$result" | jq -r '.[] | "   Package: \(.artifact.name):\(.artifact.version) | Fix: \(.vulnerability.fix.versions // ["No fix"] | join(", "))"'
        else
            echo "✅ Not affected: $service_name"
        fi
    done
else
    echo "═══ Package Search ═══"
    for sbom_file in "$SBOM_DIR"/*.json; do
        service_name=$(basename "$sbom_file" .json | sed 's/-sbom//')

        # Search SBOM for package name
        result=$(jq --arg pkg "$QUERY" \
            '[.components[] | select(.name | test($pkg; "i"))]' \
            "$sbom_file" 2>/dev/null)

        count=$(echo "$result" | jq 'length')

        if [ "$count" -gt 0 ]; then
            echo "📦 FOUND in: $service_name"
            echo "$result" | jq -r '.[] | "   \(.name):\(.version) (type: \(.type // "unknown"))"'
        fi
    done
fi
```

---

## Task 5: CI/CD SBOM Pipeline

```yaml
# .github/workflows/sbom-pipeline.yml
name: SBOM Generation & Vulnerability Gate

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  packages: write
  id-token: write  # For keyless Cosign signing

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  sbom-pipeline:
    name: Build → SBOM → Scan → Sign → Attest
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and Push Docker Image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

      - name: Install Syft
        uses: anchore/sbom-action/download-syft@v0

      - name: Generate SBOM (CycloneDX)
        run: |
          syft \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            -o cyclonedx-json \
            > sbom-cyclonedx.json

          echo "📦 SBOM generated: $(jq '.components | length' sbom-cyclonedx.json) components"

      - name: Generate SBOM (SPDX)
        run: |
          syft \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            -o spdx-json \
            > sbom-spdx.json

      - name: Install Grype
        uses: anchore/scan-action/download-grype@v4

      - name: Scan SBOM for Vulnerabilities
        id: scan
        run: |
          # Scan and generate reports
          grype sbom:./sbom-cyclonedx.json -o table > vuln-report.txt 2>&1 || true
          grype sbom:./sbom-cyclonedx.json -o json > vuln-report.json 2>&1 || true

          # Count severities
          CRITICAL=$(jq '[.matches[] | select(.vulnerability.severity == "Critical")] | length' vuln-report.json)
          HIGH=$(jq '[.matches[] | select(.vulnerability.severity == "High")] | length' vuln-report.json)
          TOTAL=$(jq '.matches | length' vuln-report.json)

          echo "critical=$CRITICAL" >> $GITHUB_OUTPUT
          echo "high=$HIGH" >> $GITHUB_OUTPUT
          echo "total=$TOTAL" >> $GITHUB_OUTPUT

          echo "=== Vulnerability Summary ==="
          echo "🔴 Critical: $CRITICAL"
          echo "🟠 High: $HIGH"
          echo "📊 Total: $TOTAL"

          # Print table report
          cat vuln-report.txt

      - name: Install Cosign
        uses: sigstore/cosign-installer@v3

      - name: Sign Image (Keyless)
        run: |
          cosign sign --yes \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }}

      - name: Attach SBOM Attestation
        run: |
          cosign attest --yes \
            --predicate sbom-cyclonedx.json \
            --type cyclonedx \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }}

          echo "✅ SBOM attestation attached to image"

      - name: Upload SBOM Artifacts
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: sbom-and-vulns-${{ github.sha }}
          path: |
            sbom-cyclonedx.json
            sbom-spdx.json
            vuln-report.json
            vuln-report.txt
          retention-days: 365

      - name: Fail on Critical Vulnerabilities
        if: steps.scan.outputs.critical != '0'
        run: |
          echo "❌ ${{ steps.scan.outputs.critical }} critical vulnerabilities found!"
          echo "Fix these before merging."
          exit 1

      - name: Verify SBOM Attestation
        run: |
          cosign verify-attestation \
            --type cyclonedx \
            --certificate-identity-regexp '.*' \
            --certificate-oidc-issuer-regexp '.*' \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }} \
            | jq -r '.payload' | base64 -d | jq '.predicate.components | length' \
            | xargs -I {} echo "✅ Verified: SBOM attestation contains {} components"
```

---

## ✅ Answers to Reflection Questions

### 1. SBOM vs Vulnerability Scan

| | SBOM | Vulnerability Scan |
|---|---|---|
| **What it is** | Inventory — list of all components | Assessment — known CVEs in components |
| **When it's useful** | Always (even with 0 current CVEs) | Right now (point-in-time) |
| **Future value** | NEW CVE drops → rescan old SBOMs instantly | Must rescan actual images (slow, may be gone) |
| **Analogy** | Ingredient list on food packaging | Recall notice for a bad ingredient |

**Why you need both**: An SBOM with 0 CVEs today might have 10 CVEs next month (new disclosures). The SBOM lets you retroactively answer "are we affected?" without accessing the running system.

### 2. EO 14028 & NIST Requirements

NIST recommends both **CycloneDX** and **SPDX** formats. Minimum required fields:
- **Supplier name** — who provided the component
- **Component name** — package name
- **Version** — exact version string
- **Unique identifier** — purl or CPE
- **Dependency relationships** — what depends on what
- **Author of the SBOM** — who generated it
- **Timestamp** — when it was generated

### 3. "500 packages, 3 CVEs = secure" — Why This Is Wrong

- **Zero-days haven't been discovered yet** — absence of CVEs ≠ absence of vulnerabilities
- **Transitive deps may not be scanned** — if Grype doesn't have a match, it's not "safe"
- **License risk** — a GPL-licensed transitive dependency could be a legal bomb
- **Supply chain compromise** — the package itself could be malicious (no CVE issued for intentional backdoors)
- **Configuration matters** — a package can be secure but used insecurely

### 4. Transitive Dependencies

**Direct dependency**: You explicitly add `express@4.17.1` to package.json.
**Transitive dependency**: Express depends on `qs@6.7.0`, which depends on `side-channel@1.0.4`, which depends on `get-intrinsic@1.1.1`...

You installed 1 package. npm installed 50+ packages. You audited 0 of those 50.

**Risk**: The `event-stream` incident — a maintainer added a malicious transitive dependency that stole Bitcoin wallets. The direct dependency was trusted; the transitive one was compromised.

**Syft handles this**: Syft scans the actual installed packages in the filesystem (node_modules, site-packages, JAR files), not just the declared dependencies. This catches everything, including transitive deps.

### 5. SBOM Impact on Incident Response

**Without SBOMs** (the Log4Shell reality):
```
Friday 6pm: CVE-2021-44228 disclosed
Saturday: Security team starts manually checking repos
Week 1: Found log4j in 5 Java services
Week 2: Found log4j embedded inside 3 vendor JARs
Week 3: Found log4j shaded inside a fat JAR nobody knew about
Total time: 3 weeks. 21 days of exposure.
```

**With SBOMs**:
```
Friday 6pm: CVE-2021-44228 disclosed
Friday 6:05pm: Run blast-radius.sh CVE-2021-44228
Friday 6:06pm: Complete list of all 8 affected services
Friday 6:30pm: Patches deployed to all 8 services
Total time: 30 minutes.
```

MTTD goes from **weeks to minutes**. That's the entire value proposition of SBOMs.

