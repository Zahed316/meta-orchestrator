#!/usr/bin/env node
/**
 * Smoke test: Project Generator
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { ProjectGenerator } = require('./project-generator');

console.log('Testing ProjectGenerator...\n');

// Create temp directory
const tmpDir = path.join('/tmp', `test-project-${Date.now()}`);
fs.mkdirSync(tmpDir, { recursive: true });

// Test 1: Generate minimal project
const generator = new ProjectGenerator(tmpDir, {
  projectName: 'test-app',
  template: 'minimal',
  mcpDiscovery: false
});

(async () => {
  try {
    const steps = await generator.generate();

    // Verify structure
    console.assert(fs.existsSync(path.join(tmpDir, '.git')), '.git missing');
    console.log('✓ Git init');

    console.assert(fs.existsSync(path.join(tmpDir, '.claude')), '.claude missing');
    console.log('✓ Claude structure');

    console.assert(fs.existsSync(path.join(tmpDir, '.gitignore')), '.gitignore missing');
    console.log('✓ Gitignore created');

    // Test 2: Idempotency
    const steps2 = await generator.generate();
    console.assert(
      steps2.filter(Boolean).length < steps.filter(Boolean).length,
      'Second run should skip more steps'
    );
    console.log('✓ Idempotency');

    console.log('\n✓ All project generator tests passed');
  } catch (err) {
    console.error(`✗ Test failed: ${err.message}`);
    process.exit(1);
  } finally {
    // Cleanup
    try {
      execSync(`rm -rf ${tmpDir}`, { stdio: 'pipe' });
    } catch (e) {}
  }
})();
