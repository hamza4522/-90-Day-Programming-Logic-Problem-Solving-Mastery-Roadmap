# Lab 2.3 — SCA: Software Composition Analysis with Trivy & Snyk
**Phase**: 2 — CI/CD Security  
**Difficulty**: ⭐⭐ Intermediate  
**Estimated Time**: 2–3 hours  
**Category**: Software Composition Analysis (SCA), Dependency Security

---

## 🎯 Objective

Implement **Software Composition Analysis (SCA)** to detect vulnerabilities in open-source dependencies and third-party libraries. 80-90% of modern applications are open-source code — if you're not scanning your dependencies, you're flying blind.

---

## 📋 Problem Statement

Your company's Node.js microservice uses dozens of npm packages, some of which have known critical CVEs. The security team has mandated that **no application with a CRITICAL severity dependency vulnerability** may be deployed to production.

You need to:
1. Identify all vulnerabilities in your current dependencies
2. Build a CI gate that blocks deployments of vulnerable code
3. Generate an SBOM (Software Bill of Materials) for compliance
4. Set up continuous monitoring for newly disclosed CVEs

---

## 🛠️ Prerequisites

- Node.js & npm installed
- Docker installed
- GitHub/GitLab account

---

## 📋 Tasks

### Task 1: Create a Vulnerable Node.js App

Create a Node.js application that intentionally uses known-vulnerable packages:

```bash
mkdir sca-lab && cd sca-lab
npm init -y
```

Install vulnerable packages (these had real CVEs):
```bash
# Install packages with known historical vulnerabilities
# Note: These are older versions intentionally
npm install express@4.17.1
npm install lodash@4.17.4
npm install axios@0.18.0
npm install minimist@1.2.0
npm install node-fetch@2.6.0
npm install jsonwebtoken@8.5.1
```

Create `index.js`:
```javascript
const express = require('express');
const axios = require('axios');
const _ = require('lodash');
const jwt = require('jsonwebtoken');

const app = express();

app.get('/data', async (req, res) => {
  const data = _.merge({}, { admin: false }, req.body);  // Prototype pollution!
  res.json(data);
});

app.get('/token', (req, res) => {
  const token = jwt.sign({ user: 'test' }, 'secret');  // Weak secret
  res.json({ token });
});

app.listen(3000, () => console.log('Running on port 3000'));
```

### Task 2: Run npm Audit (Baseline)

1. Run `npm audit` and document the findings
2. Answer: How many vulnerabilities? What severity levels?
3. Run `npm audit --json > npm-audit.json` to get machine-readable output
4. What is the **highest severity CVE** found? Look it up on nvd.nist.gov

### Task 3: Scan with Trivy

1. Install Trivy
2. Run a **filesystem scan** against your project directory
3. Run with `--severity CRITICAL,HIGH` — note the output
4. Generate a **SARIF report** for GitHub upload
5. Compare Trivy's findings with `npm audit` — are they the same? Different? Why?

### Task 4: Scan with Snyk (Free Tier)

1. Create a free Snyk account at [snyk.io](https://snyk.io)
2. Install Snyk CLI and authenticate
3. Run `snyk test` against your project
4. Run `snyk monitor` to track the project in Snyk's dashboard
5. Note: Snyk often provides **fix PRs** automatically — explore this feature

### Task 5: CI/CD Integration

Create `.github/workflows/sca.yml` with:
- Trivy filesystem scan with `--exit-code 1` on CRITICAL
- npm audit with exit code on high severity
- SBOM generation using Trivy
- Upload SARIF results to GitHub Security tab
- Upload SBOM as a pipeline artifact

### Task 6: SBOM Generation

Generate a Software Bill of Materials in multiple formats:
1. **CycloneDX** format (most common for compliance)
2. **SPDX** format (used by GitHub/Linux Foundation)

Use the SBOM to answer: **List all direct + transitive dependencies with their licenses.**

---

## 📝 Deliverables

1. `package.json` with vulnerable dependencies
2. `npm-audit.json` — raw audit output
3. `trivy-report.sarif` — SARIF format for GitHub
4. `sbom-cyclonedx.json` — SBOM in CycloneDX format
5. `sbom-spdx.json` — SBOM in SPDX format
6. `.github/workflows/sca.yml` — CI pipeline
7. `findings-comparison.md` — Compare npm audit vs Trivy vs Snyk findings

---

## ❓ Questions to Answer

1. What is a **CVE** vs a **CVSS score**? How is the CVSS score calculated?
2. Trivy found more/fewer issues than npm audit. Why might two tools find different vulnerabilities for the same dependency?
3. What is **dependency confusion** and how is it different from a vulnerable dependency?
4. Your team says "we can't upgrade this package because it will break our API." What is the DevSecOps response?
5. What information in an **SBOM** is required for **SOC2 compliance**? For **HIPAA**?

---

> 💡 **Real CVE Context**: 
> - `lodash@4.17.4` has **prototype pollution** (CVE-2018-3721, CVSSv3: 6.5)
> - `minimist@1.2.0` has **prototype pollution** (CVE-2020-7598, CVSSv3: 5.6)
> - `axios@0.18.0` has **SSRF** (CVE-2019-10742, CVSSv3: 7.5)

> ⚠️ **Production warning**: Do not use these vulnerable package versions in real applications!
