# Day 5: System Design — Access Control Architectures: RBAC vs ABAC

**Track**: Low-Level Design (LLD)  
**Level**: Level 1  
**Target Architecture**: Enterprise SaaS multi-tenant permission engines

---

## 🎯 Architectural Objective
Role-Based Access Control (RBAC) groups permissions into roles (Admin, Editor, Viewer). Attribute-Based Access Control (ABAC) evaluates context (IP, department, time, resource owner).

---

## 🏛️ System Architecture Topology
```text
[ Request: User + Action + Resource ]
                   │
                   ▼
       [ Policy Enforcement Point (PEP) ]
                   │
                   ▼
       [ Policy Decision Point (PDP) ]
         ├── RBAC: Does User have Role with Permission?
         └── ABAC: Is User the owner AND Department == 'Finance'?
                   │
         [ ALLOW / DENY ]
```

---

## 🧱 Component Breakdown & Responsibilities

| Component | Technology / Pattern | Function & Architectural Invariant |
| :--- | :--- | :--- |
| **API Perimeter** | Reverse Proxy / Gateway | TLS termination, rate limiting, authentication verification, and request routing. |
| **Service Layer** | Stateless Microservices | Core business rules, data transformation, validation, and domain state logic. |
| **Cache Tier** | Distributed In-Memory (Redis/Memcached) | Sub-millisecond reads, query caching, session management, and hot-key protection. |
| **Persistence Tier** | Relational / NoSQL Engine | ACID transactional safety, persistent storage, replication, and data partitioning. |
| **Asynchronous Bus** | Message Queue / Event Log | Decoupling slow background operations, peak absorption, and eventual consistency. |

---

## 💾 Schema & Data Contract Design
```sql
CREATE TABLE role_permissions (
  role_id INT REFERENCES roles(id),
  permission VARCHAR(64) NOT NULL,
  PRIMARY KEY (role_id, permission)
);
```

---

## ⚖️ Architectural Trade-offs & Bottleneck Analysis

### 1. Consistency vs. Latency
- RBAC is simple to query and index, but lacks granularity. ABAC is hyper-flexible but requires complex rule evaluation engines that can slow down API responses.

### 2. Failure Modes & Mitigations
- **Single Point of Failure (SPOF)**: Ensure all stateless tiers are horizontally auto-scaled across multi-availability zones (AZ).
- **Network Partition**: Plan fallback behavior when downstream dependencies become unreachable.
- **Cascading Failures**: Implement Circuit Breakers and Exponential Backoff with Jitter on all external RPC calls.

---

## 🛠️ Hands-On Architectural Exercise
> **Challenge**:  
> Design a permissions table schema that allows both role-based inheritance and fine-grained per-document overrides.

### Your Architectural Design Space
1. **Functional Requirements**:
   - [ ] Primary operations supported
   - [ ] Latency SLAs (e.g. p99 < 100ms)
2. **Non-Functional Requirements**:
   - [ ] High Availability (99.99%)
   - [ ] Data durability guarantees
3. **Draft Your Component Diagram & Notes Below**:
```text
[ Client ] ──> [ ... ]
```
