/**
 * Day 3: Conditions, Relational Operators & Boundary Checks
 * Challenge: Water Quality Safety Index Classifier
 * 
 * Instructions:
 * 1. Do NOT write code before completing Steps 1-6 in thinking-workspace.md.
 * 2. Implement your logic in classifyWaterSafety().
 * 3. Test your solution: node platform/runner.js practice/day-03/challenge.js
 */

function classifyWaterSafety(ph, turbidity, oxygen) {
  if (ph < 0 || ph > 14 || turbidity < 0 || oxygen < 0) return null;
  if (ph >= 6.5 && ph <= 8.5 && turbidity <= 2.0 && oxygen >= 6.5) return 'DRINKABLE';
  if (ph >= 6.0 && ph <= 9.0 && turbidity <= 5.0 && oxygen >= 4.0) return 'AGRICULTURAL';
  if (ph >= 5.0 && ph <= 10.0 && turbidity <= 10.0 && oxygen >= 2.0) return 'INDUSTRIAL_ONLY';
  return 'HAZARDOUS';
}

/**
 * Automated Verification Test Suite
 * DO NOT MODIFY BELOW THIS LINE
 */
function runTests() {
  const tests = [
    {
      name: "Test Case 1",
      args: [7.2, 1.5, 8.0],
      expected: 'DRINKABLE'
    },
    {
      name: "Test Case 2",
      args: [6.2, 4.0, 5.5],
      expected: 'AGRICULTURAL'
    },
    {
      name: "Test Case 3",
      args: [8.8, 8.0, 3.0],
      expected: 'INDUSTRIAL_ONLY'
    },
    {
      name: "Test Case 4",
      args: [3.0, 15.0, 1.0],
      expected: 'HAZARDOUS'
    },
    {
      name: "Test Case 5",
      args: [-1, 2.0, 5.0],
      expected: null
    }
  ];

  let passed = 0;
  const startTime = Date.now();

  console.log("Running Day 3 Verification Suite...\n");

  tests.forEach((t, idx) => {
    try {
      const result = classifyWaterSafety(...t.args);
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
  classifyWaterSafety,
  runTests
};
