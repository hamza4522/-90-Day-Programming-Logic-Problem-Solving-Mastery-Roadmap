# 90-Day Programming Logic & Problem-Solving Mastery Roadmap

## Curriculum Architecture & Level Breakdown

| Level | Domain | Timeframe | 🧠 Core DSA Track | 💡 General Logic Track | 🏛️ System Design Track |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Level 1** | Fundamentals & Components | Days 1 – 14 | Variables, types, boolean algebra, branching | First principles, deduction, inversion, parity | Single-process memory, statelessness, validation, FSMs |
| **Level 2** | Patterns, Invariants & Design | Days 15 – 28 | Invariants, digits, primes, nested loops | Mathematical induction, loop invariants, pigeonhole | SOLID, Creational/Structural patterns, Event Loop |
| **Level 3** | Storage, Reduction & Data Systems | Days 29 – 42 | Arrays, strings, two pointers, sliding window | Problem reduction, greedy choices, monotonicity | B-Trees vs LSM, SQL indexes, Redis caching, Hashing |
| **Level 4** | Modular Abstraction & Protocols | Days 43 – 52 | Call stack, functional decomposition, recursion | Abstraction barriers, composition, call stack frames | TCP/UDP/QUIC, REST, gRPC, WebSockets, API Gateway |
| **Level 5** | Structures & Distributed Core | Days 53 – 66 | Stacks, queues, linked lists, hash tables, trees | Memory locality, pointer semantics, graph modeling | CAP theorem, Raft, 2PC/Sagas, Sharding, Kafka |
| **Level 6** | Optimization, SRE & Runtime | Days 67 – 78 | Sorting, binary search, DFS/BFS, backtracking, DP | Amortized analysis, space-time trade-offs, CSP | Multi-region HA, Circuit Breakers, Tracing, Metrics |
| **Level 7** | Master Capstones & Autonomous Mindset | Days 79 – 90 | Complex pattern matching, system logic, competitive | 10 Master Mental Models, Chesterton's fence, root cause | Netflix, Uber, Twitter, Rate Limiter, Stripe |

---

## Daily Schedule Structure
Every day follows this rigorous cognitive cycle:
1. **Core Concept Deep-Dive (20-30 min)**: Understand the mechanics, memory model, and visual behavior.
2. **5 Easy Problems**: Reinforce direct application and syntax muscle memory.
3. **3 Medium Problems**: Combine two or more concepts; solve multi-step constraints.
4. **2 Challenging Problems**: Unfamiliar framing, demanding independent algorithmic derivation and edge-case testing.
5. **Reflection & Mistake Logging (15 min)**: Record any friction in the 9 mistake categories.

---

## Detailed 90-Day Schedule

### Phase 1: Level 1 — Logical Thinking Fundamentals (Days 1–14)

- **Day 1: Execution Model & State Tracing**
  - *Topic*: Variables, memory boxes, data types, value assignment vs comparison (`=` vs `===`).
  - *Daily Practice*: Variable swaps (with and without temp), state tracing through reassignments, unit price calculators.
  - *Visual*: Memory box execution diagram.
- **Day 2: Arithmetic Operators & Modulo Mastery**
  - *Topic*: Arithmetic operators, operator precedence, modulo `%` properties, integer vs floating point operations.
  - *Daily Practice*: Clock arithmetic, cyclic index wrap-arounds, extracting last digits, remainder distributions.
- **Day 3: Single & Two-Way Branching (If / Else)**
  - *Topic*: Comparison operators (`<`, `<=`, `>`, `>=`, `===`, `!==`), conditional branches, boundary checks.
  - *Daily Practice*: Voting eligibility, pass/fail grading, ticket pricing based on age, number sign detection.
- **Day 4: Multi-Way Branching & Nested Conditions**
  - *Topic*: Nested `if/else`, decision trees, order of checks, avoiding unreachable code branches.
  - *Daily Practice*: Tax bracket calculator, electricity bill tiering, shipping cost calculators with weight/distance tiers.
- **Day 5: Boolean Algebra & Logical Operators**
  - *Topic*: Truth tables, logical AND (`&&`), OR (`||`), NOT (`!`), De Morgan's laws, short-circuit evaluation.
  - *Daily Practice*: Leap year validation, valid triangle check (triangle inequality), user access control authorization matrix.
- **Day 6: Basic Mathematical Logic & Divisibility**
  - *Topic*: Mathematical rules converted to code, divisibility rules, parity, quadrant determination on Cartesian planes.
  - *Daily Practice*: Quadrant finder, FizzBuzz foundation, century from year, check if point lies within rectangle.
- **Day 7: Weekly Assessment 1 — Pure Logic Diagnostic**
  - *Format*: 4 Unseen multi-condition logic problems. No loops allowed. Focus: Pure conditional rigor and edge cases.
- **Day 8: Edge-Case Engineering & Number Boundaries**
  - *Topic*: Zero, negative numbers, extreme inputs, `Number.MAX_SAFE_INTEGER`, JavaScript precision quirks (`0.1 + 0.2 !== 0.3`).
  - *Daily Practice*: Safe monetary additions, safe range overlap checkers, strict boundary validations.
- **Day 9: Range Overlaps & Interval Logic**
  - *Topic*: Determining whether intervals $[a, b]$ and $[c, d]$ intersect; intersection span calculations.
  - *Daily Practice*: Meeting room conflict check, calendar free time detection, overlapping bounding boxes (1D).
- **Day 10: State Machines & Discrete Transitions**
  - *Topic*: Representing modes/states using variables, switch statements, transitioning between valid states.
  - *Daily Practice*: Traffic light controller simulation, turnstile gate logic, simple vending machine money intake.
- **Day 11: Unit Conversions & Coordinate Logic**
  - *Topic*: Mathematical scaling, coordinate geometry basics, Manhattan vs Euclidean distance.
  - *Daily Practice*: Distance between 2D points, temperature scale conversions with precision guards, time duration formatter.
- **Day 12: Mini-Project 1: Command-Line Rule Validator**
  - *Topic*: Combining all Level 1 concepts into an extensible credit card number or password strength validator.
- **Day 13: Phase 1 Revision & Mistake Remediation**
  - *Topic*: Targeted drills based on the user's logged mistake categories from Days 1–12.
- **Day 14: Weekly Assessment 2 — Level 1 Certification Benchmark**
  - *Format*: Comprehensive test of Level 1 mastery. Passing unlocks Level 2.

---

### Phase 2: Level 2 — Looping and Pattern Logic (Days 15–28)

- **Day 15: Anatomy of a Loop & Invariants**
  - *Topic*: Loop lifecycle: Initialization, Condition, Body, Step (Increment/Decrement). Loop termination invariants.
  - *Daily Practice*: Counting from $A$ to $B$, stepping by $K$, accumulator pattern (sum of 1 to $N$), factorials.
- **Day 16: While Loops vs For Loops**
  - *Topic*: Deterministic (bounded count) vs Non-deterministic (condition-driven) iteration. Infinite loop prevention.
  - *Daily Practice*: Guessing game simulation, Halve-until-zero, Collatz conjecture sequence length, GCD via Euclidean subtraction.
- **Day 17: Digit Extraction & Manipulation**
  - *Topic*: Mathematical extraction of base-10 digits using `% 10` and `Math.floor(n / 10)`.
  - *Daily Practice*: Count digits in integer, sum of digits, product of digits, count even vs odd digits in a number.
- **Day 18: Numerical Transformations (Reverse & Assemble)**
  - *Topic*: Building numbers mathematically from digits (`acc * 10 + digit`), handling trailing zeros and integer overflow.
  - *Daily Practice*: Reverse integer, check palindrome number, replace all 0s with 5s in an integer.
- **Day 19: Prime Numbers & Factorization**
  - *Topic*: Factors of a number, trial division, optimizing prime checks to $O(\sqrt{N})$.
  - *Daily Practice*: Check prime, list primes up to $N$, find prime factors, sum of all divisors.
- **Day 20: Mathematical Number Properties**
  - *Topic*: Armstrong numbers, Strong numbers, Perfect numbers, Harshad numbers.
  - *Daily Practice*: Check Armstrong number of order $k$, find all Armstrong numbers in range $[1, N]$, calculate digital root.
- **Day 21: Weekly Assessment 3 — Numerical & Iterative Logic**
  - *Format*: 4 Unseen algorithmic problems focusing on loops, number theory, and digit processing without string conversions.
- **Day 22: Introduction to Nested Loops (Row-Column Coordinates)**
  - *Topic*: Dependent vs independent inner loops. Grid coordinate spaces $(r, c)$.
  - *Daily Practice*: Square grid printing, multiplication table generation, coordinate pairs $(i, j)$ generator.
- **Day 23: Star Patterns & Geometric Intuition**
  - *Topic*: Formulating row-dependent space and star counts. Linear equation modeling for shapes.
  - *Daily Practice*: Right-angled triangle, inverted right-angled triangle, pyramid, inverted pyramid, diamond.
- **Day 24: Number Patterns & Sequences**
  - *Topic*: Generating sequence-dependent patterns.
  - *Daily Practice*: Floyd's triangle, alternating binary triangle (0/1), continuous numbering matrix, Pascal's triangle basics.
- **Day 25: Reverse Patterns & Hollow Geometries**
  - *Topic*: Boundary detection condition inside nested loops (`r === 0 || r === N-1 || c === 0 || c === N-1`).
  - *Daily Practice*: Hollow square, hollow pyramid, hourglass pattern, X-pattern in square.
- **Day 26: Loop Dry-Run & Tracing Mastery**
  - *Topic*: Formal step-by-step tracing tables for nested loops. Proving correctness and predicting iteration counts.
  - *Daily Practice*: Trace complex nested loops, predict output without running, identify off-by-one loop bugs.
- **Day 27: Phase 2 Revision & Pattern Remediation**
  - *Topic*: Consolidate nested loop patterns and numerical properties; targeted review of weak areas.
- **Day 28: Weekly Assessment 4 — Pattern & Iteration Mastery**
  - *Format*: 4 Complex nested pattern problems and numeric logic challenges under time constraint.

---

### Phase 3: Level 3 — Problem-Solving Fundamentals: Arrays & Strings (Days 29–42)

- **Day 29: Arrays in Memory & Direct Traversal**
  - *Topic*: Contiguous memory layout, $O(1)$ random access, zero-indexing, traversing forwards and backwards.
  - *Daily Practice*: Array sum, average, count positive/negative, check if array is sorted.
- **Day 30: Min, Max & Running Aggregates**
  - *Topic*: Single-pass tracking of extrema, second largest element without sorting, running prefix sum.
  - *Daily Practice*: Find max and min in single pass, find second largest element, compute running prefix sum, find equilibrium index.
- **Day 31: Frequency Counting & Direct Access Arrays**
  - *Topic*: Mapping values to counts using fixed-size frequency arrays or lookup objects.
  - *Daily Practice*: Count occurrences of each number, find most frequent element, find first non-repeating element, check duplicates.
- **Day 32: In-Place Array Manipulations**
  - *Topic*: Modifying arrays without allocating extra memory ($O(1)$ auxiliary space).
  - *Daily Practice*: Reverse array in place, rotate array by $K$ positions, move all zeroes to end, remove duplicates from sorted array.
- **Day 33: Two-Pointer Technique (Opposite & Same Direction)**
  - *Topic*: Shrinking windows, collision pointers, fast and slow pointers.
  - *Daily Practice*: Pair sum in sorted array (Two Sum II), container with most water, Dutch national flag (sort 0s, 1s, 2s).
- **Day 34: Sliding Window Technique**
  - *Topic*: Fixed-size vs dynamic-size sliding windows, amortized $O(N)$ traversal.
  - *Daily Practice*: Max sum subarray of size $K$, first negative integer in every window of size $K$, smallest subarray with sum $\ge S$.
- **Day 35: Weekly Assessment 5 — Array Algorithmic Techniques**
  - *Format*: 4 Problems evaluating Two-Pointer, Sliding Window, and In-Place Array operations.
- **Day 36: Strings as Character Arrays & Char Codes**
  - *Topic*: String immutability in JS, character codes (`charCodeAt`), ASCII mappings, case transformations.
  - *Daily Practice*: Reverse string without built-ins, count vowels/consonants, check uppercase/lowercase manually, toggle case.
- **Day 37: String Manipulation & Palindromes**
  - *Topic*: Alphanumeric filtering, two-pointer string verification, handling spaces and punctuation.
  - *Daily Practice*: Valid palindrome ignoring punctuation, reverse words in a sentence, validate IP address string format.
- **Day 38: Substring & Subsequence Logic**
  - *Topic*: Contiguous substrings vs non-contiguous subsequences, anagram verification using frequency hashing.
  - *Daily Practice*: Valid anagram, check if string $A$ is subsequence of $B$, longest common prefix among array of strings.
- **Day 39: Linear Search & Binary Search Fundamentals**
  - *Topic*: Search space reduction, $O(\log N)$ logic, mid calculation (`mid = Math.floor(low + (high - low) / 2)`).
  - *Daily Practice*: Standard binary search, find first and last occurrence of element in sorted array, search insert position.
- **Day 40: Elementary Sorting Algorithms**
  - *Topic*: Bubble Sort, Selection Sort, Insertion Sort: Mechanics, dry runs, loop invariants, stability.
  - *Daily Practice*: Implement Bubble Sort with early exit optimization, implement Selection Sort, implement Insertion Sort.
- **Day 41: Phase 3 Revision & Array/String Bug Hunting**
  - *Topic*: Off-by-one index traps, edge cases with empty strings/arrays, duplicate element handling.
- **Day 42: Weekly Assessment 6 — Midterm Benchmark (50% Milestone)**
  - *Format*: Comprehensive multi-concept assessment covering Levels 1, 2, and 3.

---

### Phase 4: Level 4 — Functions & Modular Thinking (Days 43–52)

- **Day 43: Functions, Parameters & Return Mechanics**
  - *Topic*: Single Responsibility Principle (SRP), pure functions, value vs reference passing in JavaScript.
  - *Daily Practice*: Refactoring monolithic code into modular pipelines, writing utility mathematical functions.
- **Day 44: Variable Scope & Execution Context**
  - *Topic*: Global, function, and block scope, lexical scope, JS call stack, stack frames.
  - *Daily Practice*: Tracing variable visibility across nested scopes, avoiding global state mutation bugs.
- **Day 45: Decomposing Complex Problems into Reusable Functions**
  - *Topic*: Breaking large requirements into testable sub-functions, top-down vs bottom-up design.
  - *Daily Practice*: Build a complete command-line text table formatter broken into 5 single-purpose functions.
- **Day 46: Introduction to Recursion (Base Case & Inductive Step)**
  - *Topic*: Self-referential logic, the anatomy of recursive functions: Base case vs Recursive step.
  - *Daily Practice*: Factorial, print 1 to $N$ and $N$ to 1 recursively, sum of natural numbers recursively.
- **Day 47: Call Stack Visualization & Stack Unwinding**
  - *Topic*: Tracing activation records, call stack growth and unwinding, calculating stack space complexity.
  - *Daily Practice*: Fibonacci sequence (naive recursive trace), trace recursive call trees on paper.
- **Day 48: Recursive Problem Solving on Arrays & Strings**
  - *Topic*: Passing pointers / indices in recursion rather than slicing arrays.
  - *Daily Practice*: Reverse array recursively, check palindrome string recursively, compute power $x^n$ in $O(\log n)$.
- **Day 49: Weekly Assessment 7 — Modular Design & Recursion**
  - *Format*: 4 Problems demanding recursive formulation and clean functional decomposition.
- **Day 50: Divide & Conquer — Merge Sort**
  - *Topic*: Divide, conquer, and combine paradigm. Merge Sort implementation and dry run.
  - *Daily Practice*: Merge two sorted arrays into one, implement Merge Sort from scratch, analyze $O(N \log N)$ complexity.
- **Day 51: Divide & Conquer — Quick Sort**
  - *Topic*: Partitioning schemes (Lomuto vs Hoare), pivot selection, average vs worst-case complexity.
  - *Daily Practice*: Implement array partition function, complete Quick Sort from scratch, find $k$-th smallest element via Quickselect.
- **Day 52: Recursion vs Iteration Trade-offs**
  - *Topic*: Stack overflow limits in V8, converting recursive algorithms to iterative loops with explicit stacks.
  - *Daily Practice*: Convert recursive tree traversal to iterative, convert recursive binary search to iterative loop.

---

### Phase 5: Level 5 — Core Data Structures (Days 53–66)

- **Day 53: Singly Linked Lists — Foundations**
  - *Topic*: Node structure (data, next), heap allocations, reference traversal, head and tail pointers.
  - *Daily Practice*: Implement `Node` and `LinkedList` class: insert at head, insert at tail, traverse and print.
- **Day 54: Linked List Operations & Manipulations**
  - *Topic*: Deleting nodes, searching, two-pointer list techniques (fast/slow runner).
  - *Daily Practice*: Delete by value, reverse a linked list in-place, find the middle node of a linked list, detect cycle (Floyd's algorithm).
- **Day 55: Stacks — LIFO Mechanics & Applications**
  - *Topic*: Last-In-First-Out, array-based stack implementation, stack invariants.
  - *Daily Practice*: Implement Stack class, validate balanced parentheses `({[]})`, evaluate postfix expression, Min Stack in $O(1)$.
- **Day 56: Queues — FIFO Mechanics & Circular Queues**
  - *Topic*: First-In-First-Out, queue pointer wrap-around, circular queue implementation using arrays.
  - *Daily Practice*: Implement Circular Queue, implement Queue using two Stacks, simulate ticket counter queue.
- **Day 57: Hash Tables / Hash Maps — Internal Mechanics**
  - *Topic*: Hash functions, bucket arrays, collision resolution (chaining vs open addressing), amortized $O(1)$ operations.
  - *Daily Practice*: Implement simple Hash Map with collision handling, group anagrams, find pairs with given difference.
- **Day 58: Sets & Hash Table Applications**
  - *Topic*: Set operations, deduplication, $O(1)$ presence queries.
  - *Daily Practice*: Longest consecutive sequence in unsorted array, intersection of two arrays, find all duplicates in $O(N)$ time.
- **Day 59: Weekly Assessment 8 — Linear Data Structures**
  - *Format*: 4 Problems implementing and applying Stacks, Queues, Linked Lists, and Hash Maps.
- **Day 60: Hierarchical Thinking — Binary Trees**
  - *Topic*: Tree anatomy: Root, parent, child, leaf, depth, height, degree. Node structure (`left`, `val`, `right`).
  - *Daily Practice*: Implement Binary Tree node, calculate maximum depth/height of tree, count total nodes and leaf nodes.
- **Day 61: Binary Tree Traversals (DFS & BFS)**
  - *Topic*: Pre-order, In-order, Post-order traversal (recursive & iterative); Breadth-First Level-Order traversal using a Queue.
  - *Daily Practice*: Implement all 3 DFS traversals, implement Level-Order traversal, invert/mirror a binary tree.
- **Day 62: Binary Search Trees (BST)**
  - *Topic*: BST invariant: $\text{left} < \text{root} < \text{right}$. Search, insertion, and deletion algorithms.
  - *Daily Practice*: Insert into BST, search in BST, validate if binary tree is a valid BST, find minimum value in BST.
- **Day 63: Heaps & Priority Queues**
  - *Topic*: Complete binary tree array representation, Min-Heap / Max-Heap properties, `heapifyUp` and `heapifyDown`.
  - *Daily Practice*: Implement Min-Heap from scratch, extract minimum, find $K$ largest elements in an array.
- **Day 64: Graph Representations**
  - *Topic*: Vertices and Edges, directed vs undirected, weighted vs unweighted, Adjacency Matrix vs Adjacency List.
  - *Daily Practice*: Build Adjacency List graph representation, calculate vertex degrees, check path existence in directed graph.
- **Day 65: Data Structure Selection & Trade-off Matrix**
  - *Topic*: Systematic decision making: When to use Array vs Linked List vs Hash Map vs BST vs Heap.
  - *Daily Practice*: Scenario-based architecture problems: Choose and justify optimal DS for 5 real-world system specs.
- **Day 66: Weekly Assessment 9 — Hierarchical Data Structures & Graphs**
  - *Format*: 4 Problems testing Trees, BST validation, and Heap manipulations.

---

### Phase 6: Level 6 — Algorithms & Paradigms (Days 67–78)

- **Day 67: Graph Traversal — Breadth-First Search (BFS)**
  - *Topic*: Queue-based exploration, visited sets, shortest path in unweighted graphs.
  - *Daily Practice*: Implement BFS traversal, find shortest path between two nodes in unweighted graph, count connected components.
- **Day 68: Graph Traversal — Depth-First Search (DFS)**
  - *Topic*: Recursion-based exploration, cycle detection in directed and undirected graphs.
  - *Daily Practice*: Implement DFS traversal, detect cycle in undirected graph, detect cycle in directed graph (3-color state).
- **Day 69: Backtracking Fundamentals**
  - *Topic*: State-space tree exploration, choice, constraint check, explore, un-choose (backtrack).
  - *Daily Practice*: Generate all subsets (power set), generate all permutations of an array, generate valid parentheses combinations.
- **Day 70: Backtracking Advanced**
  - *Topic*: Pruning search spaces, grid-based backtracking.
  - *Daily Practice*: Word Search in 2D grid, N-Queens problem formulation, Sudoku solver logic.
- **Day 71: Greedy Algorithms**
  - *Topic*: Greedy choice property, optimal substructure, when greedy fails vs when it succeeds.
  - *Daily Practice*: Activity selection / interval scheduling, fractional knapsack, minimum coins to make change (canonical denominations).
- **Day 72: Dynamic Programming — Concept & Memoization**
  - *Topic*: Overlapping subproblems, optimal substructure, top-down DP (recursion + cache).
  - *Daily Practice*: Memoized Fibonacci, climbing stairs problem, min cost climbing stairs.
- **Day 73: Weekly Assessment 10 — Backtracking & Graph Traversals**
  - *Format*: 4 Algorithmic challenges requiring BFS/DFS and backtracking search.
- **Day 74: Dynamic Programming — Tabulation (Bottom-Up 1D)**
  - *Topic*: Building solutions iteratively from base cases, state transitions, space optimization ($O(N) \to O(1)$ space).
  - *Daily Practice*: House robber problem, coin change (minimum coins for any denominations), longest increasing subsequence ($O(N^2)$).
- **Day 75: Dynamic Programming — 2D Grid & Classic Problems**
  - *Topic*: 2D state matrices $DP[i][j]$, grid path counting.
  - *Daily Practice*: Unique paths in a grid, minimum path sum in grid, 0/1 Knapsack problem.
- **Day 76: Time & Space Complexity Rigor**
  - *Topic*: Formal Big-O, Big-$\Omega$, Big-$\Theta$ definitions, master theorem intuition, amortized analysis.
  - *Daily Practice*: Mathematical complexity proof for 5 algorithms, identifying worst-case space consumption.
- **Day 77: Space-Time Optimization Drills**
  - *Topic*: Reducing $O(N^2)$ to $O(N \log N)$ or $O(N)$, bitwise replacements, in-place state reuse.
  - *Daily Practice*: Optimize 3 sub-optimal legacy solutions to optimal asymptotic bounds.
- **Day 78: Weekly Assessment 11 — Dynamic Programming & Algorithmic Optimization**
  - *Format*: 4 Multi-stage DP and optimization problems.

---

### Phase 7: Level 7 — Advanced Problem Solving & Capstones (Days 79–90)

- **Day 79: Algorithmic Pattern Recognition**
  - *Topic*: The 14 Core Algorithmic Patterns (Two Pointers, Sliding Window, Fast/Slow, Merge Intervals, Cyclic Sort, Top K, etc.).
  - *Daily Practice*: Classifying 10 unseen problem statements into their optimal algorithmic archetype without writing code.
- **Day 80: Mathematical Logic & Bit Manipulation**
  - *Topic*: Binary representation, bitwise operators (`&`, `|`, `^`, `~`, `<<`, `>>`), bitmasking techniques.
  - *Daily Practice*: Check if number is power of 2, count set bits (Hamming weight), find single number in array where others appear twice.
- **Day 81: Competitive & Edge-Case Gauntlet**
  - *Topic*: Handling strict time limits, boundary overflows, adversarial test cases.
  - *Daily Practice*: Trapping rain water, largest rectangle in histogram intuition, median of two sorted arrays conceptualization.
- **Day 82: Real-World Systems Logic — LRU Cache**
  - *Topic*: Designing compound data structures: Hash Map + Doubly Linked List for $O(1)$ `get` and `put`.
  - *Daily Practice*: Implement complete `LRUCache` class with automated test suite.
- **Day 83: Real-World Systems Logic — Rate Limiter & Task Scheduler**
  - *Topic*: Token bucket algorithm, sliding window log rate limiting, monotonic priority scheduling.
  - *Daily Practice*: Build in-memory rate limiter class that accepts or rejects timestamps within window limits.
- **Day 84: Comprehensive Debugging & Root-Cause Analysis**
  - *Topic*: Systematic fault localization: Binary search debugging, invariant checking, edge-case hypothesis testing.
  - *Daily Practice*: Debug 4 heavily bugged real-world algorithms with subtle logic and memory bugs.
- **Day 85: Weekly Assessment 12 — Advanced Systems & Algorithms**
  - *Format*: 4 Rigorous multi-concept problems under simulated interview/competition constraints.
- **Day 86: Independent Solving Gauntlet — Unseen Challenge 1**
  - *Topic*: Zero guidance challenge. Pure application of the 10-Step Method on an unseen complex problem.
- **Day 87: Independent Solving Gauntlet — Unseen Challenge 2**
  - *Topic*: Zero guidance challenge. Multi-concept data structure + algorithmic optimization problem.
- **Day 88: System Architecture & Logic Consolidation**
  - *Topic*: Review all 90 days of mistake tracking, identify remaining weak areas, formulate long-term study plan.
- **Day 89: 90-Day Comprehensive Capstone Examination**
  - *Format*: 5 Full-spectrum problems testing Levels 1 through 7:
    1. Pure Logic & Edge Cases
    2. Numerical/Array Manipulation
    3. Custom Data Structure Design
    4. Graph / Tree Search
    5. Dynamic Programming Optimization
- **Day 90: Master Graduation & Engineering Review**
  - *Topic*: Final performance analytics, mistake elimination certificate, roadmap transition into production software engineering and open-source contributions.

