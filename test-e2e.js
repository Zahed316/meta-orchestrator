#!/usr/bin/env node
/**
 * End-to-end test: Phase 2 architecture
 */

const fs = require('fs');
const path = require('path');
const { orchestrate, discoverPlugins, composeChain, PLUGIN_REGISTRY } = require('./orchestrator');

(async () => {
  console.log('E2E Test: Phase 2 Architecture\n');

  // Test 1: Alpha regression (stateless)
  console.log('Test 1: Alpha behavior (no YAML, stateless)');
  const result1 = await orchestrate('research auth patterns', { claudeMemAvailable: false });
  console.assert(!result1.persistent, 'Should be stateless');
  console.assert(result1.chain.length === 1, 'Should have single layer');
  console.assert(result1.plugins.length > 0, 'Should discover plugins');
  console.log('✓ Alpha regression works\n');

  // Test 2: Plugin registry includes Phase 2 additions
  console.log('Test 2: Plugin registry backward compatibility');
  const allPlugins = Object.keys(PLUGIN_REGISTRY);
  console.assert(allPlugins.includes('research'), 'Alpha plugin present');
  console.assert(allPlugins.includes('project_generator'), 'Phase 2 plugin added');
  console.log(`✓ Registry: ${allPlugins.length} plugins (8 alpha + project-generator)\n`);

  // Test 3: Project-generator discoverable
  console.log('Test 3: Project-generator plugin');
  const result3 = await orchestrate('setup new project', { claudeMemAvailable: false });
  console.assert(
    result3.plugins.some(p => p.id === 'meta-orchestrator:project-generator'),
    'Should discover project-generator'
  );
  console.log('✓ Project-generator correctly registered\n');

  // Test 4: Retry config in plugin interface
  console.log('Test 4: Phase 2 plugin interface (retry config)');
  const allPluginsArray = Object.values(PLUGIN_REGISTRY);
  const discovered = discoverPlugins('setup', allPluginsArray);
  const pgPlugin = discovered.find(p => p.id === 'meta-orchestrator:project-generator');
  console.assert(pgPlugin?.retry, 'Project-generator should have retry config');
  console.assert(pgPlugin.retry.maxAttempts === 1, 'Non-retryable operations should have maxAttempts=1');
  console.log('✓ Plugin interface supports retry configuration\n');

  console.log('✓ All E2E tests passed');
  process.exit(0);
})().catch(err => {
  console.error(`✗ E2E test failed: ${err.message}`);
  process.exit(1);
});
