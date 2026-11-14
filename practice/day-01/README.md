# Day 1: Execution Model, State Tracing & Pure Logical Branching

**Level 1 — Logical Thinking Fundamentals**

---

## 📖 Core Concept
**Topic**: Variable Memory Boxes, Assignment vs Comparison, Sequential Execution

### 🔍 Step-by-Step Logic Visualization (Execution Flow & Memory Tracing Table)
```text
Line 1: let a = 5;       --> [Memory: a = 5]
Line 2: let b = 10;      --> [Memory: a = 5, b = 10]
Line 3: a = a + b;       --> [Memory: a = 15, b = 10]
Line 4: b = a - b;       --> [Memory: a = 15, b = 5]
Line 5: a = a - b;       --> [Memory: a = 10, b = 5]  <-- Swapped!
```

---

## 📋 Today's 10-Problem Curated Practice Set

### 🟢 Easy (Foundational Application)
#### Problem 1: Metro Smart Transit Fare Engine
- **Context**: Transit ticket terminal calculation
- **Sample I/O**: `('ADULT', true, 2) => 5.25`
- **Constraints**: zonesCrossed >= 0
- **Progressive Hints**:
  1. *Small Hint*: Check passenger type first
  2. *Stronger Hint*: Seniors are exempt from peak hour surcharge
  3. *Concept*: Variable Memory Boxes, Assignment vs Comparison, Sequential Execution
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.

#### Problem 2: Sensor Threshold Monitor
- **Context**: Industrial temperature alert
- **Sample I/O**: `(105) => 'CRITICAL_HIGH'`
- **Constraints**: -50 <= temp <= 150
- **Progressive Hints**:
  1. *Small Hint*: Check bounds sequentially
  2. *Stronger Hint*: Avoid gap intervals
  3. *Concept*: Variable Memory Boxes, Assignment vs Comparison, Sequential Execution
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.

#### Problem 3: In-Place Variable Swap
- **Context**: Memory-constrained register swap
- **Sample I/O**: `(5, 10) => [10, 5]`
- **Constraints**: No temp variable
- **Progressive Hints**:
  1. *Small Hint*: Use addition and subtraction
  2. *Stronger Hint*: Watch for overflow in 32-bit integers
  3. *Concept*: Variable Memory Boxes, Assignment vs Comparison, Sequential Execution
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.

#### Problem 4: Library Late Fee Tiering
- **Context**: Public library return system
- **Sample I/O**: `(12) => 8.50`
- **Constraints**: daysLate >= 0
- **Progressive Hints**:
  1. *Small Hint*: Apply tiered rates: first 5 days, next 10 days, beyond 15 days
  2. *Stronger Hint*: Write down the state transitions step-by-step.
  3. *Concept*: Variable Memory Boxes, Assignment vs Comparison, Sequential Execution
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.

#### Problem 5: E-Commerce Shipping & Voucher Arbiter
- **Context**: Shopping cart checkout rules
- **Sample I/O**: `(45, 'SAVE10', true) => 40.50`
- **Constraints**: cartTotal >= 0
- **Progressive Hints**:
  1. *Small Hint*: Apply coupon before checking free shipping threshold
  2. *Stronger Hint*: Write down the state transitions step-by-step.
  3. *Concept*: Variable Memory Boxes, Assignment vs Comparison, Sequential Execution
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.


### 🟡 Medium (Multi-Concept Synthesis)
#### Problem 6: Clock Hand Angle Deductor
- **Context**: Analog clock math visualization
- **Sample I/O**: `(3, 30) => 75`
- **Constraints**: 0 <= H < 12, 0 <= M < 60
- **Progressive Hints**:
  1. *Small Hint*: Hour hand moves 0.5 degrees per minute
  2. *Stronger Hint*: Minute hand moves 6 degrees per minute
- **Edge Cases**: Inverted bounds, extreme scale, duplicate elements.

#### Problem 7: Gregorian Calendar Date Validator
- **Context**: Booking engine date input parser
- **Sample I/O**: `(29, 2, 2024) => true`
- **Constraints**: 1 <= M <= 12, Y > 0
- **Progressive Hints**:
  1. *Small Hint*: Leap year: divisible by 4, not 100 unless 400
  2. *Stronger Hint*: Check month max days
- **Edge Cases**: Inverted bounds, extreme scale, duplicate elements.

#### Problem 8: Single-Bay Docking Conflict Detector
- **Context**: Warehouse scheduling
- **Sample I/O**: `([9, 11], [10, 12]) => true`
- **Constraints**: start < end
- **Progressive Hints**:
  1. *Small Hint*: Conflict exists if max(start1, start2) < min(end1, end2)
  2. *Stronger Hint*: Trace variable values with a dry-run table.
- **Edge Cases**: Inverted bounds, extreme scale, duplicate elements.


### 🔴 Challenging (Independent Algorithmic Derivation)
#### Problem 9: Cell Tower Signal Handover Evaluator
- **Context**: Telecom network signal router
- **Sample I/O**: `(-85, 45, 1) => 'HANDOVER'`
- **Constraints**: dBm between -120 and -40
- **Progressive Hints**:
  1. *Small Hint*: Combine signal degradation rate with user speed and cell capacity
  2. *Stronger Hint*: Can you reduce time complexity from quadratic to linear/logarithmic?
- **Edge Cases**: Maximum safe integer, null/undefined checks, adversarial inputs.

#### Problem 10: 24-Hour Midnight Interval Duration
- **Context**: Flight time tracking crossing midnight
- **Sample I/O**: `('23:45:00', '00:15:00') => 1800`
- **Constraints**: Valid HH:MM:SS format
- **Progressive Hints**:
  1. *Small Hint*: Convert both times to total seconds from 00:00:00
  2. *Stronger Hint*: If end < start, add 86400 seconds
- **Edge Cases**: Maximum safe integer, null/undefined checks, adversarial inputs.


---

## 🎯 Active Starter Challenge: The Metro Smart Transit Fare Engine

### Problem Statement
Calculates transit fare based on rider profile ('ADULT', 'STUDENT', 'SENIOR'), peak-hour timing, and zone crossings. Seniors are exempt from peak surcharges and receive a $0.50 discount if travelling 3+ zones.

#### Signature:
`function calculateFare(passengerType, peakHour, zonesCrossed)`

#### Running Your Tests:
```bash
node platform/runner.js practice/day-01/challenge.js
```
