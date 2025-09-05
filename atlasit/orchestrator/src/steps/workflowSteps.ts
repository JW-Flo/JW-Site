import { z } from 'zod';
import { logger, AtlasITError } from '@atlasit/shared';
import { getSystemAuthHeaders } from '../services/authManager';

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'api-call' | 'data-transform' | 'condition' | 'parallel' | 'approval' | 'notification' | 'validation';
  config: Record<string, any>;
  onSuccess?: string[];
  onFailure?: string[];
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

export interface WorkflowContext {
  workflowId: string;
  tenantId: string;
  userId?: string;
  input: Record<string, any>;
  variables: Map<string, any>;
  stepResults: Map<string, any>;
  errors: AtlasITError[];
}

export interface StepResult {
  success: boolean;
  data?: any;
  error?: AtlasITError;
  duration: number;
  retryCount: number;
}

export abstract class BaseWorkflowStep {
  constructor(
    protected step: WorkflowStep,
    protected context: WorkflowContext
  ) {}

  abstract execute(): Promise<StepResult>;

  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    backoffMs: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        logger.warn('Step execution failed, retrying', {
          stepId: this.step.id,
          attempt,
          maxAttempts,
          error: error.message
        });

        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, backoffMs * attempt));
        }
      }
    }

    throw lastError;
  }

  protected interpolateVariables(template: string): string {
    return template.replace(/\{\{(\w+)\.(.+?)\}\}/g, (match, type, path) => {
      switch (type) {
        case 'input':
          return this.getNestedValue(this.context.input, path);
        case 'variables':
          return this.context.variables.get(path) || '';
        case 'steps':
          return this.getNestedValue(this.context.stepResults.get(path), 'data') || '';
        default:
          return match;
      }
    });
  }

  protected getNestedValue(obj: any, path: string): string {
    return path.split('.').reduce((current, key) => current?.[key], obj) || '';
  }
}

export class ApiCallStep extends BaseWorkflowStep {
  async execute(): Promise<StepResult> {
    const startTime = Date.now();
    const config = this.step.config;

    try {
      const {
        system,
        method = 'GET',
        url,
        headers = {},
        body,
        timeout = 30000
      } = config;

      // Get authentication headers
      const authHeaders = await getSystemAuthHeaders(system);

      // Interpolate variables in URL and body
      const interpolatedUrl = this.interpolateVariables(url);
      const interpolatedBody = body ? JSON.parse(this.interpolateVariables(JSON.stringify(body))) : undefined;

      // Prepare request
      const requestConfig: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...headers
        },
        signal: AbortSignal.timeout(timeout)
      };

      if (interpolatedBody && method !== 'GET') {
        requestConfig.body = JSON.stringify(interpolatedBody);
      }

      // Execute request with retry
      const response = await this.withRetry(
        () => fetch(interpolatedUrl, requestConfig),
        config.retryPolicy?.maxAttempts || 3,
        config.retryPolicy?.backoffMs || 1000
      );

      if (!response.ok) {
        throw new AtlasITError(
          'API-001',
          `API call failed: ${response.status} ${response.statusText}`,
          response.status,
          { url: interpolatedUrl, method, system }
        );
      }

      const responseData = await response.json();

      logger.info('API call completed successfully', {
        stepId: this.step.id,
        system,
        method,
        url: interpolatedUrl,
        status: response.status,
        duration: Date.now() - startTime
      });

      return {
        success: true,
        data: responseData,
        duration: Date.now() - startTime,
        retryCount: 0
      };

    } catch (error) {
      const atlasError = error instanceof AtlasITError ? error :
        new AtlasITError('API-002', `API call error: ${error.message}`, 500, {
          stepId: this.step.id,
          system: config.system
        });

      logger.error('API call failed', atlasError, {
        stepId: this.step.id,
        duration: Date.now() - startTime
      });

      return {
        success: false,
        error: atlasError,
        duration: Date.now() - startTime,
        retryCount: 0
      };
    }
  }
}

export class DataTransformStep extends BaseWorkflowStep {
  async execute(): Promise<StepResult> {
    const startTime = Date.now();
    const config = this.step.config;

    try {
      const { source, transformation, target } = config;

      // Get source data
      let sourceData: any;
      if (source.type === 'step') {
        sourceData = this.context.stepResults.get(source.stepId)?.data;
      } else if (source.type === 'input') {
        sourceData = this.context.input;
      } else if (source.type === 'variable') {
        sourceData = this.context.variables.get(source.name);
      }

      if (!sourceData) {
        throw new AtlasITError(
          'TRANSFORM-001',
          `Source data not found: ${source.type}`,
          400,
          { source }
        );
      }

      // Apply transformation
      let transformedData: any;
      switch (transformation.type) {
        case 'map':
          transformedData = this.applyMapping(sourceData, transformation.mapping);
          break;
        case 'filter':
          transformedData = this.applyFilter(sourceData, transformation.condition);
          break;
        case 'aggregate':
          transformedData = this.applyAggregation(sourceData, transformation.operation);
          break;
        case 'custom':
          transformedData = await this.applyCustomTransformation(sourceData, transformation.function);
          break;
        default:
          throw new AtlasITError(
            'TRANSFORM-002',
            `Unsupported transformation type: ${transformation.type}`,
            400,
            { transformationType: transformation.type }
          );
      }

      // Store result
      if (target.type === 'variable') {
        this.context.variables.set(target.name, transformedData);
      } else if (target.type === 'output') {
        this.context.stepResults.set(this.step.id, { data: transformedData });
      }

      logger.info('Data transformation completed', {
        stepId: this.step.id,
        sourceType: source.type,
        transformationType: transformation.type,
        targetType: target.type,
        duration: Date.now() - startTime
      });

      return {
        success: true,
        data: transformedData,
        duration: Date.now() - startTime,
        retryCount: 0
      };

    } catch (error) {
      const atlasError = error instanceof AtlasITError ? error :
        new AtlasITError('TRANSFORM-003', `Data transformation error: ${error.message}`, 500, {
          stepId: this.step.id
        });

      logger.error('Data transformation failed', atlasError, {
        stepId: this.step.id,
        duration: Date.now() - startTime
      });

      return {
        success: false,
        error: atlasError,
        duration: Date.now() - startTime,
        retryCount: 0
      };
    }
  }

  private applyMapping(data: any, mapping: Record<string, string>): any {
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

  private applyFilter(data: any, condition: any): any {
    if (!Array.isArray(data)) {
      return data;
    }

    return data.filter(item => {
      // Simple condition evaluation - can be extended for complex conditions
      const field = condition.field;
      const operator = condition.operator;
      const value = condition.value;

      const itemValue = this.getNestedValue(item, field);

      switch (operator) {
        case 'equals':
          return itemValue === value;
        case 'not_equals':
          return itemValue !== value;
        case 'contains':
          return String(itemValue).includes(String(value));
        case 'greater_than':
          return Number(itemValue) > Number(value);
        case 'less_than':
          return Number(itemValue) < Number(value);
        default:
          return true;
      }
    });
  }

  private applyAggregation(data: any, operation: any): any {
    if (!Array.isArray(data)) {
      return data;
    }

    const { field, type } = operation;

    switch (type) {
      case 'count':
        return data.length;
      case 'sum':
        return data.reduce((sum, item) => sum + Number(this.getNestedValue(item, field) || 0), 0);
      case 'average': {
        const sum = data.reduce((acc, item) => acc + Number(this.getNestedValue(item, field) || 0), 0);
        return sum / data.length;
      }
      case 'max':
        return Math.max(...data.map(item => Number(this.getNestedValue(item, field) || 0)));
      case 'min':
        return Math.min(...data.map(item => Number(this.getNestedValue(item, field) || 0)));
      default:
        return data;
    }
  }

  private async applyCustomTransformation(data: any, transformFunction: string): Promise<any> {
    // Execute custom transformation function
    // This should be done in a sandboxed environment for security
    try {
      const func = new Function('data', `return (${transformFunction})(data);`);
      return func(data);
    } catch (error) {
      throw new AtlasITError(
        'TRANSFORM-004',
        `Custom transformation failed: ${error.message}`,
        500,
        { transformFunction }
      );
    }
  }

  protected getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

export class ConditionStep extends BaseWorkflowStep {
  async execute(): Promise<StepResult> {
    const startTime = Date.now();
    const config = this.step.config;

    try {
      const { condition, trueSteps, falseSteps } = config;

      // Evaluate condition
      const result = this.evaluateCondition(condition);

      // Store result for next steps
      this.context.variables.set(`${this.step.id}_result`, result);

      logger.info('Condition evaluation completed', {
        stepId: this.step.id,
        condition: condition,
        result,
        duration: Date.now() - startTime
      });

      return {
        success: true,
        data: { result, trueSteps, falseSteps },
        duration: Date.now() - startTime,
        retryCount: 0
      };

    } catch (error) {
      const atlasError = error instanceof AtlasITError ? error :
        new AtlasITError('CONDITION-001', `Condition evaluation error: ${error.message}`, 500, {
          stepId: this.step.id
        });

      logger.error('Condition evaluation failed', atlasError, {
        stepId: this.step.id,
        duration: Date.now() - startTime
      });

      return {
        success: false,
        error: atlasError,
        duration: Date.now() - startTime,
        retryCount: 0
      };
    }
  }

  private evaluateCondition(condition: any): boolean {
    const { type, left, operator, right } = condition;

    let leftValue: any;
    let rightValue: any;

    // Get left operand value
    if (left.type === 'variable') {
      leftValue = this.context.variables.get(left.name);
    } else if (left.type === 'step') {
      leftValue = this.context.stepResults.get(left.stepId)?.data;
    } else if (left.type === 'input') {
      leftValue = this.context.input[left.field];
    } else if (left.type === 'literal') {
      leftValue = left.value;
    }

    // Get right operand value
    if (right.type === 'variable') {
      rightValue = this.context.variables.get(right.name);
    } else if (right.type === 'step') {
      rightValue = this.context.stepResults.get(right.stepId)?.data;
    } else if (right.type === 'input') {
      rightValue = this.context.input[right.field];
    } else if (right.type === 'literal') {
      rightValue = right.value;
    }

    // Evaluate based on operator
    switch (operator) {
      case 'equals':
        return leftValue === rightValue;
      case 'not_equals':
        return leftValue !== rightValue;
      case 'greater_than':
        return Number(leftValue) > Number(rightValue);
      case 'less_than':
        return Number(leftValue) < Number(rightValue);
      case 'contains':
        return String(leftValue).includes(String(rightValue));
      case 'exists':
        return leftValue !== undefined && leftValue !== null;
      case 'not_exists':
        return leftValue === undefined || leftValue === null;
      default:
        return false;
    }
  }
}

export class ValidationStep extends BaseWorkflowStep {
  async execute(): Promise<StepResult> {
    const startTime = Date.now();
    const config = this.step.config;

    try {
      const { schema, data } = config;

      // Get data to validate
      let dataToValidate: any;
      if (data.type === 'input') {
        dataToValidate = this.context.input;
      } else if (data.type === 'step') {
        dataToValidate = this.context.stepResults.get(data.stepId)?.data;
      } else if (data.type === 'variable') {
        dataToValidate = this.context.variables.get(data.name);
      }

      // Create Zod schema from config
      const zodSchema = this.createZodSchema(schema);

      // Validate data
      const validationResult = zodSchema.safeParse(dataToValidate);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        throw new AtlasITError(
          'VALIDATION-001',
          'Data validation failed',
          400,
          { errors, stepId: this.step.id }
        );
      }

      logger.info('Data validation completed successfully', {
        stepId: this.step.id,
        duration: Date.now() - startTime
      });

      return {
        success: true,
        data: validationResult.data,
        duration: Date.now() - startTime,
        retryCount: 0
      };

    } catch (error) {
      const atlasError = error instanceof AtlasITError ? error :
        new AtlasITError('VALIDATION-002', `Validation error: ${error.message}`, 500, {
          stepId: this.step.id
        });

      logger.error('Data validation failed', atlasError, {
        stepId: this.step.id,
        duration: Date.now() - startTime
      });

      return {
        success: false,
        error: atlasError,
        duration: Date.now() - startTime,
        retryCount: 0
      };
    }
  }

  private createZodSchema(schema: any): z.ZodType {
    switch (schema.type) {
      case 'string':
        let stringSchema = z.string();
        if (schema.minLength) stringSchema = stringSchema.min(schema.minLength);
        if (schema.maxLength) stringSchema = stringSchema.max(schema.maxLength);
        if (schema.pattern) stringSchema = stringSchema.regex(new RegExp(schema.pattern));
        return stringSchema;

      case 'number':
        let numberSchema = z.number();
        if (schema.minimum !== undefined) numberSchema = numberSchema.min(schema.minimum);
        if (schema.maximum !== undefined) numberSchema = numberSchema.max(schema.maximum);
        return numberSchema;

      case 'boolean':
        return z.boolean();

      case 'object':
        const shape: Record<string, z.ZodType> = {};
        for (const [key, fieldSchema] of Object.entries(schema.properties || {})) {
          shape[key] = this.createZodSchema(fieldSchema);
        }
        return z.object(shape);

      case 'array':
        return z.array(this.createZodSchema(schema.items));

      default:
        return z.any();
    }
  }
}

// Step factory for creating step instances
export class WorkflowStepFactory {
  static createStep(
    step: WorkflowStep,
    context: WorkflowContext
  ): BaseWorkflowStep {
    switch (step.type) {
      case 'api-call':
        return new ApiCallStep(step, context);
      case 'data-transform':
        return new DataTransformStep(step, context);
      case 'condition':
        return new ConditionStep(step, context);
      case 'validation':
        return new ValidationStep(step, context);
      default:
        throw new AtlasITError(
          'STEP-001',
          `Unsupported step type: ${step.type}`,
          400,
          { stepType: step.type }
        );
    }
  }
}
