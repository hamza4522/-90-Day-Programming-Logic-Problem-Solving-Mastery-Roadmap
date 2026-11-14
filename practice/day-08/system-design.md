# Day 8: System Design — Data Integrity & Idempotency Key Architecture

**Track**: Distributed LLD  
**Level**: Level 1  
**Target Architecture**: Stripe payment processing & network retry safety

---

## 🎯 Architectural Objective
Network requests fail ambiguously (timeout). Clients must safely retry without double-charging. Idempotency keys guarantee an operation executes at most once.

---

## 🏛️ System Architecture Topology
```text
Client ──( POST /charges, Idempotency-Key: uuid-1 )──> [ API Gateway ]
                                                              │
                                     [ Check Idempotency Store (Redis/Postgres) ]
                                      ├── Key Exists & Processed ──> Return Cached Response
                                      ├── Key Exists & In-Progress ──> Return 409 Concurrent Request
                                      └── New Key ──> Execute & Cache Response
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
CREATE TABLE idempotency_records (
  key VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL,
  status VARCHAR(32) NOT NULL, -- 'PENDING', 'COMPLETED'
  response_payload JSONB,
  response_code INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## ⚖️ Architectural Trade-offs & Bottleneck Analysis

### 1. Consistency vs. Latency
- Requires fast, highly available key-value storage (Redis) and adds round-trip check overhead, but is mandatory for financial safety.

### 2. Failure Modes & Mitigations
- **Single Point of Failure (SPOF)**: Ensure all stateless tiers are horizontally auto-scaled across multi-availability zones (AZ).
- **Network Partition**: Plan fallback behavior when downstream dependencies become unreachable.
- **Cascading Failures**: Implement Circuit Breakers and Exponential Backoff with Jitter on all external RPC calls.

---

## 🛠️ Hands-On Architectural Exercise
> **Challenge**:  
> Implement an Express middleware that intercepts incoming requests with an 'Idempotency-Key' header and returns cached results if already completed.

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
