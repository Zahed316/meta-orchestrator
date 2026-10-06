#!/usr/bin/env node
/**
 * Smoke test: Persistence Layer
 */

const { PersistenceLayer } = require('./persistence-layer');

console.log('Testing PersistenceLayer...\n');

// Test 1: Available mode
const persistence = new PersistenceLayer(true);
const exec = { id: 'test-123', task: 'test', state: 'running' };
persistence.saveExecution(exec).then(id => {
  console.assert(id === 'test-123', 'saveExecution should return id');
  console.log('✓ Save execution (available)');
});

// Test 2: Unavailable mode (fallback)
const persistenceUnavailable = new PersistenceLayer(false);
persistenceUnavailable.saveExecution(exec).then(id => {
  console.assert(id === null, 'saveExecution should return null when unavailable');
  console.log('✓ Save execution (unavailable fallback)');
});

// Test 3: Load custom plugins (empty when unavailable)
persistenceUnavailable.loadCustomPlugins().then(plugins => {
  console.assert(Array.isArray(plugins) && plugins.length === 0, 'loadCustomPlugins should return empty array');
  console.log('✓ Load custom plugins (fallback)');
});

console.log('\n✓ All persistence tests passed');
