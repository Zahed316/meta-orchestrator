const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MCP_REGISTRY = [
  { 
    id: 'obsidian-claude-code', 
    name: 'Obsidian vault',
    detect: (root) => fs.existsSync(path.join(root, '.obsidian')),
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-obsidian']
  },
  { 
    id: 'supabase-mcp', 
    name: 'Supabase project',
    detect: (root) => fs.existsSync(path.join(root, 'supabase')),
    command: 'npx',
    args: ['-y', '@supabase/mcp']
  },
  { 
    id: 'devtools-mcp', 
    name: 'Chrome DevTools',
    detect: (root) => fs.existsSync(path.join(root, '.devtools')),
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-chrome-devtools']
  },
  { 
    id: 'aws-mcp', 
    name: 'AWS MCP',
    detect: (root) => fs.existsSync(path.join(root, 'sam.yaml')) || fs.existsSync(path.join(root, 'cdk.json')),
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-aws']
  }
];

class MCPIntegration {
  constructor(projectRoot) {
    this.root = projectRoot;
    this.mcpConfigPath = path.join(this.root, '.claude', 'mcp.json');
  }

  discover() {
    console.log('🔍 Running live MCP discovery...');
    const discovered = [];

    for (const server of MCP_REGISTRY) {
      if (server.detect(this.root)) {
        const metadata = this.fetchPluginMetadata(server);
        discovered.push({ ...server, metadata });
      }
    }

    return discovered;
  }

  fetchPluginMetadata(server) {
    const defaultMeta = {
      name: server.name,
      version: '1.0.0',
      author: 'auto-discovered',
      stabilityTier: 'experimental',
      testPassRate: 'unknown'
    };

    // Simulate parsing plugin.json
    const pluginJsonPath = path.join(this.root, '.claude', 'plugins', server.id, 'plugin.json');
    if (fs.existsSync(pluginJsonPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
        return { ...defaultMeta, ...parsed };
      } catch (err) {}
    }

    return defaultMeta;
  }

  checkHealth(server) {
    try {
      const pkgName = server.args[1];
      if (pkgName) {
        execSync(`npm view ${pkgName} version`, { stdio: 'ignore' });
      }
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (err) {
      return { status: 'unhealthy', error: err.message, timestamp: new Date().toISOString() };
    }
  }

  generateConfig(discoveredServers) {
    const existing = fs.existsSync(this.mcpConfigPath) 
      ? JSON.parse(fs.readFileSync(this.mcpConfigPath, 'utf8')) 
      : { mcpServers: {} };

    const isArrayFormat = Array.isArray(existing.mcpServers);
    const configServers = existing.mcpServers || (isArrayFormat ? [] : {});
    
    discoveredServers.forEach(server => {
      const health = this.checkHealth(server);
      
      if (health.status === 'healthy') {
        if (isArrayFormat) {
          if (!configServers.some(s => s.name === server.id)) {
            configServers.push({
              name: server.id,
              enabled: true,
              command: server.command,
              args: server.args
            });
          }
        } else {
          configServers[server.id] = {
            command: server.command,
            args: server.args,
            env: server.env || {}
          };
        }
        console.log(`✓ MCP configured: ${server.name} (${server.id})`);
      } else {
        console.warn(`⚠️  MCP unhealthy/unavailable: ${server.name} (${server.id})`);
      }
    });

    return { mcpServers: configServers };
  }
  
  saveConfig(config) {
    const dir = path.dirname(this.mcpConfigPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.mcpConfigPath, JSON.stringify(config, null, 2));
    console.log('✓ mcp.json updated');
  }

  refresh() {
    console.log('🔄 Refreshing MCP Servers...');
    const discovered = this.discover();
    if (discovered.length === 0) {
      console.log('✓ MCP discovery (none found)');
      return [];
    }
    const config = this.generateConfig(discovered);
    this.saveConfig(config);
    return discovered;
  }
}

module.exports = { MCPIntegration, MCP_REGISTRY };
