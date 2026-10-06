/**
 * Model Router — domain-based model selection for meta-orchestrator
 *
 * Routes plugins to appropriate models:
 * - Opus 5.5: strategic thinking, architecture, research, planning
 * - Sonnet 5.5: review, validation, refactoring, quality analysis
 * - Haiku: pure implementation, documentation sync, mechanical tasks
 */

const MODEL_ROUTING = {
  // Opus 5.5 — strategic & architectural work requiring deep reasoning
  opus: {
    model: 'opus',
    domains: ['investigation', 'design', 'validation', 'scaffolding'],
    plugins: [
      'mattpocock-skills:research',
      'claude-forge:architect',
      'adversarial-spec:adversarial-spec',
      'mattpocock-skills:domain-modeling',
      'mattpocock-skills:grilling',
      'meta-orchestrator:project-generator'
    ],
    rationale: 'Deep reasoning for research, architecture design, spec validation, domain modeling'
  },

  // Sonnet 5.5 — analysis, review, validation
  sonnet: {
    model: 'sonnet',
    domains: ['review', 'security', 'quality'],
    plugins: [
      'claude-forge:code-reviewer',
      'claude-forge:security-reviewer',
      'claude-forge:adversarial-reviewer',
      'claude-forge:refactor-cleaner',
      'claude-forge:build-error-resolver'
    ],
    rationale: 'Balanced reasoning + speed for review, security analysis, quality checks'
  },

  // Haiku — mechanical execution, docs, mapping
  haiku: {
    model: 'haiku',
    domains: ['documentation', 'mapping', 'visibility', 'implementation'],
    plugins: [
      'claude-forge:doc-updater',
      'cartographer:cartographer',
      'claude-hud:configure',
      'claude-forge:tdd-guide',
      'claude-forge:verify-agent'
    ],
    rationale: 'Fast execution for docs sync, mapping, implementation with clear specs'
  }
};

/**
 * Route plugin to appropriate model
 */
function routePlugin(pluginId, domain) {
  // Direct plugin match
  for (const [modelKey, config] of Object.entries(MODEL_ROUTING)) {
    if (config.plugins.includes(pluginId)) {
      return { model: config.model, rationale: config.rationale };
    }
  }

  // Domain-based fallback
  for (const [modelKey, config] of Object.entries(MODEL_ROUTING)) {
    if (config.domains.includes(domain)) {
      return { model: config.model, rationale: config.rationale };
    }
  }

  // Default: Haiku for unknown plugins (community/custom tier)
  return {
    model: 'haiku',
    rationale: 'Default for unknown plugin — fast execution'
  };
}

/**
 * Build routing manifest for execution chain
 */
function buildRoutingManifest(plugins) {
  const manifest = plugins.map(plugin => ({
    id: plugin.id,
    domain: plugin.domain,
    tier: plugin.tier,
    ...routePlugin(plugin.id, plugin.domain)
  }));

  // Group by model for visibility
  const grouped = {
    opus: manifest.filter(p => p.model === 'opus'),
    sonnet: manifest.filter(p => p.model === 'sonnet'),
    haiku: manifest.filter(p => p.model === 'haiku')
  };

  return { manifest, grouped };
}

/**
 * Generate Agent tool invocations with model routing
 */
function generateAgentCalls(chain, routing) {
  const calls = [];

  for (const layer of chain) {
    const layerCalls = layer.map(pluginId => {
      const route = routing.manifest.find(r => r.id === pluginId);
      if (!route) {
        throw new Error(`No routing found for plugin: ${pluginId}`);
      }

      return {
        description: `${route.domain} via ${pluginId}`,
        prompt: `Execute ${pluginId} workflow`,
        model: route.model,
        subagent_type: 'general-purpose'
      };
    });

    calls.push(layerCalls);
  }

  return calls;
}

/**
 * Print routing summary
 */
function printRoutingSummary(routing) {
  console.log('\n📊 Model Routing:');

  for (const [model, plugins] of Object.entries(routing.grouped)) {
    if (plugins.length === 0) continue;
    console.log(`\n  ${model.toUpperCase()} (${plugins.length}):`,
      plugins.map(p => p.id).join(', '));
  }

  console.log('');
}

module.exports = {
  MODEL_ROUTING,
  routePlugin,
  buildRoutingManifest,
  generateAgentCalls,
  printRoutingSummary
};
