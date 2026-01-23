"use strict";
/**
 * @fbp/spec - Graph Manipulation API
 *
 * Pure functions for manipulating graphs using path-based addressing.
 * All functions are immutable - they return new graphs without modifying the original.
 *
 * Path format: "/" for root, "/nodeName" for root-level node, "/parent/child" for nested
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePath = parsePath;
exports.joinPath = joinPath;
exports.getParentPath = getParentPath;
exports.getNodeName = getNodeName;
exports.isRootPath = isRootPath;
exports.getNode = getNode;
exports.getNodes = getNodes;
exports.getEdges = getEdges;
exports.insertNode = insertNode;
exports.removeNode = removeNode;
exports.renameNode = renameNode;
exports.moveNode = moveNode;
exports.setProps = setProps;
exports.getProps = getProps;
exports.removeProp = removeProp;
exports.addEdge = addEdge;
exports.removeEdge = removeEdge;
exports.setMeta = setMeta;
exports.setPosition = setPosition;
exports.findNodes = findNodes;
exports.findBoundaryNodes = findBoundaryNodes;
exports.hasNode = hasNode;
exports.countNodes = countNodes;
// =============================================================================
// PATH UTILITIES
// =============================================================================
/**
 * Parse a path string into segments.
 * "/" -> []
 * "/foo" -> ["foo"]
 * "/foo/bar" -> ["foo", "bar"]
 */
function parsePath(path) {
    if (path === '/' || path === '')
        return [];
    const normalized = path.startsWith('/') ? path.slice(1) : path;
    return normalized.split('/').filter(Boolean);
}
/**
 * Join path segments into a path string.
 * [] -> "/"
 * ["foo"] -> "/foo"
 * ["foo", "bar"] -> "/foo/bar"
 */
function joinPath(segments) {
    if (segments.length === 0)
        return '/';
    return '/' + segments.join('/');
}
/**
 * Get the parent path.
 * "/" -> "/"
 * "/foo" -> "/"
 * "/foo/bar" -> "/foo"
 */
function getParentPath(path) {
    const segments = parsePath(path);
    if (segments.length === 0)
        return '/';
    return joinPath(segments.slice(0, -1));
}
/**
 * Get the node name from a path.
 * "/" -> null
 * "/foo" -> "foo"
 * "/foo/bar" -> "bar"
 */
function getNodeName(path) {
    const segments = parsePath(path);
    if (segments.length === 0)
        return null;
    return segments[segments.length - 1];
}
/**
 * Check if a path is the root.
 */
function isRootPath(path) {
    return path === '/' || path === '';
}
// =============================================================================
// NODE ACCESS
// =============================================================================
/**
 * Get a node by path.
 * Returns null if not found.
 */
function getNode(graph, path) {
    const segments = parsePath(path);
    if (segments.length === 0)
        return null;
    let nodes = graph.nodes;
    for (let i = 0; i < segments.length; i++) {
        const name = segments[i];
        const node = nodes.find(n => n.name === name);
        if (!node)
            return null;
        if (i === segments.length - 1) {
            return node;
        }
        if (!node.nodes)
            return null;
        nodes = node.nodes;
    }
    return null;
}
/**
 * Get all nodes at a scope (path).
 * "/" returns root-level nodes.
 */
function getNodes(graph, path) {
    if (isRootPath(path)) {
        return graph.nodes;
    }
    const node = getNode(graph, path);
    return node?.nodes || [];
}
/**
 * Get all edges at a scope (path).
 * "/" returns root-level edges.
 */
function getEdges(graph, path) {
    if (isRootPath(path)) {
        return graph.edges;
    }
    const node = getNode(graph, path);
    return node?.edges || [];
}
// =============================================================================
// NODE MUTATIONS
// =============================================================================
/**
 * Insert a node at a scope.
 *
 * @param graph - The graph to modify
 * @param scopePath - The scope to insert into ("/" for root, "/parent" for inside parent)
 * @param node - The node to insert
 * @returns New graph with the node inserted
 */
function insertNode(graph, scopePath, node) {
    if (isRootPath(scopePath)) {
        return {
            ...graph,
            nodes: [...graph.nodes, node]
        };
    }
    return updateNodeAtPath(graph, scopePath, parent => ({
        ...parent,
        nodes: [...(parent.nodes || []), node]
    }));
}
/**
 * Remove a node by path.
 * Also removes any edges connected to the node.
 *
 * @param graph - The graph to modify
 * @param nodePath - The path to the node to remove
 * @returns New graph with the node removed
 */
function removeNode(graph, nodePath) {
    const segments = parsePath(nodePath);
    if (segments.length === 0)
        return graph;
    const nodeName = segments[segments.length - 1];
    const scopePath = getParentPath(nodePath);
    if (isRootPath(scopePath)) {
        return {
            ...graph,
            nodes: graph.nodes.filter(n => n.name !== nodeName),
            edges: graph.edges.filter(e => e.src.node !== nodeName && e.dst.node !== nodeName)
        };
    }
    return updateNodeAtPath(graph, scopePath, parent => ({
        ...parent,
        nodes: (parent.nodes || []).filter(n => n.name !== nodeName),
        edges: (parent.edges || []).filter(e => e.src.node !== nodeName && e.dst.node !== nodeName)
    }));
}
/**
 * Rename a node.
 * Also updates any edges that reference the node.
 *
 * @param graph - The graph to modify
 * @param nodePath - The path to the node to rename
 * @param newName - The new name for the node
 * @returns New graph with the node renamed
 */
function renameNode(graph, nodePath, newName) {
    const segments = parsePath(nodePath);
    if (segments.length === 0)
        return graph;
    const oldName = segments[segments.length - 1];
    const scopePath = getParentPath(nodePath);
    const updateEdgeRefs = (edges) => edges.map(e => ({
        ...e,
        src: e.src.node === oldName ? { ...e.src, node: newName } : e.src,
        dst: e.dst.node === oldName ? { ...e.dst, node: newName } : e.dst
    }));
    if (isRootPath(scopePath)) {
        return {
            ...graph,
            nodes: graph.nodes.map(n => n.name === oldName ? { ...n, name: newName } : n),
            edges: updateEdgeRefs(graph.edges)
        };
    }
    return updateNodeAtPath(graph, scopePath, parent => ({
        ...parent,
        nodes: (parent.nodes || []).map(n => n.name === oldName ? { ...n, name: newName } : n),
        edges: updateEdgeRefs(parent.edges || [])
    }));
}
/**
 * Move a node to a different scope.
 *
 * @param graph - The graph to modify
 * @param fromPath - Current path of the node
 * @param toScopePath - Destination scope path
 * @returns New graph with the node moved
 */
function moveNode(graph, fromPath, toScopePath) {
    const node = getNode(graph, fromPath);
    if (!node)
        return graph;
    // Remove from old location
    let newGraph = removeNode(graph, fromPath);
    // Insert at new location
    newGraph = insertNode(newGraph, toScopePath, node);
    return newGraph;
}
// =============================================================================
// PROPERTY MUTATIONS
// =============================================================================
/**
 * Set properties on a node.
 * Merges with existing props (overwrites by name).
 *
 * @param graph - The graph to modify
 * @param nodePath - The path to the node
 * @param props - Properties to set
 * @returns New graph with properties updated
 */
function setProps(graph, nodePath, props) {
    return updateNodeAtPath(graph, nodePath, node => {
        const existingProps = node.props || [];
        const newPropNames = new Set(props.map(p => p.name));
        const mergedProps = [
            ...existingProps.filter(p => !newPropNames.has(p.name)),
            ...props
        ];
        return { ...node, props: mergedProps };
    });
}
/**
 * Get properties from a node.
 *
 * @param graph - The graph
 * @param nodePath - The path to the node
 * @returns Properties array or empty array if not found
 */
function getProps(graph, nodePath) {
    const node = getNode(graph, nodePath);
    return node?.props || [];
}
/**
 * Remove a property from a node.
 *
 * @param graph - The graph to modify
 * @param nodePath - The path to the node
 * @param propName - The property name to remove
 * @returns New graph with property removed
 */
function removeProp(graph, nodePath, propName) {
    return updateNodeAtPath(graph, nodePath, node => ({
        ...node,
        props: (node.props || []).filter(p => p.name !== propName)
    }));
}
// =============================================================================
// EDGE MUTATIONS
// =============================================================================
/**
 * Add an edge at a scope.
 *
 * @param graph - The graph to modify
 * @param scopePath - The scope to add the edge to
 * @param edge - The edge to add
 * @returns New graph with the edge added
 */
function addEdge(graph, scopePath, edge) {
    if (isRootPath(scopePath)) {
        return {
            ...graph,
            edges: [...graph.edges, edge]
        };
    }
    return updateNodeAtPath(graph, scopePath, parent => ({
        ...parent,
        edges: [...(parent.edges || []), edge]
    }));
}
/**
 * Remove an edge at a scope.
 *
 * @param graph - The graph to modify
 * @param scopePath - The scope containing the edge
 * @param src - Source port reference
 * @param dst - Destination port reference
 * @returns New graph with the edge removed
 */
function removeEdge(graph, scopePath, src, dst) {
    const matchesEdge = (e) => e.src.node === src.node && e.src.port === src.port &&
        e.dst.node === dst.node && e.dst.port === dst.port;
    if (isRootPath(scopePath)) {
        return {
            ...graph,
            edges: graph.edges.filter(e => !matchesEdge(e))
        };
    }
    return updateNodeAtPath(graph, scopePath, parent => ({
        ...parent,
        edges: (parent.edges || []).filter(e => !matchesEdge(e))
    }));
}
// =============================================================================
// META MUTATIONS
// =============================================================================
/**
 * Set metadata on a node (position, description, etc.).
 *
 * @param graph - The graph to modify
 * @param nodePath - The path to the node
 * @param meta - Metadata to set (merged with existing)
 * @returns New graph with metadata updated
 */
function setMeta(graph, nodePath, meta) {
    return updateNodeAtPath(graph, nodePath, node => ({
        ...node,
        meta: { ...node.meta, ...meta }
    }));
}
/**
 * Set position of a node.
 *
 * @param graph - The graph to modify
 * @param nodePath - The path to the node
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns New graph with position updated
 */
function setPosition(graph, nodePath, x, y) {
    return setMeta(graph, nodePath, { x, y });
}
// =============================================================================
// INTERNAL HELPERS
// =============================================================================
/**
 * Update a node at a path using an updater function.
 * Internal helper for immutable updates.
 */
function updateNodeAtPath(graph, path, updater) {
    const segments = parsePath(path);
    if (segments.length === 0)
        return graph;
    function updateNodes(nodes, depth) {
        const name = segments[depth];
        return nodes.map(node => {
            if (node.name !== name)
                return node;
            if (depth === segments.length - 1) {
                // This is the target node
                return updater(node);
            }
            // Recurse into children
            if (!node.nodes)
                return node;
            return {
                ...node,
                nodes: updateNodes(node.nodes, depth + 1)
            };
        });
    }
    return {
        ...graph,
        nodes: updateNodes(graph.nodes, 0)
    };
}
// =============================================================================
// QUERY HELPERS
// =============================================================================
/**
 * Find all nodes matching a predicate.
 * Searches recursively through all scopes.
 *
 * @param graph - The graph to search
 * @param predicate - Function to test each node
 * @returns Array of matching nodes with their paths
 */
function findNodes(graph, predicate) {
    const results = [];
    function search(nodes, basePath) {
        for (const node of nodes) {
            const path = basePath === '/' ? `/${node.name}` : `${basePath}/${node.name}`;
            if (predicate(node, path)) {
                results.push({ node, path });
            }
            if (node.nodes) {
                search(node.nodes, path);
            }
        }
    }
    search(graph.nodes, '/');
    return results;
}
/**
 * Find all boundary nodes (inputs, outputs, props) at a scope.
 * Uses type-based detection (node.type === 'graphInput', 'graphOutput', 'graphProp').
 *
 * @param graph - The graph
 * @param scopePath - The scope to search
 * @returns Object with inputs, outputs, and props arrays
 */
function findBoundaryNodes(graph, scopePath) {
    const nodes = getNodes(graph, scopePath);
    return {
        inputs: nodes.filter(n => n.type === 'graphInput'),
        outputs: nodes.filter(n => n.type === 'graphOutput'),
        props: nodes.filter(n => n.type === 'graphProp')
    };
}
/**
 * Check if a node exists at a path.
 */
function hasNode(graph, path) {
    return getNode(graph, path) !== null;
}
/**
 * Count all nodes in the graph (recursive).
 */
function countNodes(graph) {
    function count(nodes) {
        return nodes.reduce((sum, node) => {
            return sum + 1 + (node.nodes ? count(node.nodes) : 0);
        }, 0);
    }
    return count(graph.nodes);
}
