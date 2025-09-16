import { z } from 'zod';
import { logger, AtlasITError } from '@atlasit/shared';
import {
  buildRegistry,
  dropboxBusinessConnector,
  googleWorkspaceConnector,
  activeDirectoryConnector,
  microsoft365Connector,
  paycomManualConnector,
  slackEnterpriseConnector,
  jiraCloudConnector,
  confluenceCloudConnector,
  retryWithBackoff,
  type ConnectorRegistry,
  type FetchLike,
  type RetryOptions,
  type ConnectorContext,
} from '@atlasit/core';
import { AuthenticationManager } from '../services/authManager';
import type { ConnectorResourceConfig, ResolvedConnectorResource } from './connectorTypes';
import {
  SIMULATED_CONNECTOR_RESOURCES,
  registerSimulatedConnectorAuth,
} from '../config/simulatedConnectors';

interface WorkflowEngineOptions {
  connectors?: ConnectorRegistry;
  fetchImpl?: FetchLike;
  connectorResources?: Record<string, ConnectorResourceConfig>;
}

type WorkflowRetryPolicyConfig = {
  maxAttempts: number;
  backoffMs: number;
  exponential?: boolean;
};

const defaultConnectorRegistry = buildRegistry(
  googleWorkspaceConnector,
  dropboxBusinessConnector,
  paycomManualConnector,
  activeDirectoryConnector,
  microsoft365Connector,
  slackEnterpriseConnector,
  jiraCloudConnector,
  confluenceCloudConnector
);

export interface WorkflowCard {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'ifttt' | 'flow' | 'error' | 'notification' | 'connector-action';
  name: string;
  icon?: string;
  position?: { x: number; y: number };
  config: Record<string, any>;
  inputs?: Record<string, string>;
  outputs?: Record<string, string>;
  connections?: {
    input?: string;
    output?: string;
  };
}

export interface WorkflowConnection {
  from: string;
  to: string;
  type: 'data' | 'conditional' | 'flow' | 'error' | 'success';
  condition?: string;
}

export interface OktaStyleWorkflow {
  name: string;
  description: string;
  version: string;
  resources: {
    idp?: Record<string, string>;
    connectors?: Record<string, ConnectorResourceConfig>;
  };
  cards: WorkflowCard[];
  connections: WorkflowConnection[];
  variables: {
    global?: Record<string, any>;
    flow?: Record<string, any>;
  };
  errorHandling?: {
    retryPolicy?: {
      maxAttempts: number;
      backoffMs: number;
      exponential?: boolean;
    };
    circuitBreaker?: {
      failureThreshold: number;
      recoveryTimeoutMs: number;
    };
  };
}

export interface WorkflowExecutionContext {
  workflowId: string;
  tenantId: string;
  executionId: string;
  input: Record<string, any>;
  variables: Map<string, any>;
  cardStates: Map<string, any>;
  startTime: Date;
  currentCard?: string;
}

export class OktaStyleWorkflowEngine {
  private readonly authManager: AuthenticationManager;
  private readonly circuitBreakers: Map<string, { failures: number; lastFailure: Date; isOpen: boolean }> = new Map();
  private readonly connectorRegistry: ConnectorRegistry;
  private readonly fetchImpl?: FetchLike;
  private readonly defaultConnectorConfigs: Record<string, ConnectorResourceConfig>;

  constructor(tenantId: string, options: WorkflowEngineOptions = {}) {
    this.authManager = new AuthenticationManager(tenantId);
    registerSimulatedConnectorAuth(this.authManager);
    this.connectorRegistry = options.connectors ?? defaultConnectorRegistry;
    this.fetchImpl = options.fetchImpl;
    this.defaultConnectorConfigs = options.connectorResources ?? SIMULATED_CONNECTOR_RESOURCES;
  }

  /**
   * Execute an Okta-style workflow
   */
  async executeWorkflow(workflow: OktaStyleWorkflow, input: Record<string, any>): Promise<WorkflowExecutionResult> {
    const executionId = this.generateExecutionId();
    const context: WorkflowExecutionContext = {
      workflowId: workflow.name,
      tenantId: this.authManager['tenantId'],
      executionId,
      input,
      variables: new Map([
        ...Object.entries(workflow.variables.global || {}),
        ...Object.entries(workflow.variables.flow || {})
      ]),
      cardStates: new Map(),
      startTime: new Date()
    };

    logger.info('Starting Okta-style workflow execution', {
      workflowId: workflow.name,
      executionId,
      tenantId: context.tenantId
    });

    try {
      // Find trigger card
      const triggerCard = workflow.cards.find(card => card.type === 'trigger');
      if (!triggerCard) {
        throw new AtlasITError('WORKFLOW-001', 'No trigger card found in workflow', 400);
      }

      // Execute trigger
      await this.executeCard(triggerCard, context, workflow);

      // Execute connected cards based on connections
      await this.executeConnectedCards(triggerCard.id, workflow, context);

      const duration = Date.now() - context.startTime.getTime();

      logger.info('Workflow execution completed successfully', {
        workflowId: workflow.name,
        executionId,
        duration,
        tenantId: context.tenantId
      });

      return {
        success: true,
        executionId,
        duration,
        output: Object.fromEntries(context.variables),
        cardStates: Object.fromEntries(context.cardStates)
      };

    } catch (error) {
      const atlasError = error instanceof AtlasITError ? error :
        new AtlasITError('WORKFLOW-002', `Workflow execution failed: ${error.message}`, 500);

      logger.error('Workflow execution failed', atlasError, {
        workflowId: workflow.name,
        executionId,
        duration: Date.now() - context.startTime.getTime()
      });

      return {
        success: false,
        executionId,
        error: atlasError,
        duration: Date.now() - context.startTime.getTime(),
        cardStates: Object.fromEntries(context.cardStates)
      };
    }
  }

  /**
   * Execute a workflow card
   */
  private async executeCard(
    card: WorkflowCard,
    context: WorkflowExecutionContext,
    workflow: OktaStyleWorkflow
  ): Promise<any> {
    context.currentCard = card.id;

    logger.debug('Executing workflow card', {
      cardId: card.id,
      cardType: card.type,
      executionId: context.executionId
    });

    try {
      switch (card.type) {
        case 'trigger':
          return await this.executeTriggerCard(card, context);

        case 'condition':
          return await this.executeConditionCard(card, context);

        case 'ifttt':
          return await this.executeIFTTTCard(card, context, workflow);

        case 'connector-action':
          return await this.executeConnectorActionCard(card, context, workflow);

        case 'flow':
          return await this.executeFlowCard(card, context, workflow);

        case 'notification':
          return await this.executeNotificationCard(card, context);

        case 'error':
          return await this.executeErrorCard(card, context);

        default:
          throw new AtlasITError(
            'WORKFLOW-003',
            `Unsupported card type: ${card.type}`,
            400,
            { cardId: card.id, cardType: card.type }
          );
      }
    } catch (error) {
      // Handle circuit breaker
      await this.handleCircuitBreaker(card, error, workflow);

      // Apply retry policy if configured
      if (workflow.errorHandling?.retryPolicy) {
        return await this.retryCardExecution(card, context, workflow, error);
      }

      throw error;
    }
  }

  private async executeTriggerCard(card: WorkflowCard, context: WorkflowExecutionContext): Promise<any> {
    // Validate input against trigger schema
    const schema = z.object(card.config.schema);
    const validatedInput = schema.parse(context.input);

    // Store trigger output
    context.cardStates.set(card.id, {
      status: 'completed',
      output: validatedInput,
      executedAt: new Date()
    });

    // Set outputs in variables
    if (card.outputs) {
      for (const [, variablePath] of Object.entries(card.outputs)) {
        this.setVariableByPath(context.variables, variablePath, validatedInput);
      }
    }

    return validatedInput;
  }

  private async executeConditionCard(card: WorkflowCard, context: WorkflowExecutionContext): Promise<any> {
    const { operator, conditions } = card.config;
    const results: boolean[] = [];

    for (const condition of conditions) {
      const result = this.evaluateCondition(condition, context);
      results.push(result);
    }

    let finalResult: boolean;
    switch (operator) {
      case 'AND':
        finalResult = results.every(r => r);
        break;
      case 'OR':
        finalResult = results.some(r => r);
        break;
      default:
        finalResult = results[0] || false;
    }

    const output = {
      isValid: finalResult,
      results,
      evaluatedAt: new Date()
    };

    context.cardStates.set(card.id, {
      status: 'completed',
      output,
      executedAt: new Date()
    });

    // Set outputs
    if (card.outputs) {
      for (const [key, variablePath] of Object.entries(card.outputs)) {
        if (key === 'isValid') {
          this.setVariableByPath(context.variables, variablePath, finalResult);
        } else if (key === 'enrichedData') {
          this.setVariableByPath(context.variables, variablePath, context.input);
        }
      }
    }

    return output;
  }

  private async executeIFTTTCard(
    card: WorkflowCard,
    context: WorkflowExecutionContext,
    workflow: OktaStyleWorkflow
  ): Promise<any> {
    const { if: ifCondition, then: thenConfig, else: elseConfig } = card.config;

    // Evaluate IF condition
    const conditionResult = this.evaluateExpression(ifCondition, context);

    let actionResult: any;

    if (conditionResult) {
      // Execute THEN branch
      actionResult = await this.executeIFTTTAction(thenConfig, context, workflow);
    } else if (elseConfig) {
      // Execute ELSE branch
      actionResult = await this.executeIFTTTAction(elseConfig, context, workflow);
    }

    context.cardStates.set(card.id, {
      status: 'completed',
      output: {
        conditionResult,
        actionResult,
        executedAt: new Date()
      },
      executedAt: new Date()
    });

    return actionResult;
  }

  private async executeIFTTTAction(
    actionConfig: any,
    context: WorkflowExecutionContext,
    workflow: OktaStyleWorkflow
  ): Promise<any> {
    if (actionConfig.routes) {
      // Route-based action
      for (const route of actionConfig.routes) {
        const routeResult = this.evaluateExpression(route.condition, context);
        if (routeResult) {
          return await this.executeRouteAction(route.action, context, workflow);
        }
      }

      // Default route
      if (actionConfig.default) {
        return await this.executeRouteAction(actionConfig.default, context, workflow);
      }
    } else if (actionConfig.action) {
      // Single action
      return await this.executeRouteAction(actionConfig.action, context, workflow);
    }

    return null;
  }

  private async executeRouteAction(
    actionName: string,
    context: WorkflowExecutionContext,
    workflow: OktaStyleWorkflow
  ): Promise<any> {
    // Find the target card
    const targetCard = workflow.cards.find(card => card.id === actionName);
    if (!targetCard) {
      throw new AtlasITError(
        'WORKFLOW-004',
        `Route target card not found: ${actionName}`,
        400
      );
    }

    return await this.executeCard(targetCard, context, workflow);
  }

  private async executeConnectorActionCard(
    card: WorkflowCard,
    context: WorkflowExecutionContext,
    workflow: OktaStyleWorkflow
  ): Promise<any> {
    const { connector, action, parameters } = card.config;

    const connectorConfig =
      workflow.resources.connectors?.[connector] ?? this.defaultConnectorConfigs[connector];
    if (!connectorConfig) {
      throw new AtlasITError(
        'WORKFLOW-005',
        `Connector not configured: ${connector}`,
        400
      );
    }

    const resolvedConnector = this.resolveConnectorResource(connector, connectorConfig);
    const authTarget = resolvedConnector.authRef ?? connector;
    const authHeaders = await this.authManager.getAuthHeaders(authTarget);

    const interpolatedParams = this.interpolateParameters(parameters ?? {}, context);

    const result = await this.executeConnectorAction(
      resolvedConnector,
      action,
      interpolatedParams,
      authHeaders,
      context,
      workflow.errorHandling?.retryPolicy
    );

    const manifestVersion = this.connectorRegistry[resolvedConnector.id]?.manifest.version;

    context.cardStates.set(card.id, {
      status: 'completed',
      output: result,
      executedAt: new Date(),
      connector: resolvedConnector.id,
      action,
      manifestVersion,
      metadata: resolvedConnector.metadata,
      authTarget,
    });

    return result;
  }

  private async executeFlowCard(
    card: WorkflowCard,
    context: WorkflowExecutionContext,
    workflow: OktaStyleWorkflow
  ): Promise<any> {
    const { steps } = card.config;
    const results: any[] = [];

    for (const step of steps) {
      const stepCard = workflow.cards.find(c => c.id === step.id);
      if (stepCard) {
        const result = await this.executeCard(stepCard, context, workflow);
        results.push(result);
      }
    }

    const output = {
      results,
      completedAt: new Date()
    };

    context.cardStates.set(card.id, {
      status: 'completed',
      output,
      executedAt: new Date()
    });

    return output;
  }

  private async executeNotificationCard(card: WorkflowCard, context: WorkflowExecutionContext): Promise<any> {
    const { type, template, recipients, variables } = card.config;

    // Interpolate recipients and variables
    const interpolatedRecipients = this.interpolateValue(recipients, context);
    const interpolatedVariables = this.interpolateValue(variables, context);

    // Send notification
    const result = await this.sendNotification(type, template, interpolatedRecipients, interpolatedVariables);

    context.cardStates.set(card.id, {
      status: 'completed',
      output: result,
      executedAt: new Date()
    });

    return result;
  }

  private async executeErrorCard(card: WorkflowCard, context: WorkflowExecutionContext): Promise<any> {
    const { actions } = card.config;

    for (const action of actions) {
      await this.executeErrorAction(action, context);
    }

    context.cardStates.set(card.id, {
      status: 'completed',
      executedAt: new Date()
    });
  }

  private async executeConnectedCards(
    fromCardId: string,
    workflow: OktaStyleWorkflow,
    context: WorkflowExecutionContext
  ): Promise<void> {
    const connections = workflow.connections.filter(conn => conn.from === fromCardId);

    for (const connection of connections) {
      // Check connection condition
      if (connection.condition) {
        const conditionResult = this.evaluateExpression(connection.condition, context);
        if (!conditionResult) continue;
      }

      // Find target card
      const targetCard = workflow.cards.find(card => card.id === connection.to);
      if (!targetCard) continue;

      // Execute target card
      await this.executeCard(targetCard, context, workflow);

      // Recursively execute connected cards
      await this.executeConnectedCards(connection.to, workflow, context);
    }
  }

  private evaluateCondition(condition: any, context: WorkflowExecutionContext): boolean {
    switch (condition.type) {
      case 'schema-validation':
        return this.validateSchema(condition.field, condition.schema, context);

      case 'idp-lookup':
        return this.performIdpLookup(condition.resource, condition.field, condition.operator, context);

      case 'expression':
        return this.evaluateExpression(condition.expression, context);

      default:
        return false;
    }
  }

  private validateSchema(field: string, schemaName: string, context: WorkflowExecutionContext): boolean {
    // Simplified schema validation - in real implementation, you'd load and validate against JSON schema
    const value = this.getVariableByPath(context.variables, field);
    return value !== undefined && value !== null;
  }

  private performIdpLookup(resource: string, field: string, operator: string, context: WorkflowExecutionContext): boolean {
    // Simplified IdP lookup - in real implementation, you'd query the IdP
    const value = this.getVariableByPath(context.variables, field);
    return operator === 'exists' ? (value !== undefined && value !== null) : false;
  }

  private evaluateExpression(expression: string, context: WorkflowExecutionContext): boolean {
    // Simple expression evaluation - replace with proper expression parser
    try {
      const interpolated = this.interpolateValue(expression, context);
      // Very basic evaluation - in production, use a proper expression engine
      return eval(interpolated) === true;
    } catch (error) {
      logger.warn('Expression evaluation failed', { expression, error: error.message });
      return false;
    }
  }

  private interpolateParameters(parameters: Record<string, any>, context: WorkflowExecutionContext): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(parameters)) {
      result[key] = this.interpolateValue(value, context);
    }

    return result;
  }

  private interpolateValue(value: any, context: WorkflowExecutionContext): any {
    if (typeof value === 'string') {
      return value.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        return this.getVariableByPath(context.variables, path) || match;
      });
    } else if (Array.isArray(value)) {
      return value.map(item => this.interpolateValue(item, context));
    } else if (typeof value === 'object' && value !== null) {
      const result: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = this.interpolateValue(val, context);
      }
      return result;
    }

    return value;
  }

  private getVariableByPath(variables: Map<string, any>, path: string): any {
    const parts = path.split('.');
    let current: any = Object.fromEntries(variables);

    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  private setVariableByPath(variables: Map<string, any>, path: string, value: any): void {
    const parts = path.split('.');
    const lastPart = parts.pop();
    if (!lastPart) return;

    let current: any = Object.fromEntries(variables);

    for (const part of parts) {
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }

    current[lastPart] = value;

    // Update the map
    for (const [key, val] of Object.entries(current)) {
      variables.set(key, val);
    }
  }

  private async executeConnectorAction(
    resource: ResolvedConnectorResource,
    action: string,
    parameters: Record<string, any>,
    authHeaders: Record<string, string>,
    executionContext: WorkflowExecutionContext,
    retryPolicy?: WorkflowRetryPolicyConfig
  ): Promise<any> {
    const connector = this.connectorRegistry[resource.id];
    if (!connector) {
      throw new AtlasITError(
        'WORKFLOW-006',
        `Connector not registered: ${resource.id}`,
        400,
        { connector: resource.id }
      );
    }

    const handler = connector.actions[action];
    if (!handler) {
      throw new AtlasITError(
        'WORKFLOW-007',
        `Connector action not supported: ${action}`,
        400,
        { connector: resource.id, action }
      );
    }

    const retryOptions = this.mergeRetryOptions(
      this.toRetryOptions(retryPolicy),
      resource.retry
    );

    const connectorContext: ConnectorContext = {
      tenantId: executionContext.tenantId,
      authHeaders,
      fetchImpl: this.fetchImpl,
      retryOptions,
      metadata: resource.metadata,
    };

    const invokeHandler = async () => {
      return handler(parameters, connectorContext);
    };

    logger.info('Executing connector action', {
      connector: resource.id,
      action,
      executionId: executionContext.executionId,
      parameterKeys: Object.keys(parameters || {}),
      metadata: resource.metadata,
    });

    let result: any;

    if (retryOptions) {
      const { shouldRetry, onRetry, ...retryConfig } = retryOptions;
      result = await retryWithBackoff(invokeHandler, {
        ...retryConfig,
        shouldRetry:
          shouldRetry ?? ((error, attempt) => this.isRetriableConnectorError(error)),
        onRetry: (error, attempt, delayMs) => {
          logger.warn('Retrying connector action', {
            connector: resource.id,
            action,
            attempt,
            delayMs,
            executionId: executionContext.executionId,
            error: (error as Error)?.message,
          });
          if (onRetry) {
            onRetry(error, attempt, delayMs);
          }
        },
      });
    } else {
      result = await invokeHandler();
    }

    logger.info('Connector action completed', {
      connector: resource.id,
      action,
      executionId: executionContext.executionId,
      metadata: resource.metadata,
    });

    return result;
  }

  private resolveConnectorResource(
    connectorKey: string,
    resource: ConnectorResourceConfig
  ): ResolvedConnectorResource {
    if (typeof resource === 'string') {
      return { id: resource };
    }

    if (resource && typeof resource === 'object' && 'id' in resource && typeof resource.id === 'string') {
      return {
        id: resource.id,
        metadata: resource.metadata,
        authRef: resource.authRef,
        retry: resource.retry,
      };
    }

    throw new AtlasITError(
      'WORKFLOW-008',
      `Invalid connector resource configuration for: ${connectorKey}`,
      400,
      { resource }
    );
  }

  private mergeRetryOptions(base?: RetryOptions, override?: RetryOptions): RetryOptions | undefined {
    if (!base && !override) {
      return undefined;
    }

    return {
      ...base,
      ...override,
    };
  }

  private toRetryOptions(policy?: WorkflowRetryPolicyConfig): RetryOptions | undefined {
    if (!policy) {
      return undefined;
    }

    return {
      maxAttempts: policy.maxAttempts,
      baseDelayMs: policy.backoffMs,
      factor: policy.exponential ? 2 : 1,
      jitter: 'full',
    };
  }

  private isRetriableConnectorError(error: unknown): boolean {
    if (error instanceof AtlasITError) {
      return error.statusCode >= 500;
    }

    if (error && typeof error === 'object') {
      const status = (error as { status?: number; statusCode?: number }).status ??
        (error as { status?: number; statusCode?: number }).statusCode;
      if (typeof status === 'number') {
        return status >= 500;
      }
    }

    return true;
  }

  private async sendNotification(
    type: string,
    template: string,
    recipients: string[],
    variables: Record<string, any>
  ): Promise<any> {
    // Simplified notification sending
    logger.info('Sending notification', { type, template, recipients, variables: Object.keys(variables) });

    return {
      success: true,
      type,
      template,
      recipients,
      sentAt: new Date()
    };
  }

  private async executeErrorAction(action: any, context: WorkflowExecutionContext): Promise<void> {
    switch (action.type) {
      case 'notification': {
        await this.sendNotification('email', action.template, action.recipients, {});
        break;
      }
      case 'log': {
        const level = action.level || 'error';
        if (level === 'error') {
          logger.error(action.message, { executionId: context.executionId });
        } else if (level === 'warn') {
          logger.warn(action.message, { executionId: context.executionId });
        } else {
          logger.info(action.message, { executionId: context.executionId });
        }
        break;
      }
    }
  }

  private async handleCircuitBreaker(card: WorkflowCard, error: any, workflow: OktaStyleWorkflow): Promise<void> {
    const circuitBreaker = workflow.errorHandling?.circuitBreaker;
    if (!circuitBreaker) return;

    const key = `${card.id}:${card.type}`;
    const breaker = this.circuitBreakers.get(key) || { failures: 0, lastFailure: new Date(), isOpen: false };

    breaker.failures++;
    breaker.lastFailure = new Date();

    if (breaker.failures >= circuitBreaker.failureThreshold) {
      breaker.isOpen = true;
      logger.warn('Circuit breaker opened', { cardId: card.id, failures: breaker.failures });
    }

    this.circuitBreakers.set(key, breaker);
  }

  private async retryCardExecution(
    card: WorkflowCard,
    context: WorkflowExecutionContext,
    workflow: OktaStyleWorkflow,
    originalError: any
  ): Promise<any> {
    const retryPolicy = workflow.errorHandling!.retryPolicy!;
    let lastError = originalError;

    for (let attempt = 1; attempt <= retryPolicy.maxAttempts; attempt++) {
      try {
        logger.info('Retrying card execution', { cardId: card.id, attempt, maxAttempts: retryPolicy.maxAttempts });
        return await this.executeCard(card, context, workflow);
      } catch (error) {
        lastError = error;
        if (attempt < retryPolicy.maxAttempts) {
          const delay = retryPolicy.exponential
            ? retryPolicy.backoffMs * Math.pow(2, attempt - 1)
            : retryPolicy.backoffMs;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export interface WorkflowExecutionResult {
  success: boolean;
  executionId: string;
  duration: number;
  output?: Record<string, any>;
  error?: AtlasITError;
  cardStates: Record<string, any>;
}
