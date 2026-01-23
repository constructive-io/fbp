import React from 'react';
import type { Graph, NodeDefinition } from '@fbp/types';
type EvaluateFn = (graph: Graph, options: {
    definitions: any[];
    outputNode: string;
    outputPort: string;
}) => Promise<any>;
interface GraphEditorProps {
    graph?: Graph;
    definitions?: NodeDefinition[];
    showPropertiesPanel?: boolean;
    showNodePalette?: boolean;
    showStatusBar?: boolean;
    className?: string;
    onGraphChange?: (graph: Graph) => void;
    onSelectionChange?: (selectedNodeIds: string[]) => void;
    evaluationResult?: unknown;
    onRefreshEvaluation?: () => void;
    evaluateFn?: EvaluateFn;
}
export declare function GraphEditor({ graph, definitions, showPropertiesPanel, showNodePalette, showStatusBar, className, onSelectionChange, evaluationResult, onRefreshEvaluation, evaluateFn }: GraphEditorProps): React.JSX.Element;
export {};
