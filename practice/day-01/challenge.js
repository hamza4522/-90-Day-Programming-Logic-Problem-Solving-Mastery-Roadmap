/**
 * Day 1: Execution Model, State Tracing & Pure Logical Branching
 * Challenge: The Metro Smart Transit Fare Engine
 * 
 * Instructions:
 * 1. Do NOT write code before completing Steps 1-6 in thinking-workspace.md.
 * 2. Implement your logic in calculateFare().
 * 3. Test your solution: node platform/runner.js practice/day-01/challenge.js
 */

function calculateFare(passengerType, peakHour, zonesCrossed) {
  // Follow the 10-Step Method to implement!
  return null;
}

/**
 * Automated Verification Test Suite
 * DO NOT MODIFY BELOW THIS LINE
 */
function runTests() {
  const tests = [
    {
      name: "Test Case 1",
      args: ['ADULT', false, 0],
      expected: 2.50
    },
    {
      name: "Test Case 2",
      args: ['ADULT', true, 2],
      expected: 5.25
    },
    {
      name: "Test Case 3",
      args: ['SENIOR', true, 3],
      expected: 2.75
    },
    {
      name: "Test Case 4",
      args: ['SENIOR', false, 1],
      expected: 1.75
    },
    {
      name: "Test Case 5",
      args: ['STUDENT', false, 4],
      expected: 4.50
    },
    {
      name: "Test Case 6",
      args: ['CHILD', false, 2],
      expected: null
    },
    {
      name: "Test Case 7",
      args: ['ADULT', false, -1],
      expected: null
    },
    {
      name: "Test Case 8",
      args: ['ADULT', 'true', 1],
      expected: null
    }
  ];

  let passed = 0;
  const startTime = Date.now();

  console.log("Running Day 1 Verification Suite...\n");

  tests.forEach((t, idx) => {
    try {
      const result = calculateFare(...t.args);
      const isMatch = (t.expected === null && result === null) ||
                      (typeof result === 'number' && typeof t.expected === 'number' && Math.abs(result - t.expected) < 0.001) ||
                      (result === t.expected) ||
                      (JSON.stringify(result) === JSON.stringify(t.expected));

      if (isMatch) {
        console.log(`  \x1b[32m✔ Test ${idx + 1}: ${t.name}\x1b[0m`);
        passed++;
      } else {
        console.log(`  \x1b[31m✘ Test ${idx + 1}: ${t.name}\x1b[0m`);
        console.log(`     Input:    (${t.args.map(a => JSON.stringify(a)).join(', ')})`);
        console.log(`     Expected: ${JSON.stringify(t.expected)}`);
        console.log(`     Received: ${JSON.stringify(result)}`);
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
