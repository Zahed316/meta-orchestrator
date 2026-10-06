# Contributing to Meta-Orchestrator

Thank you for your interest in contributing! This document outlines the process and guidelines.

## Development Setup

```bash
git clone https://github.com/zahedrastgar/meta-orchestrator.git
cd meta-orchestrator
npm install
```

## Running Tests

```bash
# Run all tests
for test in test-*.js; do node "$test"; done

# Run specific test
node test-orchestrator.js
```

**All tests must pass before submitting a PR.**

## Code Style

- **No external dependencies** beyond `chalk` and `inquirer` (already included)
- **Functional, minimal code** — prefer stdlib, avoid abstractions
- **Comments for complex logic** — topological sort, retry backoff, MCP discovery
- **Variable names** — descriptive, avoid abbreviations (e.g., `allPlugins` not `ap`)

## Adding a Plugin

1. Register in `orchestrator.js` `PLUGIN_REGISTRY`:
```javascript
{
  my_plugin: {
    id: 'namespace:my-plugin',
    domain: 'category',
    signals: ['keyword1', 'keyword2'],
    description: 'One-liner'
  }
}
```

2. Test discovery:
```bash
node orchestrator.js "task with keyword1"
```

3. Add test case in `test-orchestrator.js`:
```javascript
const plugins = discoverPlugins('task with keyword1', allPlugins);
console.assert(plugins.some(p => p.id === 'namespace:my-plugin'));
```

4. Update `SKILL.md` plugin registry table.

## Adding a Chain Template

1. Create `examples/my-chain.yaml`:
```yaml
name: my-chain
description: What this chain does
layers:
  - [plugin1, plugin2]  # Parallel execution
  - [plugin3]           # Sequential
```

2. Test composition:
```bash
node chain-parser.js examples/my-chain.yaml
```

3. Document in `README.md` examples section.

## PR Guidelines

### Title
- Format: `feat|fix|docs: <description>`
- Examples:
  - `feat: add YAML template support`
  - `fix: handle MCP discovery timeout`
  - `docs: update installation steps`

### Description
Include:
1. **What changed** — 1-2 sentences
2. **Why** — problem solved or feature enabled
3. **Testing** — how you verified the change
4. **Backward compatibility** — breaking changes if any

### Example PR

```
feat: Add retry backoff for failed plugins

Previously, failed plugins would immediately fail the chain. Now uses
exponential backoff (2s → 4s → 8s) with configurable max attempts.

Testing:
- test-retry.js passes (new exponential backoff tests)
- test-orchestrator.js passes (existing plugin discovery)
- Manual: orchestrate('research', {retry: {maxAttempts: 3}})

Backward compatible: Default maxAttempts = 1 (no retries unless configured)
```

## Debugging

### Enable verbose logging

Edit orchestrator.js:
```javascript
const DEBUG = process.env.DEBUG === '1';
if (DEBUG) console.log('[DEBUG]', ...);
```

Then run:
```bash
DEBUG=1 node orchestrator.js "task"
```

### Check MCP discovery

```bash
node mcp-integration.js
```

Output shows detected servers, health checks, and discovered plugins.

### Trace chain composition

```bash
node -e "
const { ChainParser } = require('./chain-parser');
const chain = ChainParser.parse([
  { id: 'plugin-a' },
  { id: 'plugin-b' },
  { id: 'plugin-c' }
], null);
console.log(JSON.stringify(chain, null, 2));
"
```

## Performance Expectations

- Plugin discovery: <500ms
- Chain composition: <100ms
- Subagent dispatch: depends on plugin (typically 1-5 min)

If slower, file an issue with profile data.

## Documentation

Every code change should update relevant docs:

- **New plugin**: Update `SKILL.md` registry table + `README.md`
- **New feature**: Update `SKILL.md` features section + `Architecture.md`
- **Bug fix**: Update `examples/` if fix changes behavior

## Release Process

Maintainers only:

```bash
# Tag release
git tag v1.0.1 -m "Bug fix: handle nil plugins"
git push origin v1.0.1

# Create GitHub release draft
gh release create v1.0.1 --draft

# Edit release notes in browser
# Publish when ready
gh release edit v1.0.1 --draft=false
```

## Support

- **Questions?** Open a GitHub Discussion
- **Found a bug?** File an Issue with reproduction steps
- **Have an idea?** Start a Discussion first to gauge interest

---

**Code of Conduct**: Be respectful. We welcome all contributors regardless of experience level.
