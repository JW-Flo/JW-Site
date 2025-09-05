import { logger, AtlasITError } from '@atlasit/shared';
import { FlowWeaveDocument, componentLibrary } from '../core/flowweave';

// NexusCanvas - Visual Workflow Designer
export interface NexusCanvas {
  id: string;
  name: string;
  description?: string;
  nodes: NexusNode[];
  connections: NexusConnection[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  metadata: {
    author: string;
    created: string;
    modified: string;
    version: string;
  };
}

export interface NexusNode {
  id: string;
  type: 'component' | 'trigger' | 'condition' | 'resource' | 'variable';
  componentId?: string; // For component nodes
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  config: Record<string, any>;
  visual: {
    color: string;
    icon: string;
    label: string;
  };
  ports: NexusPort[];
}

export interface NexusPort {
  id: string;
  type: 'input' | 'output';
  label: string;
  dataType: string;
  position: 'top' | 'right' | 'bottom' | 'left';
  connected: boolean;
}

export interface NexusConnection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  style: {
    color: string;
    animated: boolean;
    label?: string;
  };
}

// NexusCanvas Compiler - Converts visual design to FlowWeave
export class NexusCanvasCompiler {
  private readonly canvas: NexusCanvas;

  constructor(canvas: NexusCanvas) {
    this.canvas = canvas;
  }

  compile(): FlowWeaveDocument {
    try {
      logger.info('Compiling NexusCanvas to FlowWeave', { canvasId: this.canvas.id });

      const flowWeave: FlowWeaveDocument = {
        version: '1.0.0',
        metadata: {
          name: this.canvas.name,
          description: this.canvas.description,
          author: this.canvas.metadata.author,
          tags: ['visual-design', 'nexus-canvas'],
          created: this.canvas.metadata.created,
          modified: this.canvas.metadata.modified,
          schema: 'https://atlasit.com/schemas/flowweave/v1.0.0'
        },
        config: {
          timeout: 3600000,
          environment: {}
        },
        resources: this.extractResources(),
        triggers: this.extractTriggers(),
        flows: [this.extractMainFlow()],
        errorHandlers: []
      };

      logger.info('NexusCanvas compilation completed', {
        canvasId: this.canvas.id,
        nodeCount: this.canvas.nodes.length,
        connectionCount: this.canvas.connections.length
      });

      return flowWeave;
    } catch (error) {
      logger.error('NexusCanvas compilation failed', error, { canvasId: this.canvas.id });
      throw new AtlasITError(
        'COMPILATION-001',
        `Failed to compile NexusCanvas: ${error.message}`,
        500,
        { canvasId: this.canvas.id }
      );
    }
  }

  private extractResources(): any[] {
    return this.canvas.nodes
      .filter(node => node.type === 'resource')
      .map(node => ({
        id: node.id,
        type: node.config.resourceType || 'data',
        name: node.visual.label,
        config: node.config
      }));
  }

  private extractTriggers(): any[] {
    return this.canvas.nodes
      .filter(node => node.type === 'trigger')
      .map(node => ({
        id: node.id,
        type: node.config.triggerType || 'manual',
        name: node.visual.label,
        config: node.config,
        enabled: true
      }));
  }

  private extractMainFlow(): any {
    const componentNodes = this.canvas.nodes.filter(node => node.type === 'component');
    const connections = this.canvas.connections;

    // Build dependency graph
    const dependencyGraph = this.buildDependencyGraph(componentNodes, connections);

    // Topological sort to determine execution order
    const executionOrder = this.topologicalSort(dependencyGraph);

    // Convert nodes to FlowWeave steps
    const steps = executionOrder.map(nodeId => {
      const node = componentNodes.find(n => n.id === nodeId);
      if (!node) return null;

      return this.nodeToStep(node);
    }).filter(Boolean);

    return {
      id: `${this.canvas.id}-flow`,
      name: `${this.canvas.name} Flow`,
      description: `Generated from NexusCanvas ${this.canvas.id}`,
      trigger: this.findTriggerNode()?.id || 'manual-trigger',
      steps,
      variables: {},
      outputs: this.extractOutputs(componentNodes)
    };
  }

  private buildDependencyGraph(nodes: NexusNode[], connections: NexusConnection[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    // Initialize graph
    nodes.forEach(node => graph.set(node.id, []));

    // Add dependencies based on connections
    connections.forEach(connection => {
      const sourceNode = nodes.find(n => n.id === connection.sourceNodeId);
      const targetNode = nodes.find(n => n.id === connection.targetNodeId);

      if (sourceNode && targetNode) {
        const dependencies = graph.get(targetNode.id) || [];
        dependencies.push(sourceNode.id);
        graph.set(targetNode.id, dependencies);
      }
    });

    return graph;
  }

  private topologicalSort(graph: Map<string, string[]>): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      if (visiting.has(nodeId)) {
        throw new AtlasITError(
          'GRAPH-001',
          'Circular dependency detected in workflow',
          400,
          { nodeId }
        );
      }

      visiting.add(nodeId);

      const dependencies = graph.get(nodeId) || [];
      dependencies.forEach(visit);

      visiting.delete(nodeId);
      visited.add(nodeId);
      order.push(nodeId);
    };

    // Visit all nodes
    graph.forEach((_, nodeId) => {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    });

    return order;
  }

  private nodeToStep(node: NexusNode): any {
    const component = componentLibrary.get(node.componentId);
    if (!component) {
      throw new AtlasITError(
        'COMPONENT-001',
        `Component not found: ${node.componentId}`,
        400,
        { nodeId: node.id, componentId: node.componentId }
      );
    }

    // Map node config to step inputs
    const inputs: Record<string, any> = {};
    component.inputs.forEach(inputPort => {
      const nodeInput = node.config.inputs?.[inputPort.name];
      if (nodeInput) {
        inputs[inputPort.name] = {
          type: nodeInput.type || 'literal',
          value: nodeInput.value
        };
      }
    });

    // Map outputs
    const outputs: Record<string, any> = {};
    component.outputs.forEach(outputPort => {
      outputs[outputPort.name] = {
        type: 'variable',
        path: `${node.id}_${outputPort.name}`
      };
    });

    return {
      id: node.id,
      name: node.visual.label,
      type: this.mapComponentTypeToStepType(component.category),
      config: {
        componentId: node.componentId,
        ...node.config
      },
      inputs,
      outputs
    };
  }

  private mapComponentTypeToStepType(category: string): string {
    switch (category) {
      case 'identity':
      case 'productivity':
      case 'communication':
      case 'cloud':
        return 'action';
      case 'data':
        return 'transform';
      case 'governance':
        return 'condition';
      default:
        return 'custom';
    }
  }

  private extractOutputs(nodes: NexusNode[]): Record<string, any> {
    const outputs: Record<string, any> = {};

    nodes.forEach(node => {
      if (node.ports.some(port => port.type === 'output' && !this.isPortConnected(port.id))) {
        // This is a final output node
        outputs[node.visual.label.toLowerCase().replace(/\s+/g, '_')] = `{{variables.${node.id}_result}}`;
      }
    });

    return outputs;
  }

  private isPortConnected(portId: string): boolean {
    return this.canvas.connections.some(conn =>
      conn.sourcePortId === portId || conn.targetPortId === portId
    );
  }

  private findTriggerNode(): NexusNode | undefined {
    return this.canvas.nodes.find(node => node.type === 'trigger');
  }
}

// NexusCanvas Validator
export class NexusCanvasValidator {
  validate(canvas: NexusCanvas): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate nodes
    canvas.nodes.forEach(node => {
      if (!node.id) {
        errors.push('Node missing ID');
      }

      if (node.type === 'component' && !node.componentId) {
        errors.push(`Component node ${node.id} missing componentId`);
      }

      // Validate ports
      const inputPorts = node.ports.filter(p => p.type === 'input');
      const outputPorts = node.ports.filter(p => p.type === 'output');

      if (inputPorts.length === 0 && node.type !== 'trigger') {
        errors.push(`Node ${node.id} has no input ports`);
      }

      if (outputPorts.length === 0 && node.type !== 'resource') {
        errors.push(`Node ${node.id} has no output ports`);
      }
    });

    // Validate connections
    canvas.connections.forEach(connection => {
      const sourceNode = canvas.nodes.find(n => n.id === connection.sourceNodeId);
      const targetNode = canvas.nodes.find(n => n.id === connection.targetNodeId);

      if (!sourceNode) {
        errors.push(`Connection ${connection.id} references non-existent source node`);
      }

      if (!targetNode) {
        errors.push(`Connection ${connection.id} references non-existent target node`);
      }

      // Validate port compatibility
      if (sourceNode && targetNode) {
        const sourcePort = sourceNode.ports.find(p => p.id === connection.sourcePortId);
        const targetPort = targetNode.ports.find(p => p.id === connection.targetPortId);

        if (!sourcePort || sourcePort.type !== 'output') {
          errors.push(`Invalid source port in connection ${connection.id}`);
        }

        if (!targetPort || targetPort.type !== 'input') {
          errors.push(`Invalid target port in connection ${connection.id}`);
        }
      }
    });

    // Check for circular dependencies
    try {
      const compiler = new NexusCanvasCompiler(canvas);
      compiler.compile(); // This will throw if there are circular dependencies
    } catch (error) {
      if (error instanceof AtlasITError && error.code === 'GRAPH-001') {
        errors.push('Circular dependency detected in workflow');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// NexusCanvas Auto-layout Engine
export class NexusCanvasAutoLayout {
  layout(canvas: NexusCanvas): NexusCanvas {
    const nodes = [...canvas.nodes];
    const connections = [...canvas.connections];

    // Simple auto-layout algorithm
    const levels = this.assignLevels(nodes, connections);
    const positions = this.calculatePositions(levels);

    // Update node positions
    nodes.forEach(node => {
      const position = positions.get(node.id);
      if (position) {
        node.position = position;
      }
    });

    return {
      ...canvas,
      nodes
    };
  }

  private assignLevels(nodes: NexusNode[], connections: NexusConnection[]): Map<string, number> {
    const levels = new Map<string, number>();
    const visited = new Set<string>();

    const getLevel = (nodeId: string): number => {
      if (levels.has(nodeId)) {
        const level = levels.get(nodeId);
        return level ?? 0;
      }
      if (visited.has(nodeId)) return 0; // Circular dependency fallback

      visited.add(nodeId);

      // Find all nodes that connect to this node (dependencies)
      const dependencies = connections
        .filter(conn => conn.targetNodeId === nodeId)
        .map(conn => conn.sourceNodeId);

      const maxDependencyLevel = dependencies.length > 0
        ? Math.max(...dependencies.map(getLevel))
        : -1;

      const level = maxDependencyLevel + 1;
      levels.set(nodeId, level);

      visited.delete(nodeId);
      return level;
    };

    nodes.forEach(node => getLevel(node.id));
    return levels;
  }

  private calculatePositions(levels: Map<string, number>): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    const levelNodes = new Map<number, string[]>();

    // Group nodes by level
    levels.forEach((level, nodeId) => {
      const nodesAtLevel = levelNodes.get(level) || [];
      nodesAtLevel.push(nodeId);
      levelNodes.set(level, nodesAtLevel);
    });

    // Calculate positions
    levelNodes.forEach((nodeIds, level) => {
      const nodesPerRow = Math.ceil(Math.sqrt(nodeIds.length));
      const spacing = 200;

      nodeIds.forEach((nodeId, index) => {
        const row = Math.floor(index / nodesPerRow);
        const col = index % nodesPerRow;

        positions.set(nodeId, {
          x: col * spacing + level * 300,
          y: row * spacing
        });
      });
    });

    return positions;
  }
}

// Export singleton instances
export const canvasCompiler = new NexusCanvasCompiler({} as NexusCanvas);
export const canvasValidator = new NexusCanvasValidator();
export const canvasAutoLayout = new NexusCanvasAutoLayout();
