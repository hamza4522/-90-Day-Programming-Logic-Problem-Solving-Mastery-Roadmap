/**
 * 90-Day General Logic Building & Analytical Thinking Curriculum Generator
 * Generates comprehensive `logic-building.md` modules for Days 1 to 90.
 */
const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..', 'practice');

const LOGIC_SYLLABUS = [
  // Level 1: Days 1-14 (Cognitive Foundations & First Principles)
  { day: 1, title: "First Principles Thinking: Deconstructing to Fundamental Truths", model: "First Principles (Aristotle / Musk)", core: "Breaking down complex problems to their most basic foundational elements and reasoning up from there, rather than reasoning by analogy." },
  { day: 2, title: "Deductive, Inductive & Abductive Reasoning in Problem Solving", model: "The Triad of Logic Inference", core: "Understanding when a conclusion is guaranteed (deduction), probable (induction), or the most plausible hypothesis (abduction)." },
  { day: 3, title: "Propositional Logic, Implications & The Contrapositive", model: "Formal Truth Logic", core: "Understanding P implies Q (P => Q), its converse, inverse, and contrapositive (not Q => not P). Avoiding false equivalences." },
  { day: 4, title: "Inversion Thinking: 'Invert, Always Invert' (Carl Jacobi)", model: "Inversion Mental Model", core: "Instead of asking 'how do I succeed?', ask 'what would guarantee catastrophic failure?' and systematically eliminate those failure modes." },
  { day: 5, title: "Boolean Simplification & Decision Tables", model: "Karnaugh Mapping & De Morgan", core: "Minimizing complex compound conditional rules into clean, non-redundant logical decision matrices." },
  { day: 6, title: "The Parity Invariant: Even/Odd Logic in Problem Solving", model: "Parity Invariant", core: "Using odd and even properties to prove that certain states can or cannot ever be reached (e.g. mutilated chessboard puzzle)." },
  { day: 7, title: "Logic Assessment 1: Analytical Deduction & Knights and Knaves", model: "Self-Consistency Analysis", core: "Evaluating sets of statements where truth values depend on reciprocal assertions. Resolving paradoxes." },
  { day: 8, title: "The Extremal Principle: Analyzing Smallest & Largest States", model: "Extremal Principle", core: "When facing a complex system, consider the element with the minimum or maximum value to reveal hidden structural invariants." },
  { day: 9, title: "Interval Reasoning & The Inclusion-Exclusion Principle", model: "Set Theory Foundations", core: "Formulating overlap logic for intervals and sets: |A U B| = |A| + |B| - |A n B| and generalizing to N dimensions." },
  { day: 10, title: "State Space Exploration & Decision Trees", model: "State Space Trees", core: "Visualizing all possible transitions of a system as a directed graph. Pruning impossible branches early." },
  { day: 11, title: "Fermi Estimation & Order-of-Magnitude Intuition", model: "Fermi Problem Solving", core: "Calculating quick dimensional estimates with limited data (e.g. how many piano tuners are in Chicago?)." },
  { day: 12, title: "Cognitive Biases in Engineering: Anchoring & Sunk Cost", model: "Cognitive Psychology", core: "Recognizing when your brain is clinging to a flawed initial hypothesis and learning to reset your mental state." },
  { day: 13, title: "Systematic Debugging: Binary Search of Problem Spaces", model: "Hypothesis Elimination", core: "Isolating variables systematically: bisecting inputs and code regions to pinpoint bugs with O(log N) experiments." },
  { day: 14, title: "Logic Assessment 2: Analytical Problem Decomposition Benchmark", model: "Foundational Diagnostic", core: "Comprehensive examination of Level 1 reasoning, propositional deduction, and boundary proofs." },

  // Level 2: Days 15-28 (Invariants, Patterns & Inductive Logic)
  { day: 15, title: "Mathematical Induction: Proving for All Natural Numbers", model: "Principle of Induction", core: "Formulating base cases and inductive hypotheses to prove that an algorithmic property holds for all N." },
  { day: 16, title: "Loop Invariants: Formal Correctness Before Coding", model: "Hoare Logic & Invariants", core: "Defining a condition that is true before the loop, preserved during each iteration, and guarantees correctness at termination." },
  { day: 17, title: "Monovariants: Proving That Algorithms Must Terminate", model: "Monovariant Progress Metric", core: "Defining a strictly decreasing positive integer quantity that proves an iterative process cannot run forever." },
  { day: 18, title: "Numerical Pattern Recognition & Recurrence Relations", model: "Sequence Analysis", core: "Identifying arithmetic, geometric, and recursive patterns in sequences (Fibonacci, Catalan, Triangular numbers)." },
  { day: 19, title: "The Pigeonhole Principle: Guaranteed Collisions", model: "Dirichlet's Drawer Principle", core: "If N+1 items are put into N containers, at least one container must hold 2+ items. Application in hashing and array duplicates." },
  { day: 20, title: "Exploiting Symmetries to Halve Problem Complexity", model: "Symmetry & Asymmetry", core: "Reflecting coordinates, rotational symmetries, and invariant centroids to reduce computational work by 50% or more." },
  { day: 21, title: "Logic Assessment 3: Invariant Proving & Mathematical Deduction", model: "Milestone Diagnostic", core: "Examining loop invariant proofs, monovariants, and inductive problem decomposition." },
  { day: 22, title: "2D Grid Reasoning & Coordinate Transformations", model: "Spatial Matrix Thinking", core: "Translating 1D indices to 2D (r, c), 4-directional and 8-directional neighbor exploration, matrix rotations." },
  { day: 23, title: "Geometric Intuition: Bounding Boxes & Distance Metrics", model: "Computational Geometry", core: "Manhattan (L1) vs Euclidean (L2) vs Chebyshev (L-infinity) distances; interval projections." },
  { day: 24, title: "Recursion as Self-Similarity: The Fractal Mindset", model: "Fractal & Recursive Logic", core: "Viewing problems as miniature versions of themselves. Formulating the recurrence equation." },
  { day: 25, title: "Game Theory & Discrete Combinatorial Games", model: "Nim-Sum & Minimax Logic", core: "Winning and losing positions, backward induction from terminal states, parity of game states." },
  { day: 26, title: "Second-Order Thinking: Anticipating Cascading Effects", model: "Second-Order Thinking (Howard Marks)", core: "Asking 'and then what?'. Evaluating the indirect, long-term consequences of an algorithmic design choice." },
  { day: 27, title: "The Complexity Mindset: Asymptotic Thinking vs Constant Factors", model: "Asymptotic Scalability", core: "Understanding why an O(N log N) algorithm will always crush an O(N^2) algorithm as N grows, regardless of hardware." },
  { day: 28, title: "Logic Assessment 4: Complex Pattern & Inductive Logic Benchmark", model: "Level 2 Certification", core: "Certification benchmark covering induction, invariants, pigeonhole logic, and grid geometry." },

  // Level 3: Days 29-42 (Problem Reduction & Archetype Recognition)
  { day: 29, title: "Problem Reduction: Mapping the Unfamiliar to the Known", model: "Reductionism in CS", core: "Transforming an obscure problem into standard graph traversal, sorting, or shortest path problems." },
  { day: 30, title: "The Greedy Choice Property: Local vs Global Optimum", model: "Greedy Strategy Formulation", core: "Proving whether taking the locally optimal step at each stage leads to a globally optimal solution." },
  { day: 31, title: "Divide and Conquer: Independence of Subproblems", model: "Divide, Conquer, Combine", core: "Splitting input into mutually exclusive subproblems, solving independently, and merging efficiently." },
  { day: 32, title: "The Dynamic Programming Mindset: Optimal Substructure", model: "Bellman's Principle of Optimality", core: "Recognizing when an optimal solution to a problem contains optimal solutions to subproblems." },
  { day: 33, title: "Monotonicity: Why Sorted Order Enables Fast Search", model: "Monotonic Invariant", core: "Understanding that sortedness converts search spaces into directed slopes, turning O(N) into O(log N)." },
  { day: 34, title: "Sliding Window Logic: Expanding & Contracting Invariants", model: "Window Invariant", core: "Maintaining valid window states while advancing boundary pointers across continuous streams." },
  { day: 35, title: "Logic Assessment 5: Algorithmic Paradigm Selection Diagnostic", model: "Paradigm Classifier", core: "Diagnosing which algorithmic pattern (Greedy, DP, Binary Search, Two-Pointer) applies to unseen problems." },
  { day: 36, title: "State Automata for Sequence & String Parsing", model: "Deterministic Finite Automata", core: "Modeling text and token streams as state transitions with zero backtracking." },
  { day: 37, title: "Identity, Equality & The Philosophy of Hashing", model: "Hashing Invariants", core: "Defining what makes two objects identical: structural equality vs reference equality vs hash value." },
  { day: 38, title: "Monotonic Ordering in Stacks & Queues", model: "Monotonic Invariant", core: "Maintaining elements in strictly ascending or descending order to answer nearest smaller/greater queries in O(1)." },
  { day: 39, title: "Binary Search on Monotonic Answer Spaces", model: "Predicate Inversion", core: "Searching over answers rather than input arrays: converting optimization problems into feasibility checks." },
  { day: 40, title: "Canonical Representations: Normalizing Data for Comparison", model: "Canonical Form", core: "Transforming anagrams, graph isomorphisms, or geometries into a single standard form for O(1) comparison." },
  { day: 41, title: "Graph Modeling: Translating Abstract Relationships", model: "Graph Abstraction", core: "Mapping dependencies, state transitions, networks, and puzzle configurations into vertices and edges." },
  { day: 42, title: "Logic Assessment 6: Midterm Analytical & Decomposition Gauntlet", model: "50% Milestone Exam", core: "Rigorous evaluation of problem reduction, search space pruning, and structural modeling." },

  // Level 4: Days 43-52 (Modular Deconstruction & Abstraction)
  { day: 43, title: "Abstraction Barriers & The Leaky Abstraction Law (Spolsky)", model: "Abstraction Layers", core: "Designing interfaces that hide internal details without hiding critical failure modes or performance costs." },
  { day: 44, title: "Composition over Inheritance: Building Compound Behaviors", model: "Modular Composition", core: "Assembling complex behaviors from small, independent pure functions rather than deep inheritance hierarchies." },
  { day: 45, title: "The Purity Mindset: Determinism & Side-Effect Elimination", model: "Referential Transparency", core: "Understanding that pure functions (same input => same output, zero side effects) make systems trivially testable." },
  { day: 46, title: "Tree Recursion: Top-Down Inheritance vs Bottom-Up Aggregation", model: "Hierarchical Flow", core: "Deciding whether information must flow from parent to children (parameters) or children to parent (return values)." },
  { day: 47, title: "Call Stack Mechanics: Visualizing Memory Activation Frames", model: "Stack Frame Visualization", core: "Tracing how function calls allocate stack memory and how deep recursion risks call stack exhaustion." },
  { day: 48, title: "Recurrence Relations & The Master Theorem Intuition", model: "Recurrence Analysis", core: "Understanding how T(N) = aT(N/b) + O(N^d) compares work done at leaves vs work done at roots." },
  { day: 49, title: "Logic Assessment 7: Functional & Recursive Decomposition", model: "Milestone Diagnostic", core: "Testing decomposition of complex monolithic specifications into reusable, pure sub-routines." },
  { day: 50, title: "Backtracking & Systematic Search Space Pruning", model: "State-Space Tree Search", core: "Exploring decision spaces: making a choice, validating constraints, recursing, and undoing the choice." },
  { day: 51, title: "Branch and Bound: Using Bounds to Prune Exponential Spaces", model: "Bounding Heuristics", core: "Calculating optimistic estimates to abandon entire branches of search trees that cannot beat the current best." },
  { day: 52, title: "Occam's Razor in Software Engineering", model: "Parsimony (Occam's Razor)", core: "Among competing algorithmic solutions, the simplest solution with the fewest assumptions is almost always superior." },

  // Level 5: Days 53-66 (Structural Logic & Relationships)
  { day: 53, title: "Memory Locality & Spatial vs Temporal Access Patterns", model: "Hardware Cache Locality", core: "Why contiguous arrays outperform linked node lists by 10x in modern CPU L1/L2 caches due to prefetching." },
  { day: 54, title: "Reference Semantics, Aliasing & Pointer Graphs", model: "Pointer Graph Topology", core: "Tracking multiple references pointing to the same memory object; avoiding unintended mutations." },
  { day: 55, title: "LIFO vs FIFO: Push-Down Automata vs Queue Buffers", model: "Data Flow Invariants", core: "Evaluating when reverse chronological order (LIFO) vs fair arrival order (FIFO) is required by business rules." },
  { day: 56, title: "Hierarchical Reasoning & Lowest Common Ancestors (LCA)", model: "Tree Ancestry Logic", core: "Finding the deepest node that is an ancestor to two given nodes; binary lifting mental model." },
  { day: 57, title: "Equivalence Relations & Disjoint Set Union (DSU)", model: "Equivalence Classes", core: "Managing dynamic connectivity: reflexivity, symmetry, and transitivity with union-by-rank and path compression." },
  { day: 58, title: "Topological Orderings & Dependency Resolution in DAGs", model: "Dependency DAGs", core: "Detecting circular dependencies and determining valid linear execution sequences (Kahn's algorithm)." },
  { day: 59, title: "Logic Assessment 8: Graph & Structural Problem Solving", model: "Milestone Diagnostic", core: "Assessing dependency graphs, tree ancestor traversals, and dynamic equivalence classes." },
  { day: 60, title: "Shortest Path Intuition: The Relaxation Invariant", model: "Edge Relaxation", core: "Understanding why triangle inequality d(v) <= d(u) + w(u,v) guarantees shortest paths once all edges are relaxed." },
  { day: 61, title: "Minimum Spanning Trees: Cut & Cycle Invariants", model: "MST Invariants", core: "The Cut Property (lightest cross edge must be in MST) and Cycle Property (heaviest edge in cycle cannot be in MST)." },
  { day: 62, title: "Heap Invariants: Maintaining Partial Orders Efficiently", model: "Partial Order vs Total Order", core: "Why maintaining only parent <= children (O(log N)) is vastly cheaper than maintaining a fully sorted array (O(N))." },
  { day: 63, title: "Trie Invariants: Common Prefix Factoring", model: "Prefix Tree Compression", core: "Sharing common character path prefixes to reduce string dictionary search to O(length) independent of dictionary size." },
  { day: 64, title: "Spatial Subdivision & Hierarchical Bounding", model: "Spatial Partitioning", core: "Dividing 2D/3D space into quadrants (Quadtrees) or bounding boxes to turn O(N^2) collision checks into O(N log N)." },
  { day: 65, title: "The Data Structure Selection Decision Tree", model: "Architectural Decision Matrix", core: "A systematic algorithm for choosing the ideal data structure given read vs write frequencies and constraints." },
  { day: 66, title: "Logic Assessment 9: Complex Data Structure Selection", model: "Level 5 Certification", core: "Comprehensive assessment evaluating structural trade-offs, graph representations, and space bounds." },

  // Level 6: Days 67-78 (Optimization Theory & Heuristics)
  { day: 67, title: "Amortized Analysis: True Average Cost of Operations", model: "Amortized Complexity", core: "Aggregate, accounting, and potential methods: proving why dynamic array resizing is O(1) amortized despite O(N) copies." },
  { day: 68, title: "Space-Time Trade-off Optimization Theory", model: "Time-Memory Trade-off", core: "Trading memory for speed: precomputations, memoization tables, prefix arrays, and bitsets." },
  { day: 69, title: "Constraint Satisfaction Problems & Forward Checking", model: "Constraint Propagation", core: "Pruning combinatorial variables by maintaining domains of possible values and filtering incompatible states." },
  { day: 70, title: "Minimax & Adversarial Decision Making", model: "Game Tree Pruning", core: "Evaluating zero-sum games with Alpha-Beta pruning: eliminating subtrees that a rational opponent will never allow." },
  { day: 71, title: "Randomized Logic: Monte Carlo vs Las Vegas", model: "Probabilistic Algorithms", core: "Las Vegas (always correct result, random runtime) vs Monte Carlo (deterministic runtime, probabilistic correctness)." },
  { day: 72, title: "Approximation Algorithms & Heuristic Thinking", model: "Approximation Bounds", core: "When exact solutions are NP-Hard, formulating polynomial-time approximations with guaranteed bounds (e.g. 2-approximation)." },
  { day: 73, title: "Logic Assessment 10: Advanced Optimization & Heuristics", model: "Milestone Diagnostic", core: "Testing amortized proofs, constraint satisfaction, and approximation heuristics." },
  { day: 74, title: "State Compression with Bitmasks", model: "Bitmask State Modeling", core: "Representing sets of up to 30 elements as binary integer bits; O(1) union, intersection, and presence checks." },
  { day: 75, title: "Range Query Invariants: Prefix vs Segment vs Fenwick", model: "Range Query Structures", core: "Comparing static prefix sums (O(1) query, O(N) update) with dynamic Fenwick / Segment trees (O(log N) query & update)." },
  { day: 76, title: "Flow Networks & The Max-Flow Min-Cut Theorem", model: "Network Flow Duality", core: "The maximum amount of flow passing from source to sink equals the total capacity of the minimum cut separating them." },
  { day: 77, title: "Computational Complexity: P vs NP vs NP-Complete Demystified", model: "Complexity Theory", core: "Verification in polynomial time vs generation in polynomial time; reduction to SAT (Cook-Levin Theorem)." },
  { day: 78, title: "Logic Assessment 11: Algorithmic Rigor & Formal Proofs", model: "Level 6 Certification", core: "Rigorous certification testing formal correctness proofs, flow duality, and complexity classification." },

  // Level 7: Days 79-90 (Master Thinker & Autonomous Problem Solving)
  { day: 79, title: "The 10 Mental Models of World-Class Software Engineers", model: "Universal Mental Models", core: "Pareto principle, feedback loops, critical mass, margin of safety, compounding, and leverage in software engineering." },
  { day: 80, title: "Chesterton's Fence: Understanding Context Before Modification", model: "Chesterton's Fence", core: "Never remove a condition, constraint, or component until you understand why it was put there in the first place." },
  { day: 81, title: "Root Cause Analysis: The 5 Whys & Fault Tree Deduction", model: "Root Cause Analysis", core: "Drilling down past superficial symptoms to discover the true underlying systemic flaw causing production bugs." },
  { day: 82, title: "Multi-Criteria Decision Analysis (MCDA) for Engineering", model: "Objective Trade-off Matrix", core: "Weighing competing architectural options against weighted criteria (speed, cost, maintainability, risk) without bias." },
  { day: 83, title: "Deconstructing Ambiguous Real-World Requirements", model: "Ambiguity Resolution", core: "Extracting explicit constraints, implicit assumptions, and edge conditions from vague business stakeholder requests." },
  { day: 84, title: "Cognitive Control & Stress Inoculation Under Pressure", model: "High-Pressure Problem Solving", core: "Maintaining systematic structured thinking during live coding interviews and critical production outages." },
  { day: 85, title: "Logic Assessment 12: Unseen Problem Decomposition Gauntlet", model: "Senior Staff Diagnostic", core: "Deconstructing an unseen, highly ambiguous real-world system problem from zero clues into formal logic." },
  { day: 86, title: "Independent Solving Solo Drill 1: The Zero-Hint Gauntlet", model: "Pure Autonomous Solving", core: "End-to-end deduction: statement -> inputs/outputs -> manual trace -> English algorithm -> pseudocode -> proof." },
  { day: 87, title: "Independent Solving Solo Drill 2: Multi-Paradigm Synthesis", model: "Multi-Concept Synthesis", core: "Synthesizing disparate logical concepts (graph + dynamic programming + bitmask) to conquer complex challenges." },
  { day: 88, title: "Post-Mortem & Cognitive Bias Audit of Your 90 Days", model: "Metacognitive Reflection", core: "Auditing your platform's mistake tracker database; identifying your dominant thinking traps and cognitive fixes." },
  { day: 89, title: "90-Day Comprehensive Analytical Logic Capstone Examination", model: "Grand Capstone Exam", core: "Full-spectrum 5-part problem solving examination testing Levels 1 through 7." },
  { day: 90, title: "Master Thinker Graduation: The Autonomous Mindset", model: "Lifelong Engineering Mastery", core: "Final performance evaluation, analytical scorecard, and personal blueprint for continuous autonomous mastery." }
];

function generateLogicBuildingFiles() {
  console.log("Compiling General Logic Building & Analytical Thinking modules for Days 1 to 90...");

  for (let d = 1; d <= 90; d++) {
    const dayStr = String(d).padStart(2, '0');
    const dayFolder = path.join(baseDir, `day-${dayStr}`);
    if (!fs.existsSync(dayFolder)) {
      fs.mkdirSync(dayFolder, { recursive: true });
    }

    const info = LOGIC_SYLLABUS[d - 1] || {
      day: d,
      title: `General Logic Building — Day ${d}`,
      model: "Analytical Decomposition",
      core: "Systematic deduction and mental model application."
    };

    const lvl = Math.min(7, Math.ceil(d / 13));

    const content = `# Day ${d}: General Logic Building & Analytical Thinking

**Topic**: ${info.title}  
**Level**: Level ${lvl}  
**Primary Mental Model**: 🧠 *${info.model}*

---

## 🎯 Cognitive Objective
${info.core}

---

## 🧩 Mental Model Deep Dive: ${info.model}

### The Core Principle
Every seasoned engineer develops an inventory of **mental models**—distilled representations of how systems, logic, and reality behave. Rather than relying on brute-force intuition, mental models give you a structured lens to deconstruct unfamiliar problems.

\`\`\`text
[ Raw, Ambiguous Problem Statement ]
                 │
                 ▼
    [ Apply Mental Model: ${info.model} ]
                 │
                 ▼
    [ Deconstructed Variables & Invariants ]
                 │
                 ▼
    [ Deterministic Algorithmic Solution ]
\`\`\`

### How to Apply This Today:
1. **Identify the Core Invariant**: What property of this system remains unchanged regardless of input transformations?
2. **Challenge Underlying Assumptions**: What are you assuming to be true that might actually be false or variable?
3. **Trace the Extremes**: What happens when the input is 0? When it is 1? When it is maximum possible value?

---

## 🔍 Analytical Case Study / Brain Teaser

### The Problem Scenario:
Imagine an unfamiliar technical problem presented by a stakeholder with no clear algorithmic path.
- **Premise**: We are given a set of constraints that seem contradictory or overwhelming.
- **The Cognitive Trap**: Immediately jumping to code or guessing data structures.
- **The Structured Fix**: Apply **${info.model}** to isolate the independent variables.

\`\`\`text
Step 1: Write down what is explicitly known vs what is assumed.
Step 2: Eliminate all assumed constraints that were not formally stated.
Step 3: Construct a minimal 3-step manual dry-run with paper and pencil.
Step 4: Prove the invariant holds before writing a single line of syntax.
\`\`\`

---

## 🧠 Daily Analytical Thinking Drill

> **The Critical Thinking Challenge (Day ${d})**:  
> *Apply the mental model of **${info.model}** to the following scenario:*  
> **"${info.core}"**

### Your Step-by-Step Logical Deductions:
1. **State the Invariant**:
   - What cannot change in this problem space?
2. **Identify the Failure Mode**:
   - What is the easiest way for an algorithm here to produce an incorrect answer?
3. **Formulate the Proof / Deduction**:
   - Write out in 3 clear sentences why your logical approach guarantees correctness.

\`\`\`text
[ Write your deduction notes here ]
\`\`\`

---

## 💡 Mentor Wisdom for Day ${d}
> *"Clear thinking precedes clear code. If you cannot explain the logic of your solution in plain language to a non-technical person, you do not understand the problem yet. Step away from the keyboard, grab a sheet of paper, and think."*
`;

    fs.writeFileSync(path.join(dayFolder, 'logic-building.md'), content, 'utf8');
  }

  console.log("✔ Successfully created `logic-building.md` for all 90 days!");
}

generateLogicBuildingFiles();

