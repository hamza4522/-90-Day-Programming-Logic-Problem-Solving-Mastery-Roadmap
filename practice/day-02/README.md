# Day 2: Arithmetic Operators, Modulo Mastery & Cyclic Systems

**Level 1 — Logical Thinking Fundamentals**

---

## 📖 Core Concept
**Topic**: Integer Division, Modulo `%` Ring Properties, Operator Precedence

### 🔍 Step-by-Step Logic Visualization (Modulo Clock Dial Visualizer (Z_12 / Z_24))
```text
Clock: (CurrentHour + ElapsedHours) % 12
Example: (10 + 5) % 12 = 15 % 12 = 3 o'clock.
Extracting Last Digit:  number % 10
Removing Last Digit:    Math.floor(number / 10)
```

---

## 📋 Today's 10-Problem Curated Practice Set

### 🟢 Easy (Foundational Application)
#### Problem 1: Circular Buffer Index Normalizer
- **Context**: Music playlist track wrapping
- **Sample I/O**: `(0, -1, 5) => 4`
- **Constraints**: bufferSize > 0
- **Progressive Hints**:
  1. *Small Hint*: Handle negative modulo in JS using (n % m + m) % m
  2. *Stronger Hint*: Write down the state transitions step-by-step.
  3. *Concept*: Integer Division, Modulo `%` Ring Properties, Operator Precedence
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.

#### Problem 2: Currency Denomination Breakdown
- **Context**: Cash register dispensing engine
- **Sample I/O**: `(87) => { 50: 1, 20: 1, 10: 1, 5: 1, 1: 2 }`
- **Constraints**: amount >= 0
- **Progressive Hints**:
  1. *Small Hint*: Use Math.floor and % progressively
  2. *Stronger Hint*: Write down the state transitions step-by-step.
  3. *Concept*: Integer Division, Modulo `%` Ring Properties, Operator Precedence
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.

#### Problem 3: Extract Hundreds, Tens, and Ones
- **Context**: Odometer digital readout
- **Sample I/O**: `(742) => [7, 4, 2]`
- **Constraints**: 100 <= N <= 999
- **Progressive Hints**:
  1. *Small Hint*: Math.floor(n / 100) % 10
  2. *Stronger Hint*: Math.floor(n / 10) % 10
  3. *Concept*: Integer Division, Modulo `%` Ring Properties, Operator Precedence
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.

#### Problem 4: Seconds to Formatted Timestamp
- **Context**: Video player timeline
- **Sample I/O**: `(3665) => '01:01:05'`
- **Constraints**: seconds >= 0
- **Progressive Hints**:
  1. *Small Hint*: Hours = floor(sec / 3600), Mins = floor((sec % 3600) / 60)
  2. *Stronger Hint*: Write down the state transitions step-by-step.
  3. *Concept*: Integer Division, Modulo `%` Ring Properties, Operator Precedence
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.

#### Problem 5: Even/Odd without Modulo
- **Context**: Low-level bit checking
- **Sample I/O**: `(7) => false`
- **Constraints**: Integer N
- **Progressive Hints**:
  1. *Small Hint*: Use bitwise AND: (n & 1) === 0
  2. *Stronger Hint*: Write down the state transitions step-by-step.
  3. *Concept*: Integer Division, Modulo `%` Ring Properties, Operator Precedence
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.


### 🟡 Medium (Multi-Concept Synthesis)
#### Problem 6: Day of the Week Predictor
- **Context**: Calendar offset calculation
- **Sample I/O**: `(3, 45) => 6`
- **Constraints**: 0 <= currentDay <= 6
- **Progressive Hints**:
  1. *Small Hint*: (currentDay + daysAhead) % 7
  2. *Stronger Hint*: Trace variable values with a dry-run table.
- **Edge Cases**: Inverted bounds, extreme scale, duplicate elements.

#### Problem 7: Coordinate Grid 1D to 2D Mapping
- **Context**: Raster image pixel addressing
- **Sample I/O**: `(14, 5) => { row: 2, col: 4 }`
- **Constraints**: index >= 0, width > 0
- **Progressive Hints**:
  1. *Small Hint*: row = floor(index / width), col = index % width
  2. *Stronger Hint*: Trace variable values with a dry-run table.
- **Edge Cases**: Inverted bounds, extreme scale, duplicate elements.

#### Problem 8: Car Park Rounding Rule
- **Context**: Automated garage billing
- **Sample I/O**: `(75) => 2`
- **Constraints**: minutes >= 0
- **Progressive Hints**:
  1. *Small Hint*: Every partial 60 min counts as full hour: Math.ceil(min / 60)
  2. *Stronger Hint*: Trace variable values with a dry-run table.
- **Edge Cases**: Inverted bounds, extreme scale, duplicate elements.


### 🔴 Challenging (Independent Algorithmic Derivation)
#### Problem 9: Precise Modulo of Big Arithmetic String
- **Context**: Cryptography check digit
- **Sample I/O**: `('123456789123456', 97) => 46`
- **Constraints**: String length up to 100
- **Progressive Hints**:
  1. *Small Hint*: Simulate long division: remainder = (remainder * 10 + digit) % divisor
  2. *Stronger Hint*: Can you reduce time complexity from quadratic to linear/logarithmic?
- **Edge Cases**: Maximum safe integer, null/undefined checks, adversarial inputs.

#### Problem 10: Leap Second Alignment Cycle
- **Context**: Astronomical time standard
- **Sample I/O**: `(1461) => 4`
- **Constraints**: days >= 0
- **Progressive Hints**:
  1. *Small Hint*: Account for 400-year cycle: 146097 days in 400 Gregorian years
  2. *Stronger Hint*: Can you reduce time complexity from quadratic to linear/logarithmic?
- **Edge Cases**: Maximum safe integer, null/undefined checks, adversarial inputs.


---

## 🎯 Active Starter Challenge: Circular Buffer Index & Clock Normalizer

### Problem Statement
Computes the zero-based index in a circular buffer after applying a positive or negative offset. Handles wrapping around backwards and forwards safely.

#### Signature:
`function getNormalizedIndex(currentIndex, offset, bufferSize)`

#### Running Your Tests:
```bash
node platform/runner.js practice/day-02/challenge.js
```
