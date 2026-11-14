# Day 3: Conditions, Relational Operators & Boundary Checks

**Level 1 — Logical Thinking Fundamentals**

---

## 📖 Core Concept
**Topic**: Branching Mechanics, Strict vs Abstract Equality, Guard Clauses

### 🔍 Step-by-Step Logic Visualization (Decision Tree Flowchart)
```text
[Input: Score]
  ├── Score < 0 or > 100 ──> 'INVALID'
  ├── Score >= 90         ──> 'A'
  ├── Score >= 80         ──> 'B'
  ├── Score >= 70         ──> 'C'
  └── Else                ──> 'FAIL'
```

---

## 📋 Today's 10-Problem Curated Practice Set

### 🟢 Easy (Foundational Application)
#### Problem 1: Water Quality Safety Classifier
- **Context**: Municipal environmental testing
- **Sample I/O**: `(7.2, 1.5, 8.0) => 'DRINKABLE'`
- **Constraints**: 0 <= ph <= 14
- **Progressive Hints**:
  1. *Small Hint*: Order checks from strictest ('DRINKABLE') to most permissive
  2. *Stronger Hint*: Write down the state transitions step-by-step.
  3. *Concept*: Branching Mechanics, Strict vs Abstract Equality, Guard Clauses
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.

#### Problem 2: Blood Pressure Risk Category
- **Context**: Clinical triage system
- **Sample I/O**: `(125, 82) => 'PREHYPERTENSION'`
- **Constraints**: systolic > 0, diastolic > 0
- **Progressive Hints**:
  1. *Small Hint*: Check both systolic and diastolic thresholds
  2. *Stronger Hint*: Write down the state transitions step-by-step.
  3. *Concept*: Branching Mechanics, Strict vs Abstract Equality, Guard Clauses
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.

#### Problem 3: Triangle Existence & Classification
- **Context**: CAD geometry validator
- **Sample I/O**: `(3, 4, 5) => 'SCALENE'`
- **Constraints**: All sides > 0
- **Progressive Hints**:
  1. *Small Hint*: Check triangle inequality first: a + b > c
  2. *Stronger Hint*: Write down the state transitions step-by-step.
  3. *Concept*: Branching Mechanics, Strict vs Abstract Equality, Guard Clauses
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.

#### Problem 4: Driver Licensing Eligibility
- **Context**: DMV automation
- **Sample I/O**: `(17, true, false) => 'PERMIT_ONLY'`
- **Constraints**: age >= 0
- **Progressive Hints**:
  1. *Small Hint*: Combine age with vision test and theory pass status
  2. *Stronger Hint*: Write down the state transitions step-by-step.
  3. *Concept*: Branching Mechanics, Strict vs Abstract Equality, Guard Clauses
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.

#### Problem 5: Quadrant Finder with Axes Check
- **Context**: Cartesian plotting engine
- **Sample I/O**: `(0, 5) => 'Y_AXIS'`
- **Constraints**: Numbers x, y
- **Progressive Hints**:
  1. *Small Hint*: Check origin (0,0) and axes before quadrants 1-4
  2. *Stronger Hint*: Write down the state transitions step-by-step.
  3. *Concept*: Branching Mechanics, Strict vs Abstract Equality, Guard Clauses
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.


### 🟡 Medium (Multi-Concept Synthesis)
#### Problem 6: Income Tax Surcharge Slab
- **Context**: Payroll processing
- **Sample I/O**: `(75000) => 13500`
- **Constraints**: income >= 0
- **Progressive Hints**:
  1. *Small Hint*: Calculate tax progressively across slabs, not single rate on total
  2. *Stronger Hint*: Trace variable values with a dry-run table.
- **Edge Cases**: Inverted bounds, extreme scale, duplicate elements.

#### Problem 7: Rock-Paper-Scissors-Lizard-Spock Arbiter
- **Context**: Game logic simulator
- **Sample I/O**: `('ROCK', 'SCISSORS') => 'PLAYER1_WINS'`
- **Constraints**: Valid gestures
- **Progressive Hints**:
  1. *Small Hint*: Map each move to the 2 moves it beats
  2. *Stronger Hint*: Trace variable values with a dry-run table.
- **Edge Cases**: Inverted bounds, extreme scale, duplicate elements.

#### Problem 8: Package Delivery Weight & Volume Tier
- **Context**: Logistics shipping rate engine
- **Sample I/O**: `(12, 45000) => 'HEAVY_OVERSIZE'`
- **Constraints**: Positive dimensions
- **Progressive Hints**:
  1. *Small Hint*: Dimensional weight = (L * W * H) / 5000
  2. *Stronger Hint*: Trace variable values with a dry-run table.
- **Edge Cases**: Inverted bounds, extreme scale, duplicate elements.


### 🔴 Challenging (Independent Algorithmic Derivation)
#### Problem 9: Financial Credit Score Rating Engine
- **Context**: Banking loan pre-approval
- **Sample I/O**: `(720, 0.28, 4) => 'APPROVED'`
- **Constraints**: FICO 300-850
- **Progressive Hints**:
  1. *Small Hint*: Factor in debt-to-income (DTI) and credit history length
  2. *Stronger Hint*: Can you reduce time complexity from quadratic to linear/logarithmic?
- **Edge Cases**: Maximum safe integer, null/undefined checks, adversarial inputs.

#### Problem 10: Flight Seat Upgrade Eligibility Matrix
- **Context**: Airline loyalty system
- **Sample I/O**: `('GOLD', 12000, true) => 'UPGRADE_CONFIRMED'`
- **Constraints**: Tier string, miles int
- **Progressive Hints**:
  1. *Small Hint*: Evaluate priority tiers with standby queue exceptions
  2. *Stronger Hint*: Can you reduce time complexity from quadratic to linear/logarithmic?
- **Edge Cases**: Maximum safe integer, null/undefined checks, adversarial inputs.


---

## 🎯 Active Starter Challenge: Water Quality Safety Index Classifier

### Problem Statement
Classifies water sample as 'DRINKABLE', 'AGRICULTURAL', 'INDUSTRIAL_ONLY', or 'HAZARDOUS' based on chemical boundaries.

#### Signature:
`function classifyWaterSafety(phLevel, turbidityNTU, dissolvedOxygenMgL)`

#### Running Your Tests:
```bash
node platform/runner.js practice/day-03/challenge.js
```
