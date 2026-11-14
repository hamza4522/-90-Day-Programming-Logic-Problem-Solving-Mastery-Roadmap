# Day 4: System Design — Finite State Machines (FSM) in Production Workflows

**Track**: Low-Level Design (LLD)  
**Level**: Level 1  
**Target Architecture**: Order lifecycle processing (Created -> Paid -> Shipped -> Delivered)

---

## 🎯 Architectural Objective
Preventing illegal state transitions in asynchronous distributed transactions using formal Deterministic Finite State Machines. State transitions must be atomic.

---

## 🏛️ System Architecture Topology
```text
[ CREATED ] ──( Payment Success )──> [ PAID ]
      │                                    │
( Payment Failed )                   ( Fulfillment )
      ▼                                    ▼
 [ CANCELLED ]                          [ SHIPPED ] ──> [ DELIVERED ]
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
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  status VARCHAR(32) NOT NULL,
  version INT NOT NULL DEFAULT 1, -- Optimistic locking
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

---

## ⚖️ Architectural Trade-offs & Bottleneck Analysis

### 1. Consistency vs. Latency
- FSMs require rigid upfront planning and boilerplate state transition tables, but completely eliminate illegal states (e.g. refunding an order before it was paid).

### 2. Failure Modes & Mitigations
- **Single Point of Failure (SPOF)**: Ensure all stateless tiers are horizontally auto-scaled across multi-availability zones (AZ).
- **Network Partition**: Plan fallback behavior when downstream dependencies become unreachable.
- **Cascading Failures**: Implement Circuit Breakers and Exponential Backoff with Jitter on all external RPC calls.

---

## 🛠️ Hands-On Architectural Exercise
> **Challenge**:  
> Map out the state transition matrix for an Uber ride dispatch: REQUESTED, MATCHED, DRIVER_ARRIVED, IN_TRANSIT, COMPLETED, CANCELLED.

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
