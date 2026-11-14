# Day 6: System Design — Data Modeling Fundamentals: Normalization (1NF, 2NF, 3NF)

**Track**: Data Architecture  
**Level**: Level 1  
**Target Architecture**: E-Commerce transactional database schema

---

## 🎯 Architectural Objective
Eliminating data redundancy and update anomalies through normalization. Understanding when to intentionally denormalize for read performance.

---

## 🏛️ System Architecture Topology
```text
Unnormalized (Repeating groups, multi-value fields)
         │  1NF: Atomic columns, unique primary key
         ▼
First Normal Form (1NF)
         │  2NF: Remove partial dependencies on composite keys
         ▼
Second Normal Form (2NF)
         │  3NF: Remove transitive dependencies (non-key attributes)
         ▼
Third Normal Form (3NF) - Clean Relational Integrity
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
CREATE TABLE users (id UUID PRIMARY KEY, email VARCHAR(255) UNIQUE);
CREATE TABLE products (id UUID PRIMARY KEY, price DECIMAL(10,2));
CREATE TABLE order_items (
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  unit_price DECIMAL(10,2), -- Historical snapshot (denormalized intentionally!)
  quantity INT NOT NULL,
  PRIMARY KEY (order_id, product_id)
);
```

---

## ⚖️ Architectural Trade-offs & Bottleneck Analysis

### 1. Consistency vs. Latency
- 3NF minimizes disk storage and eliminates inconsistent updates, but requires multi-table JOINs that can choke high-throughput OLTP systems. Denormalization trades extra disk space for single-table reads.

### 2. Failure Modes & Mitigations
- **Single Point of Failure (SPOF)**: Ensure all stateless tiers are horizontally auto-scaled across multi-availability zones (AZ).
- **Network Partition**: Plan fallback behavior when downstream dependencies become unreachable.
- **Cascading Failures**: Implement Circuit Breakers and Exponential Backoff with Jitter on all external RPC calls.

---

## 🛠️ Hands-On Architectural Exercise
> **Challenge**:  
> Identify the transitive dependency in an employee table with fields (id, name, department_id, department_name, department_head_id) and normalize it to 3NF.

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
