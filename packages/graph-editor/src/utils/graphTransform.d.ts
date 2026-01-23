/**
 * Graph Transformation Utilities
 *
 * Handles conversion between storage format and runtime format.
 *
 * Storage format: Boundary nodes ARE the interface definition.
 *                 - Boundary nodes have normal keys (e.g., 'input_a', 'output_result')
 *                 - The node's `type` property identifies it: 'graphInput', 'graphOutput', 'graphProp'
 *                 - Port/prop names stored as properties: { name: 'portName', value: 'a' }
 *                 No redundant inputs/outputs/props arrays.
 *
 * Runtime format: inputs/outputs/props are DERIVED from boundary nodes.
 *                 This is what the editor works with.
 *
 * The transformation ensures:
 * - Single source of truth (boundary nodes)
 * - No sync issues between boundary nodes and port arrays
 * - Backward compatibility with legacy graphs
 */
import type { Graph, Node, Edge, Port, PropDefinition } from '@fbp/types';
/**
 * Derive input/output ports from boundary nodes in a node list.
 * This is the single source of truth for port definitions.
 *
 * Boundary nodes are identified by their `type` property:
 * - 'graphInput' for input ports
 * - 'graphOutput' for output ports
 *
 * The port name is read from the 'portName' property.
 *
 * @param nodes - List of nodes (may include graphInput/graphOutput boundary nodes)
 * @param type - Which type of ports to derive ('input' or 'output')
 * @returns Array of Port definitions derived from boundary nodes
 */
export declare function deriveBoundaryPorts(nodes: Node[], type: 'input' | 'output'): Port[];
/**
 * Derive prop definitions from graphProp boundary nodes.
 *
 * Boundary nodes are identified by their `type` property being 'graphProp'.
 * The prop name is read from the 'propName' property.
 *
 * @param nodes - List of nodes (may include graphProp boundary nodes)
 * @returns Array of PropDefinition derived from boundary nodes
 */
export declare function deriveBoundaryProps(nodes: Node[]): PropDefinition[];
/**
 * Convert cwd string to path segments.
 * "/" -> []
 * "/subnet1" -> ["subnet1"]
 * "/subnet1/subnet2" -> ["subnet1", "subnet2"]
 */
export declare function cwdToPath(cwd: string): string[];
/**
 * Check if cwd is at root level
 */
export declare function isRootCwd(cwd: string): boolean;
/**
 * Get the parent cwd from a cwd path.
 * "/subnet1/subnet2" -> "/subnet1"
 * "/subnet1" -> "/"
 * "/" -> "/" (can't go above root)
 */
export declare function getParentCwd(cwd: string): string;
/**
 * Get child cwd by appending a node name.
 * "/", "subnet1" -> "/subnet1"
 * "/subnet1", "subnet2" -> "/subnet1/subnet2"
 */
export declare function getChildCwd(cwd: string, nodeName: string): string;
/**
 * Get nodes at a specific scope (cwd) in the graph.
 */
export declare function getNodesAtScope(graph: Graph, cwd: string): Node[];
/**
 * Get edges at a specific scope (cwd) in the graph.
 */
export declare function getEdgesAtScope(graph: Graph, cwd: string): Edge[];
/**
 * Find a node at a specific path in the graph.
 */
export declare function findNodeAtPath(graph: Graph, path: string[]): Node | null;
/**
 * Update nodes at a specific scope in the graph.
 * Returns a new graph with the updated nodes.
 */
export declare function updateNodesAtScope(graph: Graph, cwd: string, updater: (nodes: Node[]) => Node[]): Graph;
/**
 * Update edges at a specific scope in the graph.
 * Returns a new graph with the updated edges.
 */
export declare function updateEdgesAtScope(graph: Graph, cwd: string, updater: (edges: Edge[]) => Edge[]): Graph;
/**
 * Ensure a graph has derived inputs/outputs/props from boundary nodes.
 * This is called when loading a graph to ensure runtime format.
 *
 * For the root graph and all subnets, this:
 * 1. Derives inputs from graphInput boundary nodes
 * 2. Derives outputs from graphOutput boundary nodes
 * 3. Derives props from graphProp boundary nodes
 */
export declare function ensureDerivedPorts(graph: Graph): Graph;
/**
 * Migrate a legacy graph that has inputs/outputs/props but no boundary nodes.
 * This generates the boundary nodes from the port arrays.
 *
 * After migration, the boundary nodes become the source of truth.
 *
 * New boundary nodes use property-based naming:
 * - Node keys are normal identifiers (e.g., 'input_a', 'output_result')
 * - Port/prop names stored as properties: { name: 'portName', value: 'a' }
 */
export declare function migrateLegacyGraph(graph: Graph): Graph;
/**
 * Prepare a graph for storage by stripping derived fields.
 * The boundary nodes remain as the source of truth.
 *
 * Note: We keep inputs/outputs/props in storage for backward compatibility,
 * but they are derived from boundary nodes, not the other way around.
 */
export declare function prepareForStorage(graph: Graph): Graph;
/**
 * Generate a unique ID for an edge based on its endpoints.
 */
export declare function getEdgeId(edge: Edge): string;
/**
 * Generate a unique node ID.
 */
export declare function generateNodeId(): string;
