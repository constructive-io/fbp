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
import type { Graph, Node, Edge, NodeDefinition } from '@fbp/types';
/**
 * The actual graph content - shared across all views/tabs.
 * This is what gets persisted to storage.
 */
export interface GraphData {
    /** The graph structure (nodes, edges, boundary nodes) */
    graph: Graph;
    /** Node type definitions (how nodes behave) */
    definitions: Map<string, NodeDefinition>;
}
/**
 * 2D point for positions and offsets
 */
export interface Point {
    x: number;
    y: number;
}
/**
 * Camera/viewport state for the canvas
 */
export interface ViewState {
    pan: Point;
    zoom: number;
}
/**
 * What's currently selected in a view
 */
export interface SelectionState {
    nodeIds: Set<string>;
    edgeIds: Set<string>;
}
/**
 * State for edge connection in progress
 */
export interface ConnectingState {
    active: boolean;
    sourceNode: string | null;
    sourcePort: string | null;
    isOutput: boolean;
}
/**
 * State for marquee/box selection in progress
 */
export interface BoxSelectState {
    active: boolean;
    start: Point | null;
    end: Point | null;
    previewNodeIds: Set<string>;
}
/**
 * Clipboard for copy/paste operations
 */
export interface ClipboardState {
    nodes: Node[];
    edges: Edge[];
}
/**
 * A "process" represents a single view/tab of the graph.
 * Each process has its own:
 * - CWD (current working directory / scope in the graph)
 * - Selection (what's selected in this view)
 * - View state (pan, zoom)
 * - Interaction state (connecting, box select)
 *
 * Multiple processes can view the same graph at different scopes.
 */
export interface ViewProcess {
    /** Unique identifier for this process/tab */
    pid: string;
    /** Current working directory: "/" for root, "/subnet1" for nested */
    cwd: string;
    /** What's selected in this view */
    selection: SelectionState;
    /** Camera state (pan, zoom) */
    view: ViewState;
    /** Edge connection in progress */
    connecting: ConnectingState;
    /** Box selection in progress */
    boxSelect: BoxSelectState;
}
/**
 * Complete editor state combining graph data and view processes.
 *
 * - `data`: The actual graph content (shared across all tabs)
 * - `processes`: Per-tab view state (each tab can be at different scope)
 * - `activeProcessId`: Which tab is currently active (receives commands)
 * - `clipboard`: Shared clipboard for copy/paste
 */
export interface EditorState {
    /** Graph data (shared across all views) */
    data: GraphData;
    /** View processes (per-tab state) */
    processes: Map<string, ViewProcess>;
    /** Active process ID (which tab receives commands) */
    activeProcessId: string;
    /** Shared clipboard */
    clipboard: ClipboardState;
}
/**
 * Boundary node type (input, output, or prop)
 */
export type BoundaryNodeType = 'input' | 'output' | 'prop';
/**
 * Boundary node type values (used in node.type field)
 */
export declare const BOUNDARY_NODE_TYPES: {
    readonly input: "graphInput";
    readonly output: "graphOutput";
    readonly prop: "graphProp";
};
/**
 * Check if a node is a boundary node by its type property
 */
export declare function isBoundaryNode(node: {
    type: string;
}): boolean;
/**
 * Check if a node type string is a boundary node type
 */
export declare function isBoundaryNodeType(type: string): boolean;
/**
 * Get the boundary type from a node's type property
 */
export declare function getBoundaryType(node: {
    type: string;
}): BoundaryNodeType | null;
/**
 * Get the port/prop name from a boundary node's properties
 * Reads from 'portName' property for inputs/outputs, 'propName' for props
 */
export declare function getPortNameFromBoundary(node: {
    type: string;
    props?: Array<{
        name: string;
        value?: unknown;
    }>;
}): string | null;
/**
 * Get the data type from a boundary node's properties
 */
export declare function getDataTypeFromBoundary(node: {
    props?: Array<{
        name: string;
        value?: unknown;
    }>;
}): string;
/**
 * Get the default value from a boundary node's properties (for props)
 */
export declare function getDefaultFromBoundary(node: {
    props?: Array<{
        name: string;
        value?: unknown;
    }>;
}): unknown;
/**
 * Create a default view state
 */
export declare function createDefaultViewState(): ViewState;
/**
 * Create a default selection state
 */
export declare function createDefaultSelectionState(): SelectionState;
/**
 * Create a default connecting state
 */
export declare function createDefaultConnectingState(): ConnectingState;
/**
 * Create a default box select state
 */
export declare function createDefaultBoxSelectState(): BoxSelectState;
/**
 * Create a new view process
 */
export declare function createViewProcess(pid: string, cwd?: string): ViewProcess;
/**
 * Create a default clipboard state
 */
export declare function createDefaultClipboardState(): ClipboardState;
/**
 * Create a default graph data
 */
export declare function createDefaultGraphData(): GraphData;
/**
 * Create a default editor state with a single process
 */
export declare function createDefaultEditorState(): EditorState;
