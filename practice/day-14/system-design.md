# Day 14: System Design — Weekly Assessment 2: Level 1 System Design Certification

**Track**: Assessment  
**Level**: Level 1  
**Target Architecture**: Design an In-Memory Distributed Job Queue Runner

---

## 🎯 Architectural Objective
Comprehensive review of Level 1: Stateful vs stateless boundaries, input sanitization, error architecture, and clean OOP boundaries.

---

## 🏛️ System Architecture Topology
```text
[ Producer ] ──> [ Job Validator ] ──> [ Priority Queue ] ──> [ Worker Pool ] ──> [ Dead Letter Queue ]
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
// Architectural evaluation document across reliability, failure recovery, and type contracts
```

---

## ⚖️ Architectural Trade-offs & Bottleneck Analysis

### 1. Consistency vs. Latency
- Evaluating in-memory speed vs crash recovery and persistence guarantees.

### 2. Failure Modes & Mitigations
- **Single Point of Failure (SPOF)**: Ensure all stateless tiers are horizontally auto-scaled across multi-availability zones (AZ).
- **Network Partition**: Plan fallback behavior when downstream dependencies become unreachable.
- **Cascading Failures**: Implement Circuit Breakers and Exponential Backoff with Jitter on all external RPC calls.

---

## 🛠️ Hands-On Architectural Exercise
> **Challenge**:  
> Draft the comprehensive System Specification Document for a resilient single-node job processor with failure retries and concurrency limits.

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
