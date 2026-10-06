# Model Routing Strategy

**Last updated**: 2026-10-06

Model selection for meta-orchestrator plugin execution based on task complexity and domain.

## Routing Rules

### Opus 5.5 — Strategic & Architectural
**Domains**: investigation, design, validation, scaffolding

**Plugins**:
- `mattpocock-skills:research` — documentation + API pattern gathering
- `claude-forge:architect` — C4 models, ADRs, fitness functions
- `adversarial-spec:adversarial-spec` — spec refinement via debate
- `mattpocock-skills:domain-modeling` — domain model design
- `mattpocock-skills:grilling` — stress-test thinking
- `meta-orchestrator:project-generator` — zero-to-hero setup

**Rationale**: Deep reasoning required for research, architecture design, spec validation, domain modeling.

### Sonnet 5.5 — Analysis & Review
**Domains**: review, security, quality

**Plugins**:
- `claude-forge:code-reviewer` — security + standards review
- `claude-forge:security-reviewer` — OWASP Top 10 + CWE analysis
- `claude-forge:adversarial-reviewer` — independent verification
- `claude-forge:refactor-cleaner` — dead code removal
- `claude-forge:build-error-resolver` — build fix with minimal changes

**Rationale**: Balanced reasoning + speed for review, security analysis, quality checks.

### Haiku — Mechanical Execution
**Domains**: documentation, mapping, visibility, implementation

**Plugins**:
- `claude-forge:doc-updater` — auto-sync docs from code
- `cartographer:cartographer` — parallel codebase mapping
- `claude-hud:configure` — real-time visibility setup
- `claude-forge:tdd-guide` — test-driven implementation
- `claude-forge:verify-agent` — post-impl verification

**Rationale**: Fast execution for docs sync, mapping, implementation with clear specs.

## Fallback Rules

1. **Direct match**: Plugin explicitly listed → use assigned model
2. **Domain match**: Plugin domain matches tier → use tier's model
3. **Default**: Unknown plugin/domain → Haiku (safe, fast)

## Implementation

Model routing in `model-router.js`:
- `routePlugin(pluginId, domain)` — returns `{ model, rationale }`
- `buildRoutingManifest(plugins)` — generates routing for entire chain
- `generateAgentCalls(chain, routing)` — builds Agent tool invocations with model param

Integrated into `orchestrator.js` orchestrate() function — routing manifest printed before execution.

## Testing

Run: `node .agents/skills/meta-orchestrator/test-model-router.js`

Validates:
- Direct plugin routing
- Domain fallback
- Model distribution
- Core plugin coverage

## Cost Impact

Estimated token distribution per typical workflow:
- **Opus 5.5**: 20-30% (strategic work, highest quality)
- **Sonnet 5.5**: 30-40% (review/analysis, balanced)
- **Haiku**: 30-50% (implementation, fastest/cheapest)

Net effect: ~40-60% cost reduction vs all-Opus, maintains quality where needed.
