# Day 3: System Design — Input Validation, API Contract Design & Error Handling

**Track**: Low-Level Design (LLD)  
**Level**: Level 1  
**Target Architecture**: Public-facing REST API gateways

---

## 🎯 Architectural Objective
Defensive programming at system perimeters. Schema validation (Zod / Joi), strict contract typing, RFC 7807 problem details for HTTP APIs, and preventing unhandled promise rejections.

---

## 🏛️ System Architecture Topology
```text
[ Untrusted Client Payload ]
             │
             ▼
[ Validation Barrier (Schema / TypeGuard) ]
    ├── Invalid ──> 400 Bad Request (RFC 7807 JSON Error)
    └── Valid
             ▼
[ Sanitized Domain Controller ]
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
{
  "type": "https://api.example.com/errors/invalid-parameter",
  "title": "Invalid Parameters",
  "status": 400,
  "detail": "Field 'email' must be a valid RFC 5322 address",
  "instance": "/orders/req_12345"
}
```

---

## ⚖️ Architectural Trade-offs & Bottleneck Analysis

### 1. Consistency vs. Latency
- Deep schema validation adds 0.2ms parsing latency per request, but eliminates SQL injection, NoSQL injection, and unpredictable runtime crashes.

### 2. Failure Modes & Mitigations
- **Single Point of Failure (SPOF)**: Ensure all stateless tiers are horizontally auto-scaled across multi-availability zones (AZ).
- **Network Partition**: Plan fallback behavior when downstream dependencies become unreachable.
- **Cascading Failures**: Implement Circuit Breakers and Exponential Backoff with Jitter on all external RPC calls.

---

## 🛠️ Hands-On Architectural Exercise
> **Challenge**:  
> Design a centralized error middleware that maps database constraint violations to user-friendly HTTP 409 Conflict errors without leaking internal table names.

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
