/**
 * 90-Day System Design Curriculum Generator
 * Generates comprehensive `system-design.md` for Days 1 to 90.
 */
const fs = require('fs');
const path = require('path');

const SYSTEM_DESIGN_SYLLABUS = [
  // --- LEVEL 1: System Design Fundamentals & Component Thinking (Days 1–14) ---
  {
    day: 1,
    level: 1,
    type: "Low-Level Design (LLD)",
    title: "Single-Process Architecture, Memory Models & Statelessness",
    realWorld: "Designing high-performance Node.js/V8 micro-services",
    concept: "Understand single-threaded event loop vs multi-threaded execution, heap/stack allocations, memory leak prevention, and why stateless server design enables infinite horizontal scalability.",
    diagram: `[ Client / Browser ]
        │ HTTP Requests
        ▼
[ Node.js Process (Single Threaded Event Loop) ]
  ├── Call Stack (LIFO execution)
  ├── V8 Memory Heap (Objects, Closures)
  └── Libuv Threadpool (File I/O, DNS, Crypto)
        │ Stateless Worker
        ▼
[ External Persistent State: Redis / Postgres ]`,
    schema: `// In-Memory Session Cache vs External State
// Bad (Stateful in-memory leak prone):
const memorySessions = new Map();

// Good (Stateless horizontally scalable):
// Sessions persisted in external Redis with TTL`,
    tradeoffs: "In-memory state gives sub-millisecond access but breaks horizontal scaling and causes data loss on pod restart. External state introduces network latency (1-2ms) but unlocks zero-downtime rolling deploys.",
    exercise: "Design an in-process memory sanitizer that monitors V8 heap usage and gracefully sheds traffic when RSS memory exceeds 85%."
  },
  {
    day: 2,
    level: 1,
    type: "Low-Level Design (LLD)",
    title: "Modular Architecture & Separation of Concerns (SoC)",
    realWorld: "Refactoring monolith spaghetti code into maintainable service modules",
    concept: "Separation of Concerns isolates presentation, business rules, and persistence layers. Prevents tight coupling and ensures independent unit testability.",
    diagram: `[ Transport Layer: Express Router / Controller ]
                  │ Decodes DTO, validates params
                  ▼
[ Domain / Business Logic Layer: OrderService ]
                  │ Orchestrates rules, discounts, taxes
                  ▼
[ Persistence Layer: OrderRepository ]
                  │ Pure database queries (SQL / Mongo)
                  ▼
[ Database: PostgreSQL ]`,
    schema: `// Clean Interface Boundary
interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
}`,
    tradeoffs: "Layering introduces slight boilerplate and abstraction overhead, but prevents database leaks into HTTP handlers and allows changing DB drivers without touching business logic.",
    exercise: "Write the TypeScript/JavaScript interface boundaries for an Authentication Module separating password hashing, database lookup, and token generation."
  },
  {
    day: 3,
    level: 1,
    type: "Low-Level Design (LLD)",
    title: "Input Validation, API Contract Design & Error Handling",
    realWorld: "Public-facing REST API gateways",
    concept: "Defensive programming at system perimeters. Schema validation (Zod / Joi), strict contract typing, RFC 7807 problem details for HTTP APIs, and preventing unhandled promise rejections.",
    diagram: `[ Untrusted Client Payload ]
             │
             ▼
[ Validation Barrier (Schema / TypeGuard) ]
    ├── Invalid ──> 400 Bad Request (RFC 7807 JSON Error)
    └── Valid
             ▼
[ Sanitized Domain Controller ]`,
    schema: `{
  "type": "https://api.example.com/errors/invalid-parameter",
  "title": "Invalid Parameters",
  "status": 400,
  "detail": "Field 'email' must be a valid RFC 5322 address",
  "instance": "/orders/req_12345"
}`,
    tradeoffs: "Deep schema validation adds 0.2ms parsing latency per request, but eliminates SQL injection, NoSQL injection, and unpredictable runtime crashes.",
    exercise: "Design a centralized error middleware that maps database constraint violations to user-friendly HTTP 409 Conflict errors without leaking internal table names."
  },
  {
    day: 4,
    level: 1,
    type: "Low-Level Design (LLD)",
    title: "Finite State Machines (FSM) in Production Workflows",
    realWorld: "Order lifecycle processing (Created -> Paid -> Shipped -> Delivered)",
    concept: "Preventing illegal state transitions in asynchronous distributed transactions using formal Deterministic Finite State Machines. State transitions must be atomic.",
    diagram: `[ CREATED ] ──( Payment Success )──> [ PAID ]
      │                                    │
( Payment Failed )                   ( Fulfillment )
      ▼                                    ▼
 [ CANCELLED ]                          [ SHIPPED ] ──> [ DELIVERED ]`,
    schema: `CREATE TABLE orders (
  id UUID PRIMARY KEY,
  status VARCHAR(32) NOT NULL,
  version INT NOT NULL DEFAULT 1, -- Optimistic locking
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);`,
    tradeoffs: "FSMs require rigid upfront planning and boilerplate state transition tables, but completely eliminate illegal states (e.g. refunding an order before it was paid).",
    exercise: "Map out the state transition matrix for an Uber ride dispatch: REQUESTED, MATCHED, DRIVER_ARRIVED, IN_TRANSIT, COMPLETED, CANCELLED."
  },
  {
    day: 5,
    level: 1,
    type: "Low-Level Design (LLD)",
    title: "Access Control Architectures: RBAC vs ABAC",
    realWorld: "Enterprise SaaS multi-tenant permission engines",
    concept: "Role-Based Access Control (RBAC) groups permissions into roles (Admin, Editor, Viewer). Attribute-Based Access Control (ABAC) evaluates context (IP, department, time, resource owner).",
    diagram: `[ Request: User + Action + Resource ]
                   │
                   ▼
       [ Policy Enforcement Point (PEP) ]
                   │
                   ▼
       [ Policy Decision Point (PDP) ]
         ├── RBAC: Does User have Role with Permission?
         └── ABAC: Is User the owner AND Department == 'Finance'?
                   │
         [ ALLOW / DENY ]`,
    schema: `CREATE TABLE role_permissions (
  role_id INT REFERENCES roles(id),
  permission VARCHAR(64) NOT NULL,
  PRIMARY KEY (role_id, permission)
);`,
    tradeoffs: "RBAC is simple to query and index, but lacks granularity. ABAC is hyper-flexible but requires complex rule evaluation engines that can slow down API responses.",
    exercise: "Design a permissions table schema that allows both role-based inheritance and fine-grained per-document overrides."
  },
  {
    day: 6,
    level: 1,
    type: "Data Architecture",
    title: "Data Modeling Fundamentals: Normalization (1NF, 2NF, 3NF)",
    realWorld: "E-Commerce transactional database schema",
    concept: "Eliminating data redundancy and update anomalies through normalization. Understanding when to intentionally denormalize for read performance.",
    diagram: `Unnormalized (Repeating groups, multi-value fields)
         │  1NF: Atomic columns, unique primary key
         ▼
First Normal Form (1NF)
         │  2NF: Remove partial dependencies on composite keys
         ▼
Second Normal Form (2NF)
         │  3NF: Remove transitive dependencies (non-key attributes)
         ▼
Third Normal Form (3NF) - Clean Relational Integrity`,
    schema: `CREATE TABLE users (id UUID PRIMARY KEY, email VARCHAR(255) UNIQUE);
CREATE TABLE products (id UUID PRIMARY KEY, price DECIMAL(10,2));
CREATE TABLE order_items (
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  unit_price DECIMAL(10,2), -- Historical snapshot (denormalized intentionally!)
  quantity INT NOT NULL,
  PRIMARY KEY (order_id, product_id)
);`,
    tradeoffs: "3NF minimizes disk storage and eliminates inconsistent updates, but requires multi-table JOINs that can choke high-throughput OLTP systems. Denormalization trades extra disk space for single-table reads.",
    exercise: "Identify the transitive dependency in an employee table with fields (id, name, department_id, department_name, department_head_id) and normalize it to 3NF."
  },
  {
    day: 7,
    level: 1,
    type: "Assessment",
    title: "Weekly Assessment 1: LLD of E-Commerce Checkout Engine",
    realWorld: "Production shopping cart to invoice checkout pipeline",
    concept: "Full architectural synthesis: Class diagram, separation of concerns, defensive validation, idempotency, and transactional boundaries.",
    diagram: `[ CartService ] ──> [ PricingEngine (Tax + Discount) ]
                             │
                             ▼
                    [ InventoryLockService ]
                             │
                             ▼
                    [ PaymentGatewayAdapter ] ──> [ OrderRepository ]`,
    schema: `// System Architectural Review Document & Class Boundaries`,
    tradeoffs: "Evaluating balance between synchronous checkout latency and eventual consistency inventory reservation.",
    exercise: "Draft the complete architectural specification document including class contracts and error flows for handling an out-of-stock item during checkout."
  },
  {
    day: 8,
    level: 1,
    type: "Distributed LLD",
    title: "Data Integrity & Idempotency Key Architecture",
    realWorld: "Stripe payment processing & network retry safety",
    concept: "Network requests fail ambiguously (timeout). Clients must safely retry without double-charging. Idempotency keys guarantee an operation executes at most once.",
    diagram: `Client ──( POST /charges, Idempotency-Key: uuid-1 )──> [ API Gateway ]
                                                              │
                                     [ Check Idempotency Store (Redis/Postgres) ]
                                      ├── Key Exists & Processed ──> Return Cached Response
                                      ├── Key Exists & In-Progress ──> Return 409 Concurrent Request
                                      └── New Key ──> Execute & Cache Response`,
    schema: `CREATE TABLE idempotency_records (
  key VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL,
  status VARCHAR(32) NOT NULL, -- 'PENDING', 'COMPLETED'
  response_payload JSONB,
  response_code INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`,
    tradeoffs: "Requires fast, highly available key-value storage (Redis) and adds round-trip check overhead, but is mandatory for financial safety.",
    exercise: "Implement an Express middleware that intercepts incoming requests with an 'Idempotency-Key' header and returns cached results if already completed."
  },
  {
    day: 9,
    level: 1,
    type: "System Architecture",
    title: "Interval & Scheduling Engines: Booking Systems",
    realWorld: "Calendly, Airbnb booking conflict prevention",
    concept: "Efficient temporal overlap detection. Storing ranges in SQL using PostgreSQL `tstzrange` and GiST indexes for $O(\log N)$ conflict detection.",
    diagram: `Existing Booking:   [=============] (10:00 - 12:00)
New Booking A:            [=====]       (11:00 - 11:30) --> CONFLICT!
New Booking B:                            [====]        --> VALID!`,
    schema: `CREATE EXTENSION btree_gist;
CREATE TABLE room_bookings (
  room_id UUID NOT NULL,
  during TSTZRANGE NOT NULL,
  EXCLUDE USING GIST (room_id WITH =, during WITH &&) -- DB-level zero race condition guarantee!
);`,
    tradeoffs: "Database constraint exclusion prevents double-booking at the hardware level, avoiding distributed lock contention in application servers.",
    exercise: "Write the SQL query to search for all available 30-minute meeting slots within an 8-hour window given a list of existing reservations."
  },
  {
    day: 10,
    level: 1,
    type: "System Architecture",
    title: "Event-Driven vs Polling Architecture in Local Systems",
    realWorld: "Real-time notifications & webhook dispatchers",
    concept: "Comparing Short Polling, Long Polling, and Event Emitters. Understanding the impact of high-frequency polling on CPU context switching and network sockets.",
    diagram: `Polling (Wasteful):
Client ──> Check? ──> No (Empty 200)
Client ──> Check? ──> No (Empty 200)
Client ──> Check? ──> Yes (Data)

Event-Driven (Efficient):
Client ──[ Open Connection / Stream ]──> Server
Server ────────────────[ Event Push ]──> Client`,
    schema: `// In-Process Event Bus Architecture
class EventBus extends EventEmitter {
  publish(event: string, payload: unknown): void;
  subscribe(event: string, handler: Function): void;
}`,
    tradeoffs: "Polling is trivial to implement across firewalls but wastes massive network bandwidth. Event-driven connections require persistent stateful sockets on servers.",
    exercise: "Design an in-memory job status observer that notifies connected HTTP clients using Long Polling with a 30-second timeout."
  },
  {
    day: 11,
    level: 1,
    type: "Algorithmic System Design",
    title: "Rate Limiting Algorithms: Fixed Window vs Sliding Log",
    realWorld: "API abuse protection and DDoS defense",
    concept: "Rate limiters protect servers from traffic spikes. Comparison of Fixed Window, Token Bucket, Leaky Bucket, and Sliding Window Log algorithms.",
    diagram: `Fixed Window Vulnerability:
Limit: 100 req/min
[  0:00 - 0:59  ] [  1:00 - 1:59  ]
           50req   50req
          [0:59]  [1:00]  <-- 100 requests in 2 seconds! (Boundary Burst)

Sliding Window Log: Tracks individual timestamps; prevents boundary spikes.`,
    schema: `// Redis Sliding Window Log Multi/Exec:
// ZADD ratelimit:user_123 <now_timestamp> <now_timestamp>
// ZREMRANGEBYSCORE ratelimit:user_123 0 <now_timestamp - 60>
// ZCARD ratelimit:user_123`,
    tradeoffs: "Fixed window uses negligible memory (single integer per user) but suffers from 2x boundary bursts. Sliding log is 100% accurate but consumes high RAM storing timestamp sets.",
    exercise: "Calculate the RAM needed to store sliding window logs for 10 million active users making 20 requests per minute."
  },
  {
    day: 12,
    level: 1,
    type: "Mini-Project LLD",
    title: "In-Memory Key-Value Store with TTL & Expiration",
    realWorld: "Building a lightweight Redis clone in Node.js",
    concept: "Hash map indexing combined with active and passive expiration algorithms. Using a Min-Heap or doubly linked list to purge expired keys without blocking the event loop.",
    diagram: `[ Key-Value Map ] ──> Fast O(1) Reads
         │
[ Min-Heap of (ExpirationTimestamp, Key) ]
         │
[ Background Sweep Interval (Passive / Active Purge) ]`,
    schema: `class KeyValueStore {
  set(key: string, value: any, ttlSeconds?: number): void;
  get(key: string): any | null;
  delete(key: string): boolean;
  purgeExpired(): void;
}`,
    tradeoffs: "Active sweep uses CPU time in periodic intervals. Passive check on get() saves background CPU but leaks memory for keys that are set and never accessed again.",
    exercise: "Write the eviction routine combining passive read-time checking with an active 100ms sample sweep."
  },
  {
    day: 13,
    level: 1,
    type: "Low-Level Design",
    title: "Clean Architecture & Dependency Injection",
    realWorld: "Enterprise backend service decoupling",
    concept: "Robert C. Martin's Onion / Clean Architecture. Entities -> Use Cases -> Interface Adapters -> Frameworks & Drivers. The Dependency Inversion Principle in practice.",
    diagram: `     ┌───────────────────────────────┐
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
     └───────────────────────────────┘`,
    schema: `// Constructor Injection
class ProcessOrderUseCase {
  constructor(
    private readonly paymentGateway: IPaymentGateway,
    private readonly orderRepo: IOrderRepository
  ) {}
}`,
    tradeoffs: "Clean Architecture requires high initial boilerplate, but allows swapping databases (e.g. Postgres to MongoDB) or testing with mock objects without modifying business logic.",
    exercise: "Refactor a monolithic script connecting directly to MySQL into a clean Controller -> UseCase -> Repository structure."
  },
  {
    day: 14,
    level: 1,
    type: "Assessment",
    title: "Weekly Assessment 2: Level 1 System Design Certification",
    realWorld: "Design an In-Memory Distributed Job Queue Runner",
    concept: "Comprehensive review of Level 1: Stateful vs stateless boundaries, input sanitization, error architecture, and clean OOP boundaries.",
    diagram: `[ Producer ] ──> [ Job Validator ] ──> [ Priority Queue ] ──> [ Worker Pool ] ──> [ Dead Letter Queue ]`,
    schema: `// Architectural evaluation document across reliability, failure recovery, and type contracts`,
    tradeoffs: "Evaluating in-memory speed vs crash recovery and persistence guarantees.",
    exercise: "Draft the comprehensive System Specification Document for a resilient single-node job processor with failure retries and concurrency limits."
  }
];

// Helper to fill remaining days 15 to 90
const SYSTEM_DESIGN_TOPICS_REMAINING = [
  // Level 2: 15-28
  { day: 15, level: 2, type: "LLD / Design Patterns", title: "SOLID: Single Responsibility & Open/Closed in Real Systems", realWorld: "Pluggable notification routing engine" },
  { day: 16, level: 2, type: "LLD / Design Patterns", title: "SOLID: Liskov Substitution, Interface Segregation & DIP", realWorld: "Storage provider drivers (S3 vs Local vs GCS)" },
  { day: 17, level: 2, type: "LLD / Design Patterns", title: "Creational Patterns: Factory Method & Abstract Factory", realWorld: "Multi-provider payment gateway initialization" },
  { day: 18, level: 2, type: "LLD / Design Patterns", title: "Creational Patterns: Builder & Singleton Anti-Patterns", realWorld: "Complex SQL query builder & DB connection pooling" },
  { day: 19, level: 2, type: "LLD / Design Patterns", title: "Structural Patterns: Adapter, Facade & Decorator", realWorld: "Third-party legacy SDK modernization & caching decorators" },
  { day: 20, level: 2, type: "LLD / Design Patterns", title: "Behavioral Patterns: Strategy Pattern in Production", realWorld: "Dynamic shipping cost calculation engine (FedEx/UPS/DHL)" },
  { day: 21, level: 2, type: "Assessment", title: "Weekly Assessment 3: LLD of a Multi-Floor Smart Parking Garage", realWorld: "Automated ticket, gate, sensor, and fee calculation engine" },
  { day: 22, level: 2, type: "LLD / Design Patterns", title: "Behavioral Patterns: Observer Pattern & Event Emitters", realWorld: "Real-time user status broadcasts & in-app notifications" },
  { day: 23, level: 2, type: "LLD / Design Patterns", title: "Behavioral Patterns: Command Pattern & Transaction Rollbacks", realWorld: "Document editing undo/redo stack & multi-step saga execution" },
  { day: 24, level: 2, type: "Concurrency LLD", title: "The Node.js Event Loop, Libuv & Thread Pool Architecture", realWorld: "CPU-heavy image processing vs I/O bound HTTP APIs" },
  { day: 25, level: 2, type: "Resilience LLD", title: "Circuit Breakers, Retries with Exponential Backoff & Jitter", realWorld: "Downstream microservice fault isolation" },
  { day: 26, level: 2, type: "Resource Architecture", title: "Database Connection Pooling Architecture", realWorld: "PostgreSQL pgBouncer & client-side connection pooling" },
  { day: 27, level: 2, type: "Domain Architecture", title: "Domain-Driven Design (DDD): Aggregates & Bounded Contexts", realWorld: "Decomposing banking domain into Accounts, Transfers, and Auditing" },
  { day: 28, level: 2, type: "Assessment", title: "Weekly Assessment 4: LLD of In-Memory Task Scheduler with Cron Parser", realWorld: "Unix crontab-like scheduler with execution thread bounds" },

  // Level 3: 29-42
  { day: 29, level: 3, type: "Storage Architecture", title: "Storage Engines: B-Trees vs LSM-Trees (Log-Structured Merge)", realWorld: "PostgreSQL vs Cassandra / RocksDB disk layout" },
  { day: 30, level: 3, type: "Database Design", title: "Database Indexing: Clustered, Non-Clustered & Composite Indexes", realWorld: "Eliminating table scans on multi-million row user tables" },
  { day: 31, level: 3, type: "Database Optimization", title: "Query Optimization & EXPLAIN Query Execution Plans", realWorld: "Debugging sequential scans, index lookups, and nested loops" },
  { day: 32, level: 3, type: "Data Integrity", title: "ACID Transactions, WAL (Write-Ahead Logging) & Isolation Levels", realWorld: "Preventing dirty reads, non-repeatable reads, and phantom reads" },
  { day: 33, level: 3, type: "NoSQL Architecture", title: "Document Stores: MongoDB Architecture & Schema Modeling", realWorld: "E-Commerce catalog modeling: Embedding vs Referencing" },
  { day: 34, level: 3, type: "NoSQL Architecture", title: "Wide-Column & Key-Value Stores: Cassandra & Redis Internal Models", realWorld: "High-write sensor telemetry and leaderboards" },
  { day: 35, level: 3, type: "Assessment", title: "Weekly Assessment 5: High-Level Design of a Scalable URL Shortener (TinyURL)", realWorld: "100M daily writes, base62 encoding, KGS, cache layer" },
  { day: 36, level: 3, type: "Caching Architecture", title: "Caching Strategies: Cache-Aside, Write-Through & Write-Back", realWorld: "High-traffic news portal and user profile caches" },
  { day: 37, level: 3, type: "Caching Architecture", title: "Cache Eviction (LRU/LFU) & Thundering Herd (Stampede) Prevention", realWorld: "Redis mutex locking and probabilistic early expiration" },
  { day: 38, level: 3, type: "Distributed Systems", title: "Consistent Hashing & Virtual Nodes in Distributed Caches", realWorld: "DynamoDB, Memcached, and CDN edge routing rings" },
  { day: 39, level: 3, type: "Search Architecture", title: "Search Engines: Inverted Indexes & Elasticsearch Architecture", realWorld: "Full-text e-commerce search with fuzzy matching and facets" },
  { day: 40, level: 3, type: "Storage Architecture", title: "Time-Series Databases & Metric Aggregations", realWorld: "Prometheus, InfluxDB, downsampling, and chunk compaction" },
  { day: 41, level: 3, type: "Storage Architecture", title: "Distributed Object Storage: S3 Architecture & Multipart Uploads", realWorld: "Handling multi-gigabyte video uploads with pre-signed URLs" },
  { day: 42, level: 3, type: "Assessment", title: "Weekly Assessment 6: Midterm System Design — Photo Storage Engine (Instagram)", realWorld: "Global image upload, thumbnail generation, CDN, S3, metadata DB" },

  // Level 4: 43-52
  { day: 43, level: 4, type: "Networking & Protocols", title: "Transport Protocols: TCP 3-Way Handshake, UDP, QUIC & HTTP/3", realWorld: "Low-latency streaming vs reliable financial transactions" },
  { day: 44, level: 4, type: "API Architecture", title: "RESTful API Standards, Idempotency & Resource URI Modeling", realWorld: "Designing public developer APIs (Stripe/GitHub caliber)" },
  { day: 45, level: 4, type: "API Architecture", title: "GraphQL vs REST vs gRPC: Serialization & Network Overhead", realWorld: "Mobile client data over-fetching vs microservice internal RPCs" },
  { day: 46, level: 4, type: "Real-Time Systems", title: "Real-Time Protocols: WebSockets vs Server-Sent Events (SSE) vs Long Polling", realWorld: "Live financial stock tickers and collaborative whiteboard sync" },
  { day: 47, level: 4, type: "Traffic Management", title: "Load Balancing: Layer 4 (Transport) vs Layer 7 (Application) Routing", realWorld: "NGINX, HAProxy, AWS ALB, Round Robin, Least Connections" },
  { day: 48, level: 4, type: "Traffic Management", title: "API Gateway Architecture: Authentication, Routing & Rate Limiting", realWorld: "Kong, Envoy Proxy, edge token validation, TLS offloading" },
  { day: 49, level: 4, type: "Assessment", title: "Weekly Assessment 7: Designing a High-Throughput Live Chat Service", realWorld: "Slack / WhatsApp 1-on-1 messaging, presence, WebSocket gateway" },
  { day: 50, level: 4, type: "Edge & CDN", title: "Content Delivery Networks (CDNs): Edge PoPs, Anycast & Cache Purging", realWorld: "Global media acceleration and origin shielding" },
  { day: 51, level: 4, type: "Security Architecture", title: "Authentication Protocols: OAuth 2.0, OpenID Connect & JWT Deep Dive", realWorld: "Single Sign-On (SSO), refresh token rotation, public key cryptography" },
  { day: 52, level: 4, type: "Security Architecture", title: "Zero Trust Architecture & Mutual TLS (mTLS) in Service Meshes", realWorld: "Securing East-West inter-service microservice communications" },

  // Level 5: 53-66
  { day: 53, level: 5, type: "Distributed Systems", title: "Scalability Fundamentals: Vertical vs Horizontal Scaling", realWorld: "Stateful database scale-up vs stateless container auto-scaling" },
  { day: 54, level: 5, type: "Distributed Systems", title: "The CAP Theorem & PACELC: Real-World Trade-Off Analysis", realWorld: "Why CP systems (Spanner) differ from AP systems (Dynamo/Cassandra)" },
  { day: 55, level: 5, type: "Distributed Systems", title: "Distributed Consensus: Paxos & Raft Algorithms Demystified", realWorld: "Leader election in etcd, Consul, and ZooKeeper" },
  { day: 56, level: 5, type: "Distributed Transactions", title: "Distributed Transactions: Two-Phase Commit (2PC) vs Saga Pattern", realWorld: "Orchestrated vs Choreographed microservice order workflows" },
  { day: 57, level: 5, type: "Database Scaling", title: "Database Replication: Active-Passive, Active-Active & Read Replicas", realWorld: "Replication lag, read-after-write consistency, split-brain scenarios" },
  { day: 58, level: 5, type: "Database Scaling", title: "Database Sharding & Partitioning: Hash, Range & Directory Sharding", realWorld: "Horizontal table partitioning, cross-shard joins, rebalancing keys" },
  { day: 59, level: 5, type: "Assessment", title: "Weekly Assessment 8: Designing a Globally Distributed View Counter", realWorld: "YouTube view counter at 100K writes/sec: write buffering & aggregation" },
  { day: 60, level: 5, type: "Message Brokers", title: "Message Brokers: Traditional Queues (RabbitMQ) vs Distributed Logs (Kafka)", realWorld: "Point-to-point task queues vs high-throughput replayable event streams" },
  { day: 61, level: 5, type: "Message Brokers", title: "Apache Kafka Deep Dive: Partitions, Consumer Groups & Exactly-Once", realWorld: "Event streaming pipelines, partition rebalancing, offset commits" },
  { day: 62, level: 5, type: "Async Processing", title: "Background Job Processing: Workers, Dead-Letter Queues & Backoff", realWorld: "BullMQ, Celery, handling poisoned pill messages" },
  { day: 63, level: 5, type: "Distributed ID", title: "Distributed Unique ID Generation: Twitter Snowflake vs UUID vs ULID", realWorld: "Time-sortable 64-bit IDs in multi-datacenter environments" },
  { day: 64, level: 5, type: "Distributed Locks", title: "Distributed Locking: Redis Redlock vs ZooKeeper/etcd Fencing Tokens", realWorld: "Preventing race conditions across independent microservice instances" },
  { day: 65, level: 5, type: "Data Patterns", title: "CQRS (Command Query Responsibility Segregation) & Event Sourcing", realWorld: "Banking ledger auditability and specialized read model projections" },
  { day: 66, level: 5, type: "Assessment", title: "Weekly Assessment 9: Designing an E-Commerce Flash Sale System", realWorld: "Ticketmaster/Amazon Prime Day: virtual waiting room, inventory locks" },

  // Level 6: 67-78
  { day: 67, level: 6, type: "High Availability", title: "High Availability & Multi-Region Deployments: Active-Active vs Active-Passive", realWorld: "Global DNS routing, latency-based routing, database cross-region sync" },
  { day: 68, level: 6, type: "Resilience", title: "Disaster Recovery: RTO (Recovery Time) & RPO (Recovery Point) Planning", realWorld: "Automated failover, point-in-time recovery, chaos engineering" },
  { day: 69, level: 6, type: "Resilience Patterns", title: "Bulkhead Pattern, Graceful Degradation & Shedding Traffic", realWorld: "Preventing cascading failures under 10x traffic surges" },
  { day: 70, level: 6, type: "Microservices", title: "Service Mesh Architecture: Sidecar Proxies (Envoy, Istio)", realWorld: "Traffic shadowing, canary releases, automated mTLS, distributed telemetry" },
  { day: 71, level: 6, type: "Observability", title: "Distributed Tracing: OpenTelemetry, Trace Contexts & Span IDs", realWorld: "Tracing a single HTTP request across 20 downstream microservices" },
  { day: 72, level: 6, type: "Observability", title: "Metrics & Alerting: Prometheus, Grafana, SLI, SLO & SLA Framework", realWorld: "Golden signals: Latency, Traffic, Errors, Saturation" },
  { day: 73, level: 6, type: "Assessment", title: "Weekly Assessment 10: Designing a Distributed Web Crawler (Googlebot)", realWorld: "URL frontier, politeness delays, deduplication via Bloom filters" },
  { day: 74, level: 6, type: "Observability", title: "Centralized Logging: ELK / EFK Stack, FluentBit & Log Compaction", realWorld: "Structured JSON logging, indexing terabytes of access logs daily" },
  { day: 75, level: 6, type: "Cloud Native", title: "Container Orchestration: Kubernetes Pods, Deployments & Service Discovery", realWorld: "Ingress controllers, horizontal pod autoscalers (HPA), rolling updates" },
  { day: 76, level: 6, type: "Data Consistency", title: "Conflict-Free Replicated Data Types (CRDTs) in Distributed Systems", realWorld: "Offline-first mobile synchronization and collaborative editing" },
  { day: 77, level: 6, type: "Edge Architecture", title: "Edge Computing & Serverless Functions: Cloudflare Workers & Fly.io", realWorld: "Executing auth and personalization at the edge near users" },
  { day: 78, level: 6, type: "Assessment", title: "Weekly Assessment 11: Real-Time Collaborative Document Editor (Google Docs)", realWorld: "Operational Transformation (OT) vs CRDTs, WebSocket servers, snapshot DB" },

  // Level 7: 79-90
  { day: 79, level: 7, type: "HLD Capstone", title: "System Design Capstone: Global Video Streaming Platform (Netflix / YouTube)", realWorld: "Video transcoding pipeline, HLS/DASH chunking, CDN origin shields" },
  { day: 80, level: 7, type: "HLD Capstone", title: "System Design Capstone: Ride-Sharing Dispatch & Geolocation (Uber / Lyft)", realWorld: "Spatial indexing (H3 / S2 cells), real-time driver updates via WebSockets" },
  { day: 81, level: 7, type: "HLD Capstone", title: "System Design Capstone: Social Media News Feed (Twitter / X)", realWorld: "Fan-Out-On-Write vs Fan-Out-On-Read for celebrity users, Redis timeline" },
  { day: 82, level: 7, type: "HLD Capstone", title: "System Design Capstone: Distributed Notification Engine", realWorld: "Prioritized push/SMS/email delivery, rate limiters, template rendering" },
  { day: 83, level: 7, type: "HLD Capstone", title: "System Design Capstone: Distributed Rate Limiter at Cloudflare Scale", realWorld: "Sliding window rate limiting across 100 global PoPs with sync" },
  { day: 84, level: 7, type: "HLD Capstone", title: "System Design Capstone: Search Autocomplete & Typeahead System", realWorld: "Prefix trees (Tries), frequency caching in Redis, ZooKeeper synchronization" },
  { day: 85, level: 7, type: "Assessment", title: "Weekly Assessment 12: High-Level Architecture Exam — Ad-Click Aggregator", realWorld: "Millions of events per second, exactly-once aggregation, OLAP ClickHouse" },
  { day: 86, level: 7, type: "HLD Capstone", title: "System Design Capstone: Distributed File System (Google File System / HDFS)", realWorld: "Master node metadata, chunk servers, 64MB chunking, heartbeat protocols" },
  { day: 87, level: 7, type: "HLD Capstone", title: "System Design Capstone: Resilient Payment Gateway Integration (Stripe)", realWorld: "Idempotency keys, dual-entry accounting ledgers, zero double-billing" },
  { day: 88, level: 7, type: "Interview Mastery", title: "The 45-Minute Senior System Design Interview Blueprint", realWorld: "Step 1: Scoping -> Step 2: Back-of-the-envelope -> Step 3: HLD -> Step 4: Deep dive" },
  { day: 89, level: 7, type: "Capstone Exam", title: "90-Day Capstone System Design Exam: Global Cloud Gaming Platform", realWorld: "Low latency WebRTC video streaming, edge compute placement, state sync" },
  { day: 90, level: 7, type: "Engineering Mastery", title: "Master System Architect Graduation & Production Readiness Checklist", realWorld: "Checklists for zero-downtime launches, disaster playbooks, post-mortems" }
];

function getSystemDesignData(dayNum) {
  const existing = SYSTEM_DESIGN_SYLLABUS.find(d => d.day === dayNum);
  if (existing) return existing;

  const item = SYSTEM_DESIGN_TOPICS_REMAINING.find(d => d.day === dayNum);
  if (!item) return null;

  return {
    day: dayNum,
    level: item.level,
    type: item.type,
    title: item.title,
    realWorld: item.realWorld,
    concept: `Comprehensive architectural blueprint for ${item.title}. Focuses on scalability, reliability, trade-offs, and failure mode isolation.`,
    diagram: `[ Clients (Web / Mobile / IoT) ]
             │
             ▼
      [ Load Balancer (Layer 7 / Envoy) ]
             │
             ▼
     [ API Gateway / Microservices ]
      ├── [ Distributed Cache (Redis) ]
      ├── [ Message Queue (Kafka / RabbitMQ) ]
      └── [ Primary Database (PostgreSQL / Cassandra) ]`,
    schema: `// System Architectural Schema & DDL
CREATE TABLE system_events (
  id UUID PRIMARY KEY,
  entity_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`,
    tradeoffs: "Balancing consistency vs availability, write latency vs read amplification, and infrastructure cost vs high availability guarantees.",
    exercise: `Draft the component diagram, database schema, and failure recovery plan for ${item.title}.`
  };
}

function generateAllSystemDesignFiles() {
  const baseDir = path.resolve(__dirname, '..', 'practice');
  console.log("Generating dedicated `system-design.md` for Days 1 to 90...");

  for (let d = 1; d <= 90; d++) {
    const data = getSystemDesignData(d);
    if (!data) continue;

    const dayFolder = path.join(baseDir, `day-${String(d).padStart(2, '0')}`);
    if (!fs.existsSync(dayFolder)) {
      fs.mkdirSync(dayFolder, { recursive: true });
    }

    const content = `# Day ${d}: System Design — ${data.title}

**Track**: ${data.type}  
**Level**: Level ${data.level}  
**Target Architecture**: ${data.realWorld}

---

## 🎯 Architectural Objective
${data.concept}

---

## 🏛️ System Architecture Topology
\`\`\`text
${data.diagram}
\`\`\`

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
\`\`\`sql
${data.schema}
\`\`\`

---

## ⚖️ Architectural Trade-offs & Bottleneck Analysis

### 1. Consistency vs. Latency
- ${data.tradeoffs}

### 2. Failure Modes & Mitigations
- **Single Point of Failure (SPOF)**: Ensure all stateless tiers are horizontally auto-scaled across multi-availability zones (AZ).
- **Network Partition**: Plan fallback behavior when downstream dependencies become unreachable.
- **Cascading Failures**: Implement Circuit Breakers and Exponential Backoff with Jitter on all external RPC calls.

---

## 🛠️ Hands-On Architectural Exercise
> **Challenge**:  
> ${data.exercise}

### Your Architectural Design Space
1. **Functional Requirements**:
   - [ ] Primary operations supported
   - [ ] Latency SLAs (e.g. p99 < 100ms)
2. **Non-Functional Requirements**:
   - [ ] High Availability (99.99%)
   - [ ] Data durability guarantees
3. **Draft Your Component Diagram & Notes Below**:
\`\`\`text
[ Client ] ──> [ ... ]
\`\`\`
`;

    fs.writeFileSync(path.join(dayFolder, 'system-design.md'), content, 'utf8');
  }

  console.log("✔ Successfully created `system-design.md` for all 90 days!");
}

generateAllSystemDesignFiles();

