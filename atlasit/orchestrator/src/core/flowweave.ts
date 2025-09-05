import { z } from 'zod';
import { logger, AtlasITError } from '@atlasit/shared';

// FlowWeave - Proprietary workflow format for AtlasWeave
export interface FlowWeaveDocument {
  version: string;
  metadata: {
    name: string;
    description?: string;
    author?: string;
    tags?: string[];
    created: string;
    modified: string;
    schema: string;
  };
  config: {
    timeout?: number;
    retryPolicy?: {
      maxAttempts: number;
      backoffMs: number;
    };
    concurrency?: number;
    environment: Record<string, any>;
  };
  resources: FlowWeaveResource[];
  triggers: FlowWeaveTrigger[];
  flows: FlowWeaveFlow[];
  errorHandlers: FlowWeaveErrorHandler[];
}

export interface FlowWeaveResource {
  id: string;
  type: 'system' | 'user' | 'group' | 'application' | 'data' | 'custom';
  name: string;
  config: Record<string, any>;
  schema?: z.ZodType;
  cache?: {
    ttl: number;
    strategy: 'memory' | 'redis' | 'file';
  };
}

export interface FlowWeaveTrigger {
  id: string;
  type: 'schedule' | 'event' | 'webhook' | 'api' | 'manual';
  name: string;
  config: Record<string, any>;
  conditions?: FlowWeaveCondition[];
  enabled: boolean;
}

export interface FlowWeaveFlow {
  id: string;
  name: string;
  description?: string;
  trigger: string; // Reference to trigger ID
  steps: FlowWeaveStep[];
  variables: Record<string, any>;
  outputs?: Record<string, any>;
}

export interface FlowWeaveStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'loop' | 'parallel' | 'transform' | 'wait' | 'custom';
  config: Record<string, any>;
  inputs: Record<string, FlowWeaveInput>;
  outputs?: Record<string, FlowWeaveOutput>;
  onSuccess?: string[]; // Step IDs to execute on success
  onFailure?: string[]; // Step IDs to execute on failure
  timeout?: number;
  retry?: {
    maxAttempts: number;
    backoff: 'linear' | 'exponential';
    backoffMs: number;
  };
}

export interface FlowWeaveInput {
  type: 'literal' | 'variable' | 'resource' | 'step' | 'expression';
  value: any;
  transform?: FlowWeaveTransform;
}

export interface FlowWeaveOutput {
  type: 'variable' | 'resource' | 'file' | 'database';
  path: string;
  schema?: z.ZodType;
}

export interface FlowWeaveTransform {
  type: 'map' | 'filter' | 'aggregate' | 'expression' | 'template';
  config: Record<string, any>;
}

export interface FlowWeaveCondition {
  type: 'expression' | 'comparison' | 'existence' | 'custom';
  left: FlowWeaveInput;
  operator: string;
  right?: FlowWeaveInput;
  config?: Record<string, any>;
}

export interface FlowWeaveErrorHandler {
  id: string;
  pattern: string; // Error pattern to match
  action: 'retry' | 'skip' | 'fail' | 'compensate' | 'custom';
  config: Record<string, any>;
}

// FlowWeave Component System (like Okta's cards but more flexible)
export interface FlowWeaveComponent {
  id: string;
  name: string;
  category: string;
  version: string;
  schema: z.ZodType;
  icon?: string;
  description: string;
  inputs: FlowWeaveComponentPort[];
  outputs: FlowWeaveComponentPort[];
  config: Record<string, any>;
  execute: (inputs: Record<string, any>, config: Record<string, any>) => Promise<Record<string, any>>;
}

export interface FlowWeaveComponentPort {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
  required: boolean;
  description?: string;
  schema?: z.ZodType;
}

// Pre-built FlowWeave Components Library
export class FlowWeaveComponentLibrary {
  private readonly components = new Map<string, FlowWeaveComponent>();

  register(component: FlowWeaveComponent): void {
    this.components.set(component.id, component);
    logger.info('Registered FlowWeave component', {
      componentId: component.id,
      category: component.category,
      version: component.version
    });
  }

  get(id: string): FlowWeaveComponent | undefined {
    return this.components.get(id);
  }

  list(category?: string): FlowWeaveComponent[] {
    const all = Array.from(this.components.values());
    return category ? all.filter(c => c.category === category) : all;
  }

  validateComponentUsage(componentId: string, inputs: Record<string, any>): boolean {
    const component = this.components.get(componentId);
    if (!component) return false;

    try {
      // Validate inputs against component schema
      component.schema.parse(inputs);
      return true;
    } catch (error) {
      logger.error('Component validation failed', error, { componentId });
      return false;
    }
  }
}

// FlowWeave Expression Engine (advanced conditional logic)
export class FlowWeaveExpressionEngine {
  private readonly context: Map<string, any> = new Map();

  setContext(key: string, value: any): void {
    this.context.set(key, value);
  }

  evaluate(expression: string): any {
    try {
      // Create a safe evaluation context
      const context = Object.fromEntries(this.context);
      const func = new Function(...Object.keys(context), `return ${expression};`);
      return func(...Object.values(context));
    } catch (error) {
      throw new AtlasITError(
        'EXPRESSION-001',
        `Expression evaluation failed: ${error.message}`,
        400,
        { expression }
      );
    }
  }

  evaluateCondition(condition: FlowWeaveCondition): boolean {
    try {
      switch (condition.type) {
        case 'expression':
          return !!this.evaluate(condition.left.value);

        case 'comparison': {
          const left = this.resolveInput(condition.left);
          const right = condition.right ? this.resolveInput(condition.right) : null;
          return this.compare(left, condition.operator, right);
        }

        case 'existence': {
          const value = this.resolveInput(condition.left);
          return value !== undefined && value !== null;
        }

        case 'custom':
          // Custom condition logic
          return this.evaluateCustomCondition(condition);

        default:
          return false;
      }
    } catch (error) {
      logger.error('Condition evaluation failed', error, { condition });
      return false;
    }
  }

  private resolveInput(input: FlowWeaveInput): any {
    switch (input.type) {
      case 'literal':
        return input.value;
      case 'variable':
        return this.context.get(input.value);
      case 'expression':
        return this.evaluate(input.value);
      default:
        return input.value;
    }
  }

  private compare(left: any, operator: string, right: any): boolean {
    switch (operator) {
      case 'equals':
        return left === right;
      case 'not_equals':
        return left !== right;
      case 'greater_than':
        return Number(left) > Number(right);
      case 'less_than':
        return Number(left) < Number(right);
      case 'contains':
        return String(left).includes(String(right));
      case 'starts_with':
        return String(left).startsWith(String(right));
      case 'ends_with':
        return String(left).endsWith(String(right));
      case 'regex':
        return new RegExp(right).test(String(left));
      default:
        return false;
    }
  }

  private evaluateCustomCondition(condition: FlowWeaveCondition): boolean {
    // Implement custom condition logic here
    // This could include complex business rules
    // Example: time-based conditions, data validation, etc.
    return true; // Placeholder
  }
}

// FlowWeave Runtime Engine
export class FlowWeaveRuntime {
  private readonly expressionEngine = new FlowWeaveExpressionEngine();
  private readonly componentLibrary = new FlowWeaveComponentLibrary();

  async executeFlow(flow: FlowWeaveFlow, initialContext: Record<string, any> = {}): Promise<Record<string, any>> {
    const startTime = Date.now();
    const context = new Map(Object.entries(initialContext));
    const results = new Map<string, any>();

    logger.info('Starting FlowWeave execution', {
      flowId: flow.id,
      stepCount: flow.steps.length
    });

    try {
      // Set initial variables
      Object.entries(flow.variables).forEach(([key, value]) => {
        context.set(key, value);
      });

      // Execute steps in topological order
      const executed = new Set<string>();
      const stepMap = new Map(flow.steps.map(s => [s.id, s]));

      for (const step of flow.steps) {
        await this.executeStep(step, context, results, stepMap, executed);
      }

      const outputs = flow.outputs || {};
      const finalResults: Record<string, any> = {};

      // Collect outputs
      for (const [key, output] of Object.entries(outputs)) {
        finalResults[key] = this.resolveOutput(output, context, results);
      }

      logger.info('FlowWeave execution completed', {
        flowId: flow.id,
        duration: Date.now() - startTime,
        outputs: Object.keys(finalResults)
      });

      return finalResults;

    } catch (error) {
      logger.error('FlowWeave execution failed', error, {
        flowId: flow.id,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  private async executeStep(
    step: FlowWeaveStep,
    context: Map<string, any>,
    results: Map<string, any>,
    stepMap: Map<string, FlowWeaveStep>,
    executed: Set<string>
  ): Promise<void> {
    if (executed.has(step.id)) return;

    await this.executeDependencies(step, context, results, stepMap, executed);
    await this.performStepExecution(step, context, results, stepMap, executed);
  }

  private async executeDependencies(
    step: FlowWeaveStep,
    context: Map<string, any>,
    results: Map<string, any>,
    stepMap: Map<string, FlowWeaveStep>,
    executed: Set<string>
  ): Promise<void> {
    const dependencies = this.getStepDependencies(step, stepMap);
    for (const dep of dependencies) {
      if (!executed.has(dep)) {
        const depStep = stepMap.get(dep);
        if (depStep) {
          await this.executeStep(depStep, context, results, stepMap, executed);
        }
      }
    }
  }

  private async performStepExecution(
    step: FlowWeaveStep,
    context: Map<string, any>,
    results: Map<string, any>,
    stepMap: Map<string, FlowWeaveStep>,
    executed: Set<string>
  ): Promise<void> {
    const stepStartTime = Date.now();

    try {
      logger.debug('Executing FlowWeave step', { stepId: step.id, type: step.type });

      const resolvedInputs = this.resolveStepInputs(step, context, results);
      const stepResult = await this.executeStepByType(step, resolvedInputs);
      this.storeStepResults(step, stepResult, context, results);

      executed.add(step.id);

      logger.debug('FlowWeave step completed', {
        stepId: step.id,
        duration: Date.now() - stepStartTime
      });

    } catch (error) {
      logger.error('FlowWeave step failed', error, {
        stepId: step.id,
        duration: Date.now() - stepStartTime
      });

      await this.handleStepFailure(step, context, results, stepMap, executed, error);
    }
  }

  private resolveStepInputs(
    step: FlowWeaveStep,
    context: Map<string, any>,
    results: Map<string, any>
  ): Record<string, any> {
    const resolvedInputs: Record<string, any> = {};
    for (const [key, input] of Object.entries(step.inputs)) {
      resolvedInputs[key] = this.resolveInput(input, context, results);
    }
    return resolvedInputs;
  }

  private async executeStepByType(
    step: FlowWeaveStep,
    inputs: Record<string, any>
  ): Promise<Record<string, any>> {
    switch (step.type) {
      case 'action':
        return await this.executeActionStep(step, inputs);
      case 'condition':
        return await this.executeConditionStep(step, inputs);
      case 'transform':
        return await this.executeTransformStep(step, inputs);
      case 'custom':
        return await this.executeCustomStep(step, inputs);
      default:
        throw new AtlasITError(
          'STEP-001',
          `Unsupported step type: ${step.type}`,
          400,
          { stepId: step.id }
        );
    }
  }

  private storeStepResults(
    step: FlowWeaveStep,
    stepResult: Record<string, any>,
    context: Map<string, any>,
    results: Map<string, any>
  ): void {
    results.set(step.id, stepResult);

    if (step.outputs) {
      for (const [key, output] of Object.entries(step.outputs)) {
        const value = stepResult[key];
        if (output.type === 'variable') {
          context.set(output.path, value);
        }
        // Handle other output types (resource, file, database) here
      }
    }
  }

  private async handleStepFailure(
    step: FlowWeaveStep,
    context: Map<string, any>,
    results: Map<string, any>,
    stepMap: Map<string, FlowWeaveStep>,
    executed: Set<string>,
    error: any
  ): Promise<void> {
    if (step.onFailure && step.onFailure.length > 0) {
      for (const nextStepId of step.onFailure) {
        const nextStep = stepMap.get(nextStepId);
        if (nextStep) {
          await this.executeStep(nextStep, context, results, stepMap, executed);
        }
      }
    } else {
      throw error;
    }
  }

  private getStepDependencies(step: FlowWeaveStep, stepMap: Map<string, FlowWeaveStep>): string[] {
    const dependencies: string[] = [];

    // Check inputs for step references
    for (const input of Object.values(step.inputs)) {
      if (input.type === 'step') {
        dependencies.push(input.value);
      }
    }

    return dependencies;
  }

  private resolveInput(
    input: FlowWeaveInput,
    context: Map<string, any>,
    results: Map<string, any>
  ): any {
    switch (input.type) {
      case 'literal':
        return input.value;
      case 'variable':
        return context.get(input.value);
      case 'step':
        return results.get(input.value);
      case 'expression':
        this.expressionEngine.setContext('context', Object.fromEntries(context));
        this.expressionEngine.setContext('results', Object.fromEntries(results));
        return this.expressionEngine.evaluate(input.value);
      default:
        return input.value;
    }
  }

  private resolveOutput(
    output: FlowWeaveOutput,
    context: Map<string, any>,
    results: Map<string, any>
  ): any {
    if (output.type === 'variable') {
      return context.get(output.path);
    }
    return results.get(output.path);
  }

  private async executeActionStep(step: FlowWeaveStep, inputs: Record<string, any>): Promise<Record<string, any>> {
    // Execute action using component library
    const component = this.componentLibrary.get(step.config.componentId);
    if (!component) {
      throw new AtlasITError(
        'ACTION-001',
        `Component not found: ${step.config.componentId}`,
        400,
        { stepId: step.id }
      );
    }

    return await component.execute(inputs, step.config);
  }

  private async executeConditionStep(step: FlowWeaveStep, inputs: Record<string, any>): Promise<Record<string, any>> {
    const condition = step.config.condition as FlowWeaveCondition;
    const result = this.expressionEngine.evaluateCondition(condition);

    return { result, condition };
  }

  private async executeTransformStep(step: FlowWeaveStep, inputs: Record<string, any>): Promise<Record<string, any>> {
    const transform = step.config.transform as FlowWeaveTransform;

    switch (transform.type) {
      case 'map':
        return this.applyMapTransform(inputs.data, transform.config.mapping);
      case 'filter':
        return this.applyFilterTransform(inputs.data, transform.config.condition);
      case 'aggregate':
        return this.applyAggregateTransform(inputs.data, transform.config.operation);
      case 'expression':
        return { result: this.expressionEngine.evaluate(transform.config.expression) };
      case 'template':
        return { result: this.applyTemplateTransform(inputs, transform.config.template) };
      default:
        return inputs;
    }
  }

  private async executeCustomStep(step: FlowWeaveStep, inputs: Record<string, any>): Promise<Record<string, any>> {
    // Custom step execution logic
    // This would execute custom JavaScript/TypeScript code
    return { result: 'custom execution result' };
  }

  private applyMapTransform(data: any, mapping: Record<string, string>): any {
    if (Array.isArray(data)) {
      return data.map(item => this.mapObject(item, mapping));
    }
    return this.mapObject(data, mapping);
  }

  private mapObject(obj: any, mapping: Record<string, string>): any {
    const result: any = {};
    for (const [targetKey, sourcePath] of Object.entries(mapping)) {
      result[targetKey] = this.getNestedValue(obj, sourcePath);
    }
    return result;
  }

  private applyFilterTransform(data: any, condition: any): any {
    if (!Array.isArray(data)) return data;

    return data.filter(item => {
      // Simple filtering logic
      return true; // Placeholder
    });
  }

  private applyAggregateTransform(data: any, operation: any): any {
    if (!Array.isArray(data)) return data;

    // Aggregation logic
    return { count: data.length }; // Placeholder
  }

  private applyTemplateTransform(inputs: Record<string, any>, template: string): string {
    // Simple template replacement
    let result = template;
    for (const [key, value] of Object.entries(inputs)) {
      result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), String(value));
    }
    return result;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

// Export singleton instances
export const flowWeaveRuntime = new FlowWeaveRuntime();
export const componentLibrary = new FlowWeaveComponentLibrary();
