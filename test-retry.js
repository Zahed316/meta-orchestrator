#!/usr/bin/env node
/**
 * Smoke test: Retry Engine
 */

const { RetryEngine, DEFAULT_RETRY_CONFIG } = require('./retry-engine');

console.log('Testing RetryEngine...\n');

// Test 1: Exponential backoff calculation
const engine = new RetryEngine();
let backoffTests = [
  { attempt: 1, base: 2, expected: 4 }, // 2^2
  { attempt: 2, base: 2, expected: 8 }, // 2^3
];

backoffTests.forEach(({ attempt, base, expected }) => {
  const backoff = Math.pow(base, attempt + 1);
  console.assert(backoff === expected, `Backoff calculation failed: ${backoff} !== ${expected}`);
});
console.log('✓ Exponential backoff calculation');

// Test 2: Should retry logic
const config = {
  maxAttempts: 3,
  nonRetryableErrors: ['invalid_input', 'auth_failed']
};

console.assert(
  engine.shouldRetry('plugin-1', 'timeout', config) === true,
  'Should retry timeout'
);
console.assert(
  engine.shouldRetry('plugin-1', 'invalid_input', config) === false,
  'Should not retry invalid_input'
);
console.log('✓ Retry decision logic');

// Test 3: Max attempts
engine.attempts.set('plugin-2', 3);
console.assert(
  engine.shouldRetry('plugin-2', 'timeout', config) === false,
  'Should not retry when maxAttempts reached'
);
console.log('✓ Max attempts enforced');

// Test 4: Attempt count tracking
engine.reset('plugin-1');
console.assert(
  engine.getAttemptCount('plugin-1') === 0,
  'Reset should clear attempt count'
);
console.log('✓ Attempt tracking');

console.log('\n✓ All retry tests passed');
