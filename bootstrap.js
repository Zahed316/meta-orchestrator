#!/usr/bin/env node
/**
 * Bootstrap check for new users
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Meta-Orchestrator Bootstrap Check\n');

// Check 1: Node.js version
const nodeVersion = process.version.match(/^v(\d+)/)[1];
if (parseInt(nodeVersion) < 18) {
  console.error(`✗ Node.js 18+ required (found v${nodeVersion})`);
  process.exit(1);
}
console.log(`✓ Node.js ${process.version}`);

// Check 2: Git installed
try {
  execSync('git --version', { stdio: 'pipe' });
  console.log('✓ Git installed');
} catch (e) {
  console.error('✗ Git not found — required for plugin installation');
  process.exit(1);
}

// Check 3: npm dependencies
const packageJson = require('./package.json');
const deps = Object.keys(packageJson.dependencies || {});
let missingDeps = [];

for (const dep of deps) {
  try {
    require.resolve(dep);
  } catch (e) {
    missingDeps.push(dep);
  }
}

if (missingDeps.length > 0) {
  console.log(`⚠️  Missing: ${missingDeps.join(', ')}`);
  console.log('   Run: npm install');
  process.exit(1);
}
console.log(`✓ Dependencies installed (${deps.length})`);

// Check 4: Settings file
const settingsPath = path.join(process.cwd(), '../../..', '.claude/settings.json');
if (!fs.existsSync(settingsPath)) {
  console.log('⚠️  No .claude/settings.json found');
  console.log('   Will use defaults (autoInstallPlugins: true)');
} else {
  console.log('✓ Settings file exists');
}

// Check 5: plugin-sources.json
const sourcesPath = path.join(__dirname, 'plugin-sources.json');
if (!fs.existsSync(sourcesPath)) {
  console.error('✗ plugin-sources.json missing');
  process.exit(1);
}
console.log('✓ Plugin sources configured');

console.log('\n✅ Ready to orchestrate');
console.log('\nUsage: /meta "<task description>"');
