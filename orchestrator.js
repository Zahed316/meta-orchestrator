#!/usr/bin/env node
/**
 * Meta-Orchestrator Engine
 *
 * Phase 2: Hybrid NL/YAML chain composition with persistence, retries, and project scaffolding
 * Backward compatible: YAML presence = persistent mode, no YAML = stateless alpha behavior
 */

const fs = require('fs');
const path = require('path');
const { PersistenceLayer } = require('./persistence-layer');
const { RetryEngine } = require('./retry-engine');
const { ChainParser } = require('./chain-parser');
const { ProjectGenerator } = require('./project-generator');
const { MCPIntegration } = require('./mcp-integration');
const { PluginRegistry } = require('./plugin-registry');
const { PluginInstaller } = require('./plugin-installer');
const { buildRoutingManifest, generateAgentCalls, printRoutingSummary } = require('./model-router');

const PLUGIN_REGISTRY = {
  research: {
    id: 'mattpocock-skills:research',
    domain: 'investigation',
    signals: ['research', 'investigate', 'explore', 'gather', 'document', 'api', 'pattern'],
    description: 'Documentation + API pattern gathering'
  },
  architect: {
    id: 'claude-forge:architect',
    domain: 'design',
    signals: ['design', 'architecture', 'model', 'adr', 'tech debt', 'dependency', 'c4'],
    description: 'C4 models, ADRs, fitness functions, tech debt scan'
  },
  code_reviewer: {
    id: 'claude-forge:code-reviewer',
    domain: 'review',
    signals: ['review', 'audit', 'quality', 'standards', 'correctness', 'simplification'],
    description: 'Security + standards review'
  },
  security_reviewer: {
    id: 'claude-forge:security-reviewer',
    domain: 'security',
    signals: ['security', 'vulnerability', 'owasp', 'threat', 'exploit', 'cwe'],
    description: 'OWASP Top 10 + CWE analysis'
  },
  doc_updater: {
    id: 'claude-forge:doc-updater',
    domain: 'documentation',
    signals: ['doc', 'document', 'readme', 'guide', 'update', 'sync'],
    description: 'Auto-sync docs from code changes'
  },
  cartographer: {
    id: 'cartographer:cartographer',
    domain: 'mapping',
    signals: ['map', 'explore', 'codebase', 'structure', 'overview', 'dependency'],
    description: 'Parallel subagent codebase mapping'
  },
  adversarial_spec: {
    id: 'adversarial-spec:adversarial-spec',
    domain: 'validation',
    signals: ['spec', 'validate', 'refine', 'debate', 'consensus', 'verify'],
    description: 'Spec refinement via model debate'
  },
  claude_hud: {
    id: 'claude-hud:configure',
    domain: 'visibility',
    signals: ['status', 'visibility', 'monitor', 'track', 'real-time'],
    description: 'Real-time visibility + status'
  },
  project_generator: {
    id: 'meta-orchestrator:project-generator',
    domain: 'scaffolding',
    signals: ['init', 'setup', 'bootstrap', 'new project', 'scaffold', 'zero to hero'],
    description: 'Zero-to-hero project setup: git init → codegraph index → MCP discovery → docs',
    retry: { maxAttempts: 1 },
    outputs: ['.git/HEAD', '.codegraph/index.db', '.claude/mcp.json', 'CLAUDE.md', 'README.md']
  }
};

/**
 * Discover plugins matching task signals
 */
function discoverPlugins(task, allPlugins) {
  const taskTokens = task.toLowerCase().split(/\s+/);

  const scored = allPlugins.map(plugin => {
    const matches = plugin.signals.filter(signal =>
      taskTokens.some(token => token.includes(signal) || signal.includes(token))
    );
    return { ...plugin, score: matches.length };
  });

  return scored
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(p => ({ id: p.id, domain: p.domain, description: p.description, tier: p.tier, ...p.retry && { retry: p.retry } }));
}

/**
 * Compose execution chain: YAML-based or parallel-first
 */
function composeChain(plugins, yamlPath = null, pluginRegistry = PLUGIN_REGISTRY) {
  if (plugins.length === 0) return [];

  // If YAML exists, parse dependency graph into layers
  if (yamlPath) {
    try {
      const layers = ChainParser.parseChain(yamlPath, pluginRegistry);
      if (layers && layers.length > 0) return layers;
    } catch (err) {
      console.error(`✗ Chain parsing failed: ${err.message}`);
      throw err;
    }
  }

  // Fallback: all parallel (alpha behavior)
  return [plugins.map(p => p.id)];
}

/**
 * Find chain file for task
 */
function findChainFile(task) {
  const chainsDir = path.join(process.cwd(), '.claude/chains');
  return ChainParser.findChainFile(task, chainsDir);
}

/**
 * Generate dispatch prompt for Agent tool
 */
function generateDispatchPrompt(chain, task) {
  if (!chain || chain.length === 0) return '';

  if (chain[0].length === 1 && chain.length === 1) {
    // Single plugin
    return `Executing single plugin:\n\n**Task**: ${task}`;
  }

  // Multiple plugins or layers
  const layerDescriptions = chain.map((layer, i) => {
    const plugins = Array.isArray(layer[0]) ? layer : [layer];
    return `Layer ${i + 1}: ${plugins.join(', ')}`;
  }).join('\n');

  return `Orchestrating workflow:\n\n**Task**: ${task}\n\n**Execution Plan**:\n${layerDescriptions}`;
}

/**
 * Main orchestration with persistence and retry support
 */
async function orchestrate(task, options = {}) {
  console.log('🎼 Meta-Orchestrator Phase 2\n');

  const persistence = new PersistenceLayer(options.claudeMemAvailable !== false);
  const retryEngine = new RetryEngine();

  // Discover current MCP servers
  let activeMcpServers = [];
  try {
    const mcpPath = path.join(process.cwd(), '.claude/mcp.json');
    if (fs.existsSync(mcpPath)) {
      const config = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
      if (Array.isArray(config.mcpServers)) {
        activeMcpServers = config.mcpServers.filter(s => s.enabled !== false).map(s => s.name);
      } else {
        activeMcpServers = Object.keys(config.mcpServers || {});
      }
    }
  } catch (err) {
    // Graceful degradation
  }

  // Load 3-tier registry
  const settingsPath = path.join(process.cwd(), '.claude/settings.json');
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch (e) {}
  }

  const registry = new PluginRegistry({
    coreRegistry: PLUGIN_REGISTRY,
    disableCommunity: settings.communityPluginsEnabled === false,
    customPluginPath: settings.customPluginPaths
  });

  const mcpIntegration = new MCPIntegration(process.cwd());
  const discoveredMcp = mcpIntegration.discover();
  await registry.updateCommunityRegistry(discoveredMcp);

  const allPlugins = await registry.loadAllPlugins();

  // Discover plugins (core + community + custom)
  const plugins = discoverPlugins(task, allPlugins);

  // Auto-install missing plugins
  const installer = new PluginInstaller();
  const missing = await installer.checkMissing(plugins);

  if (missing.length > 0) {
    const autoInstall = settings.metaOrchestrator?.autoInstallPlugins !== false;

    if (autoInstall) {
      console.log(`\n📦 Auto-installing ${missing.length} missing plugin(s)...`);
      await installer.installMissing(missing);
      console.log('✓ Plugins installed\n');
    } else {
      console.error(`\n✗ Missing plugins: ${missing.map(m => m.id).join(', ')}`);
      console.error('  Set metaOrchestrator.autoInstallPlugins: true in .claude/settings.json to auto-install\n');
      process.exit(1);
    }
  }

  const communityPlugins = plugins.filter(p => p.tier === 'community');
  if (communityPlugins.length > 0 && !settings.communityWarningShown) {
    console.warn('\n⚠️  WARNING: Using Community plugins. Anthropic doesn\'t verify safety.');
    console.warn('   Disable with --no-community-plugins flag during init.\n');
    settings.communityWarningShown = true;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  }

  console.log(`✓ ${plugins.length} plugin(s): ${plugins.map(p => p.id).join(', ')}\n`);

  // Build model routing manifest
  const routing = buildRoutingManifest(plugins);
  printRoutingSummary(routing);

  // Record usage
  for (const p of plugins) {
    await persistence.recordPluginUsage(p.id, true);
  }

  // Check for YAML chain
  const chainFile = findChainFile(task);
  const hasPersistentMode = !!chainFile;

  // Compose execution plan
  let chain;
  try {
    chain = composeChain(plugins, chainFile ? path.join(process.cwd(), '.claude/chains', chainFile) : null);
  } catch (err) {
    console.error(`✗ Chain composition failed: ${err.message}`);
    process.exit(1);
  }

  const prompt = generateDispatchPrompt(chain, task);

  // If stateless mode, return alpha behavior
  if (!hasPersistentMode) {
    console.log(prompt);
    return { plugins, chain, prompt, persistent: false, routing };
  }

  // Persistent mode: save execution state
  const executionId = require('crypto').randomUUID();

  const execution = {
    id: executionId,
    task,
    chain_file: chainFile,
    state: 'running',
    mcp_servers: activeMcpServers,
    layers: chain.map((layer, i) => ({
      index: i,
      plugins: layer,
      status: 'pending',
      results: {}
    })),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    retries: {}
  };

  await persistence.saveExecution(execution);
  console.log(`✓ Execution saved: ${executionId}\n`);

  console.log(prompt);
  return { plugins, chain, prompt, persistent: true, executionId, execution, routing };
}

/**
 * Resume a failed or paused execution
 */
async function resume(taskId) {
  const persistence = new PersistenceLayer();
  const execution = await persistence.loadExecution(taskId);

  if (!execution) {
    console.error(`✗ Execution not found: ${taskId}`);
    process.exit(1);
  }

  console.log(`📋 Resuming: ${execution.task}\n`);
  const failedLayer = execution.layers.find(l => l.status !== 'completed');
  if (!failedLayer) {
    console.log('✓ Already completed');
    return execution;
  }

  console.log(`▶️  Continuing from layer ${failedLayer.index + 1}...`);
  return execution;
}

/**
 * Run chain layers (simulate execution / event emitter)
 */
async function runChain(executionId) {
  const persistence = new PersistenceLayer();
  const execution = await persistence.loadExecution(executionId);
  if (!execution) {
    throw new Error(`Execution not found: ${executionId}`);
  }

  console.log(`▶️  Running chain for execution: ${executionId}`);

  for (const layer of execution.layers) {
    if (layer.status === 'completed') continue;

    console.log(`\n[Layer ${layer.index + 1}] Starting plugins: ${layer.plugins.join(', ')}`);
    layer.status = 'running';

    // Simulate layer execution
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mark complete
    layer.status = 'completed';
    layer.results = { status: 'success', timestamp: new Date().toISOString() };
    await persistence.recordLayerComplete(executionId, layer.index, layer.results);

    console.log(`meta:layer-complete ${executionId} layer=${layer.index}`);
  }

  execution.state = 'completed';
  execution.updated_at = new Date().toISOString();
  // We'd also save the execution here
  console.log(`\n✓ Execution completed: ${executionId}`);
}

/**
 * Get status of an execution
 */
async function getStatus(executionId) {
  const persistence = new PersistenceLayer();
  const execution = await persistence.loadExecution(executionId);
  if (!execution) {
    console.error(`✗ Execution not found: ${executionId}`);
    return;
  }

  console.log(`Status for Execution: ${execution.id}`);
  console.log(`Task: ${execution.task}`);
  console.log(`State: ${execution.state}`);
  console.log('Layers:');
  execution.layers.forEach(l => {
    console.log(`  - Layer ${l.index + 1}: [${l.plugins.join(', ')}] -> ${l.status}`);
  });
}

if (require.main === module) {
  const cmd = process.argv[2];
  if (!cmd) {
    console.error('Usage: orchestrator.js "<task>" | new-chain | status <id> | resume <id> | run <id> | mcp:refresh');
    process.exit(1);
  }

  if (cmd === 'new-chain') {
    require('child_process').spawnSync(process.argv[0], [path.join(__dirname, 'chain-builder.js')], { stdio: 'inherit' });
  } else if (cmd === 'status') {
    const executionId = process.argv[3];
    if (!executionId) {
      console.error('Usage: orchestrator.js status <id>');
      process.exit(1);
    }
    getStatus(executionId).catch(err => {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    });
  } else if (cmd === 'run') {
    runChain(process.argv[3]).catch(err => {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    });
  } else if (cmd === 'resume' && process.argv[3]) {
    resume(process.argv[3]).catch(err => {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    });
  } else if (cmd === 'mcp:refresh') {
    const { MCPIntegration } = require('./mcp-integration');
    const mcp = new MCPIntegration(process.cwd());
    mcp.refresh();
  } else {
    orchestrate(process.argv.slice(2).join(' '));
  }
}

module.exports = {
  orchestrate,
  resume,
  runChain,
  getStatus,
  discoverPlugins,
  composeChain,
  findChainFile,
  generateDispatchPrompt,
  PLUGIN_REGISTRY,
  PersistenceLayer,
  RetryEngine,
  ChainParser,
  ProjectGenerator
};
