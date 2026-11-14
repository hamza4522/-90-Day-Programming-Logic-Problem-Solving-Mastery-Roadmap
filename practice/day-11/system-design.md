# Day 11: System Design — Rate Limiting Algorithms: Fixed Window vs Sliding Log

**Track**: Algorithmic System Design  
**Level**: Level 1  
**Target Architecture**: API abuse protection and DDoS defense

---

## 🎯 Architectural Objective
Rate limiters protect servers from traffic spikes. Comparison of Fixed Window, Token Bucket, Leaky Bucket, and Sliding Window Log algorithms.

---

## 🏛️ System Architecture Topology
```text
Fixed Window Vulnerability:
Limit: 100 req/min
[  0:00 - 0:59  ] [  1:00 - 1:59  ]
           50req   50req
          [0:59]  [1:00]  <-- 100 requests in 2 seconds! (Boundary Burst)

Sliding Window Log: Tracks individual timestamps; prevents boundary spikes.
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
// Redis Sliding Window Log Multi/Exec:
// ZADD ratelimit:user_123 <now_timestamp> <now_timestamp>
// ZREMRANGEBYSCORE ratelimit:user_123 0 <now_timestamp - 60>
// ZCARD ratelimit:user_123
```

---

## ⚖️ Architectural Trade-offs & Bottleneck Analysis

### 1. Consistency vs. Latency
- Fixed window uses negligible memory (single integer per user) but suffers from 2x boundary bursts. Sliding log is 100% accurate but consumes high RAM storing timestamp sets.

### 2. Failure Modes & Mitigations
- **Single Point of Failure (SPOF)**: Ensure all stateless tiers are horizontally auto-scaled across multi-availability zones (AZ).
- **Network Partition**: Plan fallback behavior when downstream dependencies become unreachable.
- **Cascading Failures**: Implement Circuit Breakers and Exponential Backoff with Jitter on all external RPC calls.

---

## 🛠️ Hands-On Architectural Exercise
> **Challenge**:  
> Calculate the RAM needed to store sliding window logs for 10 million active users making 20 requests per minute.

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
