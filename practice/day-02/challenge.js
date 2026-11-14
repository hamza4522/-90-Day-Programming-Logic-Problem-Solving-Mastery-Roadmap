/**
 * Day 2: Arithmetic Operators, Modulo Mastery & Cyclic Systems
 * Challenge: Circular Buffer Index & Clock Normalizer
 * 
 * Instructions:
 * 1. Do NOT write code before completing Steps 1-6 in thinking-workspace.md.
 * 2. Implement your logic in getNormalizedIndex().
 * 3. Test your solution: node platform/runner.js practice/day-02/challenge.js
 */

function getNormalizedIndex(currentIndex, offset, bufferSize) {
  if (bufferSize <= 0 || currentIndex < 0 || currentIndex >= bufferSize) return null;
  let normalized = (currentIndex + (offset % bufferSize) + bufferSize) % bufferSize;
  return normalized;
}

/**
 * Automated Verification Test Suite
 * DO NOT MODIFY BELOW THIS LINE
 */
function runTests() {
  const tests = [
    {
      name: "Test Case 1",
      args: [2, 3, 5],
      expected: 0
    },
    {
      name: "Test Case 2",
      args: [0, -1, 5],
      expected: 4
    },
    {
      name: "Test Case 3",
      args: [3, -7, 4],
      expected: 0
    },
    {
      name: "Test Case 4",
      args: [1, 10, 4],
      expected: 3
    },
    {
      name: "Test Case 5",
      args: [-1, 2, 5],
      expected: null
    },
    {
      name: "Test Case 6",
      args: [2, 3, 0],
      expected: null
    }
  ];

  let passed = 0;
  const startTime = Date.now();

  console.log("Running Day 2 Verification Suite...\n");

  tests.forEach((t, idx) => {
    try {
      const result = getNormalizedIndex(...t.args);
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
  getNormalizedIndex,
  runTests
};
