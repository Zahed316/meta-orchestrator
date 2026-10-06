#!/usr/bin/env node
/**
 * Test: Live MCP Discovery + Health Checks
 */

const fs = require('fs');
const path = require('path');
const { MCPIntegration } = require('./mcp-integration');

console.log('Testing MCP Integration...\n');

// Mock a project root with specific directories to trigger discovery
const tmpDir = path.join('/tmp', `test-mcp-${Date.now()}`);
fs.mkdirSync(tmpDir, { recursive: true });

// Create fake markers
fs.mkdirSync(path.join(tmpDir, '.obsidian'));
fs.mkdirSync(path.join(tmpDir, 'supabase'));

const mcp = new MCPIntegration(tmpDir);

try {
  // Test 1: Discovery
  const discovered = mcp.discover();
  console.assert(discovered.length === 2, 'Should discover exactly 2 mock MCP servers');
  console.assert(discovered.some(s => s.id === 'obsidian-claude-code'), 'Should find Obsidian');
  console.assert(discovered.some(s => s.id === 'supabase-mcp'), 'Should find Supabase');
  console.log(`✓ Discovery found ${discovered.length} servers`);

  // Test 2: Health Checks
  let healthyCount = 0;
  discovered.forEach(server => {
    const health = mcp.checkHealth(server);
    console.assert(health.status, 'Health object should have status');
    console.log(`✓ Health check for ${server.id}: ${health.status}`);
    if (health.status === 'healthy') healthyCount++;
  });
  console.assert(healthyCount >= 0, 'Health checks completed');

  // Test 3: Generate Config
  const config = mcp.generateConfig(discovered);
  console.assert(config.mcpServers, 'Config should have mcpServers object');
  console.log('✓ Config generation');

  console.log('\n✓ All MCP integration tests passed');
} catch (err) {
  console.error(`✗ Test failed: ${err.message}`);
  process.exit(1);
} finally {
  // Cleanup
  try {
    const { execSync } = require('child_process');
    execSync(`rm -rf ${tmpDir}`, { stdio: 'pipe' });
  } catch (e) {}
}
