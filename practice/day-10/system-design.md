# Day 10: System Design — Event-Driven vs Polling Architecture in Local Systems

**Track**: System Architecture  
**Level**: Level 1  
**Target Architecture**: Real-time notifications & webhook dispatchers

---

## 🎯 Architectural Objective
Comparing Short Polling, Long Polling, and Event Emitters. Understanding the impact of high-frequency polling on CPU context switching and network sockets.

---

## 🏛️ System Architecture Topology
```text
Polling (Wasteful):
Client ──> Check? ──> No (Empty 200)
Client ──> Check? ──> No (Empty 200)
Client ──> Check? ──> Yes (Data)

Event-Driven (Efficient):
Client ──[ Open Connection / Stream ]──> Server
Server ────────────────[ Event Push ]──> Client
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
// In-Process Event Bus Architecture
class EventBus extends EventEmitter {
  publish(event: string, payload: unknown): void;
  subscribe(event: string, handler: Function): void;
}
```

---

## ⚖️ Architectural Trade-offs & Bottleneck Analysis

### 1. Consistency vs. Latency
- Polling is trivial to implement across firewalls but wastes massive network bandwidth. Event-driven connections require persistent stateful sockets on servers.

### 2. Failure Modes & Mitigations
- **Single Point of Failure (SPOF)**: Ensure all stateless tiers are horizontally auto-scaled across multi-availability zones (AZ).
- **Network Partition**: Plan fallback behavior when downstream dependencies become unreachable.
- **Cascading Failures**: Implement Circuit Breakers and Exponential Backoff with Jitter on all external RPC calls.

---

## 🛠️ Hands-On Architectural Exercise
> **Challenge**:  
> Design an in-memory job status observer that notifies connected HTTP clients using Long Polling with a 30-second timeout.

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
