import React from 'react';
import type { Edge } from '@fbp/types';
interface GraphEdgeProps {
    edge: Edge;
}
export declare function GraphEdge({ edge }: GraphEdgeProps): React.JSX.Element;
interface TempEdgeProps {
    start: {
        x: number;
        y: number;
    };
    end: {
        x: number;
        y: number;
    };
}
export declare function TempEdge({ start, end }: TempEdgeProps): React.JSX.Element;
export {};
