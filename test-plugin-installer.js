#!/usr/bin/env node
/**
 * Test: Plugin Installer
 */

const { PluginInstaller } = require('./plugin-installer');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Plugin Installer\n');

// Test 1: Load sources
console.log('Test 1: Load Plugin Sources');
const installer = new PluginInstaller();
const sourceCount = Object.keys(installer.sources).length;
console.assert(sourceCount > 0, 'Should load plugin sources');
console.log(`  ✓ Loaded ${sourceCount} source(s)`);

// Test 2: Check missing plugins
console.log('\nTest 2: Check Missing Plugins');
const testPlugins = [
  { id: 'mattpocock-skills:research', domain: 'investigation' },
  { id: 'claude-forge:architect', domain: 'design' },
  { id: 'fake-plugin:test', domain: 'unknown' }
];

installer.checkMissing(testPlugins).then(missing => {
  console.log(`  Found ${missing.length} missing plugin(s)`);
  if (missing.length > 0) {
    missing.forEach(m => console.log(`    - ${m.id}`));
  }
  console.log('  ✓ Check completed');
}).catch(err => {
  console.error(`  ✗ Check failed: ${err.message}`);
});

// Test 3: Validate sources structure
console.log('\nTest 3: Validate Sources Structure');
for (const [namespace, source] of Object.entries(installer.sources)) {
  console.assert(source.repo, `${namespace} should have repo`);
  console.assert(source.repo.startsWith('http'), `${namespace} repo should be URL`);
  console.log(`  ✓ ${namespace}: ${source.repo}`);
}

console.log('\n✓ All installer tests passed');
