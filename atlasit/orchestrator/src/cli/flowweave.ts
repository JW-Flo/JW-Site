#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join } from 'path';
import { logger, AtlasITError } from '@atlasit/shared';
import { FlowWeaveDocument, flowWeaveRuntime } from '../core/flowweave';
import { registerBuiltInComponents } from '../components/builtin';
import { NexusCanvasCompiler } from '../designer/nexus-canvas';

// FlowWeave CLI Tool
class FlowWeaveCLI {
  private commands = new Map<string, (args: string[]) => Promise<void>>();

  constructor() {
    this.registerCommands();
  }

  private registerCommands(): void {
    this.commands.set('compile', this.compileFlowWeave.bind(this));
    this.commands.set('run', this.runFlowWeave.bind(this));
    this.commands.set('validate', this.validateFlowWeave.bind(this));
    this.commands.set('list-components', this.listComponents.bind(this));
    this.commands.set('convert-canvas', this.convertNexusCanvas.bind(this));
  }

  async execute(args: string[]): Promise<void> {
    const [command, ...commandArgs] = args;

    if (!command) {
      this.showHelp();
      return;
    }

    const commandHandler = this.commands.get(command);
    if (!commandHandler) {
      console.error(`Unknown command: ${command}`);
      this.showHelp();
      return;
    }

    try {
      await commandHandler(commandArgs);
    } catch (error) {
      console.error('Command failed:', error.message);
      process.exit(1);
    }
  }

  private async compileFlowWeave(args: string[]): Promise<void> {
    const [inputFile] = args;

    if (!inputFile) {
      console.error('Usage: flowweave compile <input-file>');
      return;
    }

    try {
      const flowWeaveData = JSON.parse(readFileSync(inputFile, 'utf-8'));
      const flowWeaveDoc: FlowWeaveDocument = flowWeaveData;

      console.log('✅ FlowWeave document loaded successfully');
      console.log(`📊 Document: ${flowWeaveDoc.metadata.name}`);
      console.log(`🔢 Version: ${flowWeaveDoc.version}`);
      console.log(`📝 Flows: ${flowWeaveDoc.flows.length}`);
      console.log(`🎯 Triggers: ${flowWeaveDoc.triggers.length}`);
      console.log(`📚 Resources: ${flowWeaveDoc.resources.length}`);

      // Validate the document structure
      this.validateFlowWeaveStructure(flowWeaveDoc);

      console.log('✅ FlowWeave document is valid');

    } catch (error) {
      console.error('❌ Failed to compile FlowWeave document:', error.message);
      throw error;
    }
  }

  private async runFlowWeave(args: string[]): Promise<void> {
    const [inputFile, flowId] = args;

    if (!inputFile) {
      console.error('Usage: flowweave run <input-file> [flow-id]');
      return;
    }

    try {
      // Register built-in components
      registerBuiltInComponents();

      // Load and parse FlowWeave document
      const flowWeaveData = JSON.parse(readFileSync(inputFile, 'utf-8'));
      const flowWeaveDoc: FlowWeaveDocument = flowWeaveData;

      // Find the flow to execute
      const targetFlowId = flowId || flowWeaveDoc.flows[0]?.id;
      const flow = flowWeaveDoc.flows.find(f => f.id === targetFlowId);

      if (!flow) {
        console.error(`❌ Flow not found: ${targetFlowId}`);
        return;
      }

      console.log(`🚀 Executing FlowWeave flow: ${flow.name}`);
      console.log(`📊 Steps: ${flow.steps.length}`);

      // Prepare execution context
      const context = {
        workflowId: flow.id,
        tenantId: 'cli-execution',
        input: {},
        variables: flow.variables || {},
        stepResults: new Map(),
        errors: []
      };

      // Execute the flow
      const startTime = Date.now();
      const results = await flowWeaveRuntime.executeFlow(flow, context);

      const duration = Date.now() - startTime;

      console.log(`✅ Flow execution completed in ${duration}ms`);
      console.log('📤 Results:', JSON.stringify(results, null, 2));

    } catch (error) {
      console.error('❌ Flow execution failed:', error.message);
      throw error;
    }
  }

  private async validateFlowWeave(args: string[]): Promise<void> {
    const [inputFile] = args;

    if (!inputFile) {
      console.error('Usage: flowweave validate <input-file>');
      return;
    }

    try {
      const flowWeaveData = JSON.parse(readFileSync(inputFile, 'utf-8'));
      const flowWeaveDoc: FlowWeaveDocument = flowWeaveData;

      this.validateFlowWeaveStructure(flowWeaveDoc);

      console.log('✅ FlowWeave document is valid');
      console.log('📊 Validation Summary:');
      console.log(`  • ${flowWeaveDoc.flows.length} flows validated`);
      console.log(`  • ${flowWeaveDoc.triggers.length} triggers validated`);
      console.log(`  • ${flowWeaveDoc.resources.length} resources validated`);

    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      throw error;
    }
  }

  private async listComponents(args: string[]): Promise<void> {
    try {
      registerBuiltInComponents();

      const { componentLibrary } = await import('../core/flowweave');

      console.log('🔧 Available FlowWeave Components:');
      console.log('');

      const categories = new Map<string, any[]>();

      // Group components by category
      componentLibrary.list().forEach(component => {
        const categoryList = categories.get(component.category) || [];
        categoryList.push(component);
        categories.set(component.category, categoryList);
      });

      // Display components by category
      categories.forEach((components, category) => {
        console.log(`📂 ${category.toUpperCase()}:`);
        components.forEach(component => {
          console.log(`  • ${component.icon} ${component.name} (${component.id})`);
          console.log(`    ${component.description}`);
          console.log(`    Inputs: ${component.inputs.length}, Outputs: ${component.outputs.length}`);
          console.log('');
        });
      });

    } catch (error) {
      console.error('❌ Failed to list components:', error.message);
      throw error;
    }
  }

  private async convertNexusCanvas(args: string[]): Promise<void> {
    const [inputFile, outputFile] = args;

    if (!inputFile || !outputFile) {
      console.error('Usage: flowweave convert-canvas <input-canvas-file> <output-flowweave-file>');
      return;
    }

    try {
      const canvasData = JSON.parse(readFileSync(inputFile, 'utf-8'));
      const compiler = new NexusCanvasCompiler(canvasData);
      const flowWeaveDoc = compiler.compile();

      // Write the compiled FlowWeave document
      const fs = await import('fs');
      fs.writeFileSync(outputFile, JSON.stringify(flowWeaveDoc, null, 2));

      console.log('✅ NexusCanvas converted to FlowWeave successfully');
      console.log(`📄 Output: ${outputFile}`);
      console.log(`🔢 Generated ${flowWeaveDoc.flows[0]?.steps.length || 0} steps`);

    } catch (error) {
      console.error('❌ Canvas conversion failed:', error.message);
      throw error;
    }
  }

  private validateFlowWeaveStructure(doc: FlowWeaveDocument): void {
    if (!doc.version) {
      throw new AtlasITError('VALIDATION-001', 'FlowWeave document missing version', 400);
    }

    if (!doc.metadata?.name) {
      throw new AtlasITError('VALIDATION-002', 'FlowWeave document missing metadata.name', 400);
    }

    if (!doc.flows || doc.flows.length === 0) {
      throw new AtlasITError('VALIDATION-003', 'FlowWeave document must have at least one flow', 400);
    }

    // Validate each flow
    doc.flows.forEach(flow => {
      if (!flow.id || !flow.name) {
        throw new AtlasITError('VALIDATION-004', `Flow missing required fields: ${flow.id}`, 400);
      }

      if (!flow.steps || flow.steps.length === 0) {
        throw new AtlasITError('VALIDATION-005', `Flow ${flow.id} has no steps`, 400);
      }
    });

    // Validate triggers
    doc.triggers?.forEach(trigger => {
      if (!trigger.id || !trigger.type) {
        throw new AtlasITError('VALIDATION-006', `Trigger missing required fields: ${trigger.id}`, 400);
      }
    });
  }

  public showHelp(): void {
    console.log('🌊 FlowWeave CLI - Dynamic Workflow Orchestration');
    console.log('');
    console.log('Usage: flowweave <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  compile <file>          Compile and validate a FlowWeave document');
    console.log('  run <file> [flow-id]    Execute a FlowWeave document');
    console.log('  validate <file>         Validate a FlowWeave document structure');
    console.log('  list-components         List all available FlowWeave components');
    console.log('  convert-canvas <input> <output>  Convert NexusCanvas to FlowWeave');
    console.log('  help                    Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  flowweave compile workflow.json');
    console.log('  flowweave run workflow.json user-onboarding');
    console.log('  flowweave list-components');
    console.log('');
  }
}

// CLI entry point
async function main() {
  const cli = new FlowWeaveCLI();
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    cli.showHelp();
    return;
  }

  await cli.execute(args);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the CLI
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });
}

export { FlowWeaveCLI };
