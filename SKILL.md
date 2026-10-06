---
name: meta-orchestrator
description: Use when you have a complex task that would benefit from parallel execution of multiple specialized workflows or custom execution chains. Automatically discovers plugins via MCP and 3-tier registry, composes execution chains, and orchestrates parallel work with streaming feedback.
---

# Meta-Orchestrator Skill

Transforms a natural-language task into a parallel execution plan, automatically discovering and chaining specialized plugins (Claude Forge, Flow Next, Cartographer, etc.) to accelerate complex workflows.

## Phase 3 Features (v1.0.0-beta.1)

- **MCP Runtime Integration**: Live discovery and health checks of MCP plugins via `.claude/mcp.json`
- **3-Tier Marketplace**: Core (8 plugins), Community (auto-discovered MCP), Custom (user plugins in `.claude/plugins/`)
- **Terminal Chain Builder**: Interactive CLI (`node chain-builder.js`) to assemble execution chains
- **Streaming Layer Feedback**: Real-time progress streaming (`meta:layer-complete`) across executing layers
- **Model Routing**: Automatic model selection per plugin domain (Opus 5.5 for research/design, Sonnet 5.5 for review, Haiku for docs/implementation)
- **Retry Engine**: Exponential backoff for failed plugins (configurable per-plugin)
- **Persistence Layer**: Optional state tracking via `claude-mem` MCP (graceful fallback if unavailable)

## How It Works

1. **Parse** your task or YAML template to identify required capabilities.
2. **Discover** plugins from the expandable 3-tier registry matching those capabilities.
3. **Compose** an execution chain (parallel when possible).
4. **Execute** via subagents, each running a specialized plugin workflow with real-time feedback.
5. **Aggregate** results into a unified report.

## Example

**Input**: "Design an auth system for a SaaS app — research best practices, validate the architecture, and document decisions."

**Discovered chain**:
- `mattpocock-skills:research` → gather auth patterns + threat models
- `claude-forge:architect` → validate design against threats
- `claude-forge:doc-updater` → generate ADRs + README

**Execution**: All three run in parallel. Results merged into a design report with architecture diagram and decision log.

## When to Use

- Multi-faceted tasks requiring 2+ specialized workflows
- Research + implementation + review in one flow
- Executing custom chains from `examples/` directory
- Any task spanning multiple skill domains (security, design, testing, docs)

## When NOT to Use

- Single-workflow tasks (use the specific skill directly: `/research`, `/code-review`, etc.)
- Real-time interaction needed inside a single skill (meta-orchestrator runs async)

## Current Plugin Registry

Expandable via auto-discovery. Currently supports Core plugins plus dynamic integration:

**Core Tier (Research & Investigation)**
- `mattpocock-skills:research` — documentation + API pattern gathering

**Core Tier (Architecture & Design)**
- `claude-forge:architect` — C4 models, ADRs, fitness functions, tech debt scan

**Core Tier (Code Review & Quality)**
- `claude-forge:code-reviewer` — security + standards review
- `claude-forge:security-reviewer` — OWASP Top 10 + CWE analysis

**Core Tier (Documentation & Mapping)**
- `claude-forge:doc-updater` — auto-sync docs from code changes
- `cartographer:cartographer` — parallel subagent codebase mapping

**Core Tier (Validation & Cross-Checking)**
- `adversarial-spec:adversarial-spec` — spec refinement via model debate
- `claude-hud:configure` — visibility + real-time status

**Community & Custom Tiers**
- Expanded automatically via live MCP discovery.

## Under the Hood

The orchestrator:
1. Reads your task and the plugin registry.
2. Matches task signals to plugin capabilities (keyword + intent matching).
3. Builds an execution graph (nodes = plugins, edges = data flow).
4. Dispatches parallel subagents per graph layer.
5. Collects results, de-duplicates, and merges into final report.
