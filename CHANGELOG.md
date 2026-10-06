# Changelog

All notable changes to Meta-Orchestrator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-beta.1] - 2026-10-06

### Added

**Phase 3 Features**:
- MCP runtime integration with live plugin discovery via `.claude/mcp.json`
- 3-tier hybrid marketplace: Core (8 plugins) + Community (MCP) + Custom (user plugins)
- Terminal chain builder (`chain-builder.js`) for interactive chain composition
- Streaming layer feedback with `meta:layer-complete` events
- Model routing: automatic model selection per domain (Opus/Sonnet/Haiku)
- Retry engine with exponential backoff (configurable per-plugin)
- Persistence layer via optional `claude-mem` MCP (graceful fallback)

**Core Plugins**:
- `mattpocock-skills:research` — documentation + API pattern gathering
- `claude-forge:architect` — C4 models, ADRs, fitness functions
- `claude-forge:code-reviewer` — security + standards review
- `claude-forge:security-reviewer` — OWASP Top 10 + CWE analysis
- `claude-forge:doc-updater` — auto-sync docs from code
- `cartographer:cartographer` — parallel codebase mapping
- `adversarial-spec:adversarial-spec` — spec refinement via debate
- `claude-hud:configure` — real-time visibility

**Documentation**:
- Comprehensive README.md with installation methods
- CONTRIBUTING.md with development guidelines
- LICENSE (MIT)
- GitHub issue templates (bug report, feature request)
- 5 example chains in `examples/` directory
- MODEL_ROUTING.md explaining model selection algorithm

**Testing**:
- 11 test files covering all modules
- End-to-end integration tests
- Backward compatibility tests (Phase 2 → Phase 3)

### Changed
- Plugin discovery now supports 3-tier registry (was 1-tier in Phase 2)
- Chain composition uses topological sort for optimal parallelization
- Model routing replaces hardcoded model selection

### Fixed
- Test suite compatibility with new plugin registry format
- MCP health checks handle unavailable servers gracefully

### Backward Compatibility
✅ **Fully backward compatible** with Phase 2:
- Stateless mode (no YAML) works as in Phase 2
- YAML chain format unchanged
- All Phase 2 plugins preserved

## [Phase 2] - 2026-10-05

### Added
- YAML-based chain composition
- Persistent execution state via `claude-mem`
- Project generator plugin for zero-to-hero setup
- Retry engine with configurable backoff
- Chain parser with dependency validation

## [Phase 1 (Alpha)] - 2026-10-04

### Added
- Initial orchestrator implementation
- Stateless parallel execution
- Plugin discovery via keyword matching
- 6 core plugins

---

## Upgrade Guide

### From Phase 2 → Beta 1

No breaking changes. Simply pull and install:

```bash
cd ~/.claude/skills/meta-orchestrator
git pull origin main
npm install
```

**New features to try**:
1. Run `node mcp-integration.js` to see auto-discovered community plugins
2. Create custom plugins in `.claude/plugins/`
3. Use `node chain-builder.js` for interactive chain composition

### From Phase 1 (Alpha) → Beta 1

Your stateless invocations work unchanged:
```bash
node orchestrator.js "research auth patterns"
```

**To use new persistent mode**:
1. Create `.claude/chains/my-chain.yaml`
2. Run with chain name in task: `node orchestrator.js "my-chain workflow"`

---

[1.0.0-beta.1]: https://github.com/zahedrastgar/meta-orchestrator/releases/tag/v1.0.0-beta.1
