#!/usr/bin/env node
/**
 * Smoke test: Orchestrator integration
 */

const { orchestrate, discoverPlugins, composeChain, PLUGIN_REGISTRY } = require('./orchestrator');

console.log('Testing Orchestrator integration...\n');

// Convert registry object to array for discovery
const allPlugins = Object.values(PLUGIN_REGISTRY);

// Test 1: Plugin discovery
const plugins = discoverPlugins('research auth patterns and validate architecture', allPlugins);
console.assert(plugins.length > 0, 'Should discover plugins');
console.assert(
  plugins.some(p => p.id === 'mattpocock-skills:research'),
  'Should discover research plugin'
);
console.assert(
  plugins.some(p => p.id === 'claude-forge:architect'),
  'Should discover architect plugin'
);
console.log(`✓ Plugin discovery (${plugins.length} plugins)`);

// Test 2: Chain composition (stateless)
const chain = composeChain(plugins);
console.assert(chain.length === 1, 'Stateless should create single layer');
console.assert(Array.isArray(chain[0]), 'Layer should be array');
console.log('✓ Chain composition (stateless)');

// Test 3: Project-generator plugin registered
const projectPlugins = discoverPlugins('setup new project', allPlugins);
console.assert(
  projectPlugins.some(p => p.id === 'meta-orchestrator:project-generator'),
  'Should discover project-generator'
);
console.log('✓ Project-generator plugin registered');

// Test 4: Backward compatibility
const oldPlugins = Object.keys(PLUGIN_REGISTRY);
console.assert(oldPlugins.includes('research'), 'Alpha plugins preserved');
console.assert(oldPlugins.includes('architect'), 'Alpha plugins preserved');
console.assert(oldPlugins.includes('project_generator'), 'Phase 2 plugin added');
console.log('✓ Backward compatibility (alpha plugins + new)');

console.log('\n✓ All orchestrator tests passed');
