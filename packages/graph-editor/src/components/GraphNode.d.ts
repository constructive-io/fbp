import React from 'react';
import type { Node, Port } from '@fbp/types';
export declare function deriveBoundaryPorts(nodes: Node[], type: 'input' | 'output'): Port[];
declare const NODE_WIDTH = 180;
declare const NODE_HEADER_HEIGHT = 28;
declare const PORT_HEIGHT = 24;
interface GraphNodeProps {
    node: Node;
    onStartConnect: (nodeId: string, portName: string, isOutput: boolean, position: {
        x: number;
        y: number;
    }) => void;
    onEndConnect?: (nodeId: string, portName: string, isOutput: boolean) => void;
}
export declare function GraphNode({ node, onStartConnect, onEndConnect }: GraphNodeProps): React.JSX.Element;
export declare function getNodePortPosition(node: Node, portName: string, isOutput: boolean, definition?: {
    inputs?: Port[];
    outputs?: Port[];
}): {
    x: number;
    y: number;
} | null;
export { NODE_WIDTH, NODE_HEADER_HEIGHT, PORT_HEIGHT };
