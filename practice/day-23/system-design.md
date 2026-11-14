# Day 23: System Design — Behavioral Patterns: Command Pattern & Transaction Rollbacks

**Track**: LLD / Design Patterns  
**Level**: Level 2  
**Target Architecture**: Document editing undo/redo stack & multi-step saga execution

---

## 🎯 Architectural Objective
Comprehensive architectural blueprint for Behavioral Patterns: Command Pattern & Transaction Rollbacks. Focuses on scalability, reliability, trade-offs, and failure mode isolation.

---

## 🏛️ System Architecture Topology
```text
[ Clients (Web / Mobile / IoT) ]
             │
             ▼
      [ Load Balancer (Layer 7 / Envoy) ]
             │
             ▼
     [ API Gateway / Microservices ]
      ├── [ Distributed Cache (Redis) ]
      ├── [ Message Queue (Kafka / RabbitMQ) ]
      └── [ Primary Database (PostgreSQL / Cassandra) ]
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
// System Architectural Schema & DDL
CREATE TABLE system_events (
  id UUID PRIMARY KEY,
  entity_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## ⚖️ Architectural Trade-offs & Bottleneck Analysis

### 1. Consistency vs. Latency
- Balancing consistency vs availability, write latency vs read amplification, and infrastructure cost vs high availability guarantees.

### 2. Failure Modes & Mitigations
- **Single Point of Failure (SPOF)**: Ensure all stateless tiers are horizontally auto-scaled across multi-availability zones (AZ).
- **Network Partition**: Plan fallback behavior when downstream dependencies become unreachable.
- **Cascading Failures**: Implement Circuit Breakers and Exponential Backoff with Jitter on all external RPC calls.

---

## 🛠️ Hands-On Architectural Exercise
> **Challenge**:  
> Draft the component diagram, database schema, and failure recovery plan for Behavioral Patterns: Command Pattern & Transaction Rollbacks.

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
