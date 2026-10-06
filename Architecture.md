# Phase 3 Architecture

## Overview
Phase 3 transitions meta-orchestrator from a static, parallel-only execution engine to a dynamic, hybrid marketplace with persistence, exponential backoff, and terminal UI support.

## Module Descriptions

- **`orchestrator.js`**: Main entry point that coordinates the parsing, discovery, execution, and aggregation phases.
- **`mcp-integration.js`**: Connects to the MCP runtime for live discovery and health checks of available capabilities.
- **`plugin-registry.js`**: Manages the 3-tier marketplace (Core, Community, Custom) and handles plugin resolution.
- **`chain-builder.js`**: Terminal UI for constructing execution chains interactively (`meta new-chain`).
- **`persistence-layer.js`**: Manages execution state, usage tracking, and checkpointing.
- **`retry-engine.js`**: Implements exponential backoff for transient failures during plugin execution.
- **`chain-parser.js`**: Parses user-defined YAML chains into execution layers.
- **`project-generator.js`**: Handles zero-to-git-init project scaffolding, CodeGraph indexing, and team setup.

## Data Flow

```text
User Input / YAML Chain
       │
       ▼
[ orchestrator.js ] ────────┐
       │                    │
       ▼                    ▼
[ chain-parser.js ]  [ mcp-integration.js ]
       │                    │
       ▼                    ▼
[ plugin-registry.js (3-Tier Marketplace) ]
       │
       ▼
[ chain-builder.js / Execution Graph ]
       │
       ▼
[ persistence-layer.js ] ──► [ retry-engine.js ]
       │
       ▼
Subagent Dispatch (Streaming Layer Feedback)
       │
       ▼
Aggregated Results
```

## Extension Points
- **Custom Plugins**: Add local plugins to the Custom tier in the plugin registry.
- **Chain Templates**: Create reusable YAML templates in the `examples/` directory for sequential or parallel workflows.
