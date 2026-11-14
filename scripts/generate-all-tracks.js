/**
 * Multi-Track Curriculum Generator: Database, AI, DevOps, DevSecOps
 * Generates dedicated daily modules for all 90 days across 4 specialized engineering tracks.
 */
const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..', 'practice');

// Track 1: Database Engineering Syllabi
const DB_TOPICS = [
  // L1: 1-14
  { day: 1, title: "Relational Modeling, Primary Keys & Referential Integrity", core: "Entity modeling, composite PKs, foreign key cascades, orphan records" },
  { day: 2, title: "SQL Query Execution Order & Set Semantics", core: "FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY execution order" },
  { day: 3, title: "NULL Semantics & Three-Valued Logic in SQL", core: "TRUE, FALSE, UNKNOWN. Pitfalls with NOT IN (SELECT NULL) and COALESCE" },
  { day: 4, title: "Advanced Relational Joins & Execution Mechanics", core: "INNER, LEFT, RIGHT, FULL OUTER, CROSS, and SELF Joins with real schemas" },
  { day: 5, title: "Subqueries, Correlated Subqueries & CTEs", core: "Common Table Expressions, recursive CTEs for hierarchical tree traversal" },
  { day: 6, title: "Window Functions: Analytical Query Mastery", core: "ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD, and running cumulative sums" },
  { day: 7, title: "Database Assessment 1: Complex Relational Schema & Reporting", core: "Comprehensive schema design and reporting analytics diagnostic" },
  { day: 8, title: "Schema Normalization: 1NF through BCNF in Practice", core: "Eliminating insertion, deletion, and update anomalies with normalization" },
  { day: 9, title: "Database Constraints: CHECK, UNIQUE & Exclusion Rules", core: "Enforcing business invariants at the database hardware layer" },
  { day: 10, title: "Materialized Views & Incremental View Maintenance", core: "Caching heavy aggregation queries on disk with REFRESH MATERIALIZED VIEW" },
  { day: 11, title: "Stored Procedures, Functions & Database Triggers", core: "Procedural PL/pgSQL vs application logic: tradeoffs, maintenance, performance" },
  { day: 12, title: "Database Schema Migrations & Version Control", core: "Zero-downtime expand-contract migration patterns using Flyway/Knex" },
  { day: 13, title: "PostgreSQL Data Types: JSONB, Arrays, UUID & Range Types", core: "Semi-structured JSONB storage with GIN indexing vs strict relational columns" },
  { day: 14, title: "Database Assessment 2: Schema Design & Migration Benchmark", core: "Certification assessment for Level 1 Relational Foundations" },
  // L2: 15-28
  { day: 15, title: "Storage Engine Internals: Pages, Tuples & Buffer Pools", core: "8KB page layout, slotted page architecture, buffer pool cache hit ratio" },
  { day: 16, title: "B-Tree Indexes: Structure, Height & Leaf Traversals", core: "Balanced tree fan-out, root-to-leaf traversal, logarithmic lookup proofs" },
  { day: 17, title: "Index Scans vs Sequential Scans vs Bitmap Heap Scans", core: "When the query planner chooses Seq Scan over Index Scan based on selectivity" },
  { day: 18, title: "Composite Indexes & The Leftmost Prefix Rule", core: "Multi-column index order (A, B, C), range query stop points" },
  { day: 19, title: "Covering Indexes (INCLUDE Clause) & Index-Only Scans", core: "Eliminating random disk reads by storing payload in index leaf nodes" },
  { day: 20, title: "Partial Indexes & Expression/Functional Indexes", core: "Indexing WHERE active = true, and lower(email) expression lookups" },
  { day: 21, title: "Database Assessment 3: Index Tuning & EXPLAIN Plan Analysis", core: "Hands-on diagnostic: diagnosing and eliminating slow sequential scans" },
  { day: 22, title: "Specialized Indexes: Hash, GiST & GIN Inverted Indexes", core: "GIN for JSONB tags and array lookups, GiST for geometric & range coordinates" },
  { day: 23, title: "PostgreSQL Full-Text Search: tsvector & tsquery", core: "Lexeme stemming, stop-word elimination, and GIN indexed full-text search" },
  { day: 24, title: "Reading EXPLAIN (ANALYZE, BUFFERS) Execution Trees", core: "Cost estimates, actual time, loops, shared hit blocks, memory spill" },
  { day: 25, title: "Join Execution Algorithms: Nested Loop, Hash & Merge Join", core: "How the database engine physically pairs rows from two tables" },
  { day: 26, title: "MVCC (Multi-Version Concurrency Control) & VACUUM", core: "xmin/xmax row versions, dead tuples, table bloat, autovacuum tuning" },
  { day: 27, title: "Connection Pooling Architecture: pgBouncer Deep Dive", core: "Session vs Transaction vs Statement pooling; managing 10,000 clients" },
  { day: 28, title: "Database Assessment 4: Storage & Indexing Performance Benchmark", core: "Level 2 certification: tuning high-throughput query workloads" },
  // L3: 29-42
  { day: 29, title: "ACID Internals: Durability & Write-Ahead Logging (WAL)", core: "Fsync, write-ahead logging buffer, crash recovery, dirty page flush" },
  { day: 30, title: "Transaction Isolation Levels & Concurrency Anomalies", core: "Read Committed vs Repeatable Read vs Serializable; preventing write skew" },
  { day: 31, title: "Pessimistic Locking: SELECT FOR UPDATE & SKIP LOCKED", core: "Row-level locks, non-blocking queue processing with SKIP LOCKED" },
  { day: 32, title: "Optimistic Locking & Versioning Patterns", core: "Preventing lost updates in concurrent web APIs without database row locks" },
  { day: 33, title: "Document Stores: MongoDB Architecture & WiredTiger Engine", core: "BSON format, document embedding vs referencing, collections, indexes" },
  { day: 34, title: "MongoDB Aggregation Pipeline: $match, $group, $lookup", core: "Multi-stage analytical pipelines and document transformations" },
  { day: 35, title: "Database Assessment 5: Designing High-Scale Polyglot Persistence", core: "Choosing optimal storage tiers for transactional vs document data" },
  { day: 36, title: "Key-Value Stores: Redis Memory Internals & Data Structures", core: "SDS strings, skiplists for sorted sets, ziplists, memory defragmentation" },
  { day: 37, title: "Redis Persistence: RDB Snapshots vs AOF Logs", core: "Forking memory, background rewrite, durability vs write speed trade-offs" },
  { day: 38, title: "Wide-Column Stores: Apache Cassandra & ScyllaDB", core: "Partition keys, clustering columns, LSM-trees, memtables, SSTables" },
  { day: 39, title: "Time-Series Databases: InfluxDB & TimescaleDB Hypertables", core: "Time chunking, downsampling, retention policies, compression algorithms" },
  { day: 40, title: "Graph Databases: Neo4j & Cypher Query Engine", core: "Index-free adjacency, node-relationship-property traversals in O(1)" },
  { day: 41, title: "ORM Architectural Pitfalls & Anti-Patterns", core: "N+1 query traps, object hydration overhead, memory leaks in TypeORM/Prisma" },
  { day: 42, title: "Database Assessment 6: Midterm NoSQL & Storage Engine Mastery", core: "Comprehensive evaluation across SQL and NoSQL storage paradigms" },
  // L4: 43-52
  { day: 43, title: "Database Replication: Physical Streaming vs Logical Replication", core: "WAL sender, WAL receiver, publication-subscription architecture" },
  { day: 44, title: "Replication Lag, Read-After-Write Consistency & Sync Modes", core: "Synchronous commit levels (off, local, remote_write, on)" },
  { day: 45, title: "Read Replicas, Load Balancing & Read-Write Split Routers", core: "Routing write queries to primary and read traffic to replica pools" },
  { day: 46, title: "High-Availability Failover & Leader Election with Patroni", core: "DCS integration (etcd/Consul), health probes, split-brain fencing" },
  { day: 47, title: "Backup Strategies: pg_dump vs Physical Basebackup & PITR", core: "Point-In-Time Recovery replay up to specific timestamp or transaction ID" },
  { day: 48, title: "Zero-Downtime Blue-Green Database Migrations", core: "Dual-writing, backfilling, CDC validation, cutover execution" },
  { day: 49, title: "Database Assessment 7: High Availability Cluster Architecture", core: "Designing multi-node failover with zero data loss guarantee (RPO=0)" },
  { day: 50, title: "Database Encryption at Rest (TDE) & In-Transit (TLS)", core: "Key management, AES-256 block encryption, SSL certificate validation" },
  { day: 51, title: "Database Auditing, Row-Level Security (RLS) & Compliance", core: "Postgres RLS policies for multi-tenant SaaS isolation" },
  { day: 52, title: "Database Disaster Recovery Simulation Drill", core: "Restoring corrupted databases from WAL archives under strict RTO limits" },
  // L5: 53-66
  { day: 53, title: "Horizontal Table Partitioning in PostgreSQL", core: "Declarative range, list, and hash partitioning; partition pruning" },
  { day: 54, title: "Database Sharding: Application-Level vs Middleware Sharding", core: "Routing queries via shard keys (Vitess, Citus, Spock)" },
  { day: 55, title: "Sharding Key Strategy: Hotspot Avoidance & Rebalancing", core: "Consistent hashing, virtual shards, avoiding skewed traffic distributions" },
  { day: 56, title: "Distributed Transactions: Two-Phase Commit (2PC) in Databases", core: "Prepare phase, commit phase, coordinator failure recovery" },
  { day: 57, title: "Distributed SQL: CockroachDB & Google Spanner Internals", core: "TrueTime API, Multi-Raft consensus per range, serializable transactions" },
  { day: 58, title: "Columnar OLAP Engines: ClickHouse Architecture", core: "MergeTree engine, columnar compression (LZ4/ZSTD), vectorized query execution" },
  { day: 59, title: "Database Assessment 8: Designing a Sharded Financial Ledger", core: "Multi-shard consensus and zero-balance transaction integrity" },
  { day: 60, title: "Change Data Capture (CDC): Debezium & Kafka Connect", core: "Streaming database transaction logs to message brokers in real-time" },
  { day: 61, title: "Real-Time Analytical Pipelines: ClickHouse + Kafka CDC", core: "Ingesting millions of events per second with sub-second OLAP queries" },
  { day: 62, title: "Distributed Deadlocks & Distributed Lock Management", core: "Wait-for graphs across distributed nodes, edge detection, victim abort" },
  { day: 63, title: "Dynamic Re-Sharding & Zero-Downtime Split Operations", core: "Splitting ranges on the fly without locking client writes" },
  { day: 64, title: "Data Lakes vs Data Warehouses: Parquet, Iceberg & Delta Lake", core: "Columnar disk files, ACID table formats on cloud object storage (S3)" },
  { day: 65, title: "Vector Databases for AI: pgvector vs Pinecone vs Qdrant", core: "Storing 1536-dimensional embeddings, HNSW graph index performance in SQL" },
  { day: 66, title: "Database Assessment 9: Distributed Scale Architecture Exam", core: "High-scale partitioning, replication, and distributed consensus evaluation" },
  // L6: 67-78
  { day: 67, title: "Linux Kernel Tuning for High-Performance Databases", core: "vm.swappiness, dirty_background_ratio, huge pages, disk I/O schedulers" },
  { day: 68, title: "PostgreSQL Memory Configuration Tuning", core: "shared_buffers, work_mem, maintenance_work_mem, effective_cache_size" },
  { day: 69, title: "Disk I/O Subsystems: NVMe, IOPS, Write Amplification & RAID", core: "Random vs sequential I/O, RAID 10 vs RAID 5 for write-heavy databases" },
  { day: 70, title: "Query Profiling with pg_stat_statements", core: "Identifying the top 1% slowest queries consuming 90% of total CPU time" },
  { day: 71, title: "Database Connection Pool Sizing Math", core: "Formula: connections = ((core_count * 2) + effective_spindle_count)" },
  { day: 72, title: "Database Bloat Remediation: pg_repack & Zero-Lock Table Rebuilds", core: "Online table defragmentation without exclusive access table locks" },
  { day: 73, title: "Database Assessment 10: Live Production Outage & Bottleneck Triage", core: "Diagnosing live lock contention, connection exhaustion, and table bloat" },
  { day: 74, title: "Database Security: SQL Injection Proofing & Prepared Statements", core: "How binary protocol parameter binding completely eliminates injection" },
  { day: 75, title: "Database Observability: Metrics, Slow Query Logs & PGBouncer Stats", core: "Prometheus postgres_exporter, pgbouncer pools, transaction duration alerts" },
  { day: 76, title: "Data Archival & Cold Tier Partition Offloading to S3", core: "Tiered storage: active data on NVMe, older data archived to Parquet/S3" },
  { day: 77, title: "Database Chaos Engineering: Simulating Network Partitions & Disk Full", core: "Injecting disk latency, abrupt node kill, evaluating automatic failover" },
  { day: 78, title: "Database Assessment 11: Enterprise Database Hardening & Performance", core: "Level 6 certification: enterprise tuning, security, and resiliency" },
  // L7: 79-90
  { day: 79, title: "Production Case Study: Stripe's Globally Distributed Ledger Database", core: "Dual-entry accounting, immutable audit trails, and zero double-spend" },
  { day: 80, title: "Production Case Study: Uber's Spatio-Temporal Database Architecture", core: "Real-time location indexing, Schemaless store, and H3 hexagonal mapping" },
  { day: 81, title: "Production Case Study: Discord's Migration to ScyllaDB", core: "Handling trillions of chat messages: why Cassandra hit GC pauses and how C++ ScyllaDB won" },
  { day: 82, title: "Modern Cloud Data Warehousing: Snowflake & BigQuery", core: "Separation of compute and storage, micro-partitions, slot allocation" },
  { day: 83, title: "The Modern Data Stack: dbt, Orchestration & Data Quality Tests", core: "Transformations inside the data warehouse, lineage DAGs, automated data assertions" },
  { day: 84, title: "Real-Time User Facing Analytics with Apache Pinot", core: "Star-tree indexing, segment stores, sub-50ms analytics over billions of records" },
  { day: 85, title: "Database Assessment 12: High-Level Data Architecture Exam", core: "Architecting the data foundation for a global real-time advertising platform" },
  { day: 86, title: "Database Interview Mastery: Data Modeling for Senior Staff Engineers", core: "Framework for 45-minute database design rounds: entities, indexes, scaling" },
  { day: 87, title: "Real-World Design: High-Throughput Auction & Bidding Data Architecture", core: "Atomic bid placement, deadline validation, high concurrency race condition defense" },
  { day: 88, title: "Enterprise Database Runbooks & Post-Mortem Engineering", core: "Standard operating procedures for primary failovers, restore verification, root-cause analysis" },
  { day: 89, title: "90-Day Comprehensive Database Capstone Examination", core: "Full-spectrum final assessment covering SQL, NoSQL, Internals, Sharding, and Tuning" },
  { day: 90, title: "Master Database Architect Graduation & Production Readiness Checklist", core: "Final scorecard, production DB launch checklist, long-term mastery trajectory" }
];

// Helper to synthesize AI, DevOps, DevSecOps metadata for all 90 days
function getTrackMeta(track, day) {
  const lvl = Math.min(7, Math.ceil(day / 13));
  if (track === 'ai') {
    return {
      title: `AI & ML Engineering — Day ${day}`,
      topic: day <= 14 ? "AI Fundamentals & Prompt Engineering" :
             day <= 28 ? "Embeddings & Vector Databases" :
             day <= 42 ? "Production Retrieval-Augmented Generation (RAG)" :
             day <= 52 ? "Autonomous Agents & Tool Execution" :
             day <= 66 ? "Fine-Tuning & Open-Source LLMs (vLLM/Ollama)" :
             day <= 78 ? "LLMOps, Evaluation & Safety Guardrails" :
                         "Frontier Architectures & Enterprise AI Systems",
      detail: `Day ${day} covers production AI engineering techniques, focusing on practical implementation, latency optimization, and robust evaluation.`
    };
  } else if (track === 'devops') {
    return {
      title: `DevOps & Cloud Infrastructure — Day ${day}`,
      topic: day <= 14 ? "Linux Systems, Networking & Docker Foundations" :
             day <= 28 ? "Enterprise CI/CD Pipelines & Release Engineering" :
             day <= 42 ? "Infrastructure as Code (Terraform) & Cloud Networking" :
             day <= 52 ? "Kubernetes Core Orchestration & Ingress Traffic" :
             day <= 66 ? "Kubernetes Advanced (StatefulSets, GitOps with ArgoCD)" :
             day <= 78 ? "Observability, Monitoring (Prometheus/Grafana) & SRE" :
                         "Platform Engineering, Multi-Region Cloud & FinOps",
      detail: `Day ${day} delivers hands-on cloud and DevOps infrastructure knowledge with battle-tested automation configurations and production architectures.`
    };
  } else {
    // devsecops
    return {
      title: `DevSecOps & Cybersecurity — Day ${day}`,
      topic: day <= 14 ? "Application Security, OWASP Top 10 & Threat Modeling" :
             day <= 28 ? "Automated Security Testing (SAST, DAST, SCA) in CI/CD" :
             day <= 42 ? "Secrets Management, Vault & Cryptographic Architecture" :
             day <= 52 ? "Container & Software Supply Chain Security (SBOM, Cosign)" :
             day <= 66 ? "Cloud Security (IAM, Zero Trust, OIDC Workload Identity)" :
             day <= 78 ? "Runtime Security (eBPF, Falco) & Incident Response" :
                         "Enterprise Governance, Red Teaming & Zero-Trust Capstones",
      detail: `Day ${day} reinforces defense-in-depth security principles, secure coding standards, and automated vulnerability detection across the software lifecycle.`
    };
  }
}

function generateTrackFiles() {
  console.log("Compiling Database, AI, DevOps, and DevSecOps modules for Days 1 to 90...");

  for (let d = 1; d <= 90; d++) {
    const dayStr = String(d).padStart(2, '0');
    const dayFolder = path.join(baseDir, `day-${dayStr}`);
    if (!fs.existsSync(dayFolder)) {
      fs.mkdirSync(dayFolder, { recursive: true });
    }

    const lvl = Math.min(7, Math.ceil(d / 13));

    // 1. Database Module (database.md)
    const dbInfo = DB_TOPICS[d - 1] || { day: d, title: `Database Engineering — Day ${d}`, core: "Advanced database engineering concepts" };
    const dbContent = `# Day ${d}: Database Engineering — ${dbInfo.title}

**Level**: Level ${lvl}  
**Core Topic**: ${dbInfo.core}

---

## 🎯 Engineering Objective
Master the foundational theory, physical storage mechanics, and production query strategies for ${dbInfo.title}.

---

## 🏛️ Storage & Architectural Model
\`\`\`text
[ Client Query Execution ]
          │
          ▼
   [ SQL Parser & Rewriter ]
          │
          ▼
   [ Query Optimizer (Cost-Based Optimizer) ]
          │
          ▼
   [ Execution Engine (Sequential / Index / Bitmap Scan) ]
          │
          ▼
   [ Buffer Pool Manager (8KB Pages in RAM) ]
          ├── Cache Hit  ──> Return Tuple
          └── Cache Miss ──> Disk I/O (Read from Tablespace)
\`\`\`

---

## 💻 Schema, DDL & Query Specification
\`\`\`sql
-- Production DDL and Query Architecture
CREATE TABLE IF NOT EXISTS system_records_day${d} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  status VARCHAR(32) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Targeted Indexing Strategy
CREATE INDEX IF NOT EXISTS idx_records_day${d}_tenant_status
ON system_records_day${d} (tenant_id, status);

-- Analytical Verification Query
EXPLAIN (ANALYZE, BUFFERS)
SELECT tenant_id, status, COUNT(*)
FROM system_records_day${d}
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
GROUP BY tenant_id, status;
\`\`\`

---

## ⚖️ Trade-offs & Performance Bottlenecks
- **Index Overhead**: While composite indexes drastically accelerate read filtering, each additional index incurs write amplification on \`INSERT\`, \`UPDATE\`, and \`DELETE\` operations.
- **Buffer Pool Pressure**: Keep working sets within \`shared_buffers\` to avoid disk I/O thrashing.
- **Concurrency Control**: Always be mindful of lock escalation and transaction isolation anomalies.

---

## 🛠️ Hands-On Database Exercise
> **Challenge**:  
> Formulate the optimal table schema, composite index, and \`EXPLAIN ANALYZE\` plan for high-throughput transactional queries relating to: **${dbInfo.core}**.
`;
    fs.writeFileSync(path.join(dayFolder, 'database.md'), dbContent, 'utf8');

    // 2. AI Module (ai.md)
    const aiInfo = getTrackMeta('ai', d);
    const aiContent = `# Day ${d}: AI & Machine Learning Engineering — ${aiInfo.title}

**Level**: Level ${lvl}  
**Track Focus**: ${aiInfo.topic}

---

## 🎯 Engineering Objective
${aiInfo.detail}

---

## 🧠 System Architecture & LLM Pipeline
\`\`\`text
[ User Prompt / Query ]
          │
          ▼
  [ Input Guardrail & Moderation ]
          │
          ▼
  [ Embedding Generation / Vector Search (RAG) ]
          ├── Dense Vector Index (HNSW)
          └── Sparse Keyword Index (BM25)
          │
          ▼
  [ Context Injection & Prompt Construction ]
          │
          ▼
  [ LLM Inference Engine (Streaming Tokenizer) ]
          │
          ▼
  [ Output Validator & Structured JSON Parser ]
\`\`\`

---

## 💻 Implementation & Prompt Engineering Specification
\`\`\`typescript
/**
 * Production AI Pipeline Pattern — Day ${d}
 */
interface PipelineConfig {
  model: string;
  temperature: number;
  maxTokens: number;
}

async function executeAIPipeline(prompt: string, config: PipelineConfig) {
  // 1. Guardrail validation
  // 2. Retrieval augmentations
  // 3. Inference call
  console.log(\`Executing AI Pipeline for Day ${d} with model: \${config.model}\`);
  return {
    status: "SUCCESS",
    day: ${d},
    topic: "${aiInfo.topic}"
  };
}
\`\`\`

---

## ⚖️ Architectural Trade-offs & Production Bottlenecks
- **Latency vs Quality**: Larger models yield higher reasoning quality but increase Time-To-First-Token (TTFT) and inference cost.
- **Context Window Utilization**: Guard against "Lost in the Middle" syndrome by pruning irrelevant chunks.
- **Determinism**: For structured tool calling, lock \`temperature: 0.0\` and use strict JSON schema validation.

---

## 🛠️ Hands-On AI Exercise
> **Challenge**:  
> Implement and benchmark a production pipeline focusing on **${aiInfo.topic}**, measuring latency, token consumption, and hallucination safety.
`;
    fs.writeFileSync(path.join(dayFolder, 'ai.md'), aiContent, 'utf8');

    // 3. DevOps Module (devops.md)
    const devopsInfo = getTrackMeta('devops', d);
    const devopsContent = `# Day ${d}: DevOps & Cloud Infrastructure — ${devopsInfo.title}

**Level**: Level ${lvl}  
**Track Focus**: ${devopsInfo.topic}

---

## 🎯 Engineering Objective
${devopsInfo.detail}

---

## 🏗️ Cloud Infrastructure & Deployment Topology
\`\`\`text
[ Developer Commit ] ──> [ GitHub Actions CI/CD ]
                                │ Build & Test
                                ▼
                       [ Container Registry (ECR/GHCR) ]
                                │ Immutable Image Digest
                                ▼
   [ Kubernetes Cluster (ArgoCD GitOps Sync) ]
     ├── Ingress Controller (TLS Termination)
     ├── Stateless Deployment (Auto-Scaled Pods)
     └── Cluster Monitoring (Prometheus + Grafana)
\`\`\`

---

## 💻 Infrastructure as Code (Terraform / Kubernetes Manifest)
\`\`\`yaml
# Production Deployment Manifest — Day ${d}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: service-day-${dayStr}
  labels:
    app: service-day-${dayStr}
    track: devops
spec:
  replicas: 3
  selector:
    matchLabels:
      app: service-day-${dayStr}
  template:
    metadata:
      labels:
        app: service-day-${dayStr}
    spec:
      containers:
      - name: main
        image: ghcr.io/org/service:v1.0.${d}
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        readinessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
\`\`\`

---

## ⚖️ SRE Trade-offs & Resilience Invariants
- **Resource Requests vs Limits**: Setting requests guarantees scheduling on nodes; setting limits prevents runaway memory leaks from triggering node-wide OOM kills.
- **Rollout Strategy**: Always configure \`maxSurge\` and \`maxUnavailable\` to guarantee zero downtime during rolling updates.
- **Observability**: Expose Prometheus metrics on \`/metrics\` for automated horizontal pod autoscaling (HPA).

---

## 🛠️ Hands-On DevOps Exercise
> **Challenge**:  
> Write the automated pipeline or deployment specification for **${devopsInfo.topic}** with built-in health checks and rolling update safety.
`;
    fs.writeFileSync(path.join(dayFolder, 'devops.md'), devopsContent, 'utf8');

    // 4. DevSecOps Module (devsecops.md)
    const secInfo = getTrackMeta('devsecops', d);
    const secContent = `# Day ${d}: DevSecOps & Cybersecurity — ${secInfo.title}

**Level**: Level ${lvl}  
**Track Focus**: ${secInfo.topic}

---

## 🎯 Engineering Objective
${secInfo.detail}

---

## 🛡️ Security Architecture & Defense-In-Depth Model
\`\`\`text
[ Developer Workstation ] ──> [ Pre-Commit Hooks (Gitleaks / Semgrep) ]
                                      │
                                      ▼
[ CI/CD Security Pipeline ]
  ├── SAST (CodeQL / SonarQube)
  ├── SCA (Software Dependency CVE Scanner - Trivy)
  ├── Secrets Scan (TruffleHog)
  └── Container Signing (Cosign Sigstore)
                                      │
                                      ▼
[ Kubernetes Admission Control (Kyverno / OPA Gatekeeper) ]
  └── Enforce: Non-Root, Verified Signatures, Read-Only Root FS
\`\`\`

---

## 💻 Security Policy & Automated Rule Configuration
\`\`\`yaml
# Security Policy / Kyverno Admission Control — Day ${d}
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: enforce-secure-workloads-day-${dayStr}
spec:
  validationFailureAction: Enforce
  background: true
  rules:
  - name: disallow-privileged-containers
    match:
      resources:
        kinds:
        - Pod
    validate:
      message: "Running privileged containers is strictly forbidden."
      pattern:
        spec:
          containers:
          - securityContext:
              privileged: false
              allowPrivilegeEscalation: false
              readOnlyRootFilesystem: true
              runAsNonRoot: true
\`\`\`

---

## ⚖️ Security Trade-offs & Risk Analysis
- **Developer Friction vs Security Rigor**: Block only high-confidence critical CVEs in PR gates to avoid breaking developer velocity, while triaging medium risks asynchronously.
- **Defense in Depth**: Never rely solely on perimeter firewalls; enforce least-privilege IAM and mutual TLS (mTLS) across internal microservices.
- **Zero Trust**: Always assume the network is hostile; authenticate and authorize every single request explicitly.

---

## 🛠️ Hands-On Security Exercise
> **Challenge**:  
> Perform a threat modeling analysis using STRIDE or configure an automated security policy for **${secInfo.topic}**.
`;
    fs.writeFileSync(path.join(dayFolder, 'devsecops.md'), secContent, 'utf8');
  }

  console.log("✔ Successfully created database.md, ai.md, devops.md, and devsecops.md for all 90 days!");
}

generateTrackFiles();

