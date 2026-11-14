# Day 2: System Design — Modular Architecture & Separation of Concerns (SoC)

**Track**: Low-Level Design (LLD)  
**Level**: Level 1  
**Target Architecture**: Refactoring monolith spaghetti code into maintainable service modules

---

## 🎯 Architectural Objective
Separation of Concerns isolates presentation, business rules, and persistence layers. Prevents tight coupling and ensures independent unit testability.

---

## 🏛️ System Architecture Topology
```text
[ Transport Layer: Express Router / Controller ]
                  │ Decodes DTO, validates params
                  ▼
[ Domain / Business Logic Layer: OrderService ]
                  │ Orchestrates rules, discounts, taxes
                  ▼
[ Persistence Layer: OrderRepository ]
                  │ Pure database queries (SQL / Mongo)
                  ▼
[ Database: PostgreSQL ]
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
// Clean Interface Boundary
interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
}
```

---

## ⚖️ Architectural Trade-offs & Bottleneck Analysis

### 1. Consistency vs. Latency
- Layering introduces slight boilerplate and abstraction overhead, but prevents database leaks into HTTP handlers and allows changing DB drivers without touching business logic.

### 2. Failure Modes & Mitigations
- **Single Point of Failure (SPOF)**: Ensure all stateless tiers are horizontally auto-scaled across multi-availability zones (AZ).
- **Network Partition**: Plan fallback behavior when downstream dependencies become unreachable.
- **Cascading Failures**: Implement Circuit Breakers and Exponential Backoff with Jitter on all external RPC calls.

---

## 🛠️ Hands-On Architectural Exercise
> **Challenge**:  
> Write the TypeScript/JavaScript interface boundaries for an Authentication Module separating password hashing, database lookup, and token generation.

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
