# Day 9: System Design — Interval & Scheduling Engines: Booking Systems

**Track**: System Architecture  
**Level**: Level 1  
**Target Architecture**: Calendly, Airbnb booking conflict prevention

---

## 🎯 Architectural Objective
Efficient temporal overlap detection. Storing ranges in SQL using PostgreSQL `tstzrange` and GiST indexes for $O(log N)$ conflict detection.

---

## 🏛️ System Architecture Topology
```text
Existing Booking:   [=============] (10:00 - 12:00)
New Booking A:            [=====]       (11:00 - 11:30) --> CONFLICT!
New Booking B:                            [====]        --> VALID!
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
CREATE EXTENSION btree_gist;
CREATE TABLE room_bookings (
  room_id UUID NOT NULL,
  during TSTZRANGE NOT NULL,
  EXCLUDE USING GIST (room_id WITH =, during WITH &&) -- DB-level zero race condition guarantee!
);
```

---

## ⚖️ Architectural Trade-offs & Bottleneck Analysis

### 1. Consistency vs. Latency
- Database constraint exclusion prevents double-booking at the hardware level, avoiding distributed lock contention in application servers.

### 2. Failure Modes & Mitigations
- **Single Point of Failure (SPOF)**: Ensure all stateless tiers are horizontally auto-scaled across multi-availability zones (AZ).
- **Network Partition**: Plan fallback behavior when downstream dependencies become unreachable.
- **Cascading Failures**: Implement Circuit Breakers and Exponential Backoff with Jitter on all external RPC calls.

---

## 🛠️ Hands-On Architectural Exercise
> **Challenge**:  
> Write the SQL query to search for all available 30-minute meeting slots within an 8-hour window given a list of existing reservations.

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
