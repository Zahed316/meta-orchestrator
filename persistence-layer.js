/**
 * Persistence Layer — Claude-mem integration
 *
 * 4 collections: executions, history, index, custom-plugins
 * Graceful fallback when claude-mem unavailable
 */

const COLLECTIONS = {
  EXECUTIONS: 'meta-orchestrator:executions',
  HISTORY: 'meta-orchestrator:history',
  INDEX: 'meta-orchestrator:index',
  CUSTOM_PLUGINS: 'meta-orchestrator:custom-plugins'
};

class PersistenceLayer {
  constructor(claudeMemAvailable = true) {
    this.available = claudeMemAvailable;
    this.warned = false;
  }

  _warn(operation) {
    if (!this.warned) {
      console.warn(`⚠️  claude-mem unavailable, ${operation} skipped (stateless fallback)`);
      this.warned = true;
    }
  }

  async saveExecution(execution) {
    if (!this.available) {
      this._warn('execution state save');
      return null;
    }
    // ponytail: stub for now, claude-mem write goes here
    return execution.id;
  }

  async loadExecution(taskId) {
    if (!this.available) {
      this._warn('execution state load');
      return null;
    }
    // ponytail: stub, claude-mem read. Returning mock for testing.
    return {
      id: taskId,
      task: 'Mock Task',
      state: 'running',
      layers: [
        { index: 0, plugins: ['plugin-A'], status: 'pending', results: {} },
        { index: 1, plugins: ['plugin-B'], status: 'pending', results: {} }
      ]
    };
  }

  async appendHistory(record) {
    if (!this.available) {
      this._warn('history append');
      return null;
    }
    // ponytail: stub
    return record.id;
  }

  async updateIndex(updates) {
    if (!this.available) {
      this._warn('index update');
      return null;
    }
    // ponytail: atomic write to index collection
    return true;
  }

  async loadCustomPlugins() {
    if (!this.available) return [];
    // ponytail: read custom-plugins collection
    return [];
  }

  async addCustomPlugin(plugin) {
    if (!this.available) {
      this._warn('custom plugin registration');
      return null;
    }
    // ponytail: write to custom-plugins
    return plugin.id;
  }

  async recordPluginUsage(pluginId, success = true) {
    if (!this.available) {
      this._warn('usage tracking');
      return null;
    }
    // ponytail: write to claude-mem usage stats
    return true;
  }

  async recordLayerComplete(executionId, layerIndex, results) {
    if (!this.available) {
      this._warn('layer complete tracking');
      return null;
    }
    // ponytail: write layer results to claude-mem
    return true;
  }
}

module.exports = { PersistenceLayer, COLLECTIONS };
