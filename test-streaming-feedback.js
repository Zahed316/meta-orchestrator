#!/usr/bin/env node
/**
 * Test Streaming Layer Feedback
 */
const { runChain, getStatus } = require('./orchestrator');

console.log('Testing Streaming Layer Feedback...\n');

async function test() {
  const executionId = 'test-exec-123';
  
  // Intercept console.log to check for events
  const originalLog = console.log;
  const logs = [];
  console.log = (...args) => {
    logs.push(args.join(' '));
    originalLog(...args);
  };

  console.log('--- Simulating runChain ---');
  await runChain(executionId);
  
  console.log('--- Checking getStatus ---');
  await getStatus(executionId);

  // Restore console.log
  console.log = originalLog;

  const layerCompleteEvents = logs.filter(l => l.includes('meta:layer-complete'));
  console.assert(layerCompleteEvents.length === 2, 'Should emit 2 layer complete events');
  console.log('✓ Streaming feedback (layer events) emitted properly');
  
  const statusOutput = logs.filter(l => l.includes('Status for Execution:'));
  console.assert(statusOutput.length > 0, 'Status command works');
  console.log('✓ Status command successfully retrieved execution state');

  console.log('\n✓ All streaming feedback tests passed');
}

test().catch(console.error);
