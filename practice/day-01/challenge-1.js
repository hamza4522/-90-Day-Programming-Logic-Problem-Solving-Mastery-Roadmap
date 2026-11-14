/**
 * Day 1 - Challenge 1: The Metro Smart Transit Fare Engine
 * 
 * Objective:
 * Implement `calculateFare(passengerType, peakHour, zonesCrossed)`
 * according to the exact specifications in `practice/day-01/README.md`.
 * 
 * Instructions:
 * 1. Do NOT rush to code before writing your approach in `thinking-workspace.md`.
 * 2. Implement your logic inside the function below.
 * 3. Run your tests with: `npm run test:day1` or `node platform/runner.js practice/day-01/challenge-1.js`
 */

function calculateFare(passengerType, peakHour, zonesCrossed) {
  // TODO: Implement your solution following the 10-Step Method
  // Step 1: Input Validation
  // Step 2: Base Fare Assignment
  // Step 3: Zone Calculation
  // Step 4: Peak Surcharge Calculation (Check exemption)
  // Step 5: Senior Discount Evaluation
  // Step 6: Return formatted number
  
  return null; // Replace with your implementation
}

/**
 * Automated Verification Test Suite
 * DO NOT MODIFY THE CODE BELOW THIS LINE
 */
function runTests() {
  const tests = [
    {
      name: "Adult - Off Peak - 0 Zones",
      args: ["ADULT", false, 0],
      expected: 2.50
    },
    {
      name: "Adult - Off Peak - 2 Zones",
      args: ["ADULT", false, 2],
      expected: 4.00
    },
    {
      name: "Adult - Peak - 2 Zones",
      args: ["ADULT", true, 2],
      expected: 5.25
    },
    {
      name: "Student - Off Peak - 4 Zones",
      args: ["STUDENT", false, 4],
      expected: 4.50
    },
    {
      name: "Student - Peak - 1 Zone",
      args: ["STUDENT", true, 1],
      expected: 3.50
    },
    {
      name: "Senior - Peak Exemption - 2 Zones",
      args: ["SENIOR", true, 2],
      expected: 2.50
    },
    {
      name: "Senior - Peak Exemption + Long Trip Discount - 3 Zones",
      args: ["SENIOR", true, 3],
      expected: 2.75
    },
    {
      name: "Senior - Off Peak + Long Trip Discount - 5 Zones",
      args: ["SENIOR", false, 5],
      expected: 4.25
    },
    {
      name: "Edge Case: Invalid Passenger Type",
      args: ["CHILD", false, 2],
      expected: null
    },
    {
      name: "Edge Case: Negative Zones Crossed",
      args: ["ADULT", false, -1],
      expected: null
    },
    {
      name: "Edge Case: Non-Integer Zones Crossed",
      args: ["ADULT", false, 2.5],
      expected: null
    },
    {
      name: "Edge Case: Non-Boolean Peak Hour",
      args: ["ADULT", "true", 1],
      expected: null
    }
  ];

  let passed = 0;
  const startTime = Date.now();

  console.log("Running Day 1 Verification Suite...\n");

  tests.forEach((t, idx) => {
    try {
      const result = calculateFare(...t.args);
      // Floating-point equality comparison
      const isMatch = (t.expected === null && result === null) ||
                      (typeof result === 'number' && typeof t.expected === 'number' && Math.abs(result - t.expected) < 0.001);

      if (isMatch) {
        console.log(`  \x1b[32m✔ Test ${idx + 1}: ${t.name}\x1b[0m`);
        passed++;
      } else {
        console.log(`  \x1b[31m✘ Test ${idx + 1}: ${t.name}\x1b[0m`);
        console.log(`     Input:    (${t.args.map(a => JSON.stringify(a)).join(', ')})`);
        console.log(`     Expected: ${t.expected}`);
        console.log(`     Received: ${result}`);
      }
    } catch (e) {
      console.log(`  \x1b[31m✘ Test ${idx + 1}: ${t.name} (CRASH)\x1b[0m`);
      console.log(`     Error: ${e.message}`);
    }
  });

  return {
    total: tests.length,
    passed,
    durationMs: Date.now() - startTime
  };
}

module.exports = {
  calculateFare,
  runTests
};

