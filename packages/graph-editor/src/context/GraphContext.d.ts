import React, { ReactNode } from 'react';
import type { Graph, Node, Edge, NodeDefinition } from '@fbp/types';
export { getEdgeId } from '../utils/graphTransform';
export interface Point {
    x: number;
    y: number;
}
export interface ViewState {
    pan: Point;
    zoom: number;
}
export interface SelectionState {
    nodeIds: Set<string>;
    edgeIds: Set<string>;
}
export interface ClipboardState {
    nodes: Node[];
    edges: Edge[];
}
export interface ScopeState {
    selection: SelectionState;
    view: ViewState;
}
export interface GraphEditorState {
    graph: Graph;
    definitions: Map<string, NodeDefinition>;
    view: ViewState;
    selection: SelectionState;
    stateByPath: Map<string, ScopeState>;
    clipboard: ClipboardState;
    cwd: string;
    connecting: {
        active: boolean;
        sourceNode: string | null;
        sourcePort: string | null;
        isOutput: boolean;
    };
    boxSelect: {
        active: boolean;
        start: Point | null;
        end: Point | null;
        previewNodeIds: Set<string>;
    };
}
type BoundaryNodeType = 'input' | 'output' | 'prop';
type GraphAction = {
    type: 'SET_GRAPH';
    graph: Graph;
} | {
    type: 'SET_DEFINITIONS';
    definitions: NodeDefinition[];
} | {
    type: 'ADD_NODE';
    node: Node;
} | {
    type: 'ADD_BOUNDARY_NODE';
    boundaryType: BoundaryNodeType;
    position: Point;
} | {
    type: 'UPDATE_NODE';
    nodeId: string;
    updates: Partial<Node>;
} | {
    type: 'DELETE_NODES';
    nodeIds: string[];
} | {
    type: 'ADD_EDGE';
    edge: Edge;
} | {
    type: 'DELETE_EDGES';
    edgeIds: string[];
} | {
    type: 'SET_NODE_PROP';
    nodeId: string;
    propName: string;
    value: unknown;
} | {
    type: 'SELECT_NODES';
    nodeIds: string[];
    additive?: boolean;
} | {
    type: 'SELECT_EDGES';
    edgeIds: string[];
    additive?: boolean;
} | {
    type: 'CLEAR_SELECTION';
} | {
    type: 'SELECT_ALL';
} | {
    type: 'DUPLICATE_SELECTION';
} | {
    type: 'COPY_SELECTION';
} | {
    type: 'PASTE_SELECTION';
} | {
    type: 'COLLAPSE_SELECTION';
} | {
    type: 'LAYOUT_SELECTION';
} | {
    type: 'MOVE_NODES';
    nodeIds: string[];
    delta: Point;
} | {
    type: 'SET_VIEW';
    view: Partial<ViewState>;
} | {
    type: 'DIVE_INTO';
    nodeId: string;
} | {
    type: 'GO_UP';
} | {
    type: 'START_CONNECTING';
    nodeId: string;
    portName: string;
    isOutput: boolean;
} | {
    type: 'END_CONNECTING';
    nodeId: string;
    portName: string;
} | {
    type: 'CANCEL_CONNECTING';
} | {
    type: 'START_BOX_SELECT';
    start: Point;
} | {
    type: 'UPDATE_BOX_SELECT';
    end: Point;
} | {
    type: 'MOVE_BOX_SELECT';
    delta: Point;
} | {
    type: 'END_BOX_SELECT';
} | {
    type: 'RENAME_NODE';
    oldName: string;
    newName: string;
};
interface GraphContextValue {
    state: GraphEditorState;
    dispatch: React.Dispatch<GraphAction>;
    getDefinition: (type: string) => NodeDefinition | undefined;
    getShortName: (type: string) => string;
    isChannelReference: (value: unknown) => boolean;
}
export declare function GraphProvider({ children, initialGraph, externalDefinitions, onSelectionChange }: {
    children: ReactNode;
    initialGraph?: Graph;
    externalDefinitions?: NodeDefinition[];
    onSelectionChange?: (selectedNodeIds: string[]) => void;
}): React.JSX.Element;
export declare function useGraph(): GraphContextValue;
export declare function useSelection(): {
    selection: SelectionState;
    selectNodes: (nodeIds: string[], additive?: boolean) => void;
    selectEdges: (edgeIds: string[], additive?: boolean) => void;
    clearSelection: () => void;
    selectAll: () => void;
    duplicateSelection: () => void;
    copySelection: () => void;
    pasteSelection: () => void;
    collapseSelection: () => void;
    layoutSelection: () => void;
    deleteSelection: () => void;
};
export declare function useNavigation(): {
    cwd: string;
    currentScope: string;
    navigationStack: string[];
    diveInto: (nodeId: string) => void;
    goUp: () => void;
    canGoUp: boolean;
};
export declare function useScopedGraph(): {
    nodes: Node[];
    edges: Edge[];
};
