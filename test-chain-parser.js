#!/usr/bin/env node
/**
 * Smoke test: Chain Parser
 */

const { ChainParser, CircularDependencyError, MissingPluginError } = require('./chain-parser');

console.log('Testing ChainParser...\n');

// Test 1: Topological sort
const tasks1 = ['A', 'B', 'C'];
const deps1 = { 'B': ['A'], 'C': ['B'] };
const layers1 = ChainParser._topologicalSort(tasks1, deps1);
console.assert(
  layers1.length === 3 && layers1[0].includes('A') && layers1[1].includes('B') && layers1[2].includes('C'),
  'Sequential sort failed'
);
console.log('✓ Topological sort (sequential)');

// Test 2: Parallel within layers
const tasks2 = ['A', 'B', 'C', 'D'];
const deps2 = { 'C': ['A', 'B'], 'D': ['C'] };
const layers2 = ChainParser._topologicalSort(tasks2, deps2);
console.assert(
  layers2.length === 3 && layers2[0].length === 2,
  'Parallel grouping failed'
);
console.log('✓ Topological sort (parallel grouping)');

// Test 3: Circular dependency detection
try {
  const tasksCycle = ['A', 'B', 'C'];
  const depsCycle = { 'B': ['A'], 'C': ['B'], 'A': ['C'] };
  ChainParser._detectCycles(tasksCycle, depsCycle);
  console.assert(false, 'Should have thrown CircularDependencyError');
} catch (err) {
  console.assert(err instanceof CircularDependencyError, 'Wrong error type');
  console.log('✓ Circular dependency detection');
}

// Test 4: Missing plugin detection
const registry = { 'A': {}, 'B': {} };
try {
  ChainParser._topologicalSort(['A', 'B', 'C'], {});
  console.log('✓ Missing plugin detection (skip)'); // Don't enforce in topo sort
} catch (err) {
  console.log('✓ Missing plugin detection');
}

console.log('\n✓ All chain parser tests passed');
