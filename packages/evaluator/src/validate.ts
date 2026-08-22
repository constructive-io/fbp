import type { Edge, Graph, Node, NodeDefinition } from '@fbp/types';

import type { NodeDefinitionWithImpl } from './types';

/**
 * Boundary node types. These are satisfied by the runtime (graphInput/graphProp
 * receive values from the execution payload; graphOutput is a pass-through), so
 * they are never checked for required inputs/props.
 */
const BOUNDARY_TYPES = new Set(['graphInput', 'graphOutput', 'graphProp']);

/**
 * Codes emitted by {@link validateGraph}. Kept in lock-step with the SQL
 * `validate_function_graph` definition-aware checks so the editor pre-flight and
 * the database gate agree on what "invalid" means.
 */
export type GraphValidationErrorCode =
  | 'MISSING_REQUIRED_INPUT'
  | 'MISSING_REQUIRED_PROP';

export interface GraphValidationError {
  code: GraphValidationErrorCode;
  /** The offending node's name (qualified with the subnet/asset path). */
  node: string;
  /** For MISSING_REQUIRED_INPUT: the unconnected required input port. */
  port?: string;
  /** For MISSING_REQUIRED_PROP: the unsupplied required prop. */
  prop?: string;
  message: string;
}

export interface ValidateGraphOptions {
  /**
   * Node definitions available for resolution. These are merged with any
   * definitions embedded on the graph (`graph.definitions`) and on nested
   * digital-asset definitions.
   */
  definitions?: NodeDefinitionWithImpl[];
}

function defKey(context: string, category: string, name: string): string {
  return `${context}:${category}:${name}`;
}

/**
 * Parse a node type (e.g., 'math:add' or 'const/string') into [category, name].
 * Mirrors the evaluator's resolution so pre-flight and evaluation stay aligned.
 */
function parseTaskIdentifier(type: string): [string, string] {
  const colonIdx = type.indexOf(':');
  if (colonIdx !== -1) return [type.slice(0, colonIdx), type.slice(colonIdx + 1)];
  const slashIdx = type.indexOf('/');
  if (slashIdx !== -1) return [type.slice(0, slashIdx), type.slice(slashIdx + 1)];
  return ['core', type];
}

/** Build "dst node -> dst port -> has at least one incoming edge". */
function connectedPorts(edges: Edge[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const edge of edges) {
    let ports = map.get(edge.dst.node);
    if (!ports) {
      ports = new Set();
      map.set(edge.dst.node, ports);
    }
    ports.add(edge.dst.port);
  }
  return map;
}

function nodeHasProp(node: Node, propName: string): boolean {
  const p = node.props?.find(pr => pr.name === propName);
  return p !== undefined && p.value !== undefined && p.value !== null;
}

/**
 * Statically validate a flow graph before publish/execution.
 *
 * Heuristic (intentionally not a proof — see the caveats below) that mirrors the
 * SQL `validate_function_graph` definition-aware pass:
 *
 *  - For every non-boundary node whose definition resolves, each **declared**
 *    input port that is required (`optional !== true`) and non-`multi` must have
 *    at least one incoming edge, else `MISSING_REQUIRED_INPUT`.
 *  - Each definition prop that is `required` and has no `default` must be
 *    supplied by a node instance prop value, else `MISSING_REQUIRED_PROP`.
 *  - Inline `subnet` nodes are checked against their declared interface inputs
 *    and recursed into.
 *  - Digital-asset definitions (definitions carrying an internal `graph`) are
 *    recursed into.
 *
 * Deliberately NOT flagged (kept consistent with the evaluator + SQL):
 *  - `graphInput` / `graphProp` boundaries — supplied at runtime.
 *  - `multi` inputs — zero-or-more, never required.
 *  - Dynamic/undeclared input ports — the evaluator accepts them, so requiredness
 *    is only enforced for declared ports.
 *  - Nodes with no resolvable definition — treated as opaque (may be a runtime
 *    handler), exactly as the SQL validator and evaluator do.
 *
 * @returns the list of validation errors; an empty array means the graph is
 *   statically valid. Never throws.
 */
export function validateGraph(graph: Graph, options: ValidateGraphOptions = {}): GraphValidationError[] {
  const errors: GraphValidationError[] = [];

  const defMap = new Map<string, NodeDefinition>();
  const registerDefs = (defs?: NodeDefinition[]) => {
    if (!defs) return;
    for (const def of defs) {
      const category = def.category ?? 'core';
      defMap.set(defKey(def.context, category, def.name), def);
    }
  };
  registerDefs(options.definitions as NodeDefinition[] | undefined);

  const visit = (g: Graph, pathPrefix: string): void => {
    // Definitions can be embedded per-graph (digital assets carry their own).
    registerDefs(g.definitions);

    const graphContext = g.context || '';
    const connected = connectedPorts(g.edges ?? []);

    for (const node of g.nodes ?? []) {
      if (BOUNDARY_TYPES.has(node.type)) continue;

      const qualifiedName = pathPrefix ? `${pathPrefix}/${node.name}` : node.name;
      const nodeConnected = connected.get(node.name) ?? new Set<string>();

      // Inline subnet: validate against its declared interface, then recurse.
      if (node.type === 'subnet' && node.nodes) {
        for (const port of node.inputs ?? []) {
          if (port.optional === true || port.multi === true) continue;
          if (!nodeConnected.has(port.name)) {
            errors.push({
              code: 'MISSING_REQUIRED_INPUT',
              node: qualifiedName,
              port: port.name,
              message: `Required input "${port.name}" of subnet "${qualifiedName}" is not connected`,
            });
          }
        }
        visit(
          { name: `${node.name}_subnet`, context: graphContext || undefined, nodes: node.nodes, edges: node.edges ?? [] },
          qualifiedName
        );
        continue;
      }

      const nodeContext = node.context || graphContext;
      const [category, name] = parseTaskIdentifier(node.type);
      const definition = defMap.get(defKey(nodeContext, category, name));

      // Unknown definition: opaque node (possibly a runtime handler). Skip —
      // matches the SQL validator + evaluator, which do not require a definition.
      if (!definition) continue;

      for (const port of definition.inputs ?? []) {
        if (port.optional === true || port.multi === true) continue;
        if (!nodeConnected.has(port.name)) {
          errors.push({
            code: 'MISSING_REQUIRED_INPUT',
            node: qualifiedName,
            port: port.name,
            message: `Required input "${port.name}" of node "${qualifiedName}" (${node.type}) is not connected`,
          });
        }
      }

      for (const prop of definition.props ?? []) {
        if (prop.required !== true) continue;
        if (prop.default !== undefined) continue;
        if (!nodeHasProp(node, prop.name)) {
          errors.push({
            code: 'MISSING_REQUIRED_PROP',
            node: qualifiedName,
            prop: prop.name,
            message: `Required prop "${prop.name}" of node "${qualifiedName}" (${node.type}) is not set`,
          });
        }
      }

      // Digital asset: recurse into the definition's internal graph.
      if (definition.graph) {
        visit(definition.graph, qualifiedName);
      }
    }
  };

  visit(graph, '');
  return errors;
}
