# Day 5: Boolean Logic, Truth Tables & De Morgan's Laws

**Level 1 — Logical Thinking Fundamentals**

---

## 📖 Core Concept
**Topic**: AND (&&), OR (||), NOT (!), Short-Circuit Evaluation, Bitwise vs Logical

### 🔍 Step-by-Step Logic Visualization (Truth Table & De Morgan Equivalent)
```text
!(A && B) === (!A || !B)
!(A || B) === (!A && !B)

Short Circuit:
false && doSomething()  --> doSomething is NEVER called
true  || doSomething()  --> doSomething is NEVER called
```

---

## 📋 Today's 10-Problem Curated Practice Set

### 🟢 Easy (Foundational Application)
#### Problem 1: Multi-Factor Authentication Arbiter
- **Context**: Cybersecurity login firewall
- **Sample I/O**: `(true, true, false, true, false) => 'GRANTED'`
- **Constraints**: Booleans
- **Progressive Hints**:
  1. *Small Hint*: Rooted device check overrides everything
  2. *Stronger Hint*: Password is mandatory
  3. *Concept*: AND (&&), OR (||), NOT (!), Short-Circuit Evaluation, Bitwise vs Logical
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.

#### Problem 2: Fire Safety Alarm Trigger
- **Context**: Building automated sensor circuit
- **Sample I/O**: `(true, false, true) => true`
- **Constraints**: Booleans (smoke, heat, manualPull)
- **Progressive Hints**:
  1. *Small Hint*: Alarm if manual pull OR (smoke AND heat)
  2. *Stronger Hint*: Write down the state transitions step-by-step.
  3. *Concept*: AND (&&), OR (||), NOT (!), Short-Circuit Evaluation, Bitwise vs Logical
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.

#### Problem 3: Server Health Warning Evaluator
- **Context**: DevOps monitoring
- **Sample I/O**: `(85, 92, false) => 'CRITICAL'`
- **Constraints**: CPU%, RAM%, isReplica
- **Progressive Hints**:
  1. *Small Hint*: CPU > 90 OR RAM > 90 triggers alert unless non-production
  2. *Stronger Hint*: Write down the state transitions step-by-step.
  3. *Concept*: AND (&&), OR (||), NOT (!), Short-Circuit Evaluation, Bitwise vs Logical
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.

#### Problem 4: Simplify Complex Boolean Expression
- **Context**: Code refactoring
- **Sample I/O**: `(!(!A && !B)) => (A || B)`
- **Constraints**: Equivalence proof
- **Progressive Hints**:
  1. *Small Hint*: Apply De Morgan's Law directly
  2. *Stronger Hint*: Write down the state transitions step-by-step.
  3. *Concept*: AND (&&), OR (||), NOT (!), Short-Circuit Evaluation, Bitwise vs Logical
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.

#### Problem 5: E-Commerce Discount Applicability
- **Context**: Coupon verification
- **Sample I/O**: `(true, false, 60) => true`
- **Constraints**: isFirstOrder, hasCoupon, cartTotal
- **Progressive Hints**:
  1. *Small Hint*: Valid if first order OR (has coupon AND total >= 50)
  2. *Stronger Hint*: Write down the state transitions step-by-step.
  3. *Concept*: AND (&&), OR (||), NOT (!), Short-Circuit Evaluation, Bitwise vs Logical
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.


### 🟡 Medium (Multi-Concept Synthesis)
#### Problem 6: Industrial Turbine Interlock System
- **Context**: Factory safety PLC
- **Sample I/O**: `(true, true, false, 1200) => 'SAFE_RUN'`
- **Constraints**: Pressure, RPM, valve booleans
- **Progressive Hints**:
  1. *Small Hint*: Must satisfy all interlock invariants simultaneously
  2. *Stronger Hint*: Trace variable values with a dry-run table.
- **Edge Cases**: Inverted bounds, extreme scale, duplicate elements.

#### Problem 7: Boolean Expression Evaluator (String)
- **Context**: Config parser
- **Sample I/O**: `('true AND false OR true') => true`
- **Constraints**: AND, OR, NOT tokens
- **Progressive Hints**:
  1. *Small Hint*: AND has higher precedence than OR
  2. *Stronger Hint*: Trace variable values with a dry-run table.
- **Edge Cases**: Inverted bounds, extreme scale, duplicate elements.

#### Problem 8: Credit Card Fraud Flag Matrix
- **Context**: Payment gateway AML
- **Sample I/O**: `(true, 5000, 'FOREIGN', false) => 'FLAG_FRAUD'`
- **Constraints**: Velocity, amount, location
- **Progressive Hints**:
  1. *Small Hint*: Flag if foreign AND amount > 2000 AND NOT 3DSecure
  2. *Stronger Hint*: Trace variable values with a dry-run table.
- **Edge Cases**: Inverted bounds, extreme scale, duplicate elements.


### 🔴 Challenging (Independent Algorithmic Derivation)
#### Problem 9: Combinational Logic Circuit Simulator
- **Context**: Digital logic chip simulator
- **Sample I/O**: `([1, 0, 1], 'NAND_TREE') => 0`
- **Constraints**: Binary inputs 0 or 1
- **Progressive Hints**:
  1. *Small Hint*: Model logic gates using bitwise operations (&, |, ^, ~)
  2. *Stronger Hint*: Can you reduce time complexity from quadratic to linear/logarithmic?
- **Edge Cases**: Maximum safe integer, null/undefined checks, adversarial inputs.

#### Problem 10: Quine-McCluskey 3-Variable Simplifier
- **Context**: Logic optimization engine
- **Sample I/O**: `([0, 1, 2, 5]) => 'A\'B\' + ...'`
- **Constraints**: Min-terms array
- **Progressive Hints**:
  1. *Small Hint*: Find prime implicants by grouping terms with 1 bit difference
  2. *Stronger Hint*: Can you reduce time complexity from quadratic to linear/logarithmic?
- **Edge Cases**: Maximum safe integer, null/undefined checks, adversarial inputs.


---

## 🎯 Active Starter Challenge: Multi-Factor Authentication Access Arbiter

### Problem Statement
Grants access ('GRANTED', 'ADDITIONAL_VERIFICATION', 'DENIED') using boolean security policies. Any rooted device is strictly DENIED.

#### Signature:
`function verifyAccessPermission(hasPassword, hasSmsOtp, hasBiometrics, isTrustedDevice, isRooted)`

#### Running Your Tests:
```bash
node platform/runner.js practice/day-05/challenge.js
```
