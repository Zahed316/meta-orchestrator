# Meta-Orchestrator v1.0.0-beta.1 🎼

**First beta release** of Meta-Orchestrator — a Claude Code skill for parallel execution of specialized plugin workflows with MCP integration.

## 🎯 What's New in Phase 3

### MCP Runtime Integration
- **Live plugin discovery** via `.claude/mcp.json`
- **3-tier hybrid marketplace**: Core (8 plugins) + Community (MCP) + Custom (user plugins)
- **Graceful degradation** when MCP servers are unavailable

### Terminal Chain Builder
- Interactive chain composition via `node chain-builder.js`
- Visual preview of execution DAG
- YAML export for reusable workflows

### Streaming Layer Feedback
- Real-time `meta:layer-complete` events during execution
- Progress tracking for long-running orchestrations
- Integration with `claude-hud` for status line updates

### Model Routing
- **Automatic model selection** per domain (Opus/Sonnet/Haiku)
- Cost optimization based on task complexity
- Configurable routing rules via `MODEL_ROUTING.md`

### Retry Engine
- Exponential backoff (2×, 4×, 8×, 16×)
- Per-plugin retry configuration
- Automatic failure recovery

### Persistence Layer
- Optional `claude-mem` MCP integration for cross-session state
- Graceful fallback to stateless mode
- Execution history tracking

## 🔌 Core Plugins (8)

1. **mattpocock-skills:research** — Documentation + API pattern gathering
2. **claude-forge:architect** — C4 models, ADRs, fitness functions
3. **claude-forge:code-reviewer** — Security + standards review
4. **claude-forge:security-reviewer** — OWASP Top 10 + CWE analysis
5. **claude-forge:doc-updater** — Auto-sync docs from code
6. **cartographer:cartographer** — Parallel codebase mapping
7. **adversarial-spec:adversarial-spec** — Spec refinement via debate
8. **claude-hud:configure** — Real-time visibility

## 📦 Installation

### Quick Install (Recommended)
```bash
cd ~/.claude/skills/
git clone https://github.com/zahedrastgar/meta-orchestrator.git
cd meta-orchestrator
npm install
```

### Verify Installation
```bash
npm test  # All 11 test suites should pass
```

## 🚀 Quick Start

### Stateless Mode (Zero Config)
```bash
node orchestrator.js "research authentication patterns in Express.js"
```

### With Chain Composition
```bash
# Interactive builder
node chain-builder.js

# Or use pre-built examples
node orchestrator.js examples/auth-flow.yaml
```

## 📚 Documentation

- [README.md](README.md) — Full usage guide
- [CHANGELOG.md](CHANGELOG.md) — Version history
- [CONTRIBUTING.md](CONTRIBUTING.md) — Development guidelines
- [MODEL_ROUTING.md](MODEL_ROUTING.md) — Model selection algorithm
- [examples/](examples/) — 5 example chains

## ✅ Testing

- **11 test files**, 100% passing
- **E2E integration tests** for Phase 1→2→3 compatibility
- **Backward compatibility verified** with Phase 2

## 🔄 Upgrade Guide

### From Phase 2
```bash
cd ~/.claude/skills/meta-orchestrator
git pull origin main
npm install
```

**No breaking changes.** All Phase 2 YAML chains work unchanged.

### From Phase 1 (Alpha)
Your stateless invocations work unchanged. To use persistent mode:
1. Create `.claude/chains/my-chain.yaml`
2. Run with chain name: `node orchestrator.js "my-chain workflow"`

## 🐛 Known Issues

- MCP plugin discovery requires `.claude/mcp.json` to be present
- `codegraph` indexing may fail on first run (non-blocking)
- `claude-mem` unavailable warnings are expected (graceful fallback)

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Development setup
- PR guidelines
- Debugging tips
- Custom plugin authoring

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

**Full Changelog**: https://github.com/zahedrastgar/meta-orchestrator/blob/main/CHANGELOG.md
