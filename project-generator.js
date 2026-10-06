/**
 * Project Generator — Git init + codegraph + MCP discovery + docs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { MCPIntegration } = require('./mcp-integration');

const DEFAULT_GITIGNORE = `node_modules/
.env
.env.local
*.log
.DS_Store
dist/
build/
.claude/memory/
`;

class ProjectGenerator {
  constructor(projectRoot, options = {}) {
    this.root = projectRoot;
    this.opts = {
      projectName: options.projectName || path.basename(projectRoot),
      language: options.language || 'auto',
      template: options.template || 'standard',
      mcpDiscovery: options.mcpDiscovery !== false,
      communityPluginsEnabled: options.communityPluginsEnabled !== false,
      customPluginPath: options.customPluginPath || ''
    };
  }

  async generate() {
    console.log('🏗️  Project Generator\n');
    const steps = [];

    steps.push(this._initGit());
    steps.push(this._createClaudeStructure());
    steps.push(this._generateSettings());
    steps.push(this._runCodegraph());
    if (this.opts.mcpDiscovery) steps.push(this._discoverMCP());
    if (this.opts.template !== 'minimal') {
      steps.push(this._generateClaudeMd());
      steps.push(this._generateReadme());
    }
    steps.push(this._commitInitial());

    return steps.filter(Boolean);
  }

  _initGit() {
    const gitDir = path.join(this.root, '.git');
    if (fs.existsSync(gitDir)) {
      console.log('✓ .git/ exists (skip init)');
      return null;
    }

    execSync('git init', { cwd: this.root, stdio: 'pipe' });
    const gitignorePath = path.join(this.root, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, DEFAULT_GITIGNORE);
    }
    console.log('✓ git init + .gitignore');
    return 'git';
  }

  _createClaudeStructure() {
    const claudeDir = path.join(this.root, '.claude');
    if (fs.existsSync(claudeDir)) {
      console.log('✓ .claude/ exists (skip mkdir)');
      return null;
    }

    fs.mkdirSync(claudeDir, { recursive: true });
    ['artifacts', 'chains', 'memory', 'plugins'].forEach(dir => {
      fs.mkdirSync(path.join(claudeDir, dir), { recursive: true });
    });
    console.log('✓ .claude/ structure');
    return 'claude-dirs';
  }

  _generateSettings() {
    const settingsPath = path.join(this.root, '.claude/settings.json');
    if (fs.existsSync(settingsPath)) {
      console.log('✓ settings.json exists (skip)');
      return null;
    }

    if (this.opts.communityPluginsEnabled) {
      console.warn('\n⚠️  WARNING: Community plugins enabled by default. Anthropic doesn\'t verify safety.');
    }

    const settings = {
      communityPluginsEnabled: this.opts.communityPluginsEnabled,
      customPluginPaths: this.opts.customPluginPath
    };

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log('✓ settings.json generated');
    return 'settings';
  }

  _runCodegraph() {
    const indexPath = path.join(this.root, '.codegraph/index.db');
    if (fs.existsSync(indexPath)) {
      console.log('✓ .codegraph/index.db exists (skip)');
      return null;
    }

    try {
      execSync('codegraph index .', { cwd: this.root, stdio: 'pipe' });
      console.log('✓ codegraph indexed');
      return 'codegraph';
    } catch (err) {
      console.warn('⚠️  codegraph indexing failed (skip)');
      return null;
    }
  }

  _discoverMCP() {
    const mcpIntegration = new MCPIntegration(this.root);
    const discovered = mcpIntegration.refresh();

    return discovered.length > 0 ? 'mcp' : null;
  }

  _generateClaudeMd() {
    const claudeMdPath = path.join(this.root, 'CLAUDE.md');
    if (fs.existsSync(claudeMdPath)) {
      console.log('✓ CLAUDE.md exists (skip)');
      return null;
    }

    const content = `# ${this.opts.projectName}

Project conventions for Claude Code.

## Tech Stack

- Language: ${this.opts.language}
- (Add your stack here)

## Key Directories

- \`.claude/chains/\` — Custom orchestration chains
- \`.claude/plugins/\` — User-defined plugins

## Testing

(Add test commands)

## Deployment

(Add deployment steps)
`;
    fs.writeFileSync(claudeMdPath, content);
    console.log('✓ CLAUDE.md generated');
    return 'claude-md';
  }

  _generateReadme() {
    const readmePath = path.join(this.root, 'README.md');
    if (fs.existsSync(readmePath)) {
      console.log('✓ README.md exists (skip)');
      return null;
    }

    const content = `# ${this.opts.projectName}

## Quick Start

\`\`\`bash
# Add setup commands
\`\`\`

## File Structure

(Auto-generated from codegraph)

## Tech Stack

- ${this.opts.language}
`;
    fs.writeFileSync(readmePath, content);
    console.log('✓ README.md generated');
    return 'readme';
  }

  _commitInitial() {
    try {
      execSync('git add .', { cwd: this.root, stdio: 'pipe' });
      execSync('git commit -m "init: project scaffold via meta-orchestrator"', { cwd: this.root, stdio: 'pipe' });
      console.log('✓ Initial commit');
      return 'commit';
    } catch (err) {
      console.warn('⚠️  git commit failed (skip)');
      return null;
    }
  }
}

module.exports = { ProjectGenerator };
