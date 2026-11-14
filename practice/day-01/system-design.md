# Day 1: System Design — Single-Process Architecture, Memory Models & Statelessness

**Track**: Low-Level Design (LLD)  
**Level**: Level 1  
**Target Architecture**: Designing high-performance Node.js/V8 micro-services

---

## 🎯 Architectural Objective
Understand single-threaded event loop vs multi-threaded execution, heap/stack allocations, memory leak prevention, and why stateless server design enables infinite horizontal scalability.

---

## 🏛️ System Architecture Topology
```text
[ Client / Browser ]
        │ HTTP Requests
        ▼
[ Node.js Process (Single Threaded Event Loop) ]
  ├── Call Stack (LIFO execution)
  ├── V8 Memory Heap (Objects, Closures)
  └── Libuv Threadpool (File I/O, DNS, Crypto)
        │ Stateless Worker
        ▼
[ External Persistent State: Redis / Postgres ]
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
// In-Memory Session Cache vs External State
// Bad (Stateful in-memory leak prone):
const memorySessions = new Map();

// Good (Stateless horizontally scalable):
// Sessions persisted in external Redis with TTL
```

---

## ⚖️ Architectural Trade-offs & Bottleneck Analysis

### 1. Consistency vs. Latency
- In-memory state gives sub-millisecond access but breaks horizontal scaling and causes data loss on pod restart. External state introduces network latency (1-2ms) but unlocks zero-downtime rolling deploys.

### 2. Failure Modes & Mitigations
- **Single Point of Failure (SPOF)**: Ensure all stateless tiers are horizontally auto-scaled across multi-availability zones (AZ).
- **Network Partition**: Plan fallback behavior when downstream dependencies become unreachable.
- **Cascading Failures**: Implement Circuit Breakers and Exponential Backoff with Jitter on all external RPC calls.

---

## 🛠️ Hands-On Architectural Exercise
> **Challenge**:  
> Design an in-process memory sanitizer that monitors V8 heap usage and gracefully sheds traffic when RSS memory exceeds 85%.

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
