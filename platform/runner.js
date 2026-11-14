/**
 * Logic Mastery Test Runner
 * Zero-dependency interactive test runner and logic validator.
 */
const path = require('path');
const fs = require('fs');

let targetArg = process.argv[2];

if (!targetArg) {
  console.log('\x1b[33m%s\x1b[0m', 'Usage:');
  console.log('  node platform/runner.js <dayNumber>              (e.g., node platform/runner.js 1)');
  console.log('  node platform/runner.js <path-to-challenge.js>   (e.g., node platform/runner.js practice/day-01/challenge.js)');
  process.exit(1);
}

// Support shorthand like "1", "01", "day-1", "day-01"
if (/^(\d+|day-\d+)$/i.test(targetArg)) {
  const match = targetArg.match(/\d+/);
  if (match) {
    const dayStr = String(parseInt(match[0], 10)).padStart(2, '0');
    const candidatePath = path.resolve(process.cwd(), `practice/day-${dayStr}/challenge.js`);
    const candidatePathAlt = path.resolve(process.cwd(), `practice/day-${dayStr}/challenge-1.js`);
    if (fs.existsSync(candidatePath)) {
      targetArg = candidatePath;
    } else if (fs.existsSync(candidatePathAlt)) {
      targetArg = candidatePathAlt;
    }
  }
}

const resolvedPath = path.resolve(process.cwd(), targetArg);

if (!fs.existsSync(resolvedPath)) {
  console.error(`\x1b[31mError: File not found at ${resolvedPath}\x1b[0m`);
  process.exit(1);
}

console.log('\n\x1b[36m==================================================');
console.log('       🧠 LOGIC & PROBLEM-SOLVING TEST RUNNER      ');
console.log('==================================================\x1b[0m\n');
console.log(`Target: \x1b[35m${path.relative(process.cwd(), resolvedPath)}\x1b[0m\n`);

try {
  const challengeModule = require(resolvedPath);
  
  if (typeof challengeModule.runTests !== 'function') {
    console.error('\x1b[31mError: Challenge file must export a `runTests` function.\x1b[0m');
    process.exit(1);
  }

  const result = challengeModule.runTests();
  
  console.log('\n\x1b[36m--------------------------------------------------\x1b[0m');
  if (result.passed === result.total && result.total > 0) {
    console.log(`\x1b[32m✔ ALL ${result.total} TESTS PASSED! EXCELLENT LOGIC EXECUTION.\x1b[0m`);
    console.log(`\x1b[90mExecution Time: ${result.durationMs || 0} ms\x1b[0m\n`);
    console.log('Next step: Review your time/space complexity and discuss with your coach!');
  } else {
    console.log(`\x1b[31m✘ ${result.total - result.passed} of ${result.total} tests failed.\x1b[0m`);
    console.log('\x1b[33mTip: Follow the 10-Step Method. Trace your variables with a dry-run table.\x1b[0m\n');
  }
} catch (err) {
  console.error('\x1b[31mRuntime Exception:\x1b[0m', err.message);
  console.error(err.stack);
  process.exit(1);
}
