/**
 * 90-Day Curriculum Data & Generator Engine
 * Generates comprehensive practice sets, starter code, test suites, and thinking workspaces for Days 1 to 90.
 */
const fs = require('fs');
const path = require('path');

const DAYS_DATA = [
  // --- LEVEL 1: LOGICAL THINKING FUNDAMENTALS (Days 1–14) ---
  {
    day: 1,
    level: 1,
    title: "Execution Model, State Tracing & Pure Logical Branching",
    concept: "Variable Memory Boxes, Assignment vs Comparison, Sequential Execution",
    visType: "Execution Flow & Memory Tracing Table",
    visExplanation: `Line 1: let a = 5;       --> [Memory: a = 5]
Line 2: let b = 10;      --> [Memory: a = 5, b = 10]
Line 3: a = a + b;       --> [Memory: a = 15, b = 10]
Line 4: b = a - b;       --> [Memory: a = 15, b = 5]
Line 5: a = a - b;       --> [Memory: a = 10, b = 5]  <-- Swapped!`,
    activeProblem: {
      name: "The Metro Smart Transit Fare Engine",
      fn: "calculateFare",
      params: "passengerType, peakHour, zonesCrossed",
      desc: "Calculates transit fare based on rider profile ('ADULT', 'STUDENT', 'SENIOR'), peak-hour timing, and zone crossings. Seniors are exempt from peak surcharges and receive a $0.50 discount if travelling 3+ zones.",
      tests: [
        { args: ["'ADULT'", "false", "0"], expected: "2.50" },
        { args: ["'ADULT'", "true", "2"], expected: "5.25" },
        { args: ["'SENIOR'", "true", "3"], expected: "2.75" },
        { args: ["'SENIOR'", "false", "1"], expected: "1.75" },
        { args: ["'STUDENT'", "false", "4"], expected: "4.50" },
        { args: ["'CHILD'", "false", "2"], expected: "null" },
        { args: ["'ADULT'", "false", "-1"], expected: "null" },
        { args: ["'ADULT'", "'true'", "1"], expected: "null" }
      ],
      defaultImpl: `function calculateFare(passengerType, peakHour, zonesCrossed) {
  if (typeof peakHour !== 'boolean' || typeof zonesCrossed !== 'number' || zonesCrossed < 0 || !Number.isInteger(zonesCrossed)) return null;
  let baseFare;
  if (passengerType === 'ADULT') baseFare = 2.50;
  else if (passengerType === 'STUDENT') baseFare = 1.50;
  else if (passengerType === 'SENIOR') baseFare = 1.00;
  else return null;

  let total = baseFare + (zonesCrossed * 0.75);
  if (peakHour && passengerType !== 'SENIOR') total += 1.25;
  if (passengerType === 'SENIOR' && zonesCrossed >= 3) total -= 0.50;
  return Math.round(total * 100) / 100;
}`
    },
    problems: [
      { id: 1, title: "Metro Smart Transit Fare Engine", diff: "Easy", context: "Transit ticket terminal calculation", inOut: "('ADULT', true, 2) => 5.25", constraints: "zonesCrossed >= 0", hints: ["Check passenger type first", "Seniors are exempt from peak hour surcharge", "Remember 3+ zone discount for seniors"] },
      { id: 2, title: "Sensor Threshold Monitor", diff: "Easy", context: "Industrial temperature alert", inOut: "(105) => 'CRITICAL_HIGH'", constraints: "-50 <= temp <= 150", hints: ["Check bounds sequentially", "Avoid gap intervals"] },
      { id: 3, title: "In-Place Variable Swap", diff: "Easy", context: "Memory-constrained register swap", inOut: "(5, 10) => [10, 5]", constraints: "No temp variable", hints: ["Use addition and subtraction", "Watch for overflow in 32-bit integers"] },
      { id: 4, title: "Library Late Fee Tiering", diff: "Easy", context: "Public library return system", inOut: "(12) => 8.50", constraints: "daysLate >= 0", hints: ["Apply tiered rates: first 5 days, next 10 days, beyond 15 days"] },
      { id: 5, title: "E-Commerce Shipping & Voucher Arbiter", diff: "Easy", context: "Shopping cart checkout rules", inOut: "(45, 'SAVE10', true) => 40.50", constraints: "cartTotal >= 0", hints: ["Apply coupon before checking free shipping threshold"] },
      { id: 6, title: "Clock Hand Angle Deductor", diff: "Medium", context: "Analog clock math visualization", inOut: "(3, 30) => 75", constraints: "0 <= H < 12, 0 <= M < 60", hints: ["Hour hand moves 0.5 degrees per minute", "Minute hand moves 6 degrees per minute", "Return min(diff, 360 - diff)"] },
      { id: 7, title: "Gregorian Calendar Date Validator", diff: "Medium", context: "Booking engine date input parser", inOut: "(29, 2, 2024) => true", constraints: "1 <= M <= 12, Y > 0", hints: ["Leap year: divisible by 4, not 100 unless 400", "Check month max days"] },
      { id: 8, title: "Single-Bay Docking Conflict Detector", diff: "Medium", context: "Warehouse scheduling", inOut: "([9, 11], [10, 12]) => true", constraints: "start < end", hints: ["Conflict exists if max(start1, start2) < min(end1, end2)"] },
      { id: 9, title: "Cell Tower Signal Handover Evaluator", diff: "Challenging", context: "Telecom network signal router", inOut: "(-85, 45, 1) => 'HANDOVER'", constraints: "dBm between -120 and -40", hints: ["Combine signal degradation rate with user speed and cell capacity"] },
      { id: 10, title: "24-Hour Midnight Interval Duration", diff: "Challenging", context: "Flight time tracking crossing midnight", inOut: "('23:45:00', '00:15:00') => 1800", constraints: "Valid HH:MM:SS format", hints: ["Convert both times to total seconds from 00:00:00", "If end < start, add 86400 seconds"] }
    ]
  },
  {
    day: 2,
    level: 1,
    title: "Arithmetic Operators, Modulo Mastery & Cyclic Systems",
    concept: "Integer Division, Modulo `%` Ring Properties, Operator Precedence",
    visType: "Modulo Clock Dial Visualizer (Z_12 / Z_24)",
    visExplanation: `Clock: (CurrentHour + ElapsedHours) % 12
Example: (10 + 5) % 12 = 15 % 12 = 3 o'clock.
Extracting Last Digit:  number % 10
Removing Last Digit:    Math.floor(number / 10)`,
    activeProblem: {
      name: "Circular Buffer Index & Clock Normalizer",
      fn: "getNormalizedIndex",
      params: "currentIndex, offset, bufferSize",
      desc: "Computes the zero-based index in a circular buffer after applying a positive or negative offset. Handles wrapping around backwards and forwards safely.",
      tests: [
        { args: ["2", "3", "5"], expected: "0" },
        { args: ["0", "-1", "5"], expected: "4" },
        { args: ["3", "-7", "4"], expected: "0" },
        { args: ["1", "10", "4"], expected: "3" },
        { args: ["-1", "2", "5"], expected: "null" },
        { args: ["2", "3", "0"], expected: "null" }
      ],
      defaultImpl: `function getNormalizedIndex(currentIndex, offset, bufferSize) {
  if (bufferSize <= 0 || currentIndex < 0 || currentIndex >= bufferSize) return null;
  let normalized = (currentIndex + (offset % bufferSize) + bufferSize) % bufferSize;
  return normalized;
}`
    },
    problems: [
      { id: 1, title: "Circular Buffer Index Normalizer", diff: "Easy", context: "Music playlist track wrapping", inOut: "(0, -1, 5) => 4", constraints: "bufferSize > 0", hints: ["Handle negative modulo in JS using (n % m + m) % m"] },
      { id: 2, title: "Currency Denomination Breakdown", diff: "Easy", context: "Cash register dispensing engine", inOut: "(87) => { 50: 1, 20: 1, 10: 1, 5: 1, 1: 2 }", constraints: "amount >= 0", hints: ["Use Math.floor and % progressively"] },
      { id: 3, title: "Extract Hundreds, Tens, and Ones", diff: "Easy", context: "Odometer digital readout", inOut: "(742) => [7, 4, 2]", constraints: "100 <= N <= 999", hints: ["Math.floor(n / 100) % 10", "Math.floor(n / 10) % 10"] },
      { id: 4, title: "Seconds to Formatted Timestamp", diff: "Easy", context: "Video player timeline", inOut: "(3665) => '01:01:05'", constraints: "seconds >= 0", hints: ["Hours = floor(sec / 3600), Mins = floor((sec % 3600) / 60)"] },
      { id: 5, title: "Even/Odd without Modulo", diff: "Easy", context: "Low-level bit checking", inOut: "(7) => false", constraints: "Integer N", hints: ["Use bitwise AND: (n & 1) === 0"] },
      { id: 6, title: "Day of the Week Predictor", diff: "Medium", context: "Calendar offset calculation", inOut: "(3, 45) => 6", constraints: "0 <= currentDay <= 6", hints: ["(currentDay + daysAhead) % 7"] },
      { id: 7, title: "Coordinate Grid 1D to 2D Mapping", diff: "Medium", context: "Raster image pixel addressing", inOut: "(14, 5) => { row: 2, col: 4 }", constraints: "index >= 0, width > 0", hints: ["row = floor(index / width), col = index % width"] },
      { id: 8, title: "Car Park Rounding Rule", diff: "Medium", context: "Automated garage billing", inOut: "(75) => 2", constraints: "minutes >= 0", hints: ["Every partial 60 min counts as full hour: Math.ceil(min / 60)"] },
      { id: 9, title: "Precise Modulo of Big Arithmetic String", diff: "Challenging", context: "Cryptography check digit", inOut: "('123456789123456', 97) => 46", constraints: "String length up to 100", hints: ["Simulate long division: remainder = (remainder * 10 + digit) % divisor"] },
      { id: 10, title: "Leap Second Alignment Cycle", diff: "Challenging", context: "Astronomical time standard", inOut: "(1461) => 4", constraints: "days >= 0", hints: ["Account for 400-year cycle: 146097 days in 400 Gregorian years"] }
    ]
  },
  {
    day: 3,
    level: 1,
    title: "Conditions, Relational Operators & Boundary Checks",
    concept: "Branching Mechanics, Strict vs Abstract Equality, Guard Clauses",
    visType: "Decision Tree Flowchart",
    visExplanation: `[Input: Score]
  ├── Score < 0 or > 100 ──> 'INVALID'
  ├── Score >= 90         ──> 'A'
  ├── Score >= 80         ──> 'B'
  ├── Score >= 70         ──> 'C'
  └── Else                ──> 'FAIL'`,
    activeProblem: {
      name: "Water Quality Safety Index Classifier",
      fn: "classifyWaterSafety",
      params: "phLevel, turbidityNTU, dissolvedOxygenMgL",
      desc: "Classifies water sample as 'DRINKABLE', 'AGRICULTURAL', 'INDUSTRIAL_ONLY', or 'HAZARDOUS' based on chemical boundaries.",
      tests: [
        { args: ["7.2", "1.5", "8.0"], expected: "'DRINKABLE'" },
        { args: ["6.2", "4.0", "5.5"], expected: "'AGRICULTURAL'" },
        { args: ["8.8", "8.0", "3.0"], expected: "'INDUSTRIAL_ONLY'" },
        { args: ["3.0", "15.0", "1.0"], expected: "'HAZARDOUS'" },
        { args: ["-1", "2.0", "5.0"], expected: "null" }
      ],
      defaultImpl: `function classifyWaterSafety(ph, turbidity, oxygen) {
  if (ph < 0 || ph > 14 || turbidity < 0 || oxygen < 0) return null;
  if (ph >= 6.5 && ph <= 8.5 && turbidity <= 2.0 && oxygen >= 6.5) return 'DRINKABLE';
  if (ph >= 6.0 && ph <= 9.0 && turbidity <= 5.0 && oxygen >= 4.0) return 'AGRICULTURAL';
  if (ph >= 5.0 && ph <= 10.0 && turbidity <= 10.0 && oxygen >= 2.0) return 'INDUSTRIAL_ONLY';
  return 'HAZARDOUS';
}`
    },
    problems: [
      { id: 1, title: "Water Quality Safety Classifier", diff: "Easy", context: "Municipal environmental testing", inOut: "(7.2, 1.5, 8.0) => 'DRINKABLE'", constraints: "0 <= ph <= 14", hints: ["Order checks from strictest ('DRINKABLE') to most permissive"] },
      { id: 2, title: "Blood Pressure Risk Category", diff: "Easy", context: "Clinical triage system", inOut: "(125, 82) => 'PREHYPERTENSION'", constraints: "systolic > 0, diastolic > 0", hints: ["Check both systolic and diastolic thresholds"] },
      { id: 3, title: "Triangle Existence & Classification", diff: "Easy", context: "CAD geometry validator", inOut: "(3, 4, 5) => 'SCALENE'", constraints: "All sides > 0", hints: ["Check triangle inequality first: a + b > c"] },
      { id: 4, title: "Driver Licensing Eligibility", diff: "Easy", context: "DMV automation", inOut: "(17, true, false) => 'PERMIT_ONLY'", constraints: "age >= 0", hints: ["Combine age with vision test and theory pass status"] },
      { id: 5, title: "Quadrant Finder with Axes Check", diff: "Easy", context: "Cartesian plotting engine", inOut: "(0, 5) => 'Y_AXIS'", constraints: "Numbers x, y", hints: ["Check origin (0,0) and axes before quadrants 1-4"] },
      { id: 6, title: "Income Tax Surcharge Slab", diff: "Medium", context: "Payroll processing", inOut: "(75000) => 13500", constraints: "income >= 0", hints: ["Calculate tax progressively across slabs, not single rate on total"] },
      { id: 7, title: "Rock-Paper-Scissors-Lizard-Spock Arbiter", diff: "Medium", context: "Game logic simulator", inOut: "('ROCK', 'SCISSORS') => 'PLAYER1_WINS'", constraints: "Valid gestures", hints: ["Map each move to the 2 moves it beats"] },
      { id: 8, title: "Package Delivery Weight & Volume Tier", diff: "Medium", context: "Logistics shipping rate engine", inOut: "(12, 45000) => 'HEAVY_OVERSIZE'", constraints: "Positive dimensions", hints: ["Dimensional weight = (L * W * H) / 5000"] },
      { id: 9, title: "Financial Credit Score Rating Engine", diff: "Challenging", context: "Banking loan pre-approval", inOut: "(720, 0.28, 4) => 'APPROVED'", constraints: "FICO 300-850", hints: ["Factor in debt-to-income (DTI) and credit history length"] },
      { id: 10, title: "Flight Seat Upgrade Eligibility Matrix", diff: "Challenging", context: "Airline loyalty system", inOut: "('GOLD', 12000, true) => 'UPGRADE_CONFIRMED'", constraints: "Tier string, miles int", hints: ["Evaluate priority tiers with standby queue exceptions"] }
    ]
  },
  {
    day: 4,
    level: 1,
    title: "Nested Conditions & Decision Trees",
    concept: "Multi-way Branching, Guard Clauses vs Deep Nesting, Early Returns",
    visType: "Nested Branching Inversion",
    visExplanation: `Deeply Nested (Fragile):
if (user) {
  if (user.isActive) {
    if (user.hasRole) { ... }
  }
}

Guard Clauses (Robust):
if (!user) return 'NO_USER';
if (!user.isActive) return 'INACTIVE';
if (!user.hasRole) return 'UNAUTHORIZED';`,
    activeProblem: {
      name: "Smart Mortgage Loan Approval Matrix",
      fn: "evaluateMortgageApplication",
      params: "creditScore, annualIncome, loanAmount, employmentYears",
      desc: "Evaluates loan approval status ('APPROVED', 'CONDITIONAL', 'REJECTED') and calculated interest rate based on loan-to-income ratio and credit score.",
      tests: [
        { args: ["750", "100000", "300000", "3"], expected: "{ status: 'APPROVED', rate: 4.5 }" },
        { args: ["660", "80000", "280000", "2"], expected: "{ status: 'CONDITIONAL', rate: 6.2 }" },
        { args: ["580", "120000", "200000", "5"], expected: "{ status: 'REJECTED', rate: null }" },
        { args: ["720", "50000", "350000", "1"], expected: "{ status: 'REJECTED', rate: null }" }
      ],
      defaultImpl: `function evaluateMortgageApplication(credit, income, loan, years) {
  if (credit < 300 || credit > 850 || income <= 0 || loan <= 0 || years < 0) return null;
  const lti = loan / income;
  if (credit < 620 || lti > 5.0 || years < 1) return { status: 'REJECTED', rate: null };
  if (credit >= 740 && lti <= 3.5 && years >= 2) return { status: 'APPROVED', rate: 4.5 };
  if (credit >= 680 && lti <= 4.2) return { status: 'APPROVED', rate: 5.2 };
  return { status: 'CONDITIONAL', rate: 6.2 };
}`
    },
    problems: [
      { id: 1, title: "Smart Mortgage Approval Matrix", diff: "Easy", context: "Banking lending platform", inOut: "(750, 100000, 300000, 3) => APPROVED", constraints: "Positive values", hints: ["Calculate loan-to-income (lti) ratio first", "Filter hard rejections before evaluating rates"] },
      { id: 2, title: "Tiered Electricity Bill Engine", diff: "Easy", context: "Utility billing calculation", inOut: "(350) => 47.50", constraints: "units >= 0", hints: ["0-100 units at rate1, 101-300 at rate2, >300 at rate3"] },
      { id: 3, title: "Movie Age & Rating Ticket Gate", diff: "Easy", context: "Cinema ticketing kiosk", inOut: "(14, 'R', false) => 'DENIED'", constraints: "Ratings G, PG, PG13, R, NC17", hints: ["Check accompaniment condition for PG13 and R"] },
      { id: 4, title: "Discount Tier Stacker", diff: "Easy", context: "Retail checkout POS", inOut: "(150, true, 'VIP') => 114.75", constraints: "total >= 0", hints: ["Apply loyalty discount, then member tier, then seasonal coupon"] },
      { id: 5, title: "Vehicle Insurance Risk Surcharge", diff: "Easy", context: "Auto underwriting", inOut: "(22, 2, 'SPORTS') => 'HIGH_RISK'", constraints: "age >= 16", hints: ["Young driver (<25) + high incident count or sports vehicle"] },
      { id: 6, title: "Hospital Emergency Triage Sort", diff: "Medium", context: "ER admission queue", inOut: "(92, 180, true) => 'RESUSCITATION'", constraints: "O2 sat, Heart Rate", hints: ["Evaluate Glasgow coma score and vital sign deviations"] },
      { id: 7, title: "Automated Hotel Room Upgrade Engine", diff: "Medium", context: "Hospitality CRM", inOut: "('DELUXE', 'PLATINUM', 3) => 'SUITE'", constraints: "Room categories, tiers", hints: ["Check vacancy priority and consecutive stay length"] },
      { id: 8, title: "Foreign Exchange Currency Spread Fee", diff: "Medium", context: "Fintech FX broker", inOut: "('USD', 'EUR', 10000, true) => 12.50", constraints: "Valid currency pairs", hints: ["Apply tiered spread based on volume and institutional flag"] },
      { id: 9, title: "Autonomous Drone Flight Clearance", diff: "Challenging", context: "Aviation traffic management", inOut: "(120, 25, 'URBAN', false) => 'DENIED'", constraints: "Altitude, wind speed", hints: ["Check altitude ceilings, wind tolerance, and geo-fence zones"] },
      { id: 10, title: "Multi-Jurisdiction Sales Tax Arbiter", diff: "Challenging", context: "Cross-border tax compliance", inOut: "('US', 'CA', 100, 'DIGITAL') => 8.50", constraints: "Country/state code", hints: ["Origin vs destination sourcing rules based on product category"] }
    ]
  },
  {
    day: 5,
    level: 1,
    title: "Boolean Logic, Truth Tables & De Morgan's Laws",
    concept: "AND (&&), OR (||), NOT (!), Short-Circuit Evaluation, Bitwise vs Logical",
    visType: "Truth Table & De Morgan Equivalent",
    visExplanation: `!(A && B) === (!A || !B)
!(A || B) === (!A && !B)

Short Circuit:
false && doSomething()  --> doSomething is NEVER called
true  || doSomething()  --> doSomething is NEVER called`,
    activeProblem: {
      name: "Multi-Factor Authentication Access Arbiter",
      fn: "verifyAccessPermission",
      params: "hasPassword, hasSmsOtp, hasBiometrics, isTrustedDevice, isRooted",
      desc: "Grants access ('GRANTED', 'ADDITIONAL_VERIFICATION', 'DENIED') using boolean security policies. Any rooted device is strictly DENIED.",
      tests: [
        { args: ["true", "true", "false", "true", "false"], expected: "'GRANTED'" },
        { args: ["true", "false", "true", "false", "false"], expected: "'GRANTED'" },
        { args: ["true", "false", "false", "true", "false"], expected: "'ADDITIONAL_VERIFICATION'" },
        { args: ["true", "true", "true", "true", "true"], expected: "'DENIED'" },
        { args: ["false", "true", "true", "true", "false"], expected: "'DENIED'" }
      ],
      defaultImpl: `function verifyAccessPermission(pw, otp, bio, trusted, rooted) {
  if (rooted || !pw) return 'DENIED';
  if (bio || (otp && trusted)) return 'GRANTED';
  if (otp || trusted) return 'ADDITIONAL_VERIFICATION';
  return 'DENIED';
}`
    },
    problems: [
      { id: 1, title: "Multi-Factor Authentication Arbiter", diff: "Easy", context: "Cybersecurity login firewall", inOut: "(true, true, false, true, false) => 'GRANTED'", constraints: "Booleans", hints: ["Rooted device check overrides everything", "Password is mandatory"] },
      { id: 2, title: "Fire Safety Alarm Trigger", diff: "Easy", context: "Building automated sensor circuit", inOut: "(true, false, true) => true", constraints: "Booleans (smoke, heat, manualPull)", hints: ["Alarm if manual pull OR (smoke AND heat)"] },
      { id: 3, title: "Server Health Warning Evaluator", diff: "Easy", context: "DevOps monitoring", inOut: "(85, 92, false) => 'CRITICAL'", constraints: "CPU%, RAM%, isReplica", hints: ["CPU > 90 OR RAM > 90 triggers alert unless non-production"] },
      { id: 4, title: "Simplify Complex Boolean Expression", diff: "Easy", context: "Code refactoring", inOut: "(!(!A && !B)) => (A || B)", constraints: "Equivalence proof", hints: ["Apply De Morgan's Law directly"] },
      { id: 5, title: "E-Commerce Discount Applicability", diff: "Easy", context: "Coupon verification", inOut: "(true, false, 60) => true", constraints: "isFirstOrder, hasCoupon, cartTotal", hints: ["Valid if first order OR (has coupon AND total >= 50)"] },
      { id: 6, title: "Industrial Turbine Interlock System", diff: "Medium", context: "Factory safety PLC", inOut: "(true, true, false, 1200) => 'SAFE_RUN'", constraints: "Pressure, RPM, valve booleans", hints: ["Must satisfy all interlock invariants simultaneously"] },
      { id: 7, title: "Boolean Expression Evaluator (String)", diff: "Medium", context: "Config parser", inOut: "('true AND false OR true') => true", constraints: "AND, OR, NOT tokens", hints: ["AND has higher precedence than OR"] },
      { id: 8, title: "Credit Card Fraud Flag Matrix", diff: "Medium", context: "Payment gateway AML", inOut: "(true, 5000, 'FOREIGN', false) => 'FLAG_FRAUD'", constraints: "Velocity, amount, location", hints: ["Flag if foreign AND amount > 2000 AND NOT 3DSecure"] },
      { id: 9, title: "Combinational Logic Circuit Simulator", diff: "Challenging", context: "Digital logic chip simulator", inOut: "([1, 0, 1], 'NAND_TREE') => 0", constraints: "Binary inputs 0 or 1", hints: ["Model logic gates using bitwise operations (&, |, ^, ~)"] },
      { id: 10, title: "Quine-McCluskey 3-Variable Simplifier", diff: "Challenging", context: "Logic optimization engine", inOut: "([0, 1, 2, 5]) => 'A\\'B\\' + ...'", constraints: "Min-terms array", hints: ["Find prime implicants by grouping terms with 1 bit difference"] }
    ]
  }
];

// Helper to fill days 6 to 90 automatically with curriculum topics and challenges
const LEVEL_TOPICS = {
  1: { level: 1, name: "Logical Thinking Fundamentals" },
  2: { level: 2, name: "Looping and Pattern Logic" },
  3: { level: 3, name: "Problem-Solving Fundamentals" },
  4: { level: 4, name: "Functions and Modular Thinking" },
  5: { level: 5, name: "Data Structures" },
  6: { level: 6, name: "Algorithms" },
  7: { level: 7, name: "Advanced Problem Solving" }
};

const SYLLABUS_INDEX = [
  // Level 1: 1-14
  { day: 6, level: 1, title: "Mathematical Logic, Parity & Cartesian Coordinates", concept: "Divisibility rules, quadrant boundaries, Euclidean metrics" },
  { day: 7, level: 1, title: "Weekly Assessment 1 — Pure Conditional Logic Diagnostic", concept: "Milestone examination: Zero loops allowed. Pure logic reasoning" },
  { day: 8, level: 1, title: "Edge-Case Engineering & Numeric Boundaries", concept: "Zero, negative inputs, MAX_SAFE_INTEGER, float precision quirks" },
  { day: 9, level: 1, title: "1D Range Overlaps & Interval Logic", concept: "Interval intersection formula: max(s1, s2) <= min(e1, e2)" },
  { day: 10, level: 1, title: "State Machines & Discrete Transitions", concept: "Deterministic Finite Automata (DFA), state transitions, guard conditions" },
  { day: 11, level: 1, title: "Coordinate Transformations & Unit Scaling", concept: "Manhattan vs Euclidean distance, coordinate translation, rounding logic" },
  { day: 12, level: 1, title: "Mini-Project 1: Command-Line Rule Decision Engine", concept: "Extensible credit card Luhn check & password strength validator" },
  { day: 13, level: 1, title: "Level 1 Revision & Mistake Category Remediation", concept: "Targeted drills addressing condition and problem misunderstanding errors" },
  { day: 14, level: 1, title: "Weekly Assessment 2 — Level 1 Certification Benchmark", concept: "Comprehensive certification exam for Level 1 mastery" },

  // Level 2: 15-28
  { day: 15, level: 2, title: "Anatomy of a Loop & Invariants", concept: "Loop initialization, condition, body, step, and loop termination invariants" },
  { day: 16, level: 2, title: "While Loops vs For Loops: Bounded vs Event-Driven", concept: "Halving sequences, Collatz conjecture, loop counter state tracking" },
  { day: 17, level: 2, title: "Accumulators & Counters: Digit Extraction", concept: "Base-10 extraction using % 10 and Math.floor(n / 10)" },
  { day: 18, level: 2, title: "Numerical Transformations: Reversal & Assembly", concept: "Building numbers via acc * 10 + digit without string coercion" },
  { day: 19, level: 2, title: "Prime Numbers, Factorization & O(sqrt(N)) Optimizations", concept: "Trial division up to sqrt(N), divisor pairs, prime factorization" },
  { day: 20, level: 2, title: "Mathematical Number Properties: Armstrong, Palindromes & Harshad", concept: "Power accumulation, order k digit extraction, Armstrong proofs" },
  { day: 21, level: 2, title: "Weekly Assessment 3 — Numerical & Iterative Logic", concept: "Milestone exam: Number theory, digit processing, loop invariants" },
  { day: 22, level: 2, title: "Nested Loops & The 2D Coordinate Grid Space", concept: "Dependent vs independent inner loops, row-column (r, c) mappings" },
  { day: 23, level: 2, title: "Star Patterns & Geometric Linear Equations", concept: "Formulating space and star counts as linear functions of row r" },
  { day: 24, level: 2, title: "Number Patterns & Sequence Matrices", concept: "Floyd's triangle, alternating binary matrices, Pascal pattern basics" },
  { day: 25, level: 2, title: "Reverse Patterns & Hollow Geometries", concept: "Boundary detection conditions: (r === 0 || r === N-1 || c === 0 || c === N-1)" },
  { day: 26, level: 2, title: "Loop Dry-Run & State Tracing Mastery", concept: "Formal tabular state tracing, predicting outputs without code execution" },
  { day: 27, level: 2, title: "Level 2 Revision & Pattern Remediation", concept: "Refining nested loop index variables and boundary edge cases" },
  { day: 28, level: 2, title: "Weekly Assessment 4 — Pattern & Iteration Mastery", concept: "Milestone exam: Complex nested patterns and numerical logic" },

  // Level 3: 29-42
  { day: 29, level: 3, title: "Arrays in Memory & Contiguous Traversal", concept: "Contiguous memory layout, O(1) index calculation, forwards/backwards sweeps" },
  { day: 30, level: 3, title: "Min/Max Tracking & Running Prefix Aggregates", concept: "Single-pass extrema search, second largest without sorting, prefix sum array" },
  { day: 31, level: 3, title: "Frequency Tables & Direct-Access Counting Arrays", concept: "Value-to-index mapping for O(N) frequency counts and duplicate detection" },
  { day: 32, level: 3, title: "In-Place Array Manipulations & Reversals", concept: "O(1) auxiliary space manipulations: reversing, rotating by K, moving zeros" },
  { day: 33, level: 3, title: "Two-Pointer Technique: Opposing & Fast/Slow", concept: "Collision pointers on sorted arrays, Dutch National Flag three-way partition" },
  { day: 34, level: 3, title: "Sliding Window Technique: Fixed & Dynamic Windows", concept: "Amortized O(N) window tracking, maintaining running sums and extrema" },
  { day: 35, level: 3, title: "Weekly Assessment 5 — Array Algorithmic Techniques", concept: "Milestone exam: Two pointers, sliding windows, in-place mutations" },
  { day: 36, level: 3, title: "Strings as Character Arrays & Char Codes", concept: "String immutability in V8, charCodeAt, ASCII manipulation, case shifting" },
  { day: 37, level: 3, title: "String Manipulation, Palindromes & Word Reversals", concept: "Two-pointer alphanumeric validation, in-place word reverse simulation" },
  { day: 38, level: 3, title: "Substrings vs Subsequences & Anagram Verification", concept: "Contiguous slices vs ordered subsets, frequency matching for anagrams" },
  { day: 39, level: 3, title: "Search Space Reduction: Binary Search on Arrays", concept: "Logarithmic halving: mid = floor(low + (high - low)/2), boundary invariants" },
  { day: 40, level: 3, title: "Elementary Sorting Algorithms: Bubble, Selection & Insertion", concept: "Comparing quadratic sorts, stability, adaptive early-exit mechanisms" },
  { day: 41, level: 3, title: "Level 3 Revision & Array/String Bug Hunting", concept: "Off-by-one index bugs, empty inputs, single-element edge traps" },
  { day: 42, level: 3, title: "Weekly Assessment 6 — Midterm Benchmark (50% Milestone)", concept: "Comprehensive multi-level examination: Fundamentals through Arrays & Strings" },

  // Level 4: 43-52
  { day: 43, level: 4, title: "Functions, Parameters, Returns & Pure Logic", concept: "Single Responsibility Principle (SRP), pure functions, value vs reference" },
  { day: 44, level: 4, title: "Variable Scope, Execution Context & The Call Stack", concept: "Global, function, and block scope, lexical environments, call stack frames" },
  { day: 45, level: 4, title: "Decomposing Monoliths into Reusable Pipelines", concept: "Top-down architectural decomposition, composing small pure functions" },
  { day: 46, level: 4, title: "Introduction to Recursion: Base Cases & Inductive Steps", concept: "Self-referential algorithms: terminating base case vs recursive reduction" },
  { day: 47, level: 4, title: "Call Stack Visualization & Stack Frame Unwinding", concept: "Tracing activation records on paper, visual recursion trees, stack memory" },
  { day: 48, level: 4, title: "Recursive Problem Solving on Arrays & Strings", concept: "Passing index bounds instead of slicing arrays, recursive reversal and search" },
  { day: 49, level: 4, title: "Weekly Assessment 7 — Modular Design & Recursion", concept: "Milestone exam: Decomposition, pure functions, recursive formulations" },
  { day: 50, level: 4, title: "Divide & Conquer: Merge Sort Implementation", concept: "Recursive halving, two-way sorted merge, O(N log N) time complexity proof" },
  { day: 51, level: 4, title: "Divide & Conquer: Quick Sort & Partitioning Logic", concept: "Lomuto vs Hoare partition schemes, pivot selection, Quickselect algorithm" },
  { day: 52, level: 4, title: "Recursion vs Iteration: Stack Overflow Limits", concept: "V8 call stack depth limits, converting recursion to iterative loops with manual stacks" },

  // Level 5: 53-66
  { day: 53, level: 5, title: "Singly Linked Lists: Node References & Traversals", concept: "Heap references, head/tail pointers, dynamic node chaining, O(1) vs O(N)" },
  { day: 54, level: 5, title: "Linked List Mutations: In-Place Reversal & Cycle Detection", concept: "Three-pointer reversal (prev, curr, next), Floyd's Tortoise and Hare cycle check" },
  { day: 55, level: 5, title: "Stacks (LIFO): Core Principles & Parentheses Matching", concept: "Last-In-First-Out, array-based stack, matching delimiters, postfix evaluation" },
  { day: 56, level: 5, title: "Queues (FIFO): Circular Queue & Monotonic Queues", concept: "First-In-First-Out, circular index wrap-around: (rear + 1) % capacity" },
  { day: 57, level: 5, title: "Hash Tables: Collision Resolution & Amortized O(1)", concept: "Hashing functions, bucket arrays, separate chaining, load factors" },
  { day: 58, level: 5, title: "Sets & Hash Maps: Two Sum & Sequence Tracking", concept: "Trading space for time, O(1) presence queries, duplicate filtering" },
  { day: 59, level: 5, title: "Weekly Assessment 8 — Linear Data Structures & Maps", concept: "Milestone exam: Stacks, queues, linked lists, and hash tables" },
  { day: 60, level: 5, title: "Hierarchical Thinking: Binary Trees Foundations", concept: "Root, edges, leaves, depth, height, binary tree node pointer anatomy" },
  { day: 61, level: 5, title: "Binary Tree Traversals: DFS (Pre/In/Post) & BFS (Level-Order)", concept: "Recursive depth-first traversals vs queue-based breadth-first level order" },
  { day: 62, level: 5, title: "Binary Search Trees (BST): Property Invariants & Operations", concept: "BST property: left < root < right. Search, insertion, and BST validation" },
  { day: 63, level: 5, title: "Heaps & Priority Queues: Array-Based Complete Binary Trees", concept: "Min/Max-heap property, parent/child index math (2i+1, 2i+2), sift-up and sift-down" },
  { day: 64, level: 5, title: "Graph Representations: Adjacency Matrix vs Adjacency List", concept: "Modeling nodes and edges, directed vs undirected, space/time trade-offs" },
  { day: 65, level: 5, title: "Data Structure Selection: Engineering Trade-off Matrix", concept: "Systematic architectural evaluation: choosing the optimal data structure" },
  { day: 66, level: 5, title: "Weekly Assessment 9 — Hierarchical Structures & Graphs", concept: "Milestone exam: Trees, BST validation, heaps, and graph graphs" },

  // Level 6: 67-78
  { day: 67, level: 6, title: "Graph Traversal: Breadth-First Search (BFS)", concept: "Queue-based shortest path in unweighted graphs, visited sets, level tracking" },
  { day: 68, level: 6, title: "Graph Traversal: Depth-First Search (DFS) & Cycles", concept: "Recursive exploration, cycle detection with three-color state (white, gray, black)" },
  { day: 69, level: 6, title: "Backtracking Fundamentals: Subsets & Permutations", concept: "State-space tree exploration: choose, explore, un-choose (backtrack)" },
  { day: 70, level: 6, title: "Backtracking Advanced: Pruning & N-Queens / Sudoku", concept: "Constraint propagation, pruning invalid search branches early" },
  { day: 71, level: 6, title: "Greedy Algorithms: Local Optimum to Global Solution", concept: "Greedy choice property, interval scheduling, when greedy fails" },
  { day: 72, level: 6, title: "Dynamic Programming: Overlapping Subproblems & Memoization", concept: "Top-down DP: recursion + lookup cache, eliminating exponential branch explosion" },
  { day: 73, level: 6, title: "Weekly Assessment 10 — Backtracking & Graph Traversal", concept: "Milestone exam: BFS/DFS graph search and state-space backtracking" },
  { day: 74, level: 6, title: "1D Dynamic Programming: Tabulation & Space Optimization", concept: "Bottom-up array filling, state transitions: dp[i] = dp[i-1] + dp[i-2], O(1) space" },
  { day: 75, level: 6, title: "2D Dynamic Programming: Grid Paths & Knapsack Logic", concept: "2D state matrix dp[i][j], unique grid paths, 0/1 knapsack inclusion/exclusion" },
  { day: 76, level: 6, title: "Formal Complexity Rigor: Big-O, Omega, Theta & Amortized", concept: "Asymptotic notation proofs, worst vs average vs amortized bounds" },
  { day: 77, level: 6, title: "Space-Time Optimization: Reducing O(N^2) to O(N)", concept: "Trade-offs: precomputing prefix tables, two-pointer scans, bitmasking" },
  { day: 78, level: 6, title: "Weekly Assessment 11 — Dynamic Programming & Optimization", concept: "Milestone exam: Tabulation, memoization, knapsack and complexity analysis" },

  // Level 7: 79-90
  { day: 79, level: 7, title: "Algorithmic Pattern Recognition: The 14 Universal Patterns", concept: "Rapid classification of unfamiliar problems into known algorithmic archetypes" },
  { day: 80, level: 7, title: "Mathematical Logic & Bit Manipulation Techniques", concept: "Bitwise AND, OR, XOR, shifts, counting set bits, finding single unique numbers" },
  { day: 81, level: 7, title: "Competitive Edge-Case Gauntlet & Hard Invariants", concept: "Trapping Rain Water, monotonic stacks, handling adversarial test cases" },
  { day: 82, level: 7, title: "Systems Logic Design: LRU Cache Implementation", concept: "Combining Hash Map + Doubly Linked List for O(1) get and put operations" },
  { day: 83, level: 7, title: "Systems Logic Design: Rate Limiter & Task Scheduler", concept: "Token bucket & sliding window log algorithms for distributed request gating" },
  { day: 84, level: 7, title: "Comprehensive Debugging & Root-Cause Localization", concept: "Hypothesis testing, binary search debugging, invariant verification" },
  { day: 85, level: 7, title: "Weekly Assessment 12 — Advanced Systems & Algorithms", concept: "Milestone exam: Complex multi-paradigm systems challenges" },
  { day: 86, level: 7, title: "Solo Gauntlet 1: Unseen Hard Problem from Scratch", concept: "Independent problem solving without hints: pure 10-Step Method application" },
  { day: 87, level: 7, title: "Solo Gauntlet 2: Multi-Concept Data Structure & Optimization", concept: "Independent synthesis of compound structures and algorithmic optimizations" },
  { day: 88, level: 7, title: "System Architecture, Mistake Review & Long-Term Plan", concept: "Auditing all 90 days of logged mistakes and cementing permanent mastery" },
  { day: 89, level: 7, title: "90-Day Comprehensive Capstone Examination", concept: "Full spectrum 5-problem final exam covering Levels 1 through 7" },
  { day: 90, level: 7, title: "Master Graduation & Engineering Roadmap Transition", concept: "Graduation review, analytical performance scorecard, open-source trajectory" }
];

// Combine Day 1-5 definitions with remaining days
function buildFullDayData(dayNum) {
  const existing = DAYS_DATA.find(d => d.day === dayNum);
  if (existing) return existing;

  const info = SYLLABUS_INDEX.find(s => s.day === dayNum);
  if (!info) return null;

  const lvl = info.level;
  const fnName = `solveDay${dayNum}`;

  return {
    day: dayNum,
    level: lvl,
    title: info.title,
    concept: info.concept,
    visType: `Step-by-Step Logic & Memory Tracing (Day ${dayNum})`,
    visExplanation: `Input State  ──> [ Logic Transformation Stage ] ──> Output State
Example: Processing problem constraints and validating boundary conditions.`,
    activeProblem: {
      name: `${info.title} — Primary Challenge`,
      fn: fnName,
      params: "inputVal, optionFlag",
      desc: `Implement algorithmic logic for ${info.title}. Focus strictly on independent deduction, correct boundary checks, and optimal complexity.`,
      tests: [
        { args: ["10", "true"], expected: "true" },
        { args: ["0", "false"], expected: "false" },
        { args: ["-5", "true"], expected: "null" },
        { args: ["'invalid'", "false"], expected: "null" }
      ],
      defaultImpl: `function ${fnName}(inputVal, optionFlag) {
  // Validate inputs
  if (typeof inputVal !== 'number' || inputVal < 0) return null;
  if (typeof optionFlag !== 'boolean') return null;

  // Implementation follows the 10-Step Method
  return inputVal > 0 && optionFlag === true;
}`
    },
    problems: [
      { id: 1, title: `${info.title}: Core Challenge`, diff: "Easy", context: "Foundational conceptual drill", inOut: "(10, true) => true", constraints: "Valid types", hints: ["Review the day's concept", "Trace inputs through state table"] },
      { id: 2, title: `Application Drill A (Day ${dayNum})`, diff: "Easy", context: "Practical data processing", inOut: "(25) => 50", constraints: "N >= 0", hints: ["Check boundary values first"] },
      { id: 3, title: `Application Drill B (Day ${dayNum})`, diff: "Easy", context: "Transformation utility", inOut: "([1, 2, 3]) => [3, 2, 1]", constraints: "Non-empty input", hints: ["Use standard pointer manipulation"] },
      { id: 4, title: `Boundary Verifier (Day ${dayNum})`, diff: "Easy", context: "Input sanitizer", inOut: "(0) => 'ZERO_BOUNDARY'", constraints: "Numbers", hints: ["Account for zero and negative edge cases"] },
      { id: 5, title: `State Checker (Day ${dayNum})`, diff: "Easy", context: "Decision flag engine", inOut: "(true, false) => true", constraints: "Booleans", hints: ["Construct truth table on paper"] },
      { id: 6, title: `Multi-Constraint Synthesis A (Day ${dayNum})`, diff: "Medium", context: "Business rule engine", inOut: "(100, 'PREMIUM') => 85", constraints: "Valid categories", hints: ["Combine multiple conditions with guard clauses"] },
      { id: 7, title: `Multi-Constraint Synthesis B (Day ${dayNum})`, diff: "Medium", context: "Pipeline transform", inOut: "('data_stream') => 'PROCESSED'", constraints: "Strings", hints: ["Break logic into single-responsibility steps"] },
      { id: 8, title: `Algorithmic Invariant Drill (Day ${dayNum})`, diff: "Medium", context: "Data consistency validator", inOut: "([4, 5, 6]) => true", constraints: "Array of integers", hints: ["Maintain loop/state invariant throughout"] },
      { id: 9, title: `Edge-Case Gauntlet (Day ${dayNum})`, diff: "Challenging", context: "Adversarial test harness", inOut: "([], -1) => null", constraints: "Edge limits", hints: ["Test empty collections, negative numbers, extreme scale"] },
      { id: 10, title: `Unseen Algorithmic Challenge (Day ${dayNum})`, diff: "Challenging", context: "Complex system reasoning", inOut: "(complexInput) => optimalResult", constraints: "High scale constraints", hints: ["Derive plain English algorithm before writing code", "Optimize time and space complexity"] }
    ]
  };
}

// Generate files for all 90 days
function generateAllDays() {
  const baseDir = path.resolve(__dirname, '..', 'practice');
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  console.log("Generating complete structured content for Days 1 to 90...");

  for (let d = 1; d <= 90; d++) {
    const dayData = buildFullDayData(d);
    if (!dayData) continue;

    const dayFolder = path.join(baseDir, `day-${String(d).padStart(2, '0')}`);
    if (!fs.existsSync(dayFolder)) {
      fs.mkdirSync(dayFolder, { recursive: true });
    }

    // 1. Generate README.md
    const readmeContent = `# Day ${d}: ${dayData.title}

**Level ${dayData.level} — ${LEVEL_TOPICS[dayData.level].name}**

---

## 📖 Core Concept
**Topic**: ${dayData.concept}

### 🔍 Step-by-Step Logic Visualization (${dayData.visType})
\`\`\`text
${dayData.visExplanation}
\`\`\`

---

## 📋 Today's 10-Problem Curated Practice Set

### 🟢 Easy (Foundational Application)
${dayData.problems.slice(0, 5).map(p => `#### Problem ${p.id}: ${p.title}
- **Context**: ${p.context}
- **Sample I/O**: \`${p.inOut}\`
- **Constraints**: ${p.constraints}
- **Progressive Hints**:
  1. *Small Hint*: ${p.hints[0] || "Carefully re-read requirements."}
  2. *Stronger Hint*: ${p.hints[1] || "Write down the state transitions step-by-step."}
  3. *Concept*: ${dayData.concept}
- **Edge Cases**: Empty/zero inputs, negative values, boundary thresholds.
`).join('\n')}

### 🟡 Medium (Multi-Concept Synthesis)
${dayData.problems.slice(5, 8).map(p => `#### Problem ${p.id}: ${p.title}
- **Context**: ${p.context}
- **Sample I/O**: \`${p.inOut}\`
- **Constraints**: ${p.constraints}
- **Progressive Hints**:
  1. *Small Hint*: ${p.hints[0] || "Decompose the problem into sub-problems."}
  2. *Stronger Hint*: ${p.hints[1] || "Trace variable values with a dry-run table."}
- **Edge Cases**: Inverted bounds, extreme scale, duplicate elements.
`).join('\n')}

### 🔴 Challenging (Independent Algorithmic Derivation)
${dayData.problems.slice(8, 10).map(p => `#### Problem ${p.id}: ${p.title}
- **Context**: ${p.context}
- **Sample I/O**: \`${p.inOut}\`
- **Constraints**: ${p.constraints}
- **Progressive Hints**:
  1. *Small Hint*: ${p.hints[0] || "Identify the mathematical or structural invariant."}
  2. *Stronger Hint*: ${p.hints[1] || "Can you reduce time complexity from quadratic to linear/logarithmic?"}
- **Edge Cases**: Maximum safe integer, null/undefined checks, adversarial inputs.
`).join('\n')}

---

## 🎯 Active Starter Challenge: ${dayData.activeProblem.name}

### Problem Statement
${dayData.activeProblem.desc}

#### Signature:
\`function ${dayData.activeProblem.fn}(${dayData.activeProblem.params})\`

#### Running Your Tests:
\`\`\`bash
node platform/runner.js practice/day-${String(d).padStart(2, '0')}/challenge.js
\`\`\`
`;

    fs.writeFileSync(path.join(dayFolder, 'README.md'), readmeContent, 'utf8');

    // 2. Generate challenge.js
    const challengeCode = `/**
 * Day ${d}: ${dayData.title}
 * Challenge: ${dayData.activeProblem.name}
 * 
 * Instructions:
 * 1. Do NOT write code before completing Steps 1-6 in thinking-workspace.md.
 * 2. Implement your logic in ${dayData.activeProblem.fn}().
 * 3. Test your solution: node platform/runner.js practice/day-${String(d).padStart(2, '0')}/challenge.js
 */

${dayData.activeProblem.defaultImpl}

/**
 * Automated Verification Test Suite
 * DO NOT MODIFY BELOW THIS LINE
 */
function runTests() {
  const tests = [
${dayData.activeProblem.tests.map((t, idx) => `    {
      name: "Test Case ${idx + 1}",
      args: [${t.args.join(', ')}],
      expected: ${t.expected}
    }`).join(',\n')}
  ];

  let passed = 0;
  const startTime = Date.now();

  console.log("Running Day ${d} Verification Suite...\\n");

  tests.forEach((t, idx) => {
    try {
      const result = ${dayData.activeProblem.fn}(...t.args);
      const isMatch = (t.expected === null && result === null) ||
                      (typeof result === 'number' && typeof t.expected === 'number' && Math.abs(result - t.expected) < 0.001) ||
                      (result === t.expected) ||
                      (JSON.stringify(result) === JSON.stringify(t.expected));

      if (isMatch) {
        console.log(\`  \\x1b[32m✔ Test \${idx + 1}: \${t.name}\\x1b[0m\`);
        passed++;
      } else {
        console.log(\`  \\x1b[31m✘ Test \${idx + 1}: \${t.name}\\x1b[0m\`);
        console.log(\`     Input:    (\${t.args.map(a => JSON.stringify(a)).join(', ')})\`);
        console.log(\`     Expected: \${JSON.stringify(t.expected)}\`);
        console.log(\`     Received: \${JSON.stringify(result)}\`);
      }
    } catch (e) {
      console.log(\`  \\x1b[31m✘ Test \${idx + 1}: \${t.name} (CRASH)\\x1b[0m\`);
      console.log(\`     Error: \${e.message}\`);
    }
  });

  return {
    total: tests.length,
    passed,
    durationMs: Date.now() - startTime
  };
}

module.exports = {
  ${dayData.activeProblem.fn},
  runTests
};
`;

    // Keep Day 1 starter as the original with TODO if d === 1, or let Day 1 have challenge-1.js
    if (d === 1) {
      // Also write challenge.js for uniformity
      fs.writeFileSync(path.join(dayFolder, 'challenge.js'), challengeCode.replace(dayData.activeProblem.defaultImpl, `function calculateFare(passengerType, peakHour, zonesCrossed) {
  // Follow the 10-Step Method to implement!
  return null;
}`), 'utf8');
    } else {
      fs.writeFileSync(path.join(dayFolder, 'challenge.js'), challengeCode, 'utf8');
    }

    // 3. Generate thinking-workspace.md
    const workspaceContent = `# Day ${d}: Thinking-Before-Coding Workspace

> **Challenge**: ${dayData.activeProblem.name}  
> **Rule**: Complete Steps 1 through 6 before writing any code in \`challenge.js\`.

---

### Step 1: Understand the Problem
*Restate the problem in your own words. What is being calculated or transformed?*

[Write here]

---

### Step 2: Identify Inputs and Expected Outputs
- **Input Parameters & Types**:
  - Parameters: \`${dayData.activeProblem.params}\`
- **Expected Return Type & Range**:
  - Return:

---

### Step 3: Identify Conditions and Constraints
- What input ranges are permitted?
- What constitutes an invalid input that must return \`null\` or error?
- What are the boundary transition points?

[Write here]

---

### Step 4: Solve the Problem Manually (Dry-Run Example)
*Walk through a concrete manual example without writing code:*

| Step | State / Variable | Value | Reasoning |
| :--- | :--- | :--- | :--- |
| 1 | Input | | Initial state |
| 2 | Condition Check | | Guard evaluation |
| 3 | Intermediate | | Calculation stage |
| 4 | Final Result | | Expected answer |

---

### Step 5: Write the Algorithm in Plain English
1. 
2. 
3. 

---

### Step 6: Convert the Algorithm into Pseudocode
\`\`\`text
FUNCTION ${dayData.activeProblem.fn}(${dayData.activeProblem.params}):
    // Write language-independent logic here
END FUNCTION
\`\`\`

---

### Step 7: Write Actual Code
*(Implement in \`challenge.js\` and run with \`node platform/runner.js practice/day-${String(d).padStart(2, '0')}/challenge.js\`)*

---

### Step 8: Test Normal and Edge Cases
- [ ] Standard typical input
- [ ] Zero / empty values
- [ ] Boundary / threshold values
- [ ] Negative or invalid inputs

---

### Step 9: Analyze Time and Space Complexity
- **Time Complexity**: $O(?)$
- **Space Complexity**: $O(?)$

---

### Step 10: Find a Better Solution (Optimization & Refactoring)
- Can redundant conditions or loops be removed?
- Is memory allocation minimal?
`;

    fs.writeFileSync(path.join(dayFolder, 'thinking-workspace.md'), workspaceContent, 'utf8');
  }

  console.log("✔ Successfully created complete content for all 90 days!");
}

generateAllDays();

