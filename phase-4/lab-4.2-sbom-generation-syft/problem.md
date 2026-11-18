# Lab 4.2 — SBOM Generation & Vulnerability Management
**Phase**: 4 — Pro / Leadership  
**Difficulty**: ⭐⭐⭐ Advanced  
**Estimated Time**: 3–4 hours  
**Category**: Software Supply Chain, SBOM, Vulnerability Management

---

## 🎯 Objective

Generate, manage, and operationalize **Software Bills of Materials (SBOMs)** using Syft, Grype, and the CycloneDX standard. SBOMs are the foundation of software supply chain security — you can't secure what you can't see.

---

## 📋 Problem Statement

Your organization ships a containerized microservices application. A new executive order (EO 14028) and your largest enterprise customer both require:

1. **Every software release** must include a machine-readable SBOM
2. The SBOM must cover **all dependencies** — OS packages, language libraries, and transitive deps
3. SBOMs must be **attached as attestations** to signed container images
4. New CVEs must be automatically matched against historical SBOMs to determine **blast radius** — "which of our deployed services use log4j?"
5. SBOMs must be generated in **CycloneDX** or **SPDX** format

Currently, developers have no idea what transitive dependencies their services pull in. When Log4Shell hit, it took the team 3 weeks to determine which services were affected.

Your task: Build an automated SBOM pipeline that generates, stores, and continuously monitors SBOMs.

---

## 🛠️ Prerequisites

- Docker installed
- A sample multi-language project (we'll create one)
- Completed Lab 3.1 (Cosign — supply chain signing) recommended

---

## 📋 Tasks

### Task 1: Install Tools & Generate Your First SBOM

1. Install Syft (SBOM generator) and Grype (vulnerability scanner):
   ```bash
   # Syft
   curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin

   # Grype
   curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin

   # Verify
   syft version
   grype version
   ```

2. Generate an SBOM from a popular Docker image:
   ```bash
   # Generate SBOM in CycloneDX JSON format
   syft docker:nginx:latest -o cyclonedx-json > nginx-sbom.json

   # Also try SPDX format
   syft docker:nginx:latest -o spdx-json > nginx-sbom-spdx.json

   # Human-readable table
   syft docker:nginx:latest -o table
   ```

3. Explore the SBOM: How many packages? What types (deb, apk, npm, pip)? What metadata is included?

### Task 2: Build a Vulnerable Multi-Service Application

Create a sample project with intentionally outdated dependencies:

```
vulnerable-app/
├── frontend/
│   ├── Dockerfile
│   └── package.json        # Node.js with vulnerable deps
├── backend/
│   ├── Dockerfile
│   └── requirements.txt    # Python with vulnerable deps
├── api-gateway/
│   ├── Dockerfile
│   └── pom.xml             # Java with log4j (!)
└── docker-compose.yml
```

Create `frontend/package.json`:
```json
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

Create `backend/requirements.txt`:
```
flask==2.0.1
requests==2.25.1
jinja2==3.0.1
pyyaml==5.4.1
cryptography==3.4.7
pillow==8.3.1
```

For each service:
1. Build the Docker image
2. Generate an SBOM with Syft
3. Scan the SBOM with Grype
4. Compare: how many vulnerabilities does each service have? What severity?

### Task 3: SBOM Formats Deep Dive

Generate the same SBOM in multiple formats and compare:

1. **CycloneDX JSON** — `syft -o cyclonedx-json`
2. **SPDX JSON** — `syft -o spdx-json`
3. **Syft native JSON** — `syft -o json`
4. **Human table** — `syft -o table`

Answer these questions:
- Which format includes license information?
- Which format includes dependency tree (transitive deps)?
- Which format is required by NIST/EO 14028?
- What is the difference between CycloneDX and SPDX in terms of fields?

### Task 4: SBOM-Powered Vulnerability Management

Use Grype to scan SBOMs (not images — scan the SBOM artifact itself):

```bash
# Scan SBOM file (much faster than rescanning image)
grype sbom:./nginx-sbom.json

# Output in JSON for processing
grype sbom:./nginx-sbom.json -o json > vulnerabilities.json

# Filter by severity
grype sbom:./nginx-sbom.json --only-fixed --fail-on critical
```

Build a script that:
1. Takes a directory of SBOM JSON files
2. Scans each with Grype
3. Produces a consolidated report: which services have critical CVEs?
4. Answers: "Which of our services use package X version Y?" (the Log4Shell query)

### Task 5: CI/CD SBOM Pipeline

Create `.github/workflows/sbom-pipeline.yml` that:
1. Builds a Docker image
2. Generates a CycloneDX SBOM with Syft
3. Scans the SBOM with Grype (fail on critical/high)
4. Signs the image with Cosign (from Lab 3.1)
5. Attaches the SBOM as a Cosign attestation
6. Uploads the SBOM as a build artifact
7. Pushes SBOM to a dependency-track instance (bonus)

### Task 6: Blast Radius Analysis

Write a script `blast-radius.sh` that:
1. Takes a CVE ID or package name as input (e.g., `CVE-2021-44228` or `log4j-core`)
2. Scans all stored SBOMs in a directory
3. Reports which services/images contain the affected package
4. Reports which version they're running and whether a fix is available
5. Outputs a severity-ranked list for incident response prioritization

---

## 📝 Deliverables

1. `sbom/` — directory of generated SBOMs in CycloneDX JSON format
2. `vulnerability-report.json` — consolidated Grype vulnerability report
3. `.github/workflows/sbom-pipeline.yml` — CI/CD SBOM generation pipeline
4. `blast-radius.sh` — CVE blast radius analysis script
5. `sbom-comparison.md` — analysis of CycloneDX vs SPDX formats

---

## ❓ Questions to Answer

1. What is the difference between an **SBOM** and a **vulnerability scan**? Why do you need both?
2. Executive Order 14028 requires SBOMs for software sold to the US government. What format does NIST recommend and what minimum fields are required?
3. Your SBOM shows 500 packages but Grype only finds 3 CVEs. A developer says "our app is secure." Why is this wrong?
4. What are **transitive dependencies** and why are they the biggest risk in supply chain security? How does Syft handle them?
5. A new zero-day drops on a Friday night. How does having SBOMs for all deployed services change your incident response time vs not having them?

---

> 💡 **Supply chain stat**: The average modern application has 200+ transitive dependencies. You wrote 1% of the code running in your container — the other 99% came from the open-source supply chain.

> 📋 **Regulation**: EO 14028, EU Cyber Resilience Act, PCI DSS 4.0, and FDA cybersecurity guidance all require or strongly recommend SBOMs. This isn't optional anymore.

---

## 🔗 Useful Links & References

- [Anchore Syft Documentation](https://github.com/anchore/syft)
- [Anchore Grype Vulnerability Scanner](https://github.com/anchore/grype)
- [CycloneDX Specification](https://cyclonedx.org/)
- [SPDX Specification](https://spdx.dev/)
- [CISA SBOM Resources & Guidance](https://www.cisa.gov/sbom)
- [NIST Executive Order 14028 Information](https://www.nist.gov/itl/executive-order-14028-improving-nations-cybersecurity)
- [OWASP Dependency-Track](https://dependencytrack.org/)
- [Sigstore Cosign Attestation Guide](https://docs.sigstore.dev/cosign/attestation/)


