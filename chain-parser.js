/**
 * Chain Parser — Dependency graph parser + resume logic
 * ponytail: defer full YAML parsing to phase 3, use simple JSON for now
 */

const fs = require('fs');
const path = require('path');

class CircularDependencyError extends Error {
  constructor(cycle) {
    super(`Circular dependency detected: ${cycle.join(' → ')}`);
    this.name = 'CircularDependencyError';
    this.cycle = cycle;
  }
}

class MissingPluginError extends Error {
  constructor(pluginId, available) {
    super(`Plugin not found: ${pluginId}. Available: ${available.join(', ')}`);
    this.name = 'MissingPluginError';
    this.pluginId = pluginId;
  }
}

class ChainParser {
  /**
   * Parse chain definition (stub for JSON structure)
   * Returns: [layer0, layer1, ...] where each layer is array of plugin IDs
   */
  static parseChain(jsonPath, pluginRegistry) {
    if (!fs.existsSync(jsonPath)) return null;

    const content = fs.readFileSync(jsonPath, 'utf8');
    let chain;
    try {
      chain = JSON.parse(content);
    } catch (err) {
      throw new Error(`Invalid chain JSON: ${err.message}`);
    }

    const tasks = chain.tasks || [];
    const availableIds = Object.keys(pluginRegistry);

    if (tasks.length === 0) return [];

    // Validate all plugins exist
    for (const task of tasks) {
      if (!availableIds.includes(task)) {
        throw new MissingPluginError(task, availableIds);
      }
    }

    // Detect cycles
    this._detectCycles(tasks, chain.dependencies || {});

    // Build layers from dependency graph
    return this._topologicalSort(tasks, chain.dependencies || {});
  }

  /**
   * Detect circular dependencies using DFS
   */
  static _detectCycles(tasks, dependencies) {
    const visited = new Set();
    const recursionStack = new Set();
    const path = [];

    const visit = (node) => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const deps = dependencies[node] || [];
      for (const dep of deps) {
        if (!visited.has(dep)) {
          visit(dep);
        } else if (recursionStack.has(dep)) {
          const cycleStart = path.indexOf(dep);
          const cycle = path.slice(cycleStart).concat([dep]);
          throw new CircularDependencyError(cycle);
        }
      }

      path.pop();
      recursionStack.delete(node);
    };

    for (const task of tasks) {
      if (!visited.has(task)) {
        visit(task);
      }
    }
  }

  /**
   * Topological sort: group tasks into layers (all parallel within layer, sequential across)
   */
  static _topologicalSort(tasks, dependencies) {
    const inDegree = new Map();
    const adjList = new Map();

    tasks.forEach(t => {
      inDegree.set(t, 0);
      adjList.set(t, []);
    });

    tasks.forEach(t => {
      const deps = dependencies[t] || [];
      deps.forEach(dep => {
        adjList.get(dep).push(t);
        inDegree.set(t, (inDegree.get(t) || 0) + 1);
      });
    });

    const layers = [];
    const queue = tasks.filter(t => inDegree.get(t) === 0);

    while (queue.length > 0) {
      const layer = [...queue];
      layers.push(layer);
      const nextQueue = [];

      layer.forEach(task => {
        adjList.get(task).forEach(dependent => {
          inDegree.set(dependent, inDegree.get(dependent) - 1);
          if (inDegree.get(dependent) === 0) {
            nextQueue.push(dependent);
          }
        });
      });

      queue.splice(0, queue.length, ...nextQueue);
    }

    return layers;
  }

  /**
   * Find chain file for task (glob by pattern or exact match)
   */
  static findChainFile(task, chainsDir) {
    if (!fs.existsSync(chainsDir)) return null;

    const files = fs.readdirSync(chainsDir).filter(f => f.endsWith('.json') || f.endsWith('.yml') || f.endsWith('.yaml'));
    // ponytail: simple prefix match, upgrade to fuzzy if needed later
    return files.find(f => task.includes(f.replace(/\.(json|yml|yaml)$/, '')));
  }
}

module.exports = { ChainParser, CircularDependencyError, MissingPluginError };
