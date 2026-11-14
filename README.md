# 🧠 Full-Stack Software Engineering & Architecture Mastery Platform

An interactive, disciplined, 90-day mastery training system covering **7 unified disciplines of modern computer science and engineering**:
1. 🧠 **Programming Logic & Problem-Solving** (Data Structures & Algorithms in JavaScript/Node.js)
2. 💡 **General Logic Building & Mental Models** (First Principles, Inversion, Deductive Logic, Invariants)
3. 🏛️ **System Design** (Low-Level Design, High-Level Design, and Distributed Systems)
4. 💾 **Database Engineering** (SQL, NoSQL, B-Trees, LSM-Trees, Sharding, Replication, MVCC)
5. 🤖 **AI & Machine Learning Engineering** (LLMs, Prompt Engineering, Embeddings, RAG, Autonomous Agents, MLOps)
6. ☁️ **DevOps & Cloud Infrastructure** (Linux, Docker, CI/CD, Kubernetes, GitOps, Terraform, SRE)
7. 🛡️ **DevSecOps & Cybersecurity** (Threat Modeling, OWASP Top 10, SAST/DAST, Secret Management, Zero Trust)

---

## 🚀 Quick Start Guide

### 1. View Your Progress Dashboard
```bash
npm run status
```

### 2. Launch the Platform Navigator CLI
```bash
npm start
```
From here you can access all 7 disciplines for any day:
- `view <day>` — Read Logic/DSA concept & 10 curated problems
- `logic <day>` — View General Logic Building & Mental Models (`logic-building.md`)
- `design <day>` — View System Design blueprint (`system-design.md`)
- `db <day>` — View Database Engineering module (`database.md`)
- `ai <day>` — View AI & Machine Learning module (`ai.md`)
- `devops <day>` — View DevOps & Cloud Infrastructure module (`devops.md`)
- `sec <day>` — View DevSecOps & Cybersecurity module (`devsecops.md`)
- `test <day>` — Run the automated verification test harness
- `list [level]` — List days across Levels 1 to 7

### 3. Direct Command-Line Access
```bash
# Run tests for Day 1:
npm test 1

# View specific discipline tracks for Day 1:
node platform/cli.js view 1       # Logic & 10 DSA Problems
node platform/cli.js logic 1      # General Logic & First Principles
node platform/cli.js design 1     # System Design LLD
node platform/cli.js db 1         # Database Engineering
node platform/cli.js ai 1         # AI & Prompt Engineering
node platform/cli.js devops 1     # DevOps & Docker Foundations
node platform/cli.js sec 1        # DevSecOps & Threat Modeling
```

---

## 🏗️ Architecture & Directory Layout

```text
logic-build/
├── curriculum/
│   ├── ROADMAP_90_DAYS.md      # Complete multi-track 90-day syllabus
│   └── METHODOLOGY.md          # 10-Step Pipeline, Mistake Taxonomy & 4-Tier Hint Protocol
├── platform/
│   ├── cli.js                  # Multi-track terminal navigator
│   ├── runner.js               # Zero-dependency test runner with execution metrics
│   ├── tracker.js              # State & diagnostic mistake tracking system
│   └── state.json              # Persistent progress file
├── practice/
│   ├── day-01/ ... day-90/     # 90 Complete Multi-Track Daily Modules
│   │   ├── README.md           # 🧠 Logic concept, visualization, and 10 problems
│   │   ├── challenge.js        # 💻 Starter function & automated unit tests
│   │   ├── thinking-workspace.md # 📝 10-Step Thinking-Before-Coding template
│   │   ├── logic-building.md   # 💡 General Logic Building & Mental Models
│   │   ├── system-design.md    # 🏛️ System Design Architecture (LLD/HLD)
│   │   ├── database.md         # 💾 Database Engineering (SQL/NoSQL/Internals)
│   │   ├── ai.md               # 🤖 AI & LLM Engineering (RAG, Agents, MLOps)
│   │   ├── devops.md           # ☁️ DevOps & Cloud (Docker, K8s, CI/CD, IaC)
│   │   └── devsecops.md        # 🛡️ DevSecOps & Security (OWASP, Zero Trust, OPA)
├── scripts/
│   ├── generate-all-days.js    # DSA & Problem-solving generation engine
│   ├── generate-system-design.js # System design compilation engine
│   ├── generate-all-tracks.js  # Database, AI, DevOps, DevSecOps compiler
│   └── generate-logic-building.js # General logic building compiler
└── package.json
```

---

## 🎯 The 7 Progression Levels

| Level | Range | 🧠 Logic & DSA | 💡 General Logic | 🏛️ System Design | 💾 Database | 🤖 AI & ML | ☁️ DevOps | 🛡️ DevSecOps |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **L1** | 1–14 | State, Branches | First Principles, Inversion | Single-Process LLD | Relational SQL | Prompt Eng, Tokens | Linux, Docker | Threat Modeling |
| **L2** | 15–28 | Loops, Digits | Induction, Invariants | Design Patterns | B-Trees, Indexes | Embeddings, Vector | CI/CD, Git Actions | SAST/DAST, SCA |
| **L3** | 29–42 | Arrays, Strings | Problem Reduction | Storage & Caching | ACID, NoSQL | Advanced RAG | Terraform IaC | Secrets, Vault |
| **L4** | 43–52 | Modular, Recursion | Abstraction, Purity | Networking, APIs | Replication, HA | Autonomous Agents | K8s Pods, Ingress | Supply Chain, SBOM |
| **L5** | 53–66 | Stacks, Trees | Structural Invariants | Distributed Core | Sharding, OLAP | Fine-Tuning, vLLM | GitOps, ArgoCD | Cloud IAM, OIDC |
| **L6** | 67–78 | Algorithms, DP | Heuristics, Complexity | Resiliency, Mesh | Kernel Tuning | LLMOps, Eval | Prometheus, SRE | eBPF, Runtime Sec |
| **L7** | 79–90 | Capstones | Master Mental Models | Netflix, Uber HLD | Stripe Ledger | Frontier Agents | Multi-Region IDP | Red Team, Zero Trust |
