const { PluginRegistry } = require('./plugin-registry');
const fs = require('fs');

async function run() {
  console.log('Testing Plugin Registry (Discovery & Health Checks)');

  const registry = new PluginRegistry({
    coreRegistry: {
      core1: { id: 'core1', signals: ['core'] }
    },
    disableCommunity: false
  });

  // mock MCP server
  const mockMcp = [{
    id: 'mcp-test',
    name: 'test-mcp',
    metadata: {
      author: 'Tester',
      version: '2.0.0'
    }
  }];

  console.log('Simulating MCP discovery...');
  await registry.updateCommunityRegistry(mockMcp);

  const plugins = await registry.loadAllPlugins();
  console.log(`Found ${plugins.length} plugins.`);

  const hasCore = plugins.some(p => p.tier === 'core');
  const hasCommunity = plugins.some(p => p.tier === 'community');

  console.log(`Core plugins loaded: ${hasCore}`);
  console.log(`Community plugins loaded: ${hasCommunity}`);

  if (hasCore && hasCommunity) {
    console.log('✓ test-plugin-registry passed');
  } else {
    console.error('✗ test-plugin-registry failed');
    process.exit(1);
  }
}

run().catch(console.error);