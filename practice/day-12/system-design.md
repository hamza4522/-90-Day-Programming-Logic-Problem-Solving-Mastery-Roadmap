# Day 12: System Design — In-Memory Key-Value Store with TTL & Expiration

**Track**: Mini-Project LLD  
**Level**: Level 1  
**Target Architecture**: Building a lightweight Redis clone in Node.js

---

## 🎯 Architectural Objective
Hash map indexing combined with active and passive expiration algorithms. Using a Min-Heap or doubly linked list to purge expired keys without blocking the event loop.

---

## 🏛️ System Architecture Topology
```text
[ Key-Value Map ] ──> Fast O(1) Reads
         │
[ Min-Heap of (ExpirationTimestamp, Key) ]
         │
[ Background Sweep Interval (Passive / Active Purge) ]
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
class KeyValueStore {
  set(key: string, value: any, ttlSeconds?: number): void;
  get(key: string): any | null;
  delete(key: string): boolean;
  purgeExpired(): void;
}
```

---

## ⚖️ Architectural Trade-offs & Bottleneck Analysis

### 1. Consistency vs. Latency
- Active sweep uses CPU time in periodic intervals. Passive check on get() saves background CPU but leaks memory for keys that are set and never accessed again.

### 2. Failure Modes & Mitigations
- **Single Point of Failure (SPOF)**: Ensure all stateless tiers are horizontally auto-scaled across multi-availability zones (AZ).
- **Network Partition**: Plan fallback behavior when downstream dependencies become unreachable.
- **Cascading Failures**: Implement Circuit Breakers and Exponential Backoff with Jitter on all external RPC calls.

---

## 🛠️ Hands-On Architectural Exercise
> **Challenge**:  
> Write the eviction routine combining passive read-time checking with an active 100ms sample sweep.

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
