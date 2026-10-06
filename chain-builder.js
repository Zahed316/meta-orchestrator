#!/usr/bin/env node
/**
 * Terminal Chain Builder UI
 */
const fs = require('fs');
const path = require('path');
const { PluginRegistry } = require('./plugin-registry');
const { PLUGIN_REGISTRY } = require('./orchestrator');
const { ChainParser, CircularDependencyError } = require('./chain-parser');

let chalk;
let inquirer;

try {
  chalk = require('chalk');
  inquirer = require('inquirer');
} catch (err) {
  console.log("Installing 'chalk' and 'inquirer' for Terminal UI...");
  try {
    require('child_process').execSync('npm install chalk@4 inquirer@8', { stdio: 'inherit', cwd: __dirname });
    chalk = require('chalk');
    inquirer = require('inquirer');
  } catch (installErr) {
    console.error("Failed to install dependencies.");
    console.error("Please edit the chain YAML/JSON files manually in .claude/chains/");
    process.exit(1);
  }
}

async function run() {
  console.log(chalk.bold.blue('\n🔗 Meta-Orchestrator Chain Builder\n'));

  // 1. Prompt for chain name
  const { chainName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'chainName',
      message: 'Enter chain name (e.g., test-chain):',
      validate: (input) => input ? true : 'Chain name is required'
    }
  ]);

  // Load plugins
  const registry = new PluginRegistry({ coreRegistry: PLUGIN_REGISTRY });
  // Just use core for now as it's simpler, or load all
  const allPlugins = await registry.loadAllPlugins();
  
  if (allPlugins.length === 0) {
    console.log(chalk.red('No plugins found.'));
    process.exit(1);
  }

  const choices = allPlugins.map(p => ({
    name: `${p.id} ${chalk.dim(`(${p.tier})`)}`,
    value: p.id
  }));

  // 2 & 3. Multi-select plugins
  const { selectedPlugins } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedPlugins',
      message: 'Select plugins to include in this chain:',
      choices,
      validate: (input) => input.length > 0 ? true : 'Select at least one plugin'
    }
  ]);

  // 4. For each plugin, ask dependencies
  const dependencies = {};
  for (const pluginId of selectedPlugins) {
    const otherPlugins = selectedPlugins.filter(p => p !== pluginId);
    if (otherPlugins.length === 0) continue;

    const { deps } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'deps',
        message: `Select dependencies for ${chalk.cyan(pluginId)}:`,
        choices: otherPlugins.map(p => ({ name: p, value: p }))
      }
    ]);
    if (deps.length > 0) {
      dependencies[pluginId] = deps;
    }
  }

  const chainObj = {
    tasks: selectedPlugins,
    dependencies
  };

  // Try to parse to catch circular dependencies
  try {
    const layers = ChainParser._topologicalSort(selectedPlugins, dependencies);
    ChainParser._detectCycles(selectedPlugins, dependencies);
    
    // 6. Preview dependency graph (ASCII art)
    console.log(chalk.bold.green('\n✓ Chain is valid. Dependency Graph:'));
    layers.forEach((layer, i) => {
      console.log(`Layer ${i + 1}: ${chalk.cyan(layer.join(', '))}`);
      if (i < layers.length - 1) {
        console.log('   ↓');
      }
    });

  } catch (err) {
    if (err instanceof CircularDependencyError) {
      console.log(chalk.red(`\n✗ ${err.message}`));
      process.exit(1);
    }
    throw err;
  }

  // 5. Generate .claude/chains/<name>.yaml (outputting as YAML string manually to avoid dependencies)
  const chainsDir = path.join(process.cwd(), '.claude/chains');
  if (!fs.existsSync(chainsDir)) {
    fs.mkdirSync(chainsDir, { recursive: true });
  }

  const outPath = path.join(chainsDir, `${chainName}.json`);
  fs.writeFileSync(outPath, JSON.stringify(chainObj, null, 2));

  console.log(chalk.green(`\n✓ Chain saved to ${outPath}`));
}

run().catch(err => {
  console.error(chalk.red('Error:'), err);
  process.exit(1);
});
