/**
 * Day 36: Strings as Character Arrays & Char Codes
 * Challenge: Strings as Character Arrays & Char Codes — Primary Challenge
 * 
 * Instructions:
 * 1. Do NOT write code before completing Steps 1-6 in thinking-workspace.md.
 * 2. Implement your logic in solveDay36().
 * 3. Test your solution: node platform/runner.js practice/day-36/challenge.js
 */

function solveDay36(inputVal, optionFlag) {
  // Validate inputs
  if (typeof inputVal !== 'number' || inputVal < 0) return null;
  if (typeof optionFlag !== 'boolean') return null;

  // Implementation follows the 10-Step Method
  return inputVal > 0 && optionFlag === true;
}

/**
 * Automated Verification Test Suite
 * DO NOT MODIFY BELOW THIS LINE
 */
function runTests() {
  const tests = [
    {
      name: "Test Case 1",
      args: [10, true],
      expected: true
    },
    {
      name: "Test Case 2",
      args: [0, false],
      expected: false
    },
    {
      name: "Test Case 3",
      args: [-5, true],
      expected: null
    },
    {
      name: "Test Case 4",
      args: ['invalid', false],
      expected: null
    }
  ];

  let passed = 0;
  const startTime = Date.now();

  console.log("Running Day 36 Verification Suite...\n");

  tests.forEach((t, idx) => {
    try {
      const result = solveDay36(...t.args);
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
  solveDay36,
  runTests
};
