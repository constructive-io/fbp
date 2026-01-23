"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEdgeId = void 0;
exports.GraphProvider = GraphProvider;
exports.useGraph = useGraph;
exports.useSelection = useSelection;
exports.useNavigation = useNavigation;
exports.useScopedGraph = useScopedGraph;
const react_1 = __importStar(require("react"));
const graphTransform_1 = require("../utils/graphTransform");
const types_1 = require("../types");
// Re-export getEdgeId for backward compatibility
var graphTransform_2 = require("../utils/graphTransform");
Object.defineProperty(exports, "getEdgeId", { enumerable: true, get: function () { return graphTransform_2.getEdgeId; } });
// Node dimension constants (must match GraphNode.tsx)
const NODE_WIDTH = 180;
const NODE_HEADER_HEIGHT = 28;
const PORT_HEIGHT = 24;
// Helper to calculate node height based on number of ports
function getNodeHeight(node, definition) {
    // For subnets, derive ports from boundary nodes (identified by type, not prefix)
    const isSubnet = node.nodes && node.nodes.length > 0;
    let inputCount = 0;
    let outputCount = 0;
    if (isSubnet) {
        inputCount = (node.nodes || []).filter(n => n.type === types_1.BOUNDARY_NODE_TYPES.input).length;
        outputCount = (node.nodes || []).filter(n => n.type === types_1.BOUNDARY_NODE_TYPES.output).length;
    }
    else {
        inputCount = (node.inputs || definition?.inputs || []).length;
        outputCount = (node.outputs || definition?.outputs || []).length;
    }
    return NODE_HEADER_HEIGHT + Math.max(inputCount, outputCount, 1) * PORT_HEIGHT + 8;
}
// Check if two rectangles overlap (any intersection counts)
function rectanglesOverlap(rect1, rect2) {
    return rect1.maxX >= rect2.minX && rect1.minX <= rect2.maxX &&
        rect1.maxY >= rect2.minY && rect1.minY <= rect2.maxY;
}
// generateId is kept locally as it's a simple utility
function generateId() {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
// Auto-layout nodes in a layered/hierarchical arrangement
// Inputs on left, outputs on right, other nodes in layers based on dependency depth
function autoLayoutNodes(nodes, edges) {
    const NODE_WIDTH = 180;
    const NODE_SPACING_X = 250;
    const NODE_SPACING_Y = 100;
    const START_X = 50;
    const START_Y = 50;
    // Separate nodes by type (boundary nodes identified by type property, not prefix)
    const inputNodes = nodes.filter(n => n.type === types_1.BOUNDARY_NODE_TYPES.input);
    const outputNodes = nodes.filter(n => n.type === types_1.BOUNDARY_NODE_TYPES.output);
    const propNodes = nodes.filter(n => n.type === types_1.BOUNDARY_NODE_TYPES.prop);
    const regularNodes = nodes.filter(n => !(0, types_1.isBoundaryNodeType)(n.type));
    // Build adjacency map for regular nodes (who depends on whom)
    const nodeDepth = new Map();
    const nodeSet = new Set(regularNodes.map(n => n.name));
    // Initialize all regular nodes with depth 0
    regularNodes.forEach(n => nodeDepth.set(n.name, 0));
    // Compute depth based on incoming edges (BFS-like approach)
    // Depth = max depth of all nodes that feed into this node + 1
    let changed = true;
    let iterations = 0;
    while (changed && iterations < 100) {
        changed = false;
        iterations++;
        edges.forEach(edge => {
            if (nodeSet.has(edge.src.node) && nodeSet.has(edge.dst.node)) {
                const srcDepth = nodeDepth.get(edge.src.node) || 0;
                const dstDepth = nodeDepth.get(edge.dst.node) || 0;
                if (dstDepth <= srcDepth) {
                    nodeDepth.set(edge.dst.node, srcDepth + 1);
                    changed = true;
                }
            }
        });
    }
    // Group regular nodes by depth
    const layers = new Map();
    regularNodes.forEach(n => {
        const depth = nodeDepth.get(n.name) || 0;
        if (!layers.has(depth))
            layers.set(depth, []);
        layers.get(depth).push(n);
    });
    // Calculate number of layers for positioning
    const maxDepth = Math.max(0, ...Array.from(layers.keys()));
    const totalLayers = maxDepth + 3; // +1 for inputs, +1 for outputs, +1 for props
    // Position input nodes (layer 0)
    const positionedInputs = inputNodes.map((n, i) => ({
        ...n,
        meta: { ...n.meta, x: START_X, y: START_Y + i * NODE_SPACING_Y }
    }));
    // Position prop nodes (below inputs)
    const positionedProps = propNodes.map((n, i) => ({
        ...n,
        meta: { ...n.meta, x: START_X, y: START_Y + (inputNodes.length + i) * NODE_SPACING_Y }
    }));
    // Position regular nodes by layer
    const positionedRegular = [];
    for (let depth = 0; depth <= maxDepth; depth++) {
        const layerNodes = layers.get(depth) || [];
        layerNodes.forEach((n, i) => {
            positionedRegular.push({
                ...n,
                meta: { ...n.meta, x: START_X + (depth + 1) * NODE_SPACING_X, y: START_Y + i * NODE_SPACING_Y }
            });
        });
    }
    // Position output nodes (rightmost layer)
    const outputX = START_X + (maxDepth + 2) * NODE_SPACING_X;
    const positionedOutputs = outputNodes.map((n, i) => ({
        ...n,
        meta: { ...n.meta, x: outputX, y: START_Y + i * NODE_SPACING_Y }
    }));
    return [...positionedInputs, ...positionedProps, ...positionedRegular, ...positionedOutputs];
}
function graphReducer(state, action) {
    switch (action.type) {
        case 'SET_GRAPH': {
            // Migrate legacy graphs and ensure derived ports
            const migratedGraph = (0, graphTransform_1.migrateLegacyGraph)(action.graph);
            return {
                ...state,
                graph: migratedGraph,
                definitions: new Map([
                    ...state.definitions,
                    ...(migratedGraph.definitions || []).map(d => [d.type, d])
                ])
            };
        }
        case 'SET_DEFINITIONS': {
            const newDefs = new Map(state.definitions);
            action.definitions.forEach(d => newDefs.set(d.type, d));
            return { ...state, definitions: newDefs };
        }
        case 'ADD_NODE': {
            const newGraph = (0, graphTransform_1.updateNodesAtScope)(state.graph, state.cwd, nodes => [...nodes, action.node]);
            return { ...state, graph: newGraph };
        }
        case 'ADD_BOUNDARY_NODE': {
            const { boundaryType, position } = action;
            // Use type-based boundary node identification (not prefix-based)
            const nodeType = types_1.BOUNDARY_NODE_TYPES[boundaryType];
            // Count existing boundary nodes of this type to generate next number (scope-aware)
            const scopedNodes = (0, graphTransform_1.getNodesAtScope)(state.graph, state.cwd);
            const existingNodes = scopedNodes.filter(n => n.type === nodeType);
            const existingNumbers = existingNodes.map(n => {
                const match = n.name.match(new RegExp(`^${boundaryType}_(\\d+)$`));
                return match ? parseInt(match[1], 10) : 0;
            });
            const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
            const portOrPropName = `${boundaryType}${nextNumber}`;
            const nodeName = `${boundaryType}_${nextNumber}`;
            // Create node with portName/propName as a property (not in the node name)
            const propName = boundaryType === 'prop' ? 'propName' : 'portName';
            const newNode = {
                name: nodeName,
                type: nodeType,
                meta: { x: position.x, y: position.y },
                props: [{ name: propName, type: 'string', value: portOrPropName }]
            };
            // Add node at current scope
            let newGraph = (0, graphTransform_1.updateNodesAtScope)(state.graph, state.cwd, nodes => [...nodes, newNode]);
            // Derive ports from boundary nodes (single source of truth)
            // This replaces the old dual-sync logic - ports are now always derived
            newGraph = (0, graphTransform_1.ensureDerivedPorts)(newGraph);
            return { ...state, graph: newGraph };
        }
        case 'UPDATE_NODE': {
            const updateNodeInList = (nodes) => nodes.map(n => n.name === action.nodeId ? { ...n, ...action.updates } : n);
            const newGraph = (0, graphTransform_1.updateNodesAtScope)(state.graph, state.cwd, updateNodeInList);
            return { ...state, graph: newGraph };
        }
        case 'DELETE_NODES': {
            const nodeIdSet = new Set(action.nodeIds);
            // Delete nodes at current scope
            let newGraph = (0, graphTransform_1.updateNodesAtScope)(state.graph, state.cwd, nodes => nodes.filter(n => !nodeIdSet.has(n.name)));
            // Delete edges that reference deleted nodes at current scope
            newGraph = (0, graphTransform_1.updateEdgesAtScope)(newGraph, state.cwd, edges => edges.filter(e => !nodeIdSet.has(e.src.node) && !nodeIdSet.has(e.dst.node)));
            // Derive ports from remaining boundary nodes (single source of truth)
            // This replaces the old dual-sync logic - ports are now always derived
            newGraph = (0, graphTransform_1.ensureDerivedPorts)(newGraph);
            return {
                ...state,
                graph: newGraph,
                selection: { nodeIds: new Set(), edgeIds: new Set() }
            };
        }
        case 'ADD_EDGE': {
            const newGraph = (0, graphTransform_1.updateEdgesAtScope)(state.graph, state.cwd, edges => [...edges, action.edge]);
            return { ...state, graph: newGraph };
        }
        case 'DELETE_EDGES': {
            const edgeIdSet = new Set(action.edgeIds);
            const newGraph = (0, graphTransform_1.updateEdgesAtScope)(state.graph, state.cwd, edges => edges.filter(e => !edgeIdSet.has((0, graphTransform_1.getEdgeId)(e))));
            return {
                ...state,
                graph: newGraph,
                selection: { ...state.selection, edgeIds: new Set() }
            };
        }
        case 'SET_NODE_PROP': {
            const updateProps = (nodes) => nodes.map(n => {
                if (n.name !== action.nodeId)
                    return n;
                const props = n.props || [];
                const existingIdx = props.findIndex(p => p.name === action.propName);
                const newProp = { name: action.propName, type: typeof action.value, value: action.value };
                const newProps = existingIdx >= 0
                    ? props.map((p, i) => i === existingIdx ? newProp : p)
                    : [...props, newProp];
                return { ...n, props: newProps };
            });
            const newGraph = (0, graphTransform_1.updateNodesAtScope)(state.graph, state.cwd, updateProps);
            return { ...state, graph: newGraph };
        }
        case 'SELECT_NODES': {
            const newNodeSelection = action.additive
                ? new Set([...state.selection.nodeIds, ...action.nodeIds])
                : new Set(action.nodeIds);
            // Clear edge selection when selecting nodes (unless additive)
            const newEdgeSelection = action.additive ? state.selection.edgeIds : new Set();
            return { ...state, selection: { nodeIds: newNodeSelection, edgeIds: newEdgeSelection } };
        }
        case 'SELECT_EDGES': {
            const newEdgeSelection = action.additive
                ? new Set([...state.selection.edgeIds, ...action.edgeIds])
                : new Set(action.edgeIds);
            // Clear node selection when selecting edges (unless additive)
            const newNodeSelection = action.additive ? state.selection.nodeIds : new Set();
            return { ...state, selection: { nodeIds: newNodeSelection, edgeIds: newEdgeSelection } };
        }
        case 'CLEAR_SELECTION':
            return { ...state, selection: { nodeIds: new Set(), edgeIds: new Set() } };
        case 'SELECT_ALL': {
            const nodes = (0, graphTransform_1.getNodesAtScope)(state.graph, state.cwd);
            const edges = (0, graphTransform_1.getEdgesAtScope)(state.graph, state.cwd);
            return {
                ...state,
                selection: {
                    nodeIds: new Set(nodes.map(n => n.name)),
                    edgeIds: new Set(edges.map(graphTransform_1.getEdgeId))
                }
            };
        }
        case 'DUPLICATE_SELECTION': {
            const scopedNodes = (0, graphTransform_1.getNodesAtScope)(state.graph, state.cwd);
            const scopedEdges = (0, graphTransform_1.getEdgesAtScope)(state.graph, state.cwd);
            const selectedNodes = scopedNodes.filter(n => state.selection.nodeIds.has(n.name));
            const nameMap = new Map();
            const duplicatedNodes = selectedNodes.map(n => {
                const newName = `${n.name}_copy_${Date.now().toString(36)}`;
                nameMap.set(n.name, newName);
                return {
                    ...n,
                    name: newName,
                    meta: n.meta ? { ...n.meta, x: (n.meta.x || 0) + 50, y: (n.meta.y || 0) + 50 } : { x: 50, y: 50 }
                };
            });
            const duplicatedEdges = scopedEdges
                .filter(e => state.selection.nodeIds.has(e.src.node) && state.selection.nodeIds.has(e.dst.node))
                .map(e => ({
                src: { node: nameMap.get(e.src.node) || e.src.node, port: e.src.port },
                dst: { node: nameMap.get(e.dst.node) || e.dst.node, port: e.dst.port }
            }));
            let newGraph = (0, graphTransform_1.updateNodesAtScope)(state.graph, state.cwd, nodes => [...nodes, ...duplicatedNodes]);
            newGraph = (0, graphTransform_1.updateEdgesAtScope)(newGraph, state.cwd, edges => [...edges, ...duplicatedEdges]);
            return {
                ...state,
                graph: newGraph,
                selection: { nodeIds: new Set(duplicatedNodes.map(n => n.name)), edgeIds: new Set() }
            };
        }
        case 'COPY_SELECTION': {
            const scopedNodes = (0, graphTransform_1.getNodesAtScope)(state.graph, state.cwd);
            const scopedEdges = (0, graphTransform_1.getEdgesAtScope)(state.graph, state.cwd);
            const selectedNodes = scopedNodes.filter(n => state.selection.nodeIds.has(n.name));
            const selectedEdges = scopedEdges.filter(e => state.selection.nodeIds.has(e.src.node) && state.selection.nodeIds.has(e.dst.node));
            return {
                ...state,
                clipboard: {
                    nodes: selectedNodes.map(n => ({ ...n })),
                    edges: selectedEdges.map(e => ({ ...e }))
                }
            };
        }
        case 'PASTE_SELECTION': {
            if (state.clipboard.nodes.length === 0)
                return state;
            const nameMap = new Map();
            const pastedNodes = state.clipboard.nodes.map(n => {
                const newName = `${n.name}_copy_${Date.now().toString(36)}`;
                nameMap.set(n.name, newName);
                return {
                    ...n,
                    name: newName,
                    meta: n.meta ? { ...n.meta, x: (n.meta.x || 0) + 50, y: (n.meta.y || 0) + 50 } : { x: 50, y: 50 }
                };
            });
            const pastedEdges = state.clipboard.edges.map(e => ({
                src: { node: nameMap.get(e.src.node) || e.src.node, port: e.src.port },
                dst: { node: nameMap.get(e.dst.node) || e.dst.node, port: e.dst.port }
            }));
            let newGraph = (0, graphTransform_1.updateNodesAtScope)(state.graph, state.cwd, nodes => [...nodes, ...pastedNodes]);
            newGraph = (0, graphTransform_1.updateEdgesAtScope)(newGraph, state.cwd, edges => [...edges, ...pastedEdges]);
            return {
                ...state,
                graph: newGraph,
                selection: { nodeIds: new Set(pastedNodes.map(n => n.name)), edgeIds: new Set() }
            };
        }
        case 'COLLAPSE_SELECTION': {
            const selectedNodeIds = state.selection.nodeIds;
            if (selectedNodeIds.size < 1)
                return state;
            const scopedNodes = (0, graphTransform_1.getNodesAtScope)(state.graph, state.cwd);
            const scopedEdges = (0, graphTransform_1.getEdgesAtScope)(state.graph, state.cwd);
            const selectedNodes = scopedNodes.filter(n => selectedNodeIds.has(n.name));
            // Calculate center position for the subnet node
            let sumX = 0, sumY = 0;
            selectedNodes.forEach(n => {
                sumX += n.meta?.x || 0;
                sumY += n.meta?.y || 0;
            });
            const centerX = sumX / selectedNodes.length;
            const centerY = sumY / selectedNodes.length;
            // Categorize edges
            const internalEdges = [];
            const incomingEdges = []; // External -> Selected
            const outgoingEdges = []; // Selected -> External
            scopedEdges.forEach(edge => {
                const srcSelected = selectedNodeIds.has(edge.src.node);
                const dstSelected = selectedNodeIds.has(edge.dst.node);
                if (srcSelected && dstSelected) {
                    internalEdges.push(edge);
                }
                else if (!srcSelected && dstSelected) {
                    incomingEdges.push(edge);
                }
                else if (srcSelected && !dstSelected) {
                    outgoingEdges.push(edge);
                }
            });
            // Find existing boundary nodes in selection (identified by type, not prefix)
            const existingInputs = selectedNodes.filter(n => n.type === types_1.BOUNDARY_NODE_TYPES.input);
            const existingOutputs = selectedNodes.filter(n => n.type === types_1.BOUNDARY_NODE_TYPES.output);
            const existingProps = selectedNodes.filter(n => n.type === types_1.BOUNDARY_NODE_TYPES.prop);
            // Create new boundary nodes for external connections
            const newInputNodes = [];
            const newOutputNodes = [];
            const newInternalEdges = [];
            const subnetExternalEdges = [];
            // Generate unique subnet name
            const existingSubnets = scopedNodes.filter(n => n.kind === 'subnet' || n.name.startsWith('subnet'));
            const subnetNumber = existingSubnets.length + 1;
            const subnetName = `subnet${subnetNumber}`;
            // Process incoming edges - create graphInput nodes (property-based naming)
            let inputCounter = existingInputs.length + 1;
            const incomingPortMap = new Map(); // "dstNode:dstPort" -> inputPortName
            incomingEdges.forEach(edge => {
                const key = `${edge.dst.node}:${edge.dst.port}`;
                if (!incomingPortMap.has(key)) {
                    const inputPortName = `input${inputCounter}`;
                    const inputNodeName = `input_${inputCounter++}`;
                    incomingPortMap.set(key, inputPortName);
                    // Create graphInput node inside subnet (with portName as property)
                    newInputNodes.push({
                        name: inputNodeName,
                        type: types_1.BOUNDARY_NODE_TYPES.input,
                        meta: { x: (edge.dst.node ? (selectedNodes.find(n => n.name === edge.dst.node)?.meta?.x || 0) - 150 : 0), y: selectedNodes.find(n => n.name === edge.dst.node)?.meta?.y || 0 },
                        props: [{ name: 'portName', type: 'string', value: inputPortName }]
                    });
                    // Create internal edge from graphInput to original destination
                    newInternalEdges.push({
                        src: { node: inputNodeName, port: 'value' },
                        dst: { node: edge.dst.node, port: edge.dst.port }
                    });
                }
                // Create external edge from original source to subnet input
                const inputPortName = incomingPortMap.get(key);
                subnetExternalEdges.push({
                    src: { node: edge.src.node, port: edge.src.port },
                    dst: { node: subnetName, port: inputPortName }
                });
            });
            // Process outgoing edges - create graphOutput nodes (property-based naming)
            let outputCounter = existingOutputs.length + 1;
            const outgoingPortMap = new Map(); // "srcNode:srcPort" -> outputPortName
            outgoingEdges.forEach(edge => {
                const key = `${edge.src.node}:${edge.src.port}`;
                if (!outgoingPortMap.has(key)) {
                    const outputPortName = `output${outputCounter}`;
                    const outputNodeName = `output_${outputCounter++}`;
                    outgoingPortMap.set(key, outputPortName);
                    // Create graphOutput node inside subnet (with portName as property)
                    newOutputNodes.push({
                        name: outputNodeName,
                        type: types_1.BOUNDARY_NODE_TYPES.output,
                        meta: { x: (selectedNodes.find(n => n.name === edge.src.node)?.meta?.x || 0) + 150, y: selectedNodes.find(n => n.name === edge.src.node)?.meta?.y || 0 },
                        props: [{ name: 'portName', type: 'string', value: outputPortName }]
                    });
                    // Create internal edge from original source to graphOutput
                    newInternalEdges.push({
                        src: { node: edge.src.node, port: edge.src.port },
                        dst: { node: outputNodeName, port: 'value' }
                    });
                }
                // Create external edge from subnet output to original destination
                const outputPortName = outgoingPortMap.get(key);
                subnetExternalEdges.push({
                    src: { node: subnetName, port: outputPortName },
                    dst: { node: edge.dst.node, port: edge.dst.port }
                });
            });
            // Build subnet inputs/outputs/props from boundary nodes (read portName/propName from properties)
            const getPortName = (n) => {
                const prop = n.props?.find(p => p.name === 'portName');
                return prop?.value || n.name;
            };
            const getPropName = (n) => {
                const prop = n.props?.find(p => p.name === 'propName');
                return prop?.value || n.name;
            };
            const subnetInputs = [
                ...existingInputs.map(n => ({ name: getPortName(n), type: 'any' })),
                ...Array.from(incomingPortMap.values()).map(name => ({ name, type: 'any' }))
            ];
            const subnetOutputs = [
                ...existingOutputs.map(n => ({ name: getPortName(n), type: 'any' })),
                ...Array.from(outgoingPortMap.values()).map(name => ({ name, type: 'any' }))
            ];
            const subnetProps = existingProps.map(n => ({ name: getPropName(n), type: 'any' }));
            // Collect all nodes for the subnet and apply autolayout
            const allSubnetNodes = [...selectedNodes, ...newInputNodes, ...newOutputNodes];
            const allSubnetEdges = [...internalEdges, ...newInternalEdges];
            const layoutedNodes = autoLayoutNodes(allSubnetNodes, allSubnetEdges);
            // Create the subnet node
            const subnetNode = {
                name: subnetName,
                type: 'subnet',
                kind: 'subnet',
                meta: { x: centerX, y: centerY },
                inputs: subnetInputs,
                outputs: subnetOutputs,
                props: subnetProps.map(p => ({ name: p.name, type: p.type, value: undefined })),
                nodes: layoutedNodes,
                edges: allSubnetEdges
            };
            // Remove selected nodes and their edges from current scope, add subnet node
            let newGraph = (0, graphTransform_1.updateNodesAtScope)(state.graph, state.cwd, nodes => {
                const remaining = nodes.filter(n => !selectedNodeIds.has(n.name));
                return [...remaining, subnetNode];
            });
            newGraph = (0, graphTransform_1.updateEdgesAtScope)(newGraph, state.cwd, edges => {
                const remaining = edges.filter(e => !selectedNodeIds.has(e.src.node) && !selectedNodeIds.has(e.dst.node));
                return [...remaining, ...subnetExternalEdges];
            });
            return {
                ...state,
                graph: newGraph,
                selection: { nodeIds: new Set([subnetName]), edgeIds: new Set() }
            };
        }
        case 'LAYOUT_SELECTION': {
            const selectedNodeIds = state.selection.nodeIds;
            if (selectedNodeIds.size < 1)
                return state;
            const scopedNodes = (0, graphTransform_1.getNodesAtScope)(state.graph, state.cwd);
            const scopedEdges = (0, graphTransform_1.getEdgesAtScope)(state.graph, state.cwd);
            const selectedNodes = scopedNodes.filter(n => selectedNodeIds.has(n.name));
            // Get edges that connect selected nodes (for layout algorithm)
            const selectedEdges = scopedEdges.filter(e => selectedNodeIds.has(e.src.node) && selectedNodeIds.has(e.dst.node));
            // Apply autolayout to selected nodes
            const layoutedNodes = autoLayoutNodes(selectedNodes, selectedEdges);
            // Create a map of new positions
            const newPositions = new Map();
            layoutedNodes.forEach(n => {
                newPositions.set(n.name, { x: n.meta?.x || 0, y: n.meta?.y || 0 });
            });
            // Update nodes at current scope with new positions
            const newGraph = (0, graphTransform_1.updateNodesAtScope)(state.graph, state.cwd, nodes => nodes.map(n => {
                const newPos = newPositions.get(n.name);
                if (!newPos)
                    return n;
                return { ...n, meta: { ...n.meta, x: newPos.x, y: newPos.y } };
            }));
            return { ...state, graph: newGraph };
        }
        case 'MOVE_NODES': {
            const nodeIdSet = new Set(action.nodeIds);
            const newGraph = (0, graphTransform_1.updateNodesAtScope)(state.graph, state.cwd, nodes => nodes.map(n => {
                if (!nodeIdSet.has(n.name))
                    return n;
                return {
                    ...n,
                    meta: {
                        ...n.meta,
                        x: (n.meta?.x || 0) + action.delta.x,
                        y: (n.meta?.y || 0) + action.delta.y
                    }
                };
            }));
            return { ...state, graph: newGraph };
        }
        case 'SET_VIEW':
            return { ...state, view: { ...state.view, ...action.view } };
        case 'DIVE_INTO': {
            const scopedNodes = (0, graphTransform_1.getNodesAtScope)(state.graph, state.cwd);
            const node = scopedNodes.find(n => n.name === action.nodeId);
            if (!node || !node.nodes)
                return state;
            // Calculate new cwd: "/" + nodeId or currentCwd + "/" + nodeId
            const newCwd = (0, graphTransform_1.isRootCwd)(state.cwd) ? `/${action.nodeId}` : `${state.cwd}/${action.nodeId}`;
            // Save current state for this path
            const newStateByPath = new Map(state.stateByPath);
            newStateByPath.set(state.cwd, { selection: state.selection, view: state.view });
            // Restore state for the new path if it exists, otherwise use defaults
            const restoredState = state.stateByPath.get(newCwd);
            const newSelection = restoredState?.selection || { nodeIds: new Set(), edgeIds: new Set() };
            const newView = restoredState?.view || { pan: { x: 0, y: 0 }, zoom: 1 };
            return {
                ...state,
                cwd: newCwd,
                selection: newSelection,
                view: newView,
                stateByPath: newStateByPath
            };
        }
        case 'GO_UP': {
            // Can't go up from root
            if ((0, graphTransform_1.isRootCwd)(state.cwd))
                return state;
            // Calculate parent cwd: "/subnet1/subnet2" -> "/subnet1", "/subnet1" -> "/"
            const pathSegments = (0, graphTransform_1.cwdToPath)(state.cwd);
            pathSegments.pop();
            const newCwd = pathSegments.length === 0 ? '/' : '/' + pathSegments.join('/');
            // Save current state for this path
            const newStateByPath = new Map(state.stateByPath);
            newStateByPath.set(state.cwd, { selection: state.selection, view: state.view });
            // Restore state for the parent path if it exists, otherwise use defaults
            const restoredState = state.stateByPath.get(newCwd);
            const newSelection = restoredState?.selection || { nodeIds: new Set(), edgeIds: new Set() };
            const newView = restoredState?.view || { pan: { x: 0, y: 0 }, zoom: 1 };
            return {
                ...state,
                cwd: newCwd,
                selection: newSelection,
                view: newView,
                stateByPath: newStateByPath
            };
        }
        case 'START_CONNECTING':
            return {
                ...state,
                connecting: {
                    active: true,
                    sourceNode: action.nodeId,
                    sourcePort: action.portName,
                    isOutput: action.isOutput
                }
            };
        case 'END_CONNECTING': {
            if (!state.connecting.active || !state.connecting.sourceNode || !state.connecting.sourcePort) {
                return { ...state, connecting: { active: false, sourceNode: null, sourcePort: null, isOutput: false } };
            }
            const edge = state.connecting.isOutput
                ? {
                    src: { node: state.connecting.sourceNode, port: state.connecting.sourcePort },
                    dst: { node: action.nodeId, port: action.portName }
                }
                : {
                    src: { node: action.nodeId, port: action.portName },
                    dst: { node: state.connecting.sourceNode, port: state.connecting.sourcePort }
                };
            const newGraph = (0, graphTransform_1.updateEdgesAtScope)(state.graph, state.cwd, edges => [...edges, edge]);
            return {
                ...state,
                graph: newGraph,
                connecting: { active: false, sourceNode: null, sourcePort: null, isOutput: false }
            };
        }
        case 'CANCEL_CONNECTING':
            return { ...state, connecting: { active: false, sourceNode: null, sourcePort: null, isOutput: false } };
        case 'START_BOX_SELECT':
            return { ...state, boxSelect: { active: true, start: action.start, end: action.start, previewNodeIds: new Set() } };
        case 'UPDATE_BOX_SELECT': {
            const start = state.boxSelect.start;
            const end = action.end;
            if (!start)
                return state;
            // Marquee bounding box
            const marqueeRect = {
                minX: Math.min(start.x, end.x),
                maxX: Math.max(start.x, end.x),
                minY: Math.min(start.y, end.y),
                maxY: Math.max(start.y, end.y)
            };
            const scopedNodes = (0, graphTransform_1.getNodesAtScope)(state.graph, state.cwd);
            const previewNodeIds = new Set(scopedNodes
                .filter(n => {
                const nodeX = n.meta?.x || 0;
                const nodeY = n.meta?.y || 0;
                const definition = state.definitions.get(n.type);
                const nodeHeight = getNodeHeight(n, definition);
                // Node bounding box
                const nodeRect = {
                    minX: nodeX,
                    maxX: nodeX + NODE_WIDTH,
                    minY: nodeY,
                    maxY: nodeY + nodeHeight
                };
                // Select if marquee overlaps with node (any touch counts)
                return rectanglesOverlap(marqueeRect, nodeRect);
            })
                .map(n => n.name));
            return { ...state, boxSelect: { ...state.boxSelect, end, previewNodeIds } };
        }
        case 'MOVE_BOX_SELECT': {
            const { start, end } = state.boxSelect;
            if (!start || !end)
                return state;
            const newStart = { x: start.x + action.delta.x, y: start.y + action.delta.y };
            const newEnd = { x: end.x + action.delta.x, y: end.y + action.delta.y };
            // Marquee bounding box
            const marqueeRect = {
                minX: Math.min(newStart.x, newEnd.x),
                maxX: Math.max(newStart.x, newEnd.x),
                minY: Math.min(newStart.y, newEnd.y),
                maxY: Math.max(newStart.y, newEnd.y)
            };
            const scopedNodes = (0, graphTransform_1.getNodesAtScope)(state.graph, state.cwd);
            const previewNodeIds = new Set(scopedNodes
                .filter(n => {
                const nodeX = n.meta?.x || 0;
                const nodeY = n.meta?.y || 0;
                const definition = state.definitions.get(n.type);
                const nodeHeight = getNodeHeight(n, definition);
                // Node bounding box
                const nodeRect = {
                    minX: nodeX,
                    maxX: nodeX + NODE_WIDTH,
                    minY: nodeY,
                    maxY: nodeY + nodeHeight
                };
                // Select if marquee overlaps with node (any touch counts)
                return rectanglesOverlap(marqueeRect, nodeRect);
            })
                .map(n => n.name));
            return { ...state, boxSelect: { ...state.boxSelect, start: newStart, end: newEnd, previewNodeIds } };
        }
        case 'END_BOX_SELECT': {
            // Use the already-calculated preview nodes for selection
            const previewNodeIds = state.boxSelect.previewNodeIds;
            return {
                ...state,
                boxSelect: { active: false, start: null, end: null, previewNodeIds: new Set() },
                selection: { ...state.selection, nodeIds: previewNodeIds }
            };
        }
        case 'RENAME_NODE': {
            const { oldName, newName } = action;
            if (oldName === newName)
                return state;
            // Check if new name already exists in current scope
            const scopedNodes = (0, graphTransform_1.getNodesAtScope)(state.graph, state.cwd);
            if (scopedNodes.some(n => n.name === newName)) {
                console.warn(`Node with name "${newName}" already exists`);
                return state;
            }
            // Update node name
            let newGraph = (0, graphTransform_1.updateNodesAtScope)(state.graph, state.cwd, nodes => nodes.map(n => n.name === oldName ? { ...n, name: newName } : n));
            // Update edges that reference this node
            newGraph = (0, graphTransform_1.updateEdgesAtScope)(newGraph, state.cwd, edges => edges.map(e => ({
                ...e,
                src: e.src.node === oldName ? { ...e.src, node: newName } : e.src,
                dst: e.dst.node === oldName ? { ...e.dst, node: newName } : e.dst
            })));
            // Derive ports from boundary nodes (single source of truth)
            // This replaces the old dual-sync logic - ports are now always derived
            newGraph = (0, graphTransform_1.ensureDerivedPorts)(newGraph);
            // Update selection if the renamed node was selected
            const newSelection = state.selection.nodeIds.has(oldName)
                ? {
                    ...state.selection,
                    nodeIds: new Set([...state.selection.nodeIds].map(id => id === oldName ? newName : id))
                }
                : state.selection;
            return { ...state, graph: newGraph, selection: newSelection };
        }
        default:
            return state;
    }
}
const initialState = {
    graph: { name: 'untitled', nodes: [], edges: [] },
    definitions: new Map(),
    view: { pan: { x: 0, y: 0 }, zoom: 1 },
    selection: { nodeIds: new Set(), edgeIds: new Set() },
    stateByPath: new Map(),
    clipboard: { nodes: [], edges: [] },
    cwd: '/',
    connecting: { active: false, sourceNode: null, sourcePort: null, isOutput: false },
    boxSelect: { active: false, start: null, end: null, previewNodeIds: new Set() }
};
const GraphContext = (0, react_1.createContext)(null);
function GraphProvider({ children, initialGraph, externalDefinitions, onSelectionChange }) {
    // Migrate legacy graphs on initialization to ensure boundary nodes are the source of truth
    const migratedInitialGraph = initialGraph ? (0, graphTransform_1.migrateLegacyGraph)(initialGraph) : initialState.graph;
    const [state, dispatch] = (0, react_1.useReducer)(graphReducer, {
        ...initialState,
        graph: migratedInitialGraph,
        definitions: new Map([
            ...(migratedInitialGraph.definitions || []).map(d => [d.type, d]),
            ...(externalDefinitions || []).map(d => [d.type, d])
        ])
    });
    // Call onSelectionChange when selection changes
    react_1.default.useEffect(() => {
        if (onSelectionChange) {
            onSelectionChange(Array.from(state.selection.nodeIds));
        }
    }, [state.selection.nodeIds, onSelectionChange]);
    const getDefinition = (0, react_1.useCallback)((type) => state.definitions.get(type), [state.definitions]);
    const getShortName = (0, react_1.useCallback)((type) => {
        const parts = type.split('/');
        return parts[parts.length - 1];
    }, []);
    const isChannelReference = (0, react_1.useCallback)((value) => {
        if (typeof value !== 'string')
            return false;
        return value.startsWith('ch(') || value.startsWith('$');
    }, []);
    return (<GraphContext.Provider value={{ state, dispatch, getDefinition, getShortName, isChannelReference }}>
      {children}
    </GraphContext.Provider>);
}
function useGraph() {
    const context = (0, react_1.useContext)(GraphContext);
    if (!context)
        throw new Error('useGraph must be used within a GraphProvider');
    return context;
}
function useSelection() {
    const { state, dispatch } = useGraph();
    return {
        selection: state.selection,
        selectNodes: (nodeIds, additive = false) => dispatch({ type: 'SELECT_NODES', nodeIds, additive }),
        selectEdges: (edgeIds, additive = false) => dispatch({ type: 'SELECT_EDGES', edgeIds, additive }),
        clearSelection: () => dispatch({ type: 'CLEAR_SELECTION' }),
        selectAll: () => dispatch({ type: 'SELECT_ALL' }),
        duplicateSelection: () => dispatch({ type: 'DUPLICATE_SELECTION' }),
        copySelection: () => dispatch({ type: 'COPY_SELECTION' }),
        pasteSelection: () => dispatch({ type: 'PASTE_SELECTION' }),
        collapseSelection: () => dispatch({ type: 'COLLAPSE_SELECTION' }),
        layoutSelection: () => dispatch({ type: 'LAYOUT_SELECTION' }),
        deleteSelection: () => {
            dispatch({ type: 'DELETE_NODES', nodeIds: Array.from(state.selection.nodeIds) });
            dispatch({ type: 'DELETE_EDGES', edgeIds: Array.from(state.selection.edgeIds) });
        }
    };
}
function useNavigation() {
    const { state, dispatch } = useGraph();
    // Derive navigationStack from cwd: "/" -> [], "/subnet1" -> ["subnet1"], "/subnet1/subnet2" -> ["subnet1", "subnet2"]
    const navigationStack = (0, graphTransform_1.cwdToPath)(state.cwd);
    return {
        cwd: state.cwd,
        currentScope: state.cwd, // Alias for backwards compatibility
        navigationStack,
        diveInto: (nodeId) => dispatch({ type: 'DIVE_INTO', nodeId }),
        goUp: () => dispatch({ type: 'GO_UP' }),
        canGoUp: !(0, graphTransform_1.isRootCwd)(state.cwd)
    };
}
function useScopedGraph() {
    const { state } = useGraph();
    const nodes = (0, graphTransform_1.getNodesAtScope)(state.graph, state.cwd);
    const edges = (0, graphTransform_1.getEdgesAtScope)(state.graph, state.cwd);
    return { nodes, edges };
}
