/**
 * @fbp/spec - Graph Manipulation API
 *
 * Pure functions for manipulating graphs using path-based addressing.
 * All functions are immutable - they return new graphs without modifying the original.
 *
 * Path format: "/" for root, "/nodeName" for root-level node, "/parent/child" for nested
 */
import type { Graph, Node, Edge, PropValue, PortRef } from './types';
/**
 * Parse a path string into segments.
 * "/" -> []
 * "/foo" -> ["foo"]
 * "/foo/bar" -> ["foo", "bar"]
 */
export declare function parsePath(path: string): string[];
/**
 * Join path segments into a path string.
 * [] -> "/"
 * ["foo"] -> "/foo"
 * ["foo", "bar"] -> "/foo/bar"
 */
export declare function joinPath(segments: string[]): string;
/**
 * Get the parent path.
 * "/" -> "/"
 * "/foo" -> "/"
 * "/foo/bar" -> "/foo"
 */
export declare function getParentPath(path: string): string;
/**
 * Get the node name from a path.
 * "/" -> null
 * "/foo" -> "foo"
 * "/foo/bar" -> "bar"
 */
export declare function getNodeName(path: string): string | null;
/**
 * Check if a path is the root.
 */
export declare function isRootPath(path: string): boolean;
/**
 * Get a node by path.
 * Returns null if not found.
 */
export declare function getNode(graph: Graph, path: string): Node | null;
/**
 * Get all nodes at a scope (path).
 * "/" returns root-level nodes.
 */
export declare function getNodes(graph: Graph, path: string): Node[];
/**
 * Get all edges at a scope (path).
 * "/" returns root-level edges.
 */
export declare function getEdges(graph: Graph, path: string): Edge[];
/**
 * Insert a node at a scope.
 *
 * @param graph - The graph to modify
 * @param scopePath - The scope to insert into ("/" for root, "/parent" for inside parent)
 * @param node - The node to insert
 * @returns New graph with the node inserted
 */
export declare function insertNode(graph: Graph, scopePath: string, node: Node): Graph;
/**
 * Remove a node by path.
 * Also removes any edges connected to the node.
 *
 * @param graph - The graph to modify
 * @param nodePath - The path to the node to remove
 * @returns New graph with the node removed
 */
export declare function removeNode(graph: Graph, nodePath: string): Graph;
/**
 * Rename a node.
 * Also updates any edges that reference the node.
 *
 * @param graph - The graph to modify
 * @param nodePath - The path to the node to rename
 * @param newName - The new name for the node
 * @returns New graph with the node renamed
 */
export declare function renameNode(graph: Graph, nodePath: string, newName: string): Graph;
/**
 * Move a node to a different scope.
 *
 * @param graph - The graph to modify
 * @param fromPath - Current path of the node
 * @param toScopePath - Destination scope path
 * @returns New graph with the node moved
 */
export declare function moveNode(graph: Graph, fromPath: string, toScopePath: string): Graph;
/**
 * Set properties on a node.
 * Merges with existing props (overwrites by name).
 *
 * @param graph - The graph to modify
 * @param nodePath - The path to the node
 * @param props - Properties to set
 * @returns New graph with properties updated
 */
export declare function setProps(graph: Graph, nodePath: string, props: PropValue[]): Graph;
/**
 * Get properties from a node.
 *
 * @param graph - The graph
 * @param nodePath - The path to the node
 * @returns Properties array or empty array if not found
 */
export declare function getProps(graph: Graph, nodePath: string): PropValue[];
/**
 * Remove a property from a node.
 *
 * @param graph - The graph to modify
 * @param nodePath - The path to the node
 * @param propName - The property name to remove
 * @returns New graph with property removed
 */
export declare function removeProp(graph: Graph, nodePath: string, propName: string): Graph;
/**
 * Add an edge at a scope.
 *
 * @param graph - The graph to modify
 * @param scopePath - The scope to add the edge to
 * @param edge - The edge to add
 * @returns New graph with the edge added
 */
export declare function addEdge(graph: Graph, scopePath: string, edge: Edge): Graph;
/**
 * Remove an edge at a scope.
 *
 * @param graph - The graph to modify
 * @param scopePath - The scope containing the edge
 * @param src - Source port reference
 * @param dst - Destination port reference
 * @returns New graph with the edge removed
 */
export declare function removeEdge(graph: Graph, scopePath: string, src: PortRef, dst: PortRef): Graph;
/**
 * Set metadata on a node (position, description, etc.).
 *
 * @param graph - The graph to modify
 * @param nodePath - The path to the node
 * @param meta - Metadata to set (merged with existing)
 * @returns New graph with metadata updated
 */
export declare function setMeta(graph: Graph, nodePath: string, meta: Partial<Node['meta']>): Graph;
/**
 * Set position of a node.
 *
 * @param graph - The graph to modify
 * @param nodePath - The path to the node
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns New graph with position updated
 */
export declare function setPosition(graph: Graph, nodePath: string, x: number, y: number): Graph;
/**
 * Find all nodes matching a predicate.
 * Searches recursively through all scopes.
 *
 * @param graph - The graph to search
 * @param predicate - Function to test each node
 * @returns Array of matching nodes with their paths
 */
export declare function findNodes(graph: Graph, predicate: (node: Node, path: string) => boolean): Array<{
    node: Node;
    path: string;
}>;
/**
 * Find all boundary nodes (inputs, outputs, props) at a scope.
 * Uses type-based detection (node.type === 'graphInput', 'graphOutput', 'graphProp').
 *
 * @param graph - The graph
 * @param scopePath - The scope to search
 * @returns Object with inputs, outputs, and props arrays
 */
export declare function findBoundaryNodes(graph: Graph, scopePath: string): {
    inputs: Node[];
    outputs: Node[];
    props: Node[];
};
/**
 * Check if a node exists at a path.
 */
export declare function hasNode(graph: Graph, path: string): boolean;
/**
 * Count all nodes in the graph (recursive).
 */
export declare function countNodes(graph: Graph): number;
