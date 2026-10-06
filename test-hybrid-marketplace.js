const { orchestrate } = require('./orchestrator');
const fs = require('fs');

async function run() {
  console.log('Testing Hybrid Marketplace (3-tier integration)');

  // Create mock settings to ensure community is enabled
  fs.mkdirSync('.claude', { recursive: true });
  fs.writeFileSync('.claude/settings.json', JSON.stringify({
    communityPluginsEnabled: true
  }));

  // mock mcp.json
  fs.writeFileSync('.claude/mcp.json', JSON.stringify({
    mcpServers: {
      "mock-mcp": {
        command: "npx",
        args: ["-y", "mock"]
      }
    }
  }));

  const res = await orchestrate('research and use mock-mcp', { claudeMemAvailable: false });
  console.log('Orchestrated plugins:', res.plugins.map(p => `${p.id} (${p.tier})`));

  const hasCore = res.plugins.some(p => p.tier === 'core');
  const hasCommunity = res.plugins.some(p => p.tier === 'community');

  if (hasCore && hasCommunity) {
    console.log('✓ test-hybrid-marketplace passed');
  } else {
    console.error('✗ test-hybrid-marketplace failed');
    process.exit(1);
  }
}

run().catch(console.error);