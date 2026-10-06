/**
 * Plugin Installer — Auto-provision missing plugins
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PluginInstaller {
  constructor(sourcesPath = null) {
    this.sourcesPath = sourcesPath || path.join(__dirname, 'plugin-sources.json');
    this.sources = this.loadSources();
  }

  loadSources() {
    if (!fs.existsSync(this.sourcesPath)) {
      console.warn('⚠️  No plugin-sources.json found');
      return {};
    }
    try {
      return JSON.parse(fs.readFileSync(this.sourcesPath, 'utf8'));
    } catch (e) {
      console.error(`✗ Failed to parse plugin-sources.json: ${e.message}`);
      return {};
    }
  }

  async checkMissing(plugins) {
    const missing = [];

    for (const plugin of plugins) {
      const [namespace] = plugin.id.split(':');
      const source = this.sources[namespace];

      if (!source) {
        console.warn(`⚠️  No source configured for ${namespace}`);
        continue;
      }

      const targetPath = source.path || path.join(process.cwd(), '.agents/skills', namespace);

      if (!fs.existsSync(targetPath)) {
        missing.push({ ...plugin, namespace, source, targetPath });
      }
    }

    return missing;
  }

  async installPlugin(pluginInfo) {
    const { namespace, source, targetPath } = pluginInfo;

    console.log(`📦 Installing ${namespace}...`);

    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    try {
      const branch = source.branch || 'main';
      execSync(
        `git clone --depth 1 --branch ${branch} ${source.repo} ${targetPath}`,
        { stdio: 'inherit' }
      );
      console.log(`✓ ${namespace} installed`);
      return true;
    } catch (err) {
      console.error(`✗ Failed to install ${namespace}: ${err.message}`);
      return false;
    }
  }

  async installMissing(missing) {
    const results = [];

    for (const plugin of missing) {
      const success = await this.installPlugin(plugin);
      results.push({ id: plugin.id, success });
    }

    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      throw new Error(`Failed to install: ${failed.map(f => f.id).join(', ')}`);
    }

    return results;
  }

  async updatePlugin(namespace) {
    const source = this.sources[namespace];
    if (!source) {
      console.warn(`⚠️  No source configured for ${namespace}`);
      return false;
    }

    const targetPath = source.path || path.join(process.cwd(), '.agents/skills', namespace);

    if (!fs.existsSync(path.join(targetPath, '.git'))) {
      console.warn(`⚠️  ${namespace} not a git repo, skipping update`);
      return false;
    }

    try {
      console.log(`🔄 Updating ${namespace}...`);

      const localHash = execSync('git rev-parse HEAD', { cwd: targetPath }).toString().trim();
      execSync('git fetch origin', { cwd: targetPath, stdio: 'pipe' });
      const branch = source.branch || 'main';
      const remoteHash = execSync(`git rev-parse origin/${branch}`, { cwd: targetPath }).toString().trim();

      if (localHash === remoteHash) {
        console.log(`✓ ${namespace} up to date`);
        return false;
      }

      execSync(`git pull origin ${branch}`, { cwd: targetPath, stdio: 'inherit' });
      console.log(`✓ ${namespace} updated`);
      return true;
    } catch (err) {
      console.error(`✗ Failed to update ${namespace}: ${err.message}`);
      return false;
    }
  }

  async updateAll() {
    const namespaces = Object.keys(this.sources);
    const results = [];

    for (const namespace of namespaces) {
      const updated = await this.updatePlugin(namespace);
      if (updated) results.push(namespace);
    }

    return results;
  }
}

module.exports = { PluginInstaller };
