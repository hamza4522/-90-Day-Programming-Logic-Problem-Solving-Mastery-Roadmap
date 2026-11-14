# Day 7: System Design — Weekly Assessment 1: LLD of E-Commerce Checkout Engine

**Track**: Assessment  
**Level**: Level 1  
**Target Architecture**: Production shopping cart to invoice checkout pipeline

---

## 🎯 Architectural Objective
Full architectural synthesis: Class diagram, separation of concerns, defensive validation, idempotency, and transactional boundaries.

---

## 🏛️ System Architecture Topology
```text
[ CartService ] ──> [ PricingEngine (Tax + Discount) ]
                             │
                             ▼
                    [ InventoryLockService ]
                             │
                             ▼
                    [ PaymentGatewayAdapter ] ──> [ OrderRepository ]
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
// System Architectural Review Document & Class Boundaries
```

---

## ⚖️ Architectural Trade-offs & Bottleneck Analysis

### 1. Consistency vs. Latency
- Evaluating balance between synchronous checkout latency and eventual consistency inventory reservation.

### 2. Failure Modes & Mitigations
- **Single Point of Failure (SPOF)**: Ensure all stateless tiers are horizontally auto-scaled across multi-availability zones (AZ).
- **Network Partition**: Plan fallback behavior when downstream dependencies become unreachable.
- **Cascading Failures**: Implement Circuit Breakers and Exponential Backoff with Jitter on all external RPC calls.

---

## 🛠️ Hands-On Architectural Exercise
> **Challenge**:  
> Draft the complete architectural specification document including class contracts and error flows for handling an out-of-stock item during checkout.

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
