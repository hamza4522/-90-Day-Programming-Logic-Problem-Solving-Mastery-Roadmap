# The Logic Mastery Methodology: Thinking Before Coding

## 1. The 10-Step Problem-Solving Pipeline

Every single problem, from day 1 to day 90, MUST be tackled using this disciplined cognitive pipeline. Never jump straight to the code editor.

```
[ Understand Problem ] ──> [ Define In/Out ] ──> [ Uncover Constraints ]
                                                             │
[ Algorithm (English) ] <── [ Manual Example Trace ] <───────┘
         │
         ▼
[ Pseudocode Draft ] ──> [ Working Code (JS) ] ──> [ Edge Case Tests ]
                                                             │
[ Optimize & Scale ] <── [ Complexity Analysis (Time/Space) ]
```

### Step 1: Understand the Problem
- Read the statement twice.
- Restate the goal in your own words in one clear sentence.
- Eliminate ambiguity: What are we actually being asked to calculate, transform, or decide?

### Step 2: Identify Inputs and Expected Outputs
- What exact data types are incoming (numbers, strings, booleans, objects, arrays)?
- What exact type and format must be returned?
- Does the function mutate inputs in place, or return a new value?

### Step 3: Identify Conditions and Constraints
- What are the minimum and maximum ranges of numbers?
- Can inputs be negative, zero, empty, null, or undefined?
- Are inputs sorted? Can there be duplicate values?

### Step 4: Solve the Problem Manually (Dry-Run Example)
- Pick a concrete, non-trivial sample input.
- Walk through how a human brain solves it step by step on paper or a board.
- Track variables manually. Never write code until you can solve it by hand without intuition jumps.

### Step 5: Write the Algorithm in Plain English
- Describe the sequential actions step by step:
  1. *Initialize a counter at 0.*
  2. *Check if the input meets rule X.*
  3. *Repeat for each item...*

### Step 6: Convert the Algorithm into Pseudocode
- Bridge the gap between human language and syntax without worrying about semicolons or library methods.
- Focus strictly on logic flow: loops, branches, variables, updates.

### Step 7: Write the Actual Code
- Implement clean, idiomatic JavaScript (Node.js).
- Use descriptive variable names that reflect the problem domain.
- Keep functions small and focused on a single responsibility.

### Step 8: Test Normal and Edge Cases
- Test the happy path.
- Test the 6 Essential Edge Conditions:
  1. **Zero / Empty** (`0`, `""`, `[]`)
  2. **Singular / Minimal** (`1`, single character, single element)
  3. **Extremes / Limits** (Very large numbers, `Number.MAX_SAFE_INTEGER`, negative numbers)
  4. **Duplicates / Uniformity** (All identical elements, e.g. `[5, 5, 5]`)
  5. **Alternating / Inverted** (Reverse sorted, alternating polarities)
  6. **Boundary Crossings** (Off-by-one errors on thresholds)

### Step 9: Analyze Time and Space Complexity
- Express Time Complexity using Big-O: How does execution time scale as input size $N$ increases?
- Express Space Complexity: How much auxiliary memory is allocated relative to $N$?

### Step 10: Find a Better Solution (Optimize)
- Can we eliminate redundant checks?
- Can we trade space for time (e.g. using a hash map or frequency table)?
- Can we reduce $O(N^2)$ to $O(N \log N)$ or $O(N)$?

---

## 2. Mistake Taxonomy

When a bug or blocker occurs, it is categorized into one of 9 diagnostic areas:

1. **Problem understanding mistakes**: Misinterpreting what was asked or missing a hidden requirement.
2. **Logical mistakes**: Inverted logic, incorrect deduction, wrong step ordering.
3. **Condition mistakes**: Incorrect operators (`>` vs `>=`), faulty Boolean compound expressions (`&&` vs `||`).
4. **Loop mistakes**: Off-by-one bounds, missing loop updates, infinite loops, incorrect termination conditions.
5. **Array indexing mistakes**: Out-of-bounds access, 0-indexing confusion, overwriting elements prematurely.
6. **Mathematical mistakes**: Integer division vs floating point, modulo with negatives, overflow, precedence confusion.
7. **Edge-case mistakes**: Failing on `0`, empty arrays, negative numbers, or single-element inputs.
8. **Time complexity mistakes**: Inadvertently nesting loops (e.g. `indexOf` inside a `for` loop), unnecessary recomputation.
9. **Syntax mistakes**: Typos, incorrect variable declarations, scoping issues with `let` vs `const`.

---

## 3. The 4-Tier Intelligent Hint Protocol

When you are stuck, guidance is delivered strictly across 4 guarded tiers:

- **Tier 1: Guiding Question / Small Hint**: A nudge directing attention to a specific relationship or pattern.
- **Tier 2: Structural / Logical Hint**: Revealing the algorithmic mechanism or invariant without code.
- **Tier 3: Concept Deep-Dive**: Explaining the underlying computer science or mathematical concept with a miniature isolated example.
- **Tier 4: Solution Reveal**: Only shown when you explicitly say: *"Reveal complete solution"*.

