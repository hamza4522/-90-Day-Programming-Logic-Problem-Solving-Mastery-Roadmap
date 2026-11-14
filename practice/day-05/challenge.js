/**
 * Day 5: Boolean Logic, Truth Tables & De Morgan's Laws
 * Challenge: Multi-Factor Authentication Access Arbiter
 * 
 * Instructions:
 * 1. Do NOT write code before completing Steps 1-6 in thinking-workspace.md.
 * 2. Implement your logic in verifyAccessPermission().
 * 3. Test your solution: node platform/runner.js practice/day-05/challenge.js
 */

function verifyAccessPermission(pw, otp, bio, trusted, rooted) {
  if (rooted || !pw) return 'DENIED';
  if (bio || (otp && trusted)) return 'GRANTED';
  if (otp || trusted) return 'ADDITIONAL_VERIFICATION';
  return 'DENIED';
}

/**
 * Automated Verification Test Suite
 * DO NOT MODIFY BELOW THIS LINE
 */
function runTests() {
  const tests = [
    {
      name: "Test Case 1",
      args: [true, true, false, true, false],
      expected: 'GRANTED'
    },
    {
      name: "Test Case 2",
      args: [true, false, true, false, false],
      expected: 'GRANTED'
    },
    {
      name: "Test Case 3",
      args: [true, false, false, true, false],
      expected: 'ADDITIONAL_VERIFICATION'
    },
    {
      name: "Test Case 4",
      args: [true, true, true, true, true],
      expected: 'DENIED'
    },
    {
      name: "Test Case 5",
      args: [false, true, true, true, false],
      expected: 'DENIED'
    }
  ];

  let passed = 0;
  const startTime = Date.now();

  console.log("Running Day 5 Verification Suite...\n");

  tests.forEach((t, idx) => {
    try {
      const result = verifyAccessPermission(...t.args);
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
  verifyAccessPermission,
  runTests
};
