# Meta-Orchestrator

**Version**: 1.0.0-beta.1  
**Status**: Phase 3 Complete — MCP Runtime, Hybrid Marketplace, Terminal UI, Streaming Feedback

A Claude Code skill that transforms complex multi-step tasks into parallel execution chains across specialized plugins. Automatically discovers capabilities, composes workflows, and orchestrates subagents with real-time feedback.

## What It Does

Instead of manually invoking `/research`, `/architect`, `/code-review`, and `/doc-updater` in sequence, meta-orchestrator:
1. Parses your natural-language task
2. Discovers the right plugins (from 8 core + auto-discovered community plugins)
3. Builds a parallel execution graph
4. Runs subagents concurrently where possible
5. Aggregates results into a unified report

**Result**: Multi-hour workflows complete in minutes with full traceability.

## Phase 3 Features

- **MCP Runtime Integration** — Live plugin discovery from installed MCP servers
- **3-Tier Plugin Marketplace** — Core (8 plugins) + Community (MCP) + Custom (user plugins)
- **Auto-Provisioning** — Missing plugins auto-installed from git repos on first use
- **Auto-Updates** — Check and pull latest plugin versions from upstream
- **Terminal Chain Builder** — Interactive CLI to compose and save reusable chains
- **Streaming Feedback** — Real-time layer progress (`meta:layer-complete` events)
- **Model Routing** — Automatic model selection per domain (Opus 5.5 for research/design, Sonnet 5.5 for review, Haiku for docs)

## Installation

### Prerequisites

- **Node.js 18+** — `node --version`
- **Git** — Required for plugin auto-installation
- **npm** — Package manager (comes with Node.js)

### Method 1: Git Clone (Recommended)

```bash
cd ~/.claude/skills/
git clone https://github.com/zahedrastgar/meta-orchestrator.git
cd meta-orchestrator
npm install
node bootstrap.js  # Verify installation
```

Verify installation:
```bash
node orchestrator.js "research auth patterns"
```

### Method 2: Manual Copy

```bash
# Download release archive
wget https://github.com/zahedrastgar/meta-orchestrator/archive/refs/tags/v1.0.0-beta.1.zip
unzip v1.0.0-beta.1.zip
mv meta-orchestrator-1.0.0-beta.1 ~/.claude/skills/meta-orchestrator
cd ~/.claude/skills/meta-orchestrator
npm install --production
```

### Method 3: Development (Symlink)

```bash
# For contributors testing local changes
ln -s /path/to/dev/meta-orchestrator ~/.claude/skills/meta-orchestrator
cd ~/.claude/skills/meta-orchestrator
npm install
```

## Quick Start

### Stateless Mode (Alpha Behavior)

Just invoke with a natural-language task:

```bash
/meta research auth patterns and validate architecture
```

**Output**:
```
🎼 Meta-Orchestrator Phase 2

🔍 Running live MCP discovery...
✓ 3 plugin(s): research, architect, security-reviewer

📊 Model Routing:
  OPUS (2): research, architect
  SONNET (1): security-reviewer

Orchestrating workflow:
Layer 1: research, architect, security-reviewer
```

### Persistent Mode (YAML Chains)

Create a reusable chain in `.claude/chains/`:

```yaml
# .claude/chains/auth-flow.yaml
name: auth-flow
description: Research, design, and secure an auth system
layers:
  - [research]
  - [architect, security-reviewer]
  - [doc-updater]
```

Run it:
```bash
/meta auth flow for SaaS app
```

The orchestrator auto-detects `auth-flow.yaml` and executes the saved chain with full state persistence.

## Auto-Provisioning Plugins

Meta-orchestrator automatically installs missing plugins on first use. No manual setup required.

### Plugin Registry

Plugin sources defined in `plugin-sources.json`:

```json
{
  "mattpocock-skills": {
    "repo": "https://github.com/mattpocock/claude-skills.git",
    "branch": "main",
    "path": "../mattpocock-skills"
  },
  "claude-forge": {
    "repo": "https://github.com/anthropics/claude-forge.git",
    "branch": "main",
    "path": "../claude-forge"
  }
}
```

### First Run

```bash
/meta "research auth patterns"
```

If `mattpocock-skills:research` not found:
- Checks `.agents/skills/mattpocock-skills/`
- Auto-clones from github.com/mattpocock/claude-skills
- Installs to `.agents/skills/mattpocock-skills/`
- Proceeds with orchestration

### Configuration

Enable/disable auto-install in `.claude/settings.json`:

```json
{
  "metaOrchestrator": {
    "autoInstallPlugins": true,
    "autoUpdatePlugins": "weekly"
  }
}
```

- `autoInstallPlugins: true` — Install missing plugins without prompt (default)
- `autoUpdatePlugins: "weekly"` — Check upstream repos weekly, pull if updated

### Manual Install

Force install missing plugins:

```bash
cd .agents/skills/meta-orchestrator
node -e "const { PluginInstaller } = require('./plugin-installer'); new PluginInstaller().installMissing([{id:'mattpocock-skills:research', namespace:'mattpocock-skills', source: {...}}])"
```

Check for updates:

```bash
node -e "const { PluginInstaller } = require('./plugin-installer'); new PluginInstaller().updateAll()"
```

### Interactive Chain Builder

```bash
cd ~/.claude/skills/meta-orchestrator
node chain-builder.js
```

Follow the prompts to compose a custom chain. Saved chains appear in `.claude/chains/`.

## Examples

### 1. Research + Validation

**Task**: "Research OAuth 2.0 best practices and validate against OWASP"

**Auto-composed chain**:
```
Layer 1: mattpocock-skills:research
Layer 2: claude-forge:architect, claude-forge:security-reviewer
```

**Output**: Research report + architecture validation + security audit

### 2. Full Development Lifecycle

**Task**: "Design, implement, test, and document a payment service"

**YAML chain** (`examples/full-lifecycle.yaml`):
```yaml
name: full-lifecycle
layers:
  - [research]
  - [architect]
  - [tdd-guide]
  - [code-reviewer, security-reviewer]
  - [doc-updater]
```

### 3. Security Audit

**Task**: "Audit authentication code for vulnerabilities"

**YAML chain** (`examples/security-audit.yaml`):
```yaml
name: security-audit
layers:
  - [code-reviewer, security-reviewer]
  - [doc-updater]
```

**See `examples/` directory for more**.

## Plugin Registry

### Core Tier (8 Plugins)

| Plugin | Domain | Trigger Signals |
|--------|--------|----------------|
| `mattpocock-skills:research` | Investigation | research, investigate, gather |
| `claude-forge:architect` | Design | architecture, adr, c4, design |
| `claude-forge:code-reviewer` | Review | review, audit, quality |
| `claude-forge:security-reviewer` | Security | security, owasp, vulnerability |
| `claude-forge:doc-updater` | Documentation | doc, readme, update |
| `cartographer:cartographer` | Mapping | map, codebase, structure |
| `adversarial-spec:adversarial-spec` | Validation | spec, validate, refine |
| `claude-hud:configure` | Visibility | status, monitor, real-time |

### Community Tier (Auto-Discovered)

Plugins from installed MCP servers (e.g., `obsidian-claude-code`, `supabase-mcp`). Discovered at runtime via `.claude/mcp.json`.

### Custom Tier (User Plugins)

Place custom plugins in `.claude/plugins/` — auto-loaded if they export the required interface.

## How It Works

```
[Natural Language Task]
        ↓
[Plugin Discovery] ← 3-tier registry (core + community + custom)
        ↓
[Chain Composition] ← Topological sort (parallel where possible)
        ↓
[Model Routing] ← Opus for strategic, Sonnet for review, Haiku for docs
        ↓
[Subagent Dispatch] ← Parallel execution via Claude Agent SDK
        ↓
[Result Aggregation] ← Unified report
```

**Key innovation**: The orchestrator IS the meta-planner. It doesn't just parallelize — it discovers, composes, and adapts based on installed plugins.

## Configuration

### Disable Community Plugins

Edit `.claude/settings.json`:
```json
{
  "communityPluginsEnabled": false
}
```

Or pass flag during project init:
```bash
node orchestrator.js "init project" --no-community-plugins
```

### Custom Plugin Paths

```json
{
  "customPluginPaths": [
    "/path/to/my/plugins",
    "./local-plugins"
  ]
}
```

### Retry Configuration

Per-plugin retry settings in `orchestrator.js`:
```javascript
{
  id: 'my-plugin',
  retry: {
    maxAttempts: 3,
    backoffMs: 2000
  }
}
```

## Troubleshooting

### "No plugins discovered"

- Check plugin signals match task keywords
- Verify `.claude/mcp.json` lists MCP servers
- Run `node mcp-integration.js` to test discovery

### "Chain composition failed"

- YAML syntax error — validate with `node chain-parser.js <chain-file>`
- Circular dependency — check layer definitions

### "claude-mem unavailable"

- Persistent mode disabled, falls back to stateless (alpha behavior)
- Optional: Install `claude-mem` MCP for execution state tracking

### Tests Failing

```bash
# Run all tests
for test in test-*.js; do node "$test"; done

# Run specific test
node test-orchestrator.js
```

## Upgrading

From Phase 2 (or earlier):

```bash
cd ~/.claude/skills/meta-orchestrator
git fetch --tags
git checkout v1.0.0-beta.1
npm install
```

**Breaking changes**: None — Phase 3 is backward compatible.

## Roadmap

**1.1.0** (4-6 weeks)
- YAML chain templates library
- Retry state recovery across sessions
- Performance optimizations

**1.2.0** (3 months)
- Web UI for chain visualization
- Remote plugin execution (distributed mode)
- Chain analytics dashboard

**2.0.0** (6-12 months)
- Plugin interface v2 (streaming support)
- Chain format v2 (conditional execution, loops)
- Standalone service mode (HTTP API)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Quick start for contributors**:
1. Fork this repo
2. Create feature branch: `git checkout -b feature/my-feature`
3. Run tests: `for test in test-*.js; do node "$test"; done`
4. Submit PR with clear description

## Documentation

- [SKILL.md](SKILL.md) — Usage guide and trigger conditions
- [Architecture.md](Architecture.md) — System design and module responsibilities
- [MODEL_ROUTING.md](MODEL_ROUTING.md) — Model selection algorithm

## License

MIT — See [LICENSE](LICENSE) file.

## Support

- **Issues**: [GitHub Issues](https://github.com/zahedrastgar/meta-orchestrator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/zahedrastgar/meta-orchestrator/discussions)
- **Discord**: Claude Code community (if exists)

---

**Status**: Beta 1 — Early adopters welcome. Report bugs via GitHub Issues.
