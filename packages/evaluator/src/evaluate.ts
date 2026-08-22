import type { Edge, Graph, Node } from '@fbp/types';

import type { EvaluateOptions,NodeDefinitionWithImpl } from './types';

/**
 * Build a definition map key from context, category, and name.
 */
function defKey(context: string, category: string, name: string): string {
  return `${context}:${category}:${name}`;
}

/**
 * Parse a node type (e.g., 'math:add' or 'const/string') into [category, name].
 * Colon is the canonical separator (category:name); slash is checked as fallback
 * for legacy graph files. Boundary nodes (no separator) default to ['core', type].
 */
function parseTaskIdentifier(type: string): [string, string] {
  const colonIdx = type.indexOf(':');
  if (colonIdx !== -1) return [type.slice(0, colonIdx), type.slice(colonIdx + 1)];
  const slashIdx = type.indexOf('/');
  if (slashIdx !== -1) return [type.slice(0, slashIdx), type.slice(slashIdx + 1)];
  return ['core', type];
}

/**
 * Evaluate a graph starting from the specified output node/port.
 * Uses lazy evaluation - only evaluates nodes that are needed for the output.
 * Fully async to support async node implementations.
 * 
 * @param graph - The graph to evaluate
 * @param options - Evaluation options including definitions, output node/port, and external inputs
 * @returns Promise resolving to the value at the specified output port
 */
export async function evaluate(graph: Graph, options: EvaluateOptions): Promise<any> {
  const { definitions, outputNode, outputPort, inputs = {}, props = {} } = options;

  // Build lookup maps
  const nodeMap = new Map<string, Node>();
  for (const node of graph.nodes) {
    nodeMap.set(node.name, node);
  }

  const defMap = new Map<string, NodeDefinitionWithImpl>();
  for (const def of definitions) {
    defMap.set(defKey(def.context, def.category, def.name), def);
  }

  // Graph-level context used as default for node lookups
  const graphContext = graph.context || '';

  // Build edge lookup: destination node -> destination port -> edges (in array order)
  const edgesByDst = new Map<string, Map<string, Edge[]>>();
  for (const edge of graph.edges) {
    const dstNode = edge.dst.node;
    const dstPort = edge.dst.port;
    
    if (!edgesByDst.has(dstNode)) {
      edgesByDst.set(dstNode, new Map());
    }
    const portMap = edgesByDst.get(dstNode)!;
    if (!portMap.has(dstPort)) {
      portMap.set(dstPort, []);
    }
    portMap.get(dstPort)!.push(edge);
  }

  // Cache for evaluated node outputs to avoid re-evaluation
  const cache = new Map<string, Record<string, any>>();

  /**
   * Recursively evaluate a node and return all its outputs.
   * Fully async to support async node implementations.
   */
  async function evaluateNode(nodeName: string): Promise<Record<string, any>> {
    // Check cache first
    if (cache.has(nodeName)) {
      return cache.get(nodeName)!;
    }

    const node = nodeMap.get(nodeName);
    if (!node) {
      throw new Error(`Node not found: ${nodeName}`);
    }

    // Handle system nodes (graphInput, graphOutput, graphProp)
    // System nodes are identified by their type name — reserved, no definition lookup needed
    if (node.type === 'graphInput') {
      // Get the port name from the portName property
      const portNameProp = node.props?.find(p => p.name === 'portName');
      const inputName = (portNameProp?.value as string) || nodeName;
      // Check external inputs first, then fall back to node's default prop
      let value = inputs[inputName];
      if (value === undefined) {
        const defaultProp = node.props?.find(p => p.name === 'default');
        value = defaultProp?.value;
      }
      const result = { value };
      cache.set(nodeName, result);
      return result;
    }

    if (node.type === 'graphProp') {
      // Get the prop name from the propName property
      const propNameProp = node.props?.find(p => p.name === 'propName');
      const propName = (propNameProp?.value as string) || nodeName;
      const value = props[propName];
      const result = { value };
      cache.set(nodeName, result);
      return result;
    }

    if (node.type === 'graphOutput') {
      // graphOutput is a pass-through: evaluate its upstream 'value' input
      const portEdges = edgesByDst.get(nodeName);
      const edges = portEdges?.get('value') ?? [];
      let value: any = undefined;
      if (edges.length > 0) {
        const edge = edges[0];
        const upstreamOutputs = await evaluateNode(edge.src.node);
        value = upstreamOutputs[edge.src.port];
      }
      const result = { value };
      cache.set(nodeName, result);
      return result;
    }

    // Handle subnet nodes (type: 'subnet' with inline nodes/edges)
    if (node.type === 'subnet' && node.nodes && node.edges) {
      // Collect inputs for the subnet by evaluating upstream nodes
      const subnetInputs: Record<string, any> = {};
      const subnetPortEdges = edgesByDst.get(nodeName);
      
      if (node.inputs && subnetPortEdges) {
        for (const inputPort of node.inputs) {
          const edges = subnetPortEdges.get(inputPort.name) ?? [];
          if (edges.length > 0) {
            const edge = edges[0];
            const upstreamOutputs = await evaluateNode(edge.src.node);
            subnetInputs[inputPort.name] = upstreamOutputs[edge.src.port];
          }
        }
      }
      
      // Find the output boundary nodes in the subnet
      const subnetOutputs: Record<string, any> = {};
      
      if (node.outputs) {
        for (const outputPort of node.outputs) {
          // Find the graphOutput boundary node by matching portName property
          const outputBoundaryNode = node.nodes.find(n => {
            if (n.type !== 'graphOutput') return false;
            const portNameProp = n.props?.find(p => p.name === 'portName');
            return (portNameProp?.value as string) === outputPort.name;
          });
          
          if (!outputBoundaryNode) {
            throw new Error(`Output boundary node not found for port: ${outputPort.name}`);
          }
          
          // Recursively evaluate the subnet's internal graph
          const subnetResult = await evaluate(
            {
              name: `${nodeName}_subnet`,
              context: graphContext || undefined,
              nodes: node.nodes,
              edges: node.edges
            },
            {
              definitions,
              outputNode: outputBoundaryNode.name,
              outputPort: 'value',
              inputs: subnetInputs
            }
          );
          
          subnetOutputs[outputPort.name] = subnetResult;
        }
      }
      
      cache.set(nodeName, subnetOutputs);
      return subnetOutputs;
    }

    // Get the definition for this node — resolve context from node override or graph default
    const nodeContext = node.context || graphContext;
    const [nodeCategory, nodeDefName] = parseTaskIdentifier(node.type);
    const definition = defMap.get(defKey(nodeContext, nodeCategory, nodeDefName));
    if (!definition) {
      throw new Error(`No definition found for node: ${nodeContext}:${node.type}`);
    }

    // Collect inputs by evaluating upstream nodes
    const nodeInputs: Record<string, any> = {};
    const portEdges = edgesByDst.get(nodeName);

    /**
     * A branch emits only the port it took, so an edge out of the arm it did not
     * take is an edge whose source port is *absent* — not one carrying
     * `undefined`, which a node may legitimately produce. A node fed by such an
     * edge on a required input is not runnable, and the preview says so the way
     * the runtime does: the node produces no outputs at all, which leaves the
     * arm dark for everything downstream of it and lets a `flow:merge` further
     * on run on whichever arm did arrive. Optional inputs absorb the absence
     * instead, which is what makes reconvergence expressible.
     */
    const notTaken = (outputs: Record<string, any>, port: string) => !(port in outputs);
    const skipped: Record<string, any> = {};

    const declaredPortNames = new Set<string>();
    if (definition.inputs) {
      for (const inputPort of definition.inputs) {
        declaredPortNames.add(inputPort.name);
        const edges = portEdges?.get(inputPort.name) ?? [];
        
        if (inputPort.multi) {
          const arrived = await Promise.all(edges.map(async edge => {
            const upstreamOutputs = await evaluateNode(edge.src.node);
            return notTaken(upstreamOutputs, edge.src.port)
              ? undefined
              : { value: upstreamOutputs[edge.src.port] };
          }));
          const values = arrived.filter((slot): slot is { value: any } => slot !== undefined);
          if (edges.length > 0 && values.length === 0 && !inputPort.optional) {
            cache.set(nodeName, skipped);
            return skipped;
          }
          nodeInputs[inputPort.name] = values.map((slot) => slot.value);
        } else {
          if (edges.length > 0) {
            const edge = edges[0];
            const upstreamOutputs = await evaluateNode(edge.src.node);
            if (notTaken(upstreamOutputs, edge.src.port)) {
              if (!inputPort.optional) {
                cache.set(nodeName, skipped);
                return skipped;
              }
            } else {
              nodeInputs[inputPort.name] = upstreamOutputs[edge.src.port];
            }
          }
        }
      }
    }

    // Dynamic inputs: collect any edges targeting ports not declared in definition.inputs
    if (portEdges) {
      for (const [portName, edges] of portEdges) {
        if (!declaredPortNames.has(portName) && edges.length > 0) {
          const edge = edges[0];
          const upstreamOutputs = await evaluateNode(edge.src.node);
          if (notTaken(upstreamOutputs, edge.src.port)) {
            cache.set(nodeName, skipped);
            return skipped;
          }
          nodeInputs[portName] = upstreamOutputs[edge.src.port];
        }
      }
    }

    // Get props from node instance (override definition defaults)
    const nodeProps: Record<string, any> = {};
    if (definition.props) {
      for (const propDef of definition.props) {
        const instanceProp = node.props?.find(p => p.name === propDef.name);
        if (instanceProp !== undefined && instanceProp.value !== undefined) {
          nodeProps[propDef.name] = instanceProp.value;
        } else if (propDef.default !== undefined) {
          nodeProps[propDef.name] = propDef.default;
        }
      }
    }

    // Digital asset: definition has an internal graph — evaluate it recursively
    if (definition.graph) {
      const assetGraph = definition.graph;

      // Find all output boundary nodes in the asset's graph
      const assetOutputs: Record<string, any> = {};
      const outputBoundaryNodes = assetGraph.nodes.filter(n => n.type === 'graphOutput');

      for (const outputBoundaryNode of outputBoundaryNodes) {
        const portNameProp = outputBoundaryNode.props?.find(p => p.name === 'portName');
        const portName = (portNameProp?.value as string) || outputBoundaryNode.name;

        const result = await evaluate(
          { name: `${nodeName}_asset`, context: assetGraph.context, nodes: assetGraph.nodes, edges: assetGraph.edges },
          { definitions, outputNode: outputBoundaryNode.name, outputPort: 'value', inputs: nodeInputs, props: nodeProps }
        );

        assetOutputs[portName] = result;
      }

      cache.set(nodeName, assetOutputs);
      return assetOutputs;
    }

    // Leaf node: call the implementation function
    if (!definition.impl) {
      throw new Error(`No implementation found for node: ${nodeContext}:${node.type}`);
    }

    const outputs = await definition.impl(nodeInputs, nodeProps);
    
    cache.set(nodeName, outputs);
    return outputs;
  }

  // Evaluate starting from the output node
  const outputs = await evaluateNode(outputNode);
  return outputs[outputPort];
}
