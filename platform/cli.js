/**
 * Interactive Platform Navigator CLI
 * Full multi-track support: Logic/DSA, System Design, Database, AI, DevOps, DevSecOps.
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const baseDir = path.resolve(__dirname, '..', 'practice');

function printBanner() {
  console.log('\n\x1b[36m==============================================================');
  console.log('       🧠 FULL-STACK LOGIC & ARCHITECTURE MASTERY             ');
  console.log('      90-DAY MULTI-TRACK ENGINEERING TRAINING PLATFORM        ');
  console.log('==============================================================\x1b[0m\n');
}

function printHelp() {
  console.log('\x1b[33mAvailable Commands:\x1b[0m');
  console.log('  list [level]        - List days (filter by level 1-7)');
  console.log('  view <day>          - Show Logic/DSA overview & 10 problems');
  console.log('  logic <day>         - View General Logic Building & Mental Models');
  console.log('  design <day>        - View System Design blueprint (LLD/HLD)');
  console.log('  db <day>            - View Database Engineering module');
  console.log('  ai <day>            - View AI & Machine Learning module');
  console.log('  devops <day>        - View DevOps & Cloud Infrastructure module');
  console.log('  sec <day>           - View DevSecOps & Cybersecurity module');
  console.log('  test <day>          - Run the automated test runner for a day');
  console.log('  status              - View streak, current day, and mistake analytics');
  console.log('  log-mistake <cat>   - Log a mistake in one of the 9 categories');
  console.log('  complete <day>      - Mark a day as successfully completed');
  console.log('  exit                - Exit platform CLI\n');
}

function listDays(filterLevel) {
  console.log('\n\x1b[35m--- 90-DAY CURRICULUM OVERVIEW ---\x1b[0m');
  for (let d = 1; d <= 90; d++) {
    const dayStr = String(d).padStart(2, '0');
    const readmePath = path.join(baseDir, `day-${dayStr}`, 'README.md');
    if (fs.existsSync(readmePath)) {
      const firstLine = fs.readFileSync(readmePath, 'utf8').split('\n')[0] || '';
      const levelLine = fs.readFileSync(readmePath, 'utf8').split('\n')[2] || '';
      const lvlMatch = levelLine.match(/Level (\d+)/);
      const lvl = lvlMatch ? parseInt(lvlMatch[1], 10) : 1;

      if (!filterLevel || lvl === parseInt(filterLevel, 10)) {
        console.log(`  \x1b[32mDay ${dayStr}\x1b[0m [L${lvl}]: ${firstLine.replace(/^#\s*/, '')}`);
      }
    }
  }
  console.log('');
}

function renderFile(dayNum, fileName, trackName, colorCode = '\x1b[36m') {
  const dayStr = String(parseInt(dayNum, 10)).padStart(2, '0');
  const targetPath = path.join(baseDir, `day-${dayStr}`, fileName);
  if (!fs.existsSync(targetPath)) {
    console.log(`\x1b[31mError: ${trackName} for Day ${dayNum} not found.\x1b[0m`);
    return;
  }
  const content = fs.readFileSync(targetPath, 'utf8');
  console.log(`\n${colorCode}${content}\x1b[0m\n`);
}

function runTest(dayNum) {
  const dayStr = String(parseInt(dayNum, 10)).padStart(2, '0');
  const runnerPath = path.resolve(__dirname, 'runner.js');
  const targetPath = path.resolve(baseDir, `day-${dayStr}`, 'challenge.js');
  
  const { execSync } = require('child_process');
  try {
    const output = execSync(`node "${runnerPath}" "${targetPath}"`, { encoding: 'utf8' });
    console.log(output);
  } catch (err) {
    console.log(err.stdout || err.message);
  }
}

// Check if running directly with CLI arguments
const args = process.argv.slice(2);
if (args.length > 0) {
  const cmd = args[0].toLowerCase();
  const day = args[1] || 1;
  if (cmd === 'list') listDays(args[1]);
  else if (cmd === 'view') renderFile(day, 'README.md', 'Logic & DSA', '\x1b[36m');
  else if (cmd === 'logic' || cmd === 'general') renderFile(day, 'logic-building.md', 'General Logic Building', '\x1b[32m');
  else if (cmd === 'design' || cmd === 'sys') renderFile(day, 'system-design.md', 'System Design', '\x1b[35m');
  else if (cmd === 'db' || cmd === 'database') renderFile(day, 'database.md', 'Database Engineering', '\x1b[34m');
  else if (cmd === 'ai' || cmd === 'ml') renderFile(day, 'ai.md', 'AI & Machine Learning', '\x1b[32m');
  else if (cmd === 'devops' || cmd === 'ops') renderFile(day, 'devops.md', 'DevOps Infrastructure', '\x1b[33m');
  else if (cmd === 'sec' || cmd === 'devsecops') renderFile(day, 'devsecops.md', 'DevSecOps & Security', '\x1b[31m');
  else if (cmd === 'test') runTest(day);
  else if (cmd === 'status') require('./tracker.js');
  else printHelp();
  process.exit(0);
}

// Interactive prompt
printBanner();
printHelp();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '\x1b[33mEngineeringMastery> \x1b[0m'
});

rl.prompt();

rl.on('line', (line) => {
  const parts = line.trim().split(/\s+/);
  const cmd = (parts[0] || '').toLowerCase();
  const param = parts[1] || '1';

  switch (cmd) {
    case 'list':
      listDays(parts[1]);
      break;
    case 'view':
      renderFile(param, 'README.md', 'Logic & DSA', '\x1b[36m');
      break;
    case 'logic':
    case 'general':
      renderFile(param, 'logic-building.md', 'General Logic Building', '\x1b[32m');
      break;
    case 'design':
    case 'sys':
      renderFile(param, 'system-design.md', 'System Design', '\x1b[35m');
      break;
    case 'db':
    case 'database':
      renderFile(param, 'database.md', 'Database Engineering', '\x1b[34m');
      break;
    case 'ai':
    case 'ml':
      renderFile(param, 'ai.md', 'AI & Machine Learning', '\x1b[32m');
      break;
    case 'devops':
    case 'ops':
      renderFile(param, 'devops.md', 'DevOps Infrastructure', '\x1b[33m');
      break;
    case 'sec':
    case 'devsecops':
      renderFile(param, 'devsecops.md', 'DevSecOps & Security', '\x1b[31m');
      break;
    case 'test':
      runTest(param);
      break;
    case 'status':
      require('./tracker.js');
      break;
    case 'help':
      printHelp();
      break;
    case 'exit':
    case 'quit':
      rl.close();
      return;
    default:
      if (cmd) console.log(`Unknown command '${cmd}'. Type 'help' for options.`);
  }
  rl.prompt();
}).on('close', () => {
  console.log('\nKeep engineering! Mastery is built through daily compounding practice.\n');
  process.exit(0);
});
