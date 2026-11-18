# Lab 1.2 — Threat Modeling a CI/CD Pipeline
**Phase**: 1 — Security Foundation  
**Difficulty**: ⭐⭐ Beginner–Intermediate  
**Estimated Time**: 2–3 hours  
**Category**: Threat Modeling, Security Design

---

## 🎯 Objective

Learn to identify security threats in a CI/CD pipeline **before building defenses**. Threat modeling forces you to think like an attacker during the design phase — saving far more time and money than fixing issues after deployment.

---

## 📋 Problem Statement

Your company has the following CI/CD pipeline:

```
Developer Laptop
      │
      │  git push
      ▼
GitHub Repository
      │
      │  webhook trigger
      ▼
GitHub Actions Runner
      │
      ├── npm install (fetch dependencies from npm registry)
      ├── docker build
      ├── docker push → DockerHub (uses stored secret)
      │
      ▼
AWS EKS Cluster (Production)
      │
      └── kubectl apply (using KUBECONFIG from GitHub secrets)
```

**Your Task**: Perform a threat model of this pipeline using the **STRIDE methodology**.

---

## 🧠 STRIDE Methodology Reference

| Letter | Threat Type | Question to Ask |
|---|---|---|
| **S** | Spoofing | Can someone pretend to be a legitimate user/system? |
| **T** | Tampering | Can someone modify data or code in transit/at rest? |
| **R** | Repudiation | Can someone deny performing an action? |
| **I** | Information Disclosure | Can sensitive data be exposed? |
| **D** | Denial of Service | Can someone make the system unavailable? |
| **E** | Elevation of Privilege | Can someone gain more permissions than intended? |

---

## 📋 Tasks

### Task 1: Draw the Data Flow Diagram (DFD)
Recreate the pipeline diagram above and add:
- **Trust boundaries** (where does trust change? e.g., Internet → CI Runner)
- **Data flows** (what data moves between components?)
- **External entities** (npm registry, DockerHub, AWS)
- **Processes** (build, test, deploy)
- **Data stores** (GitHub Secrets, Docker registry)

You can use [OWASP Threat Dragon](https://www.threatdragon.com/) (free, browser-based) or draw it on paper.

### Task 2: Apply STRIDE to Each Component

For each component in the pipeline, identify at least **one threat per applicable STRIDE category**:

**Components to analyze**:
1. GitHub Repository
2. GitHub Actions Secrets Store
3. CI/CD Runner (build environment)
4. npm Registry (external dependency)
5. DockerHub (container registry)
6. AWS EKS Cluster (deployment target)

### Task 3: Risk Rating

Rate each threat you identify using the **DREAD model**:
- **D**amage (1–3): How bad is the impact?
- **R**eproducibility (1–3): How easy to reproduce?
- **E**xploitability (1–3): How easy to exploit?
- **A**ffected users (1–3): How many users affected?
- **D**iscoverability (1–3): How easy to find the vulnerability?

Score = Average of all 5. **High ≥ 2.5**, **Medium 1.5–2.4**, **Low < 1.5**

### Task 4: Propose Mitigations

For your top 5 threats (highest DREAD score), propose a specific technical mitigation that you could implement in the CI/CD pipeline.

---

## 📝 Deliverables

Create a `threat-model-report.md` file with:
1. Your DFD description (text or embedded image)
2. STRIDE threat table for each component
3. Top 5 threats with DREAD scores
4. Proposed mitigations

---

## ❓ Questions to Answer

1. Which component in the pipeline has the **most attack surface**?
2. What is the **blast radius** if a developer's laptop is compromised?
3. How would you detect if a **dependency was tampered with** in the npm registry?
4. What would happen if your **GitHub Actions secrets were leaked**? How would you recover?
5. Where would you place **audit logging** in this pipeline?

---

> 💡 **Hint**: Think about supply chain attacks (SolarWinds style) — what if a package you `npm install` is malicious?

> 💡 **Real-world context**: The 2020 SolarWinds attack compromised the CI/CD build system. The 2021 Codecov breach compromised a CI bash uploader script. These are exactly the threats you're modeling.
