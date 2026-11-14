# Day 4: Nested Conditions & Decision Trees

**Level 1 — Logical Thinking Fundamentals**

---

## 📖 Core Concept
**Topic**: Multi-way Branching, Guard Clauses vs Deep Nesting, Early Returns

### 🔍 Step-by-Step Logic Visualization (Nested Branching Inversion)
```text
Deeply Nested (Fragile):
if (user) {
  if (user.isActive) {
    if (user.hasRole) { ... }
  }
}

Guard Clauses (Robust):
if (!user) return 'NO_USER';
if (!user.isActive) return 'INACTIVE';
if (!user.hasRole) return 'UNAUTHORIZED';
```

---

## 📋 Today's 10-Problem Curated Practice Set

### 🟢 Easy (Foundational Application)
#### Problem 1: Smart Mortgage Approval Matrix
- **Context**: Banking lending platform
- **Sample I/O**: `(750, 100000, 300000, 3) => APPROVED`
- **Constraints**: Positive values
- **Progressive Hints**:
  1. *Small Hint*: Calculate loan-to-income (lti) ratio first
  2. *Stronger Hint*: Filter hard rejections before evaluating rates
  3. *Concept*: Multi-way Branching, Guard Clauses vs Deep Nesting, Early Returns
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.

#### Problem 2: Tiered Electricity Bill Engine
- **Context**: Utility billing calculation
- **Sample I/O**: `(350) => 47.50`
- **Constraints**: units >= 0
- **Progressive Hints**:
  1. *Small Hint*: 0-100 units at rate1, 101-300 at rate2, >300 at rate3
  2. *Stronger Hint*: Write down the state transitions step-by-step.
  3. *Concept*: Multi-way Branching, Guard Clauses vs Deep Nesting, Early Returns
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.

#### Problem 3: Movie Age & Rating Ticket Gate
- **Context**: Cinema ticketing kiosk
- **Sample I/O**: `(14, 'R', false) => 'DENIED'`
- **Constraints**: Ratings G, PG, PG13, R, NC17
- **Progressive Hints**:
  1. *Small Hint*: Check accompaniment condition for PG13 and R
  2. *Stronger Hint*: Write down the state transitions step-by-step.
  3. *Concept*: Multi-way Branching, Guard Clauses vs Deep Nesting, Early Returns
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.

#### Problem 4: Discount Tier Stacker
- **Context**: Retail checkout POS
- **Sample I/O**: `(150, true, 'VIP') => 114.75`
- **Constraints**: total >= 0
- **Progressive Hints**:
  1. *Small Hint*: Apply loyalty discount, then member tier, then seasonal coupon
  2. *Stronger Hint*: Write down the state transitions step-by-step.
  3. *Concept*: Multi-way Branching, Guard Clauses vs Deep Nesting, Early Returns
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.

#### Problem 5: Vehicle Insurance Risk Surcharge
- **Context**: Auto underwriting
- **Sample I/O**: `(22, 2, 'SPORTS') => 'HIGH_RISK'`
- **Constraints**: age >= 16
- **Progressive Hints**:
  1. *Small Hint*: Young driver (<25) + high incident count or sports vehicle
  2. *Stronger Hint*: Write down the state transitions step-by-step.
  3. *Concept*: Multi-way Branching, Guard Clauses vs Deep Nesting, Early Returns
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.


### 🟡 Medium (Multi-Concept Synthesis)
#### Problem 6: Hospital Emergency Triage Sort
- **Context**: ER admission queue
- **Sample I/O**: `(92, 180, true) => 'RESUSCITATION'`
- **Constraints**: O2 sat, Heart Rate
- **Progressive Hints**:
  1. *Small Hint*: Evaluate Glasgow coma score and vital sign deviations
  2. *Stronger Hint*: Trace variable values with a dry-run table.
- **Edge Cases**: Inverted bounds, extreme scale, duplicate elements.

#### Problem 7: Automated Hotel Room Upgrade Engine
- **Context**: Hospitality CRM
- **Sample I/O**: `('DELUXE', 'PLATINUM', 3) => 'SUITE'`
- **Constraints**: Room categories, tiers
- **Progressive Hints**:
  1. *Small Hint*: Check vacancy priority and consecutive stay length
  2. *Stronger Hint*: Trace variable values with a dry-run table.
- **Edge Cases**: Inverted bounds, extreme scale, duplicate elements.

#### Problem 8: Foreign Exchange Currency Spread Fee
- **Context**: Fintech FX broker
- **Sample I/O**: `('USD', 'EUR', 10000, true) => 12.50`
- **Constraints**: Valid currency pairs
- **Progressive Hints**:
  1. *Small Hint*: Apply tiered spread based on volume and institutional flag
  2. *Stronger Hint*: Trace variable values with a dry-run table.
- **Edge Cases**: Inverted bounds, extreme scale, duplicate elements.


### 🔴 Challenging (Independent Algorithmic Derivation)
#### Problem 9: Autonomous Drone Flight Clearance
- **Context**: Aviation traffic management
- **Sample I/O**: `(120, 25, 'URBAN', false) => 'DENIED'`
- **Constraints**: Altitude, wind speed
- **Progressive Hints**:
  1. *Small Hint*: Check altitude ceilings, wind tolerance, and geo-fence zones
  2. *Stronger Hint*: Can you reduce time complexity from quadratic to linear/logarithmic?
- **Edge Cases**: Maximum safe integer, null/undefined checks, adversarial inputs.

#### Problem 10: Multi-Jurisdiction Sales Tax Arbiter
- **Context**: Cross-border tax compliance
- **Sample I/O**: `('US', 'CA', 100, 'DIGITAL') => 8.50`
- **Constraints**: Country/state code
- **Progressive Hints**:
  1. *Small Hint*: Origin vs destination sourcing rules based on product category
  2. *Stronger Hint*: Can you reduce time complexity from quadratic to linear/logarithmic?
- **Edge Cases**: Maximum safe integer, null/undefined checks, adversarial inputs.


---

## 🎯 Active Starter Challenge: Smart Mortgage Loan Approval Matrix

### Problem Statement
Evaluates loan approval status ('APPROVED', 'CONDITIONAL', 'REJECTED') and calculated interest rate based on loan-to-income ratio and credit score.

#### Signature:
`function evaluateMortgageApplication(creditScore, annualIncome, loanAmount, employmentYears)`

#### Running Your Tests:
```bash
node platform/runner.js practice/day-04/challenge.js
```
