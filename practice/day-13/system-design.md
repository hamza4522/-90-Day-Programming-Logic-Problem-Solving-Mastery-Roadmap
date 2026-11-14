# Day 13: System Design — Clean Architecture & Dependency Injection

**Track**: Low-Level Design  
**Level**: Level 1  
**Target Architecture**: Enterprise backend service decoupling

---

## 🎯 Architectural Objective
Robert C. Martin's Onion / Clean Architecture. Entities -> Use Cases -> Interface Adapters -> Frameworks & Drivers. The Dependency Inversion Principle in practice.

---

## 🏛️ System Architecture Topology
```text
     ┌───────────────────────────────┐
     │  Frameworks (Express, Knex)   │
     │   ┌───────────────────────┐   │
     │   │ Controllers, Repos    │   │
     │   │   ┌───────────────┐   │   │
     │   │   │   Use Cases   │   │   │
     │   │   │   ┌───────┐   │   │   │
     │   │   │   │Domain │   │   │   │
     │   │   │   └───────┘   │   │   │
     │   │   └───────────────┘   │   │
     │   └───────────────────────┘   │
     └───────────────────────────────┘
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
// Constructor Injection
class ProcessOrderUseCase {
  constructor(
    private readonly paymentGateway: IPaymentGateway,
    private readonly orderRepo: IOrderRepository
  ) {}
}
```

---

## ⚖️ Architectural Trade-offs & Bottleneck Analysis

### 1. Consistency vs. Latency
- Clean Architecture requires high initial boilerplate, but allows swapping databases (e.g. Postgres to MongoDB) or testing with mock objects without modifying business logic.

### 2. Failure Modes & Mitigations
- **Single Point of Failure (SPOF)**: Ensure all stateless tiers are horizontally auto-scaled across multi-availability zones (AZ).
- **Network Partition**: Plan fallback behavior when downstream dependencies become unreachable.
- **Cascading Failures**: Implement Circuit Breakers and Exponential Backoff with Jitter on all external RPC calls.

---

## 🛠️ Hands-On Architectural Exercise
> **Challenge**:  
> Refactor a monolithic script connecting directly to MySQL into a clean Controller -> UseCase -> Repository structure.

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
