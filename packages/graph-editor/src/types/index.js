"use strict";
/**
 * Graph Editor Data Model
 *
 * This module defines a clean separation between:
 * 1. Graph Data (the actual content - nodes, edges, boundary nodes)
 * 2. View State (how you're looking at it - cwd, selections, pan/zoom)
 *
 * Key concepts:
 * - Filesystem mental model: nodes are folders, boundary nodes define interfaces
 * - Process model: each tab/view is a "process" with its own cwd, selection, view state
 * - Single source of truth: boundary nodes ARE the interface definition
 * - Derived fields: inputs/outputs/props are computed from boundary nodes at runtime
 *
 * Boundary Node Design (property-based):
 * - Boundary nodes have normal keys (e.g., 'input_a', 'output_result', 'prop_scale')
 * - The node's `type` property identifies it as a boundary node: 'graphInput', 'graphOutput', 'graphProp'
 * - The port/prop name is stored as a property: { name: 'portName', value: 'a' } or { name: 'propName', value: 'scale' }
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOUNDARY_NODE_TYPES = void 0;
exports.isBoundaryNode = isBoundaryNode;
exports.isBoundaryNodeType = isBoundaryNodeType;
exports.getBoundaryType = getBoundaryType;
exports.getPortNameFromBoundary = getPortNameFromBoundary;
exports.getDataTypeFromBoundary = getDataTypeFromBoundary;
exports.getDefaultFromBoundary = getDefaultFromBoundary;
exports.createDefaultViewState = createDefaultViewState;
exports.createDefaultSelectionState = createDefaultSelectionState;
exports.createDefaultConnectingState = createDefaultConnectingState;
exports.createDefaultBoxSelectState = createDefaultBoxSelectState;
exports.createViewProcess = createViewProcess;
exports.createDefaultClipboardState = createDefaultClipboardState;
exports.createDefaultGraphData = createDefaultGraphData;
exports.createDefaultEditorState = createDefaultEditorState;
/**
 * Boundary node type values (used in node.type field)
 */
exports.BOUNDARY_NODE_TYPES = {
    input: 'graphInput',
    output: 'graphOutput',
    prop: 'graphProp',
};
/**
 * Check if a node is a boundary node by its type property
 */
function isBoundaryNode(node) {
    return node.type === exports.BOUNDARY_NODE_TYPES.input ||
        node.type === exports.BOUNDARY_NODE_TYPES.output ||
        node.type === exports.BOUNDARY_NODE_TYPES.prop;
}
/**
 * Check if a node type string is a boundary node type
 */
function isBoundaryNodeType(type) {
    return type === exports.BOUNDARY_NODE_TYPES.input ||
        type === exports.BOUNDARY_NODE_TYPES.output ||
        type === exports.BOUNDARY_NODE_TYPES.prop;
}
/**
 * Get the boundary type from a node's type property
 */
function getBoundaryType(node) {
    if (node.type === exports.BOUNDARY_NODE_TYPES.input)
        return 'input';
    if (node.type === exports.BOUNDARY_NODE_TYPES.output)
        return 'output';
    if (node.type === exports.BOUNDARY_NODE_TYPES.prop)
        return 'prop';
    return null;
}
/**
 * Get the port/prop name from a boundary node's properties
 * Reads from 'portName' property for inputs/outputs, 'propName' for props
 */
function getPortNameFromBoundary(node) {
    const boundaryType = getBoundaryType(node);
    if (!boundaryType)
        return null;
    const propName = boundaryType === 'prop' ? 'propName' : 'portName';
    const prop = node.props?.find(p => p.name === propName);
    return prop?.value;
}
/**
 * Get the data type from a boundary node's properties
 */
function getDataTypeFromBoundary(node) {
    const prop = node.props?.find(p => p.name === 'dataType');
    return prop?.value || 'any';
}
/**
 * Get the default value from a boundary node's properties (for props)
 */
function getDefaultFromBoundary(node) {
    const prop = node.props?.find(p => p.name === 'default');
    return prop?.value;
}
// =============================================================================
// DEFAULT VALUES
// =============================================================================
/**
 * Create a default view state
 */
function createDefaultViewState() {
    return { pan: { x: 0, y: 0 }, zoom: 1 };
}
/**
 * Create a default selection state
 */
function createDefaultSelectionState() {
    return { nodeIds: new Set(), edgeIds: new Set() };
}
/**
 * Create a default connecting state
 */
function createDefaultConnectingState() {
    return { active: false, sourceNode: null, sourcePort: null, isOutput: false };
}
/**
 * Create a default box select state
 */
function createDefaultBoxSelectState() {
    return { active: false, start: null, end: null, previewNodeIds: new Set() };
}
/**
 * Create a new view process
 */
function createViewProcess(pid, cwd = '/') {
    return {
        pid,
        cwd,
        selection: createDefaultSelectionState(),
        view: createDefaultViewState(),
        connecting: createDefaultConnectingState(),
        boxSelect: createDefaultBoxSelectState(),
    };
}
/**
 * Create a default clipboard state
 */
function createDefaultClipboardState() {
    return { nodes: [], edges: [] };
}
/**
 * Create a default graph data
 */
function createDefaultGraphData() {
    return {
        graph: { name: 'untitled', nodes: [], edges: [] },
        definitions: new Map(),
    };
}
/**
 * Create a default editor state with a single process
 */
function createDefaultEditorState() {
    const defaultPid = 'main';
    return {
        data: createDefaultGraphData(),
        processes: new Map([[defaultPid, createViewProcess(defaultPid)]]),
        activeProcessId: defaultPid,
        clipboard: createDefaultClipboardState(),
    };
}
