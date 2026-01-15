/**
 * @fbp/spec - Storage Types
 * 
 * These types represent the MINIMAL data needed to persist a graph.
 * No derived data, no runtime state - just the canonical source of truth.
 * 
 * Key principle: Boundary nodes (@in/, @out/, @prop/) ARE the interface definition.
 * The inputs/outputs/props arrays are NOT stored - they're derived at runtime.
 */

// =============================================================================
// PRIMITIVES
// =============================================================================

/**
 * Position and optional metadata for visual layout.
 * Only store what's needed to reconstruct the visual state.
 */
export interface NodeMeta {
  x?: number;
  y?: number;
  /** Optional description for documentation */
  description?: string;
}

/**
 * Reference to a port on a node.
 */
export interface PortRef {
  node: string;
  port: string;
}

/**
 * A connection between two ports.
 * Edges are stored per-scope (inside the node that contains them).
 */
export interface Edge {
  src: PortRef;
  dst: PortRef;
  /** Optional channel name for named connections */
  channel?: string;
}

// =============================================================================
// NODE
// =============================================================================

/**
 * A property value on a node instance.
 * Can be a literal value or a reference to another value.
 */
export interface PropValue {
  name: string;
  value: unknown;
  /** If true, value is a reference path (e.g., "@prop/myProp") */
  ref?: boolean;
}

/**
 * A node in the graph.
 * 
 * For subnet nodes (nodes with children), the interface is defined by
 * boundary nodes inside: @in/name, @out/name, @prop/name
 * 
 * NO inputs/outputs/props arrays - those are derived from boundary nodes.
 */
export interface Node {
  /** Unique name within the parent scope */
  name: string;
  /** Node type (references a NodeDefinition) */
  type: string;
  /** Visual position and metadata */
  meta?: NodeMeta;
  /** Property values for this instance */
  props?: PropValue[];
  /** Child nodes (for subnets) */
  nodes?: Node[];
  /** Edges within this scope (for subnets) */
  edges?: Edge[];
}

// =============================================================================
// GRAPH (Top-level)
// =============================================================================

/**
 * A complete graph document.
 * 
 * The graph's interface is defined by boundary nodes at the root level:
 * - @in/name nodes define inputs
 * - @out/name nodes define outputs  
 * - @prop/name nodes define props
 * 
 * NO inputs/outputs/props arrays - those are derived from boundary nodes.
 */
export interface Graph {
  /** Optional name for the graph */
  name?: string;
  /** Root-level nodes */
  nodes: Node[];
  /** Root-level edges */
  edges: Edge[];
  /** Inline node definitions (optional, for self-contained graphs) */
  definitions?: NodeDefinition[];
  /** Optional metadata */
  meta?: NodeMeta;
}

// =============================================================================
// NODE DEFINITIONS
// =============================================================================

/**
 * A port definition on a node type.
 */
export interface PortDef {
  name: string;
  /** Data type (e.g., "string", "number", "any") */
  type?: string;
  /** If true, accepts multiple connections */
  multi?: boolean;
  /** Human-readable description */
  description?: string;
}

/**
 * A property definition on a node type.
 */
export interface PropDef {
  name: string;
  /** Data type */
  type?: string;
  /** Default value */
  default?: unknown;
  /** Human-readable description */
  description?: string;
}

/**
 * Definition of a node type.
 * This is like a "class" that node instances reference.
 */
export interface NodeDefinition {
  /** Unique type identifier (e.g., "math/add", "ui/button") */
  type: string;
  /** Namespace/context (e.g., "math", "ui", "flow") */
  context?: string;
  /** Category for organization in palette */
  category?: string;
  /** Input port definitions */
  inputs?: PortDef[];
  /** Output port definitions */
  outputs?: PortDef[];
  /** Property definitions */
  props?: PropDef[];
  /** Icon identifier */
  icon?: string;
  /** Human-readable description */
  description?: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * A collection of node definitions, typically loaded from a library.
 */
export interface DefinitionLibrary {
  name: string;
  version?: string;
  definitions: NodeDefinition[];
}
