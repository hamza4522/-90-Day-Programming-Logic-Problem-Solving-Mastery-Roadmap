/**
 * Day 4: Nested Conditions & Decision Trees
 * Challenge: Smart Mortgage Loan Approval Matrix
 * 
 * Instructions:
 * 1. Do NOT write code before completing Steps 1-6 in thinking-workspace.md.
 * 2. Implement your logic in evaluateMortgageApplication().
 * 3. Test your solution: node platform/runner.js practice/day-04/challenge.js
 */

function evaluateMortgageApplication(credit, income, loan, years) {
  if (credit < 300 || credit > 850 || income <= 0 || loan <= 0 || years < 0) return null;
  const lti = loan / income;
  if (credit < 620 || lti > 5.0 || years < 1) return { status: 'REJECTED', rate: null };
  if (credit >= 740 && lti <= 3.5 && years >= 2) return { status: 'APPROVED', rate: 4.5 };
  if (credit >= 680 && lti <= 4.2) return { status: 'APPROVED', rate: 5.2 };
  return { status: 'CONDITIONAL', rate: 6.2 };
}

/**
 * Automated Verification Test Suite
 * DO NOT MODIFY BELOW THIS LINE
 */
function runTests() {
  const tests = [
    {
      name: "Test Case 1",
      args: [750, 100000, 300000, 3],
      expected: { status: 'APPROVED', rate: 4.5 }
    },
    {
      name: "Test Case 2",
      args: [660, 80000, 280000, 2],
      expected: { status: 'CONDITIONAL', rate: 6.2 }
    },
    {
      name: "Test Case 3",
      args: [580, 120000, 200000, 5],
      expected: { status: 'REJECTED', rate: null }
    },
    {
      name: "Test Case 4",
      args: [720, 50000, 350000, 1],
      expected: { status: 'REJECTED', rate: null }
    }
  ];

  let passed = 0;
  const startTime = Date.now();

  console.log("Running Day 4 Verification Suite...\n");

  tests.forEach((t, idx) => {
    try {
      const result = evaluateMortgageApplication(...t.args);
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
  evaluateMortgageApplication,
  runTests
};
