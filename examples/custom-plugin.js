/**
 * Custom Plugin Template for Meta-Orchestrator
 *
 * Place in ~/.claude/plugins/ and meta-orchestrator will auto-discover it.
 *
 * Export an object with:
 * - id: namespace:plugin-name
 * - domain: category for model routing
 * - signals: keywords that trigger this plugin
 * - execute: async function(context) that runs the plugin
 */

module.exports = {
  id: 'custom:my-plugin',
  domain: 'category', // research, design, review, security, documentation, mapping, validation, visibility, etc.
  signals: ['keyword1', 'keyword2', 'keyword3'],
  description: 'One-line description of what your plugin does',
  tier: 'custom',

  /**
   * Execute the plugin
   * @param {Object} context - Execution context from meta-orchestrator
   * @param {string} context.task - The natural-language task
   * @param {Array} context.previousResults - Results from earlier layers
   * @param {string} context.executionId - Unique ID for this run
   * @returns {Promise<Object>} { success, output, error? }
   */
  async execute(context) {
    console.log(`[${this.id}] Executing for task: ${context.task}`);

    try {
      // Your plugin logic here
      const result = await doWork(context);

      return {
        success: true,
        output: result,
        pluginId: this.id
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        pluginId: this.id
      };
    }
  }
};

/**
 * Implement your plugin logic
 */
async function doWork(context) {
  // Example: Call an external API, process files, etc.
  return {
    analysis: 'Your analysis here',
    summary: 'Key findings',
    metadata: {
      executionTime: Date.now(),
      version: '1.0.0'
    }
  };
}
