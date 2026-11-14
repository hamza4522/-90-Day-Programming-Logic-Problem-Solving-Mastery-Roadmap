/**
 * Logic Mastery Progress & Mistake Tracker CLI
 */
const fs = require('fs');
const path = require('path');

const stateFile = path.resolve(__dirname, 'state.json');

function loadState() {
  if (!fs.existsSync(stateFile)) {
    return {
      startedAt: new Date().toISOString(),
      currentDay: 1,
      currentLevel: 1,
      streakDays: 0,
      solvedCount: 0,
      mistakeSummary: {},
      completedDays: [],
      assessments: []
    };
  }
  return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
}

function saveState(state) {
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');
}

const args = process.argv.slice(2);
const command = args[0] || 'status';

const state = loadState();

if (command === 'status') {
  console.log('\n\x1b[36m==================================================');
  console.log('         📊 LOGIC MASTERY DASHBOARD');
  console.log('==================================================\x1b[0m');
  console.log(`Current Day:    \x1b[33mDay ${state.currentDay} / 90\x1b[0m`);
  console.log(`Current Level:  \x1b[32mLevel ${state.currentLevel}\x1b[0m`);
  console.log(`Streak:         \x1b[35m${state.streakDays} day(s)\x1b[0m`);
  console.log(`Problems Solved:\x1b[34m${state.solvedCount}\x1b[0m\n`);
  
  console.log('\x1b[33m📌 Mistake Analytics:\x1b[0m');
  for (const [category, count] of Object.entries(state.mistakeSummary)) {
    const bar = '■'.repeat(Math.min(count, 20));
    console.log(`  - ${category.padEnd(30)}: ${count} ${bar}`);
  }
  console.log('\n\x1b[36m--------------------------------------------------\x1b[0m\n');
} else if (command === 'log-mistake') {
  const category = args[1];
  if (!category || !state.mistakeSummary.hasOwnProperty(category)) {
    console.log('\x1b[31mInvalid category. Choose one of:\x1b[0m');
    Object.keys(state.mistakeSummary).forEach(cat => console.log(`  - "${cat}"`));
    process.exit(1);
  }
  state.mistakeSummary[category] = (state.mistakeSummary[category] || 0) + 1;
  saveState(state);
  console.log(`\x1b[32m✔ Logged mistake in category: ${category}\x1b[0m`);
} else if (command === 'complete-day') {
  const day = parseInt(args[1] || state.currentDay, 10);
  if (!state.completedDays.includes(day)) {
    state.completedDays.push(day);
    state.solvedCount += 1;
    state.currentDay = day + 1;
    state.streakDays += 1;
    saveState(state);
    console.log(`\x1b[32m✔ Marked Day ${day} as complete! Moving to Day ${state.currentDay}.\x1b[0m`);
  } else {
    console.log(`Day ${day} was already marked complete.`);
  }
} else {
  console.log('Commands: status | log-mistake "<category>" | complete-day [dayNumber]');
}

