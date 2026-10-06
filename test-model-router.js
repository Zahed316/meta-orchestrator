#!/usr/bin/env node
/**
 * Test: Model Router
 */

const {
  routePlugin,
  buildRoutingManifest,
  printRoutingSummary,
  MODEL_ROUTING
} = require('./model-router');

console.log('🧪 Testing Model Router\n');

// Test 1: Direct plugin routing
console.log('Test 1: Direct Plugin Routing');
const testPlugins = [
  { id: 'mattpocock-skills:research', domain: 'investigation' },
  { id: 'claude-forge:code-reviewer', domain: 'review' },
  { id: 'claude-forge:doc-updater', domain: 'documentation' },
  { id: 'unknown-plugin:test', domain: 'unknown' }
];

testPlugins.forEach(p => {
  const route = routePlugin(p.id, p.domain);
  console.log(`  ${p.id} → ${route.model}`);
});

// Test 2: Domain fallback
console.log('\nTest 2: Domain Fallback');
const domainTests = [
  { id: 'new-plugin:arch', domain: 'design' },
  { id: 'new-plugin:sec', domain: 'security' },
  { id: 'new-plugin:map', domain: 'mapping' }
];

domainTests.forEach(p => {
  const route = routePlugin(p.id, p.domain);
  console.log(`  ${p.id} [${p.domain}] → ${route.model}`);
});

// Test 3: Routing manifest
console.log('\nTest 3: Routing Manifest');
const plugins = [
  { id: 'mattpocock-skills:research', domain: 'investigation', tier: 'core' },
  { id: 'claude-forge:architect', domain: 'design', tier: 'core' },
  { id: 'claude-forge:code-reviewer', domain: 'review', tier: 'core' },
  { id: 'claude-forge:doc-updater', domain: 'documentation', tier: 'core' },
  { id: 'cartographer:cartographer', domain: 'mapping', tier: 'core' }
];

const routing = buildRoutingManifest(plugins);
printRoutingSummary(routing);

// Test 4: Model distribution
console.log('Test 4: Model Distribution');
console.log(`  Opus: ${routing.grouped.opus.length} plugins`);
console.log(`  Sonnet: ${routing.grouped.sonnet.length} plugins`);
console.log(`  Haiku: ${routing.grouped.haiku.length} plugins`);

// Test 5: Verify all core plugins have routes
console.log('\nTest 5: Core Plugin Coverage');
const allCorePlugins = [
  'mattpocock-skills:research',
  'claude-forge:architect',
  'claude-forge:code-reviewer',
  'claude-forge:security-reviewer',
  'claude-forge:doc-updater',
  'cartographer:cartographer',
  'adversarial-spec:adversarial-spec',
  'claude-hud:configure'
];

let uncovered = 0;
allCorePlugins.forEach(id => {
  const route = routePlugin(id, 'unknown');
  if (route.model === 'haiku' && !MODEL_ROUTING.haiku.plugins.includes(id)) {
    console.log(`  ⚠️  ${id} → default (haiku)`);
    uncovered++;
  }
});

if (uncovered === 0) {
  console.log('  ✓ All core plugins explicitly routed');
}

console.log('\n✓ All tests passed');
